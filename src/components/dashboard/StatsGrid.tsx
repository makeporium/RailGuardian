
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  trend: string;
  isPositive: boolean;
  index: number;
}

const StatCard = ({ title, value, description, icon: Icon, color, bgColor, trend, isPositive, index }: StatCardProps) => (
  <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 hover:bg-slate-900/70 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 hover:border-purple-500/30 transition-all duration-500 animate-fade-in-up group cursor-pointer relative overflow-hidden"
       style={{ animationDelay: `${index * 150 + 600}ms` }}>
    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    <CardContent className="p-6 relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-slate-400 text-sm font-medium group-hover:text-slate-300 transition-colors">{title}</p>
          <p className="text-white text-2xl font-bold group-hover:scale-110 group-hover:text-white transition-all duration-300 inline-block">{value}</p>
          <p className="text-slate-500 text-xs group-hover:text-slate-400 transition-colors">{description}</p>
          <p className={`text-sm mt-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'} group-hover:font-semibold transition-all`}>
            {trend}
          </p>
        </div>
        <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 group-hover:shadow-lg transition-all duration-500 relative`}>
          <Icon className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />
          <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      </div>
    </CardContent>
  </Card>
);

interface StatsGridProps {
  stats: Array<{
    title: string;
    value: string;
    description: string;
    icon: React.ComponentType<any>;
    color: string;
    bgColor: string;
    trend: string;
    isPositive: boolean;
  }>;
}

export const StatsGrid = ({ stats }: StatsGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={stat.title} {...stat} index={index} />
      ))}
    </div>
  );
};
