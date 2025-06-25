// src/pages/admin/manage.tsx

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, CheckCircle, XCircle, Loader2, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const fetchManagementData = async () => {
  const [
    { data: pendingData, error: pError },
    { data: sessionsData, error: sError },
  ] = await Promise.all([
    supabase.from('cleaning_records').select(`*, after_photo_url, staff:staff_id(profiles:user_id(full_name, employee_id)), washrooms:washroom_id(location_description, coaches:coach_id(coach_number, trains:train_id(train_name)))`).eq('approval_status', 'pending').order('completed_at', { ascending: false }),
    supabase.from('otp_sessions').select(`*, staff:staff_id(profiles:user_id(full_name)), coaches:coach_id(coach_number, trains:train_id(train_name))`).eq('is_active', true).not('staff_id', 'is', null),
  ]);

  if (pError || sError) throw new Error(pError?.message || sError?.message);
  return { pendingRecords: pendingData || [], activeSessions: sessionsData || [] };
};

const AdminManagePage = () => {
    const { toast } = useToast();
    const [viewingImage, setViewingImage] = useState<string[] | string | null>(null);
    const { data, isLoading, refetch } = useQuery({ queryKey: ['admin_management'], queryFn: fetchManagementData });

    const approveRecord = async (recordId: string, approved: boolean) => {
      try {
        const { data: record, error: fetchError } = await supabase
          .from('cleaning_records')
          .select('id, staff_id, started_at')
          .eq('id', recordId)
          .single();

        if (fetchError || !record) throw fetchError || new Error('Cleaning record not found.');

        const { data: session, error: sessionError } = await supabase
          .from('otp_sessions')
          .select('id')
          .eq('staff_id', record.staff_id)
          .eq('created_at', record.started_at)
          .maybeSingle();

        if (sessionError) throw sessionError;

        const { error: updateError } = await supabase
          .from('cleaning_records')
          .update({
            approval_status: approved ? 'approved' : 'rejected',
            status: approved ? 'verified' : 'completed',
            verified_at: approved ? new Date().toISOString() : null,
            rating: approved ? 5 : 2
          })
          .eq('id', recordId);

        if (updateError) throw updateError;

        if (session?.id) {
          const { error: nullifyError } = await supabase
            .from('otp_sessions')
            .update({
              staff_id: null,
              is_active: true
            })
            .eq('id', session.id);

          if (nullifyError) throw nullifyError;
        }

        toast({
          title: `Record ${approved ? 'Approved' : 'Rejected'}`,
          description: session?.id ? 'Session is now reusable.' : 'Session not found.',
        });

        refetch();
      } catch (error: any) {
        console.error('❌ Error in approval logic:', error);
        toast({
          title: "Error updating record",
          description: error?.message || 'Unexpected error',
          variant: "destructive",
        });
      }
    };


    if (isLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <Tabs defaultValue="approvals">
                <TabsList className="grid w-full grid-cols-2 bg-slate-900 border-slate-800">
                    <TabsTrigger value="approvals">Pending Approvals ({data?.pendingRecords.length})</TabsTrigger>
                    <TabsTrigger value="sessions">Active Sessions ({data?.activeSessions.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="approvals">
                     <Card className="bg-slate-900 border-slate-800">
                        <CardHeader><CardTitle>Review Submissions</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {data?.pendingRecords?.map((record) => (
                            <div key={record.id} className="p-4 bg-slate-800/70 rounded-lg flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex-1">
                                <h3 className="font-semibold">{record.washrooms?.coaches?.trains?.train_name} - Coach {record.washrooms?.coaches?.coach_number}</h3>
                                <div className="space-y-1 text-sm text-slate-400 mt-2"><p>{record.washrooms?.location_description}</p><p>Staff: {record.staff?.profiles?.full_name} ({record.staff?.profiles?.employee_id})</p><p>Completed: {new Date(record.completed_at).toLocaleString()}</p></div>
                                </div>
                                <div className="flex space-x-2 flex-shrink-0 mt-4 md:mt-0">
                                {record.after_photo_url && (
                                    <>
                                    <Button
                                        onClick={() => {
                                        try {
                                            const imageUrls = JSON.parse(record.after_photo_url);
                                            setViewingImage(imageUrls);
                                        } catch (error) {
                                            console.error("Error parsing image URLs:", error);
                                            setViewingImage([record.after_photo_url]); // Fallback to displaying the raw string
                                        }
                                        }}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Photos
                                    </Button>
                                    </>
                                )}
                                <Button onClick={() => approveRecord(record.id, true)} className="bg-emerald-600 hover:bg-emerald-700" size="sm">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                </Button>
                                <Button onClick={() => approveRecord(record.id, false)} variant="destructive" size="sm">
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                </Button>
                                </div>
                            </div>
                            ))}
                            {data?.pendingRecords?.length === 0 && <p className="text-center py-8 text-slate-400">No pending approvals.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="sessions">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader>
                            <CardTitle>Active Cleaning Sessions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {data?.activeSessions?.map((session) => (
                            <div
                                key={session.id}
                                className="flex items-center justify-between p-4 bg-slate-800/70 rounded-lg"
                            >
                                <div>
                                    <p className="font-semibold">{session.staff?.profiles?.full_name || 'Unassigned'}</p>
                                    <p className="text-sm text-slate-400">
                                        {session.coaches?.trains?.train_name} - Coach {session.coaches?.coach_number}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Session started: {new Date(session.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <Badge className="bg-yellow-600">In Progress</Badge>
                            </div>
                            ))}
                            {data?.activeSessions?.length === 0 && (
                            <p className="text-center py-8 text-slate-400">No active cleaning sessions.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* --- MODAL SECTION --- */}
            {viewingImage && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    onClick={() => setViewingImage(null)}
                >
                    <Card
                        className="w-full max-w-2xl max-h-[90vh] bg-slate-900 border-slate-700 flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Proof of Cleaning</CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => setViewingImage(null)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </CardHeader>

                        {/* --- MODIFIED PART --- */}
                        <CardContent className="flex-1 flex flex-col gap-4 overflow-y-auto p-6">
                            {Array.isArray(viewingImage) ? (
                                viewingImage.map((img, index) => (
                                    <img
                                        key={index}
                                        src={img}
                                        alt={`Proof of cleaning ${index + 1}`}
                                        className="rounded-md object-contain max-h-[70vh] w-full"
                                    />
                                ))
                            ) : (
                                <img
                                    src={viewingImage}
                                    alt="Proof of cleaning"
                                    className="rounded-md object-contain max-h-[70vh]"
                                />
                            )}
                        </CardContent>
                        {/* --- END OF MODIFIED PART --- */}
                    </Card>
                </div>
            )}
        </div>
    );
};
export default AdminManagePage;