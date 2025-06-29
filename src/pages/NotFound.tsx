import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

// --- SVG Component for the Ghost ---
// By creating a separate component for the SVG, we keep the main component cleaner.
const GhostWithScythe = ({ className }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 150 150" 
      className={className}
      // We set the fill on the SVG, and use "currentColor" inside for easier styling
      fill="currentColor"
    >
      {/* The main group for the floating animation */}
      <g className="animate-float">
        {/* Scythe Group: This will have the swing animation */}
        <g className="animate-scythe-swing" style={{ transformOrigin: '70px 85px' }}>
          {/* Scythe Handle */}
          <path d="M70 85 L100 115" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          {/* Scythe Blade */}
          <path d="M65 80 Q 40 40, 80 30 C 90 35, 75 75, 65 80 Z" />
        </g>
        
        {/* Ghost Body */}
        <path d="M40 130 C 40 90, 110 90, 110 130 L 95 120 L 80 130 L 65 120 L 50 130 Z" />
        
        {/* Ghost Eyes - with a separate class for the glow animation */}
        <g className="animate-eye-glow">
          <circle cx="65" cy="75" r="5" />
          <circle cx="85" cy="75" r="5" />
        </g>
      </g>
    </svg>
  );
};


// --- Main NotFound Component ---
const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User trespassed into non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // Generate particles for the background effect
  const particles = Array.from({ length: 50 });

  return (
    <>
      <div 
        className="relative min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-4 text-center overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(147, 51, 234, 0.08) 0%, transparent 60%)'
        }}
      >
        {/* Particle Container */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full bg-slate-700 animate-particle"
              style={{
                // Random positions and sizes
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 3}px`,
                height: `${Math.random() * 3}px`,
                // Random animation delay and duration for a natural effect
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${5 + Math.random() * 8}s`,
              }}
            />
          ))}
        </div>

        {/* The new Ghost component is used here */}
        <GhostWithScythe className="w-40 h-40 text-slate-700 mb-2 z-10" />

        <h1 className="font-extrabold text-9xl bg-gradient-to-r from-pink-400 via-violet-400 to-blue-400 bg-clip-text text-transparent animate-pulse-glow z-10">
          404
        </h1>

        <p className="mt-4 text-2xl font-semibold text-slate-300 z-10">
          You've Trespassed into the Void.
        </p>

        <p className="mt-2 text-slate-400 max-w-sm z-10">
          The page you seek has been reaped by our guardian. It might have been moved, deleted, or was never meant to be.
        </p>
        
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 z-10">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Flee to Safety
          </Button>
          <Button 
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-pink-500 to-violet-600 text-white group"
          >
            Return to the Mortal Realm
            <Home className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
          </Button>
        </div>
      </div>

      {/* We add all custom animations here to keep the component self-contained */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 1;
            text-shadow: 0 0 10px rgba(236, 72, 153, 0.3), 0 0 20px rgba(139, 92, 246, 0.2);
          }
          50% {
            opacity: 0.8;
            text-shadow: 0 0 20px rgba(236, 72, 153, 0.5), 0 0 40px rgba(139, 92, 246, 0.4);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes scythe-swing {
          0%, 100% { transform: rotate(10deg); }
          20% { transform: rotate(-30deg); } /* Wind up */
          60% { transform: rotate(45deg); } /* Swing */
          80% { transform: rotate(10deg); } /* Reset */
        }
        
        @keyframes eye-glow {
          0%, 100% { fill: currentColor; }
          50% { fill: #ec4899; } /* A menacing pink glow */
        }

        @keyframes particle-float {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-100px);
            opacity: 0;
          }
        }

        .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-scythe-swing { animation: scythe-swing 5s ease-in-out infinite 1s; } /* 1s delay */
        .animate-eye-glow { animation: eye-glow 4s ease-in-out infinite 0.5s; } /* 0.5s delay */
        .animate-particle { animation: particle-float linear infinite; }
      `}} />
    </>
  );
};

export default NotFound;
