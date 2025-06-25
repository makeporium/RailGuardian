import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const fetchOverviewData = async () => {
  const [
    { count: staffCount }, { count: activeSessionsCount }, { count: pendingApprovalsCount },
    { data: recentActivity, error: activityError },
  ] = await Promise.all([
    supabase.from('staff').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('otp_sessions').select('*', { count: 'exact', head: true }).eq('is_active', true).not('staff_id', 'is', null),
    supabase.from('cleaning_records').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
    supabase.from('cleaning_records').select(`*, staff:staff_id(profiles:user_id(full_name)), washrooms:washroom_id(location_description, coaches:coach_id(coach_number, trains:train_id(train_name)))`).order('created_at', { ascending: false }).limit(7),
  ]);
  if(activityError) throw activityError;
  return {
    stats: { totalStaff: staffCount || 0, activeCleaningSessions: activeSessionsCount || 0, pendingApprovals: pendingApprovalsCount || 0 },
    recentActivity: recentActivity || [],
  };
};

const AdminOverviewPage = () => {
  const { data, isLoading } = useQuery({ queryKey: ['admin_overview'], queryFn: fetchOverviewData });
  if (isLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-slate-900 border-slate-800"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-slate-400 text-sm">Active Staff</p><p className="text-3xl font-bold">{data?.stats.totalStaff}</p></div><Users className="w-10 h-10 text-blue-500" /></CardContent></Card>
        <Card className="bg-slate-900 border-slate-800"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-slate-400 text-sm">Active Sessions</p><p className="text-3xl font-bold">{data?.stats.activeCleaningSessions}</p></div><Clock className="w-10 h-10 text-yellow-500" /></CardContent></Card>
        <Card className="bg-slate-900 border-slate-800"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-slate-400 text-sm">Pending Approvals</p><p className="text-3xl font-bold">{data?.stats.pendingApprovals}</p></div><AlertTriangle className="w-10 h-10 text-red-500" /></CardContent></Card>
      </div>
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {data?.recentActivity?.map((act) => (
            <div key={act.id} className="flex items-center justify-between p-4 bg-slate-800/70 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${act.approval_status === 'approved' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                <div>
                  <p className="font-medium">{act.staff?.profiles?.full_name || 'System'} cleaned <span className="text-pink-400">{act.washrooms?.location_description}</span></p>
                  <p className="text-xs text-slate-400">{act.washrooms?.coaches?.trains?.train_name} - Coach {act.washrooms?.coaches?.coach_number}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={act.approval_status === 'approved' ? 'default' : 'secondary'} className={`${act.approval_status === 'approved' ? 'bg-emerald-600' : ''}`}>{act.approval_status}</Badge>
                <p className="text-xs text-slate-500 mt-1">{new Date(act.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {data?.recentActivity?.length === 0 && <p className="text-center py-4 text-slate-400">No recent activity.</p>}
        </CardContent>
      </Card>
    </div>
  );
};
export default AdminOverviewPage;