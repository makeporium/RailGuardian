// src/pages/Complaint.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Train, MessageSquareWarning, ArrowRight, Loader2, X } from 'lucide-react';

const PassengerComplaintPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    coachNumber: '',
    locationDetails: '',
    category: '',
    description: '',
    contactInfo: ''
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "File too large", description: "Please upload an image smaller than 5MB.", variant: "destructive" });
        return;
    }
    setPhoto(file);
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoPreview(null);
    }
  };
  
  const clearPhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
    if(fileInput) fileInput.value = '';
  }

  // REWRITTEN SUBMISSION HANDLER (Direct-to-Supabase)
  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Your DB schema has location_details as NOT NULL, so we enforce it here.
    if (!formData.coachNumber || !formData.category || !formData.description || !formData.locationDetails) {
      toast({
        title: "Incomplete Form",
        description: "Please fill out all required fields marked with *.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);

    try {
      let photo_url: string | null = null;
      
      // 1. Upload photo if it exists
      if (photo) {
        // The bucket `complaint-photos` must be public with insert permissions.
        const fileName = `public/${Date.now()}-${photo.name}`;
        const { error: uploadError } = await supabase.storage
          .from('complaint-photos')
          .upload(fileName, photo);

        if (uploadError) throw uploadError;

        // Get the public URL of the uploaded file
        const { data: urlData } = supabase.storage
          .from('complaint-photos')
          .getPublicUrl(fileName);
        
        photo_url = urlData.publicUrl;
      }
      
      // 2. Insert the complaint data into the 'alerts' table
      // NOTE: The `assigned_to` field is intentionally omitted from this insert object.
      // In SQL, if a column is nullable and no value is provided for it during an INSERT,
      // it will default to NULL. This is the most reliable way to achieve this.
      //
      // If `assigned_to` is STILL not being set to NULL, the issue is in your Supabase backend:
      // 1. Check the Column's Default Value in the Table Editor.
      // 2. Check for a Row Level Security (RLS) policy that might be setting a value.
      // 3. Check for a database trigger/function that might be populating the field.
      const { error: insertError } = await supabase
        .from('alerts')
        .insert({
          title: `Complaint: ${formData.category} in Coach ${formData.coachNumber}`,
          description: formData.description,
          type: 'passenger_complaint',
          priority: 'high',
          status: 'active',
          coach_number: formData.coachNumber,
          location_details: formData.locationDetails, // Now required
          contact_info: formData.contactInfo || null, // Ensure empty string becomes null
          photo_url: photo_url
          // `assigned_to` is omitted to let the database handle setting it to NULL by default.
        });

      if (insertError) throw insertError;

      toast({
        title: "Complaint Submitted!",
        description: "Thank you for your feedback. Our team will look into it shortly.",
      });

      // Reset the form
      setFormData({ coachNumber: '', locationDetails: '', category: '', description: '', contactInfo: '' });
      clearPhoto();

    } catch (error: any) {
      console.error("Error submitting complaint:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "An error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-brand-text flex flex-col items-center p-4">
      <header className="w-full max-w-4xl mx-auto py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-saffron to-orange-500 rounded-lg flex items-center justify-center">
            <Train className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold">RailSeva</h1>
        </div>
        <Button variant="outline" onClick={() => navigate('/auth')}>
          Staff Login <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </header>
      
      <main className="flex-grow flex items-center justify-center w-full py-8">
        <Card className="w-full max-w-2xl bg-card border">
          <CardHeader className="text-center">
            <MessageSquareWarning className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-2xl">File a Complaint</CardTitle>
            <CardDescription>
              Your feedback helps us improve our services. Fields with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleComplaintSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="coachNumber">Coach Number*</Label>
                  <Input id="coachNumber" value={formData.coachNumber} onChange={handleInputChange} required />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="category">Complaint Category*</Label>
                  <Select onValueChange={handleSelectChange} value={formData.category} required>
                    <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cleanliness">Cleanliness</SelectItem>
                      <SelectItem value="Water Supply">Water Supply</SelectItem>
                      <SelectItem value="Electrical Issue">Electrical Issue</SelectItem>
                      <SelectItem value="Pest Control">Pest Control</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="locationDetails">Seat/Berth/Area*</Label>
                  <Input id="locationDetails" value={formData.locationDetails} onChange={handleInputChange} placeholder="e.g., Seat 42, near door" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="photo-upload">Upload Photo (Optional)</Label>
                    <Input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} />
                </div>
              </div>
              
              {photoPreview && (
                <div className="relative w-fit">
                    <img src={photoPreview} alt="Complaint Preview" className="rounded-lg max-h-48 border" />
                    <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 rounded-full" onClick={clearPhoto}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description*</Label>
                <Textarea id="description" value={formData.description} onChange={handleInputChange} rows={4} required placeholder="Please describe the issue in detail..." />
              </div>
              
               <div className="space-y-2">
                <Label htmlFor="contactInfo">Contact Info (Optional)</Label>
                <Input id="contactInfo" value={formData.contactInfo} onChange={handleInputChange} placeholder="Your email or phone for updates" />
              </div>

              <Button type="submit" disabled={loading} size="lg" className="w-full">
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                {loading ? 'Submitting...' : 'Submit Complaint'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PassengerComplaintPage;