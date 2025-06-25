import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type OtpSession = {
    id: string;
    otp_code: string;
    train_id: string | null;
    coach_id: string | null;
    staff_id: string | null;
    is_active: boolean | null;
    trains: { train_name: string } | null;
    coaches: { coach_number: string } | null;
};

const OtpForm = ({ session, onDone }: { session?: OtpSession, onDone: () => void }) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [otpCode] = useState(() => {
        if (session?.otp_code) {
            return session.otp_code;
        }
        return Math.floor(100000 + Math.random() * 900000).toString();
    });
    const [trainId, setTrainId] = useState(session?.train_id || '');
    const [coachId, setCoachId] = useState(session?.coach_id || '');

    const { data: trains } = useQuery({
        queryKey: ['trains'],
        queryFn: async () => {
            const { data, error } = await supabase.from('trains').select('id, train_name');
            if (error) throw error;
            return data;
        }
    });

    const { data: coaches } = useQuery({
        queryKey: ['coaches', trainId],
        queryFn: async () => {
            if (!trainId) return [];
            const { data, error } = await supabase.from('coaches').select('id, coach_number').eq('train_id', trainId);
            if (error) throw error;
            return data;
        },
        enabled: !!trainId
    });

    const mutation = useMutation({
        mutationFn: async () => {
            const otpData = {
                otp_code: otpCode,
                train_id: trainId || null,
                coach_id: coachId || null,
            };
            if (session?.id) {
                const { error } = await supabase.from('otp_sessions').update(otpData).eq('id', session.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('otp_sessions').insert([otpData]);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            toast({ title: `OTP ${session?.id ? 'updated' : 'created'} successfully` });
            queryClient.invalidateQueries({ queryKey: ['otp_sessions'] });
            onDone();
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    return (
        <div>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="otp_code" className="text-right">OTP Code</Label>
                    <Input id="otp_code" value={otpCode} className="col-span-3" readOnly />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="train" className="text-right">Train</Label>
                    <Select value={trainId || ''} onValueChange={val => { setTrainId(val); setCoachId(''); }}>
                        <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a train" /></SelectTrigger>
                        <SelectContent>
                            {trains?.map(train => <SelectItem key={train.id} value={train.id}>{train.train_name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="coach" className="text-right">Coach</Label>
                     <Select value={coachId || ''} onValueChange={setCoachId} disabled={!trainId}>
                        <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a coach" /></SelectTrigger>
                        <SelectContent>
                            {coaches?.map(coach => <SelectItem key={coach.id} value={coach.id}>{coach.coach_number}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                    {mutation.isPending ? 'Saving...' : 'Save changes'}
                </Button>
            </DialogFooter>
        </div>
    );
};

export const OtpManager = () => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<OtpSession | undefined>(undefined);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: otpSessions, isLoading } = useQuery<OtpSession[]>({
        queryKey: ['otp_sessions'],
        queryFn: async () => {
            const { data, error } = await supabase.from('otp_sessions').select('*, trains(train_name), coaches(coach_number)').order('created_at', { ascending: false });
            if (error) throw error;
            return data as OtpSession[];
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('otp_sessions').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: 'OTP deleted' });
            queryClient.invalidateQueries({ queryKey: ['otp_sessions'] });
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    return (
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>OTP Management</CardTitle>
                        <CardDescription>Manage predefined OTPs for cleaning sessions.</CardDescription>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => { setSelectedSession(undefined); setDialogOpen(true); }}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add OTP
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{selectedSession ? 'Edit' : 'Add'} OTP</DialogTitle>
                            </DialogHeader>
                            <OtpForm session={selectedSession} onDone={() => setDialogOpen(false)} />
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? <p>Loading OTPs...</p> : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>OTP Code</TableHead>
                                <TableHead>Train</TableHead>
                                <TableHead>Coach</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Claimed</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {otpSessions?.map(session => (
                                <TableRow key={session.id}>
                                    <TableCell className="font-mono">{session.otp_code}</TableCell>
                                    <TableCell>{session.trains?.train_name || 'Any'}</TableCell>
                                    <TableCell>{session.coaches?.coach_number || 'Any'}</TableCell>
                                    <TableCell>
                                        <Badge variant={session.is_active ? "outline" : "secondary"} className={session.is_active ? 'border-green-500 text-green-500' : ''}>
                                            {session.is_active ? 'Active' : 'Used'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{session.staff_id ? 'Yes' : 'No'}</TableCell>
                                    <TableCell className="space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => { setSelectedSession(session); setDialogOpen(true); }}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(session.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
};
