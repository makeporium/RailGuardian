import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * This component acts as a router/redirector.
 * When a user navigates to '/dashboard', this component checks their role
 * and immediately redirects them to their specific dashboard page 
 * (e.g., '/dashboard/admin', '/dashboard/worker').
 * It only shows a loading screen while this check is in progress.
 */
const Dashboard = () => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait until the authentication status is confirmed
    if (loading) {
      return;
    }

    // If the user's profile is loaded, redirect based on their role
    if (profile) {
      switch (profile.role) {
        case 'admin':
          navigate('/dashboard/admin', { replace: true });
          break;
        case 'supervisor':
          navigate('/dashboard/supervisor', { replace: true });
          break;
        case 'laborer':
          navigate('/dashboard/worker', { replace: true });
          break;
        default:
          // If role is unknown or not set, send back to auth page
          navigate('/auth', { replace: true });
          break;
      }
    } else {
      // If loading is finished and there's still no profile, the user is not logged in.
      // Redirect them to the authentication page.
      navigate('/auth', { replace: true });
    }
  }, [profile, loading, navigate]);

  // Render a full-screen loading indicator while the redirect is being processed.
  // This prevents any other content from flashing on the screen.
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
      <Loader2 className="h-8 w-8 animate-spin mb-4" />
      <p>Routing to your dashboard...</p>
    </div>
  );
};

export default Dashboard;