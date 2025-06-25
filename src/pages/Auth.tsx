import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Train, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Signup form state
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    fullName: '',
    employeeId: '',
    phone: ''
  });

  // Forgot password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // This useEffect handles auto-login if a session already exists.
  // It correctly navigates to /dashboard, where the router component
  // will handle the final redirect to the role-specific page.
  // NO CHANGES ARE NEEDED HERE.
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        navigate('/dashboard');
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // MODIFIED: This function now fetches the user's role and navigates directly.
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Sign in the user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          toast({
            title: "Login Failed",
            description: "Invalid email or password. Please check your credentials.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Login Failed",
            description: authError.message,
            variant: "destructive"
          });
        }
        return; // Stop execution if login fails
      }

      // Step 2: If login is successful, fetch the user's profile to get their role
      if (authData.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        if (profileError) {
          // Handle case where profile might not exist or there's a DB error
          toast({
            title: "Login Error",
            description: "Could not retrieve user profile. Please contact support.",
            variant: "destructive",
          });
          // Log out the user to prevent being in a broken state
          await supabase.auth.signOut();
          return;
        }
        
        toast({
          title: "Welcome Back!",
          description: "Successfully logged in.",
        });

        // Step 3: Navigate based on the fetched role
        const role = profileData?.role;
        switch (role) {
          case 'admin':
            navigate('/dashboard/admin');
            break;
          case 'supervisor':
            navigate('/dashboard/supervisor');
            break;
          case 'laborer':
            navigate('/dashboard/worker');
            break;
          default:
            // Fallback to the generic dashboard if role is not found or is unexpected
            navigate('/dashboard');
            break;
        }
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // NOTE: For signup, we redirect to a generic page because the user must first
      // verify their email. The role will be assigned after verification.
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: signupData.fullName,
            employee_id: signupData.employeeId,
            phone: signupData.phone,
            // You might set a default role here if your policies allow
            // role: 'laborer' 
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast({
            title: "Signup Failed",
            description: "An account with this email already exists. Please try logging in instead.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Signup Failed",
            description: error.message,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account.",
        });
        setSignupData({
          email: '',
          password: '',
          fullName: '',
          employeeId: '',
          phone: ''
        });
      }
    } catch (error) {
      toast({
        title: "Signup Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/dashboard`,
      });

      if (error) {
        toast({
          title: "Reset Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setResetSent(true);
        toast({
          title: "Reset Email Sent",
          description: "Please check your email for password reset instructions.",
        });
      }
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex items-center justify-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-violet-600 rounded-lg flex items-center justify-center">
              <Train className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Railway Clean</h1>
          </div>
          <p className="text-slate-400">Hygiene Management System</p>
        </div>

        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
          <CardHeader>
            <CardTitle className="text-white text-center">Account Access</CardTitle>
            <CardDescription className="text-slate-400 text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
                <TabsTrigger value="login" className="text-slate-300">Login</TabsTrigger>
                <TabsTrigger value="signup" className="text-slate-300">Sign Up</TabsTrigger>
                <TabsTrigger value="reset" className="text-slate-300">Reset</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-300">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        className="bg-slate-800/50 border-slate-700 text-white pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700"
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              {/* ... The rest of the component (Signup, Reset Password) remains the same ... */}
              <TabsContent value="signup" className="space-y-4 mt-6">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-slate-300">Full Name</Label>
                    <Input id="fullName" value={signupData.fullName} onChange={(e) => setSignupData({...signupData, fullName: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employeeId" className="text-slate-300">Employee ID</Label>
                    <Input id="employeeId" value={signupData.employeeId} onChange={(e) => setSignupData({...signupData, employeeId: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signupEmail" className="text-slate-300">Email</Label>
                    <Input id="signupEmail" type="email" value={signupData.email} onChange={(e) => setSignupData({...signupData, email: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-300">Phone (Optional)</Label>
                    <Input id="phone" type="tel" value={signupData.phone} onChange={(e) => setSignupData({...signupData, phone: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signupPassword" className="text-slate-300">Password</Label>
                    <div className="relative">
                      <Input id="signupPassword" type={showPassword ? "text" : "password"} value={signupData.password} onChange={(e) => setSignupData({...signupData, password: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white pr-10" required minLength={6} />
                      <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="reset" className="space-y-4 mt-6">
                {!resetSent ? (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="resetEmail" className="text-slate-300">Email Address</Label>
                      <Input id="resetEmail" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="bg-slate-800/50 border-slate-700 text-white" required />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
                      {loading ? 'Sending...' : 'Send Reset Email'}
                    </Button>
                  </form>
                ) : (
                  <Alert className="bg-emerald-900/30 border-emerald-700">
                    <AlertDescription className="text-emerald-300">
                      Password reset email sent! Please check your inbox and follow the instructions to reset your password.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;