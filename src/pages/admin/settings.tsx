import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Shield, Save, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type ProfileState = {
  fullName: string;
  email: string;
  employeeId: string;
  phone: string;
  role: string;
  avatarUrl: string;
};

const AdminSettingsPage = () => {
    const { profile: initialProfile, loading, refreshAuth } = useAuth();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [profile, setProfile] = useState<ProfileState>({
        fullName: '',
        email: '',
        employeeId: '',
        phone: '',
        role: '',
        avatarUrl: '',
    });
    
    const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // Password state is still here
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (initialProfile) {
            const initialData = {
                fullName: initialProfile.full_name || '',
                email: initialProfile.email || '',
                employeeId: initialProfile.employee_id || '',
                phone: initialProfile.phone || '',
                role: initialProfile.role || '',
                avatarUrl: initialProfile.avatar_url || '',
            };
            setProfile(initialData);
            setAvatarPreview(initialData.avatarUrl);
        }
    }, [initialProfile]);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                toast({ title: "File is too large", description: "Please select an image smaller than 2MB.", variant: "destructive"});
                return;
            }
            setNewAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };
    
    const handleProfileUpdate = async () => {
        if (!initialProfile?.id) {
            toast({ title: 'Error: User not found.', variant: 'destructive' });
            return;
        }
        setIsSaving(true);
        let newAvatarUrl = profile.avatarUrl;

        if (newAvatarFile) {
            const filePath = `${initialProfile.id}/${Date.now()}-${newAvatarFile.name}`;
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, newAvatarFile, { upsert: true });

            if (uploadError) {
                toast({ title: 'Avatar upload failed', description: uploadError.message, variant: 'destructive' });
                setIsSaving(false);
                return;
            }
            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);
            newAvatarUrl = urlData.publicUrl;
        }

        const { error: dbError } = await supabase
            .from('profiles')
            .update({
                full_name: profile.fullName,
                employee_id: profile.employeeId,
                phone: profile.phone,
                avatar_url: newAvatarUrl,
                updated_at: new Date().toISOString(),
            })
            .eq('id', initialProfile.id);

        if (dbError) {
            toast({ title: 'Profile update failed', description: dbError.message, variant: 'destructive' });
        } else {
            toast({ title: 'Profile updated successfully' });
            setNewAvatarFile(null);
            if (refreshAuth) refreshAuth();
        }
        setIsSaving(false);
    };

    // Password update logic is also still here and correct
    const handlePasswordUpdate = async () => {
        if(password.length < 6) {
            toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
            return;
        }
        const { error } = await supabase.auth.updateUser({ password });
         if (error) {
            toast({ title: 'Password update failed', description: error.message, variant: 'destructive' });
        } else {
            setPassword('');
            toast({ title: 'Password updated successfully' });
        }
    };

    const getInitials = (name: string) => {
        if (!name) return '';
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    };

    if (loading) return <div>Loading settings...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* --- Profile Information Card --- */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2"><User /><CardTitle>Profile Information</CardTitle></div>
          <CardDescription>Update your personal and employee details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="flex items-center gap-4 pt-2">
            <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                    <img src={avatarPreview} alt={profile.fullName} className="w-full h-full object-cover"/>
                ) : (
                    <span className="text-2xl font-semibold text-slate-300">{getInitials(profile.fullName)}</span>
                )}
            </div>
            <div className="space-y-2">
                <Label>Profile Picture</Label>
                <input type="file" accept="image/png, image/jpeg" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" /> Change</Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" value={profile.email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" value={profile.fullName} onChange={e => setProfile({...profile, fullName: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee ID</Label>
            <Input id="employeeId" value={profile.employeeId} onChange={e => setProfile({...profile, employeeId: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="e.g., +1 555-123-4567" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input id="role" value={profile.role} disabled className="capitalize"/>
          </div>

          <Button onClick={handleProfileUpdate} disabled={isSaving}>
            {isSaving ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Save Profile</>}
          </Button>
        </CardContent>
      </Card>

      {/* --- Password Card (RESTORED) --- */}
       <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2"><Shield /><CardTitle>Security</CardTitle></div>
          <CardDescription>Change your account password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Enter new password..." 
            />
          </div>
          <Button onClick={handlePasswordUpdate}>
            <Save className="mr-2 h-4 w-4" />Update Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
export default AdminSettingsPage;