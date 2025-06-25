// src/components/QRVerification.tsx

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, MapPin, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageProcessor } from './ImageProcessor';
import { useSubmitProof } from '@/hooks/useOtp';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

interface QRVerificationProps {
  qrToken: string;
  onClose: () => void;
  onComplete: () => void;
  onFallback: () => void;
}

export const QRVerification: React.FC<QRVerificationProps> = ({
  qrToken,
  onClose,
  onComplete,
  onFallback,
}) => {
  const [sessionData, setSessionData] = useState<any | null>(null);
  const [isImageProcessorOpen, setIsImageProcessorOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { mutate: submitProof } = useSubmitProof();
  const queryClient = useQueryClient();

  // Helper function to get staff_id
  const getStaffId = async (userId: string): Promise<string> => {
    const { data, error } = await supabase
      .from('staff')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new Error('Staff record not found for the current user.');
    }

    return data.id;
  };

  useEffect(() => {
  const fetchSession = async () => {
    const cleanedToken = qrToken.trim().replace(/^https?:\/\/[^/]+\//, '');
    console.log('🔍 Cleaned QR Token:', cleanedToken);

    if (!user || !user.id) {
      console.log('⏳ Waiting for user to be authenticated...');
      return; // Wait for user to be ready
    }

    try {
      const { data, error } = await (supabase as any)
        .from('otp_sessions')
        .select('*, coaches(*, trains(*))')
        .eq('qr_token', cleanedToken)
        .is('staff_id', null)
        .eq('is_active', true)
        .maybeSingle();

      console.log('📦 Session Response:', data);

      if (error || !data) {
        toast({
          title: 'Invalid QR',
          description: 'No active session found for this QR.',
          variant: 'destructive',
        });
        onFallback();
        return;
      }

      const staffId = await getStaffId(user.id);

      const { error: claimError } = await supabase
        .from('otp_sessions')
        .update({ staff_id: staffId })
        .eq('id', data.id);

      if (claimError) {
        toast({
          title: 'Claim Failed',
          description: 'Could not assign session to user.',
          variant: 'destructive',
        });
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['my_otps'] });
      setSessionData(data);
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      onFallback();
    }
  };

  fetchSession();
}, [qrToken, user]);


  const handleProofComplete = (imageUrl: string) => {
    if (!sessionData) return;

    setIsSubmitting(true);
    submitProof(
      {
        session: sessionData,
        imageUrl,
      },
      {
        onSuccess: () => {
          setIsSubmitting(false);
          setIsImageProcessorOpen(false);
          onComplete(); // Close scanner
        },
        onError: () => {
          setIsSubmitting(false);
          setIsImageProcessorOpen(false);
        },
      }
    );
  };

  const handleStart = () => {
  toast({
    title: 'QR Verified',
    description: 'Session has been claimed and added to your active sessions.',
  });
  onClose();
  onComplete(); // to trigger dashboard refresh if needed
};

  const handleProcessorClose = () => setIsImageProcessorOpen(false);

  if (!sessionData) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="w-96 bg-white p-6 rounded shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5 text-green-600 text-green" />
              QR Verified Successfully
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="text-sm text-gray-700 space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>
                <strong>Train:</strong>{' '}
                {sessionData?.coaches?.trains?.train_name ?? 'N/A'} (
                {sessionData?.coaches?.trains?.train_number ?? 'N/A'})
              </span>
            </div>
            <div>
              <strong>Coach:</strong>{' '}
              {sessionData?.coaches?.coach_number ?? 'N/A'} (
              {sessionData?.coaches?.coach_type ?? 'N/A'})
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>
                <strong>Expires At:</strong>{' '}
                {new Date(sessionData?.expires_at).toLocaleString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true,
                })
                }
              </span>
            </div>
            <div>
              
            </div>
          </div>

          <Button
            onClick={handleStart}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            disabled={isSubmitting}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Start Cleaning'}
          </Button>
        </div>
      </div>

      {isImageProcessorOpen && (
        <ImageProcessor
          onClose={handleProcessorClose}
          onComplete={handleProofComplete}
        />
      )}
    </>
  );
};
