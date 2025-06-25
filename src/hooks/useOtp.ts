  // src/hooks/useOtp.ts

  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
  import { supabase } from '@/integrations/supabase/client';
  import { useAuth } from './useAuth';
  import { useToast } from '@/hooks/use-toast';

  // Get staff ID using user ID
  const getStaffId = async (userId: string) => {
    const { data, error } = await supabase
      .from('staff')
      .select('id')
      .eq('user_id', userId)
      .single();
    if (error) throw new Error('Staff record not found for the current user.');
    return data.id;
  };

  // 🔹 Get all active OTP or QR sessions for a worker
  export const useMyOtps = () => {
    const { user } = useAuth();
    return useQuery({
      queryKey: ['my_otps', user?.id],
      queryFn: async () => {
        if (!user) return null;
        const staffId = await getStaffId(user.id);
        const { data, error } = await supabase
          .from('otp_sessions')
          .select('*, coaches(*, trains(*))')
          .eq('staff_id', staffId)
          .eq('is_active', true);
        if (error) throw error;
        return data;
      },
      enabled: !!user,
    });
  };

  // 🔹 Worker manually enters OTP
  export const useVerifyOtp = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { toast } = useToast();

    return useMutation({
      mutationFn: async (otpCode: string) => {
        if (!user) throw new Error("User not authenticated");
        const staffId = await getStaffId(user.id);

        const { data: otpSession, error: findError } = await supabase
          .from('otp_sessions')
          .select('id')
          .eq('otp_code', otpCode)
          .is('staff_id', null)
          .maybeSingle();

        if (findError) throw new Error('Error while verifying OTP.');
        if (!otpSession) throw new Error('Invalid OTP, or it has already been claimed.');

        const { error: updateError } = await supabase
          .from('otp_sessions')
          .update({ staff_id: staffId })
          .eq('id', otpSession.id);

        if (updateError) throw new Error('Failed to claim OTP session.');

        return otpSession;
      },
      onSuccess: () => {
        toast({
          title: 'Success!',
          description: 'OTP verified and session claimed successfully.',
        });
        queryClient.invalidateQueries({ queryKey: ['my_otps'] });
        queryClient.invalidateQueries({ queryKey: ['otp_sessions'] });
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  // 🔹 Cleaning records list for worker
  export const useMyCleaningRecords = () => {
    const { user } = useAuth();
    return useQuery({
      queryKey: ['my_cleaning_records', user?.id],
      queryFn: async () => {
        if (!user) return null;
        const staffId = await getStaffId(user.id);
        const { data, error } = await supabase
          .from('cleaning_records')
          .select(`
            *,
            washrooms:washroom_id (
              location_description,
              coaches:coach_id (
                coach_number,
                trains:train_id (
                  train_name
                )
              )
            )
          `)
          .eq('staff_id', staffId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
      },
      enabled: !!user,
    });
  };

  // 🔹 Submit proof for an OTP/QR session
  export const useSubmitProof = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
      mutationFn: async ({ session, imageUrls }: { session: any; imageUrls: string[] }) => {
        console.log('📥 Submitting Proof for session:', session);

        // 1. Validate washroom
        const { data: washrooms, error: washroomError } = await supabase
          .from('washrooms')
          .select('id')
          .eq('coach_id', session.coach_id)
          .limit(1);

        if (washroomError || !washrooms || washrooms.length === 0) {
          throw new Error(`No washrooms found for coach ${session.coaches?.coach_number || session.coach_id}.`);
        }

        const washroomId = washrooms[0].id;

        // 2. Create cleaning record
        const { error: recordError } = await supabase.from('cleaning_records').insert({
          washroom_id: washroomId,
          staff_id: session.staff_id,
            train_id: session.train_id, // ✅ THIS FIXES THE ERROR
          status: 'completed',
          approval_status: 'pending',
          started_at: session.created_at,
          completed_at: new Date().toISOString(),
          after_photo_url: JSON.stringify(imageUrls),
          notes: 'Submitted for manual review.',
        });

        if (recordError) {
          console.error("❌ Failed to insert cleaning record:", recordError);
          console.error("❌ Supabase insert error:", recordError); // ⬅️ ADD THIS LINE
          throw new Error('Failed to create cleaning record.');
        }

        // 3. Deactivate session
        const { error: deactivateError } = await supabase
          .from('otp_sessions')
          .update({ is_active: false })
          .eq('id', session.id);

        if (deactivateError) {
          console.error('❌ Failed to deactivate session:', deactivateError);
          throw new Error('Failed to deactivate session.');
        }

        return { washroomId };
      },
      onSuccess: () => {
        toast({
          title: 'Submitted!',
          description: 'Your proof of cleaning has been submitted for review.',
        });
        queryClient.invalidateQueries({ queryKey: ['my_otps'] });
        queryClient.invalidateQueries({ queryKey: ['my_cleaning_records'] });
        queryClient.invalidateQueries({ queryKey: ['admin_dashboard_data'] });
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };
