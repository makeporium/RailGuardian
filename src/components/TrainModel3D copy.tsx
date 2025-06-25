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
      <CheckCircle className="w-4 h-4 text-white" />
    ) : (
      <XCircle className="w-4 h-4 text-white" />
    );
  };

  return (
    <div
      ref={trainRef}
      className="relative w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-lg overflow-hidden"
      style={{
        transform: isHovering
          ? `perspective(1000px) rotateX(${(mousePosition.y - 50) * 0.05}deg) rotateY(${(mousePosition.x - 50) * 0.05}deg)`
          : 'none',
        transition: 'transform 0.1s ease-out',
      }}
    >
      {/* Summary Bar */}
      <div className="absolute top-4 left-4 z-10 text-white text-sm bg-slate-800/80 px-4 py-2 rounded-lg shadow-lg flex space-x-4">
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

      {/* Engine */}
      <div className="absolute bottom-24 left-4 w-16 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-l-xl rounded-r-md shadow-lg flex items-center justify-center text-white text-xs font-bold">
        ENG
      </div>

      {/* Coaches */}
      <div className="absolute bottom-24 left-20 flex space-x-3 overflow-x-auto pr-4 max-w-full">
        {trainData.coaches.map((coach, index) => (
          <div
            key={coach.id}
            className="relative group"
            onMouseEnter={() => setHoveredCoach(coach)}
            onMouseLeave={() => setHoveredCoach(null)}
          >
            <div
              className={`w-14 h-14 bg-gradient-to-r ${getCoachColor(
                coach
              )} rounded-md shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-200`}
            >
              {getCoachIcon(coach)}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-slate-800 rounded-full text-white text-xs flex items-center justify-center font-bold">
                {coach.coach_number || index + 1}
              </div>
            </div>

            {/* Tooltip */}
            {hoveredCoach?.id === coach.id && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs rounded-lg p-3 z-20 whitespace-nowrap">
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
