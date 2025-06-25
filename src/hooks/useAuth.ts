
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'supervisor' | 'laborer';
  employee_id: string;
  phone?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener. This will also be triggered for the initial session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid blocking the auth state change, but fetch profile before setting loading to false.
          setTimeout(async () => {
            if (!mounted) return;
            
            try {
              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (!error && profileData && mounted) {
                setProfile(profileData);
              } else if (error) {
                console.error('Error fetching profile:', error);
                if (error.code === 'PGRST116') {
                  console.log("Profile not found for this user. Signing out to resolve inconsistent state.");
                  await supabase.auth.signOut();
                  // The onAuthStateChange listener will handle state updates upon sign-out.
                  // No need to set profile/loading here, as the sign-out will trigger a new auth state change.
                  return; // Exit early to prevent unnecessary state updates
                }
                setProfile(null);
              }
            } catch (error) {
              console.error('Error fetching profile:', error);
              setProfile(null);
            } finally {
              if (mounted) {
                setLoading(false);
              }
            }
          }, 0);
        } else {
          setProfile(null);
          if (mounted) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signOut,
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin',
    isSupervisor: profile?.role === 'supervisor',
    isLaborer: profile?.role === 'laborer'
  };
};

