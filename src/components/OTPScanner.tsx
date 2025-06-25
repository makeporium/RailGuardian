import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyRound, CheckCircle, X, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface OTPScannerProps {
  onComplete: () => void;
  onClose: () => void;
}

export const OTPScanner: React.FC<OTPScannerProps> = ({ onComplete, onClose }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const verifyOTP = async () => {
    if (!otp || !user) return;

    setLoading(true);
    try {
      // Find OTP session
      const { data: otpData, error: otpError } = await supabase
        .from('otp_sessions')
        .select(`
          *,
          trains:train_id (train_number, train_name, route),
          coaches:coach_id (coach_number, coach_type)
        `)
        .eq('otp_code', otp)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (otpError || !otpData) {
        toast({
          title: "Invalid OTP",
          description: "OTP not found or expired. Please check and try again.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Find staff record for current user
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (staffError || !staffData) {
        toast({
          title: "Error",
          description: "Staff record not found. Please contact administrator.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Update OTP session with staff assignment
      const { error: updateError } = await supabase
        .from('otp_sessions')
        .update({ staff_id: staffData.id })
        .eq('id', otpData.id);

      if (updateError) {
        console.error('Error updating OTP session:', updateError);
      }

      setSessionData({
        ...otpData,
        staffId: staffData.id,
        startTime: new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
      });

    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({
        title: "Error",
        description: "Failed to verify OTP. Please try again.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const startCleaning = async () => {
    if (!sessionData || !user) return;

    try {
      // Get washrooms for this coach
      const { data: washrooms, error: washroomError } = await supabase
        .from('washrooms')
        .select('*')
        .eq('coach_id', sessionData.coach_id);

      if (washroomError) {
        console.error('Error fetching washrooms:', washroomError);
        return;
      }

      // Create cleaning record for each washroom
      for (const washroom of washrooms || []) {
        const { error: recordError } = await supabase
          .from('cleaning_records')
          .insert({
            washroom_id: washroom.id,
            staff_id: sessionData.staffId,
            status: 'in_progress',
            started_at: new Date().toISOString(),
            notes: `OTP-initiated cleaning session for ${sessionData.trains.train_name} - Coach ${sessionData.coaches.coach_number}`
          });

        if (recordError) {
          console.error('Error creating cleaning record:', recordError);
        }
      }

      toast({
        title: "Cleaning Session Started",
        description: `Started cleaning ${sessionData.trains.train_name} - Coach ${sessionData.coaches.coach_number}`,
      });

      onComplete();
    } catch (error) {
      console.error('Error starting cleaning session:', error);
      toast({
        title: "Error",
        description: "Failed to start cleaning session. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-96 bg-slate-900 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center space-x-2">
            <KeyRound className="w-5 h-5" />
            <span>Enter OTP Code</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {!sessionData ? (
            <>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
                    <KeyRound className="w-10 h-10 text-blue-400" />
                  </div>
                  <p className="text-slate-300 text-sm">
                    Enter the OTP code provided for your assigned coach
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Enter OTP (e.g., 1231)"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>
              </div>
              
              <Button 
                onClick={verifyOTP}
                disabled={loading || !otp}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </>
          ) : (
            <>
              <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">OTP Verified Successfully</span>
                </div>
                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span><strong>Train:</strong> {sessionData.trains.train_name} ({sessionData.trains.train_number})</span>
                  </div>
                  <div><strong>Route:</strong> {sessionData.trains.route}</div>
                  <div><strong>Coach:</strong> {sessionData.coaches.coach_number} ({sessionData.coaches.coach_type})</div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span><strong>Start Time:</strong> {sessionData.startTime}</span>
                  </div>
                  <div><strong>OTP:</strong> {sessionData.otp_code}</div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={startCleaning} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  Start Cleaning
                </Button>
                <Button variant="outline" onClick={() => setSessionData(null)} className="flex-1">
                  Verify Again
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
