import React, { useRef, useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, BarChart2 } from 'lucide-react';

interface Coach {
  id: string;
  coach_number: string;
  washroomCleaned: boolean;
  lastCleaned: string | null;
}

interface TrainModel3DProps {
  trainData: {
    coaches: Coach[];
  };
}

export const TrainModel3D: React.FC<TrainModel3DProps> = ({ trainData }) => {
  const trainRef = useRef<HTMLDivElement | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);
  const [hoveredCoach, setHoveredCoach] = useState<Coach | null>(null);

  const total = trainData.coaches.length;
  const clean = trainData.coaches.filter((c) => c.washroomCleaned).length;
  const dirty = total - clean;
  const progress = total > 0 ? Math.round((clean / total) * 100) : 0;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = trainRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePosition({ x, y });
    };

    const element = trainRef.current;
    element?.addEventListener('mousemove', handleMouseMove);
    element?.addEventListener('mouseenter', () => setIsHovering(true));
    element?.addEventListener('mouseleave', () => setIsHovering(false));

    return () => {
      element?.removeEventListener('mousemove', handleMouseMove);
      element?.removeEventListener('mouseenter', () => setIsHovering(true));
      element?.removeEventListener('mouseleave', () => setIsHovering(false));
    };
  }, []);

  const getCoachColor = (coach: Coach) => {
    return coach.washroomCleaned
      ? 'from-green-500 to-green-600'
      : 'from-red-500 to-red-600';
  };

  const getCoachIcon = (coach: Coach) => {
    return coach.washroomCleaned ? (
      <CheckCircle className="w-6 h-6 text-white" />
    ) : (
      <XCircle className="w-6 h-6 text-white" />
    );
  };

  return (
    <div
      ref={trainRef}
      className="relative w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-lg overflow-hidden flex flex-col items-center justify-center"
      style={{
        transform: isHovering
          ? `perspective(1000px) rotateX(${(mousePosition.y - 50) * 0.05}deg) rotateY(${(mousePosition.x - 50) * 0.05}deg)`
          : 'none',
        transition: 'transform 0.1s ease-out',
      }}
    >
      {/* Summary Bar */}
      <div className="mb-6 z-10 text-white text-sm bg-slate-800/80 px-4 py-2 rounded-lg shadow-lg flex space-x-4">
        <div className="flex items-center space-x-1">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span>Clean: {clean}</span>
        </div>
        <div className="flex items-center space-x-1">
          <XCircle className="w-4 h-4 text-red-400" />
          <span>Dirty: {dirty}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="w-4 h-4 text-slate-300" />
          <span>Total: {total}</span>
        </div>
        <div className="flex items-center space-x-1">
          <BarChart2 className="w-4 h-4 text-blue-400" />
          <span>Progress: {progress}%</span>
        </div>
      </div>

      {/* 🚆 Train wrapper */}
      <div className="relative flex flex-wrap justify-center gap-4 max-w-5xl z-10 items-center">
        {/* Horizontal Track behind engine+coaches */}
        <div className="absolute inset-y-0 left-0 right-0 my-auto h-1 bg-[length:50px_1px] bg-repeat-x bg-gradient-to-r from-slate-400 to-slate-200 animate-track-move opacity-80 z-0"></div>

        {/* Engine */}
        <div className="w-20 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-l-xl rounded-r-md shadow-lg flex items-center justify-center text-white text-sm font-bold animate-slide-in-left z-10">
          ENG
        </div>

        {/* Coaches */}
        {trainData.coaches.map((coach, index) => (
          <div
            key={coach.id}
            className="relative group animate-fade-in-up z-10"
            onMouseEnter={() => setHoveredCoach(coach)}
            onMouseLeave={() => setHoveredCoach(null)}
          >
            <div
              className={`w-20 h-16 bg-gradient-to-r ${getCoachColor(
                coach
              )} rounded-md shadow-lg flex items-center justify-center transform transition-transform duration-200 hover:scale-110`}
            >
              {getCoachIcon(coach)}
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-slate-800 rounded-full text-white text-xs flex items-center justify-center font-bold">
                {coach.coach_number || index + 1}
              </div>
            </div>

            {/* Tooltip */}
            {hoveredCoach?.id === coach.id && (
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs rounded-lg p-3 z-20 whitespace-nowrap animate-fade-in-up">
                <div className="font-semibold">Coach {coach.coach_number}</div>
                <div className={coach.washroomCleaned ? 'text-green-400' : 'text-red-400'}>
                  Status: {coach.washroomCleaned ? 'Clean' : 'Dirty'}
                </div>
                {coach.lastCleaned && (
                  <div className="text-slate-300">
                    Last cleaned: {new Date(coach.lastCleaned).toLocaleTimeString()}
                  </div>
                )}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
