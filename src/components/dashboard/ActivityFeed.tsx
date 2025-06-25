
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight } from 'lucide-react';

interface Activity {
  title: string;
  time: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  selectedTrain?: any;
}

export const ActivityFeed = ({ activities, selectedTrain }: ActivityFeedProps) => {
  return (
    <Card className="lg:col-span-1 bg-slate-900/50 backdrop-blur-xl border-slate-800/50 hover:bg-slate-900/70 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/20 hover:border-blue-500/30 transition-all duration-300 group">
      <CardHeader className="group-hover:bg-slate-800/30 transition-colors duration-300">
        <CardTitle className="text-white group-hover:text-blue-200 transition-colors duration-300">Recent Activity</CardTitle>
        <CardDescription className="text-slate-400 group-hover:text-slate-300 transition-colors duration-300">
          {selectedTrain ? `Updates from ${selectedTrain.name}` : 'Latest updates from the system'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 hover:bg-slate-800/30 p-2 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md animate-slide-in-right group/item cursor-pointer"
                 style={{ animationDelay: `${index * 100 + 1400}ms` }}>
              <div className={`w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:scale-110 group-hover/item:scale-110 group-hover/item:shadow-lg transition-all duration-200`}>
                <activity.icon className={`w-4 h-4 ${activity.color} group-hover/item:scale-110 transition-transform duration-200`} />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium group-hover/item:text-blue-200 transition-colors duration-200">{activity.title}</p>
                <p className="text-slate-400 text-xs group-hover/item:text-slate-300 transition-colors duration-200">{activity.time}</p>
              </div>
              <div className="opacity-0 group-hover/item:opacity-100 transition-opacity duration-200">
                <ArrowUpRight className="w-3 h-3 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
