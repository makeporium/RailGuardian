import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Train, MapPin, Users, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const TrainSelector = ({ onTrainSelect }) => {
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [trains, setTrains] = useState([]);

  useEffect(() => {
    const fetchTrains = async () => {
      const { data, error } = await supabase
        .from('trains')
        .select('*')
        .order('train_name', { ascending: true });

      if (error) {
        console.error('Error fetching trains:', error);
      } else {
        setTrains(data);
      }
    };

    fetchTrains();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'out_of_service': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTrainSelect = (train) => {
    setSelectedTrain(train);
    onTrainSelect(train);
  };

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Train className="w-5 h-5" />
          <span>Select Train for Monitoring</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {trains.map((train) => (
            <div
              key={train.id}
              onClick={() => handleTrainSelect(train)}
              className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                selectedTrain?.id === train.id
                  ? 'border-blue-500 bg-blue-900/20'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-sm mb-1">{train.train_name}</h3>
                  <div className="flex items-center space-x-1 text-slate-400 text-xs">
                    <MapPin className="w-3 h-3" />
                    <span>{train.route}</span>
                  </div>
                </div>
                <Badge className={getStatusColor(train.status)}>
                  {train.status}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Coaches</span>
                  <span className="text-white font-semibold">
                    {train.total_coaches}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full"
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>{train.staff_count || 0} staff</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(train.updated_at).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedTrain && (
          <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="text-white font-semibold mb-2">Selected: {selectedTrain.train_name}</h4>
            <p className="text-slate-400 text-sm">
              Monitoring {selectedTrain.total_coaches} coaches with staff on duty.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
