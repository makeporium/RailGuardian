// src/pages/admin/trains.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface TrainData {
  id: string;
  train_name: string;
  train_number: string;
  route: string;
  status: string;
  coaches: Array<{ count: number }>;
  train_cleaning_records_count: number;
}

const fetchTrainsData = async (): Promise<TrainData[]> => {
  const { data: trainsData, error: trainsError } = await supabase.from('trains').select(`
    *,
    coaches(count)
  `);
  if (trainsError) throw trainsError;

  const { data: cleaningRecordsCountData, error: cleaningRecordsCountError } = await supabase.from('train_cleaning_records_count').select(`
    train_id,
    cleaning_records_count
  `);
  if (cleaningRecordsCountError) throw cleaningRecordsCountError;

  const cleaningRecordsMap = new Map(cleaningRecordsCountData.map(record => [record.train_id, record.cleaning_records_count]));

  const mergedData = (trainsData as unknown as TrainData[]).map(train => ({
    ...train,
    train_cleaning_records_count: cleaningRecordsMap.get(train.id) || 0
  }));

  return mergedData;
};

const AdminTrainsPage = () => {
  const navigate = useNavigate();
  const { data: trains, isLoading, error } = useQuery<TrainData[], Error>({ queryKey: ['admin_trains'], queryFn: fetchTrainsData });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'maintenance': return 'bg-yellow-600';
      default: return 'bg-slate-600';
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (error) return <div className="flex items-center justify-center h-full text-red-500">Error: {error.message}</div>;
  if (!trains || trains.length === 0) return <div className="flex items-center justify-center h-full text-slate-400">No trains found.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {trains?.map((train) => (
        <Card key={train.id} className="bg-slate-900 border-slate-800 flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{train.train_name} <span className="text-sm font-normal text-slate-400">({train.train_number})</span></CardTitle>
              <Badge className={getStatusColor(train.status)}>{train.status}</Badge>
            </div>
            <p className="text-sm text-slate-400">{train.route}</p>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col justify-between space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-slate-800/70 p-3 rounded-lg">
                <p className="text-2xl font-bold">{train.coaches[0]?.count || 0}</p>
                <p className="text-xs text-slate-400">Coaches</p>
              </div>
              <div className="bg-slate-800/70 p-3 rounded-lg">
                <p className="text-2xl font-bold">{train.train_cleaning_records_count || 0}</p>
                <p className="text-xs text-slate-400">Services</p>
              </div>
            </div>
             <Button className="w-full" onClick={() => navigate('/dashboard/admin/staff', { state: { trainId: train.id }})}>
              View Assigned Staff
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
export default AdminTrainsPage;
