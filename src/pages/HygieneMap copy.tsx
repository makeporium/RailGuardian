import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Train, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TrainModel3D } from '@/components/TrainModel3D';
import { TrainSelector } from '@/components/TrainSelector';
import { supabase } from '@/integrations/supabase/client';

interface Coach {
  id: string;
  coach_number: string;
  washroom_count: number | null;
  washrooms: {
    id: string;
    cleaning_records: {
      status: 'pending' | 'in_progress' | 'completed' | 'verified' | null;
      completed_at: string | null;
    }[];
  }[];
}

const HygieneMap = () => {
  const navigate = useNavigate();
  const [selectedTrain, setSelectedTrain] = useState<any>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);

  useEffect(() => {
    const fetchTrainData = async () => {
      if (!selectedTrain) return;
      const { data: coachesData, error } = await supabase
        .from('coaches')
        .select(`
          id,
          coach_number,
          washroom_count,
          washrooms!inner(
            id,
            cleaning_records(
              status,
              completed_at
            )
          )
        `)
        .eq('train_id', selectedTrain.id);

      if (error) {
        console.error('Error fetching coaches:', error);
        return;
      }

      setCoaches(coachesData || []);
    };

    fetchTrainData();
  }, [selectedTrain]);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'verified': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'pending': return <AlertTriangle className="w-4 h-4" />;
      case 'verified': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <TrainSelector onTrainSelect={setSelectedTrain} />

        {selectedTrain && (
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Train className="w-5 h-5" />
                <span>{selectedTrain.train_name} - Coach Status</span>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Real-time washroom cleaning status visualization
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="h-60 w-full flex justify-center items-center">
                <TrainModel3D
                  trainData={{
                    coaches: coaches.map((coach) => ({
                      id: coach.id,
                      coach_number: coach.coach_number,
                      washroomCleaned:
                        coach.washrooms?.[0]?.cleaning_records?.[0]?.status === 'completed' ||
                        coach.washrooms?.[0]?.cleaning_records?.[0]?.status === 'verified',
                      lastCleaned: coach.washrooms?.[0]?.cleaning_records?.[0]?.completed_at || null,
                    })),
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {coaches.map((coach) => (
            <Card key={coach.id} className="bg-slate-900/50 border-slate-800/50">
              <CardHeader>
                <CardTitle className="text-white">Coach {coach.coach_number}</CardTitle>
                <Badge className={`flex items-center space-x-1 ${getStatusColor(coach.washrooms?.[0]?.cleaning_records?.[0]?.status)}`}>
                  {getStatusIcon(coach.washrooms?.[0]?.cleaning_records?.[0]?.status)}
                  <span>{coach.washrooms?.[0]?.cleaning_records?.[0]?.status || 'No Status'}</span>
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">Washroom Count: {coach.washroom_count}</p>
                <p className="text-slate-300">Last Cleaned: {coach.washrooms?.[0]?.cleaning_records?.[0]?.completed_at || 'N/A'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HygieneMap;
