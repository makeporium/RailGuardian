import React from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from './ui/button';

// --- Type Definitions ---
type Role = 'admin' | 'supervisor' | 'laborer';

interface ProtectedRouteProps {
  children: React.ReactNode;
  // The requireRole prop can now be a single role string OR an array of roles
  requireRole?: Role | Role[];
}

// --- Helper Component for Access Denied ---
const AccessDenied = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white text-center p-4">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
      <p className="text-slate-400 mb-6 max-w-sm">
        You do not have the necessary permissions to view this page. Please contact an administrator if you believe this is an error.
      </p>
      <Button onClick={() => navigate('/')} className="bg-gradient-to-r from-pink-500 to-violet-600">
        Return to Home
      </Button>
    </div>
  );
};


// --- The Main ProtectedRoute Component ---
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireRole 
}) => {
  // Now using isAuthenticated as well for a clearer check
  const { isAuthenticated, profile, loading } = useAuth();
  const location = useLocation();

  // 1. Show a full-screen loader while authentication state is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white mb-4" />
        <p className="text-white">Authenticating...</p>
      </div>
    );
  }

  // 2. If not loading and user is not authenticated, redirect to the auth page
  // We also pass the `from` location to allow redirecting back after login.
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 3. If a role is required, perform the improved validation check
  if (requireRole) {
    // This line ensures `allowedRoles` is always an array, making the logic simpler.
    const allowedRoles = Array.isArray(requireRole) ? requireRole : [requireRole];
    
    // Check if the user's profile exists and if their role is in the allowed list.
    if (!profile || !allowedRoles.includes(profile.role as Role)) {
      // If the role doesn't match, show the friendly Access Denied component.
      return <AccessDenied />;
    }
  }

  // 4. If all checks pass (user is authenticated and has the required role, if any),
  // render the child components.
  return <>{children}</>;
};