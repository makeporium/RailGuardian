// src/pages/admin/alerts.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CheckCircle, Eye, Loader2, User, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// --- TYPES ---
type Profile = {
  id: string;
  full_name: string | null;
};

type AlertData = {
  id: string;
  created_at: string;
  title: string | null;
  description: string | null;
  type: string | null;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'in_progress' | 'resolved';
  coach_number: string | null;
  location_details: string | null;
  assigned_to: string | null;
  photo_url: string | null;
};

// --- MODIFIED API DATA FETCHING FUNCTION ---
// We now fetch alerts and ALL profiles in separate, simpler queries.
const fetchAlertsData = async () => {
  const [
    { data: activeData, error: aError },
    { data: resolvedData, error: rError },
    // MODIFICATION: Fetch all profiles, not just supervisors, and order them by name.
    { data: profilesData, error: pError }
  ] = await Promise.all([
    supabase.from('alerts').select(`*`).in('status', ['active', 'in_progress']).order('created_at', { ascending: false }),
    supabase.from('alerts').select(`*`).eq('status', 'resolved').order('created_at', { ascending: false }).limit(50),
    // MODIFICATION: Select all profiles from the table to make them available for assignment.
    supabase.from('profiles').select('id, full_name').order('full_name', { ascending: true })
  ]);

  if (aError || rError || pError) {
    console.error("Error fetching admin data:", { aError, rError, pError });
    throw new Error(aError?.message || rError?.message || pError?.message || "An unknown error occurred");
  }
  
  return { 
    activeAlerts: (activeData as AlertData[]) || [], 
    resolvedAlerts: (resolvedData as AlertData[]) || [],
    // MODIFICATION: Changed property name for clarity.
    allProfiles: (profilesData as Profile[]) || []
  };
};

// --- MAIN COMPONENT ---
const AdminAlertsPage = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedAlert, setSelectedAlert] = useState<AlertData | null>(null);
    // MODIFICATION: Renamed state for clarity (Supervisor -> Assignee)
    const [selectedAssignee, setSelectedAssignee] = useState('');

    const { data, isLoading, refetch } = useQuery({ 
      queryKey: ['admin_alerts_data'], 
      queryFn: fetchAlertsData 
    });

    useEffect(() => {
        const channel = supabase.channel('realtime-alerts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => { refetch(); })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [refetch]);

    const updateAlertMutation = useMutation({
        mutationFn: async ({ alertId, updates }: { alertId: string, updates: Partial<AlertData> }) => {
            const { error } = await supabase.from('alerts').update(updates).eq('id', alertId);
            if (error) throw error;
        },
        onSuccess: (data, variables) => {
            toast({ title: `Alert successfully updated!` });
            queryClient.invalidateQueries({ queryKey: ['admin_alerts_data'] });
            if (variables.updates.status === 'resolved') {
                setSelectedAlert(null);
            }
        },
        onError: (error) => {
            toast({ title: 'Error Updating Alert', description: error.message, variant: 'destructive' });
        }
    });

    // --- MODIFIED HELPER FUNCTION ---
    // This function looks up the assignee's name using the ID from the list of all profiles.
    const getAssigneeNameById = (id: string | null): string => {
        if (!id || !data?.allProfiles) return "Unassigned";
        const assignee = data.allProfiles.find(p => p.id === id);
        return assignee?.full_name || "Unassigned (Invalid ID)";
    };

    // --- EVENT HANDLERS ---
    // MODIFICATION: Renamed handler for clarity.
    const handleAssignUser = () => {
        if (!selectedAlert || !selectedAssignee) {
            toast({ title: 'Assignment Failed', description: 'Please select a user from the list.', variant: 'destructive' });
            return;
        }

        updateAlertMutation.mutate({
            alertId: selectedAlert.id,
            updates: { assigned_to: selectedAssignee, status: 'in_progress' },
        });
    };
    
    const handleResolveClick = () => {
        if (selectedAlert) {
            updateAlertMutation.mutate({
                alertId: selectedAlert.id,
                updates: { status: 'resolved' },
            });
        }
    };

    // --- RENDER LOGIC ---
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full pt-16">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="ml-4 text-muted-foreground">Loading Alerts...</p>
        </div>
      );
    }

    const priorityBadgeVariant = {
        high: 'destructive',
        medium: 'secondary',
        low: 'outline',
    } as const;

    return (
        <div className="space-y-6">
            <Tabs defaultValue="active">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="active">Active Alerts ({data?.activeAlerts?.length || 0})</TabsTrigger>
                    <TabsTrigger value="resolved">Resolved History ({data?.resolvedAlerts?.length || 0})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="active">
                     <Card>
                        <CardHeader>
                            <CardTitle>Incoming Alerts</CardTitle>
                            <CardDescription>Review, assign, and resolve active issues.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {data?.activeAlerts?.map((alert) => (
                                <div key={alert.id} className="p-4 bg-card-foreground/5 rounded-lg flex flex-col md:flex-row md:items-center gap-4 border">
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant={priorityBadgeVariant[alert.priority] || 'default'}>{alert.priority || 'N/A'}</Badge>
                                            <Badge variant={alert.status === 'in_progress' ? 'default' : 'outline'}>{(alert.status || 'unknown').replace('_', ' ')}</Badge>
                                        </div>
                                        <h3 className="font-semibold text-lg">{alert.title || 'Untitled Alert'}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {/* MODIFICATION: Using renamed helper function */}
                                            Assigned to: <span className={!alert.assigned_to ? "italic" : ""}>{getAssigneeNameById(alert.assigned_to)}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground/70">
                                            Reported: {alert.created_at ? new Date(alert.created_at).toLocaleString() : 'No timestamp'}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        {/* MODIFICATION: Updated onClick to set a smart default for the assignee */}
                                        <Button onClick={() => {
                                            setSelectedAlert(alert);
                                            const profiles = data?.allProfiles || [];
                                            const currentAssignee = profiles.find(p => p.id === alert.assigned_to);

                                            if (currentAssignee) {
                                                // If the assigned user is valid, select them.
                                                setSelectedAssignee(currentAssignee.id);
                                            } else if (profiles.length > 0) {
                                                // If unassigned or invalid, and profiles exist, default to the first profile.
                                                setSelectedAssignee(profiles[0].id);
                                            } else {
                                                // If no profiles exist at all, clear selection.
                                                setSelectedAssignee('');
                                            }
                                        }}>
                                            <Eye className="w-4 h-4 mr-2" />
                                            Review
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {data?.activeAlerts?.length === 0 && <p className="text-center py-8 text-muted-foreground">No active alerts.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="resolved">
                    <Card>
                        <CardHeader>
                            <CardTitle>Resolved Alerts</CardTitle>
                            <CardDescription>A history of all completed alerts.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             {data?.resolvedAlerts?.map((alert) => (
                                <div key={alert.id} className="p-4 bg-card-foreground/5 rounded-lg flex items-center gap-4 opacity-70 border">
                                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                                    <div className="flex-1">
                                        <h3 className="font-semibold">{alert.title || 'Untitled Alert'}</h3>
                                        {/* MODIFICATION: Using renamed helper function */}
                                        <p className="text-sm text-muted-foreground">{getAssigneeNameById(alert.assigned_to)}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{alert.created_at ? new Date(alert.created_at).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            ))}
                            {data?.resolvedAlerts?.length === 0 && <p className="text-center py-8 text-muted-foreground">No resolved alerts yet.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            
            {selectedAlert && (
                 <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedAlert(null)}>
                 <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                     <CardHeader>
                         <div className="flex justify-between items-center">
                             <CardTitle>{selectedAlert.title || 'Alert Details'}</CardTitle>
                             <Button variant="ghost" size="icon" onClick={() => setSelectedAlert(null)}><X className="w-5 h-5" /></Button>
                         </div>
                         <CardDescription>{selectedAlert.coach_number || 'N/A'} - {selectedAlert.location_details || 'No location details'}</CardDescription>
                     </CardHeader>
                     <CardContent className="space-y-6">
                          <p><span className="font-semibold text-muted-foreground">Description:</span> {selectedAlert.description || 'No description provided.'}</p>
                          
                          {selectedAlert.photo_url && (
                             <div>
                                 <Label>Attached Photo</Label>
                                 <div className="mt-2 flex justify-center items-center bg-black rounded-md p-2">
                                     <a href={selectedAlert.photo_url} target="_blank" rel="noopener noreferrer">
                                         <img src={selectedAlert.photo_url} alt="Complaint Attachment" className="rounded-md object-contain max-h-[40vh] cursor-pointer" />
                                     </a>
                                 </div>
                             </div>
                         )}
                          <div className="space-y-2">
                             {/* MODIFICATION: Updated label and select component */}
                             <Label htmlFor="assignee-select">Assign to User</Label>
                             <div className="flex items-center gap-2">
                                 <Select onValueChange={setSelectedAssignee} value={selectedAssignee}>
                                     <SelectTrigger id="assignee-select"><SelectValue placeholder="Select a user..." /></SelectTrigger>
                                     <SelectContent>
                                         {data?.allProfiles.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name || 'Unnamed User'}</SelectItem>)}
                                     </SelectContent>
                                 </Select>
                                 <Button onClick={handleAssignUser} disabled={!selectedAssignee || updateAlertMutation.isPending}>
                                     {updateAlertMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <User className="w-4 h-4 mr-2" />}
                                     Assign
                                 </Button>
                             </div>
                         </div>
                         <div className="pt-4 border-t flex justify-end">
                             <Button variant="destructive" onClick={handleResolveClick} disabled={updateAlertMutation.isPending}>
                                  {updateAlertMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4 mr-2" />}
                                  Mark as Resolved
                             </Button>
                         </div>
                     </CardContent>
                 </Card>
             </div>
            )}
        </div>
    );
};

export default AdminAlertsPage;