// src/pages/admin/staff.tsx

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrainFront } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// --- TYPES ---
// Based on the 'profiles' table schema
type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  employee_id: string | null;
  role: 'supervisor' | 'laborer' | 'admin' | string; // Allow for other roles
  avatar_url: string | null;
};

// Based on the 'trains' table schema (assumed)
type Train = {
  id: string;
  train_name: string | null;
};

// From the 'staff' table, used for mapping assignments
type StaffAssignment = {
  user_id: string;
  train_id: string;
};

// --- API FETCHING ---
// Fetches all necessary data in one go: profiles, trains, and current assignments
const fetchStaffPageData = async () => {
  const [
    { data: profiles, error: pError },
    { data: trains, error: tError },
    { data: assignments, error: aError }
  ] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, employee_id, role, avatar_url').order('full_name'),
    supabase.from('trains').select('id, train_name').order('train_name'),
    supabase.from('staff').select('user_id, train_id') // Get current assignments
  ]);

  if (pError || tError || aError) {
    console.error({ pError, tError, aError });
    throw new Error('Failed to fetch staff data');
  }

  return {
    profiles: (profiles as any as Profile[]) || [],
    trains: (trains as Train[]) || [],
    assignments: (assignments as StaffAssignment[]) || [],
  };
};


// --- MAIN COMPONENT ---
const AdminStaffPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['admin_staff_page_data'],
    queryFn: fetchStaffPageData,
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ userId, trainId }: { userId: string, trainId: string }) => {
      // Use upsert: updates if user_id exists, inserts if not. Perfect for this use case.
      const { error } = await supabase.from('staff').upsert(
        { user_id: userId, train_id: trainId, is_active: true }, // Set is_active on assignment
        { onConflict: 'user_id' }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Train assignment updated.' });
      queryClient.invalidateQueries({ queryKey: ['admin_staff_page_data'] });
    },
    onError: (error) => {
      toast({ title: 'Error', description: `Failed to update assignment: ${error.message}`, variant: 'destructive' });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full pt-16">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="ml-4 text-muted-foreground">Loading Staff...</p>
      </div>
    );
  }

  // Create a quick lookup map for user assignments
  const assignmentsMap = new Map(data?.assignments.map(a => [a.user_id, a.train_id]));

  // Group profiles by role for rendering
  const groupedProfiles = data?.profiles.reduce((acc, profile) => {
    const role = profile.role || 'Unassigned';
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(profile);
    return acc;
  }, {} as Record<string, Profile[]>);

  const roleOrder = ['admin', 'supervisor', 'laborer']; // Define the display order
  const sortedRoleKeys = Object.keys(groupedProfiles || {}).sort((a, b) => {
      const indexA = roleOrder.indexOf(a);
      const indexB = roleOrder.indexOf(b);
      if (indexA === -1) return 1; // Put unknown roles at the end
      if (indexB === -1) return -1;
      return indexA - indexB;
  });


  return (
    <div className="space-y-8">
      {sortedRoleKeys.map(role => (
        <div key={role}>
          <h2 className="text-2xl font-bold tracking-tight mb-4 capitalize">{role}s</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {groupedProfiles?.[role].map((profile) => (
              <Card key={profile.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                     <div className="flex items-center space-x-4">
                        <Avatar className="w-8 h-8 rounded-full">
                           {profile.avatar_url ? (
                              <img src={profile.avatar_url} alt={profile.full_name || 'Profile'} className="rounded-full" />
                           ) : (
                              <AvatarFallback>{profile.full_name?.charAt(0)}</AvatarFallback>
                           )}
                         </Avatar>
                        <CardTitle>{profile.full_name || 'No Name'}</CardTitle>
                     </div>
                    <Badge variant="outline" className="capitalize">{profile.role}</Badge>
                  </div>
                  <CardDescription>{profile.employee_id || 'No Employee ID'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                  <div>
                    <Label htmlFor={`train-select-${profile.id}`}>Assigned Train</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <TrainFront className="h-5 w-5 text-muted-foreground" />
                      <Select
                        value={assignmentsMap.get(profile.id) || ''}
                        onValueChange={(newTrainId) => {
                          updateAssignmentMutation.mutate({ userId: profile.id, trainId: newTrainId });
                        }}
                        disabled={updateAssignmentMutation.isPending}
                      >
                        <SelectTrigger id={`train-select-${profile.id}`}>
                          <SelectValue placeholder="Assign a train..." />
                        </SelectTrigger>
                        <SelectContent>
                          {data?.trains.map(train => (
                            <SelectItem key={train.id} value={train.id}>
                              {train.train_name || 'Unnamed Train'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
       {data?.profiles?.length === 0 && <p className="col-span-full text-center py-8 text-muted-foreground">No staff profiles found.</p>}
    </div>
  );
};

export default AdminStaffPage;
