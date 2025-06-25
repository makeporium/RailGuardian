import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Ghost } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // This is good for debugging purposes.
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <>
      <div 
        className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-4 text-center overflow-hidden"
        style={{
          // Creates a subtle background glow effect
          backgroundImage: 'radial-gradient(circle, rgba(147, 51, 234, 0.08) 0%, transparent 60%)'
        }}
      >
        <Ghost className="w-24 h-24 text-slate-700 animate-float mb-6" />

        <h1 className="font-extrabold text-9xl bg-gradient-to-r from-pink-400 via-violet-400 to-blue-400 bg-clip-text text-transparent animate-pulse-glow">
          404
        </h1>

        <p className="mt-4 text-2xl font-semibold text-slate-300">
          Oops! You've found a digital ghost.
        </p>

        <p className="mt-2 text-slate-400 max-w-sm">
          The page you are looking for might have been moved, deleted, or perhaps it never existed in this dimension.
        </p>
        
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)} // Navigates to the previous page
            className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Button 
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-pink-500 to-violet-600 text-white group"
          >
            Return to Homepage
            <Home className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
          </Button>
        </div>
      </div>

      {/* We add the custom animations directly into the component for simplicity */}
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
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        .animate-pulse-glow {
          animation: pulse-glow 4s ease-in-out infinite;
        }

        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
      `}} />
    </>
  );
};

export default NotFound;