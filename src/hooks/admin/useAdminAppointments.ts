import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface AdminAppointment {
  id: string;
  user_id: string;
  profile_id: string | null;
  appointment_type_id: string;
  scheduled_at: string;
  status: 'payment_pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes: string | null;
  created_at: string;
  video_room_url: string | null;
  user?: {
    email: string | null;
  };
  profile?: {
    first_name: string;
    last_name: string | null;
  };
  appointment_type?: {
    name: string;
    duration_minutes: number;
    price: number;
  };
}

export function useAdminAppointments() {
  return useQuery<AdminAppointment[]>({
    queryKey: ['admin-appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          user:users!appointments_user_id_fkey(id, email),
          profile:profiles(id, first_name, last_name),
          appointment_type:appointment_types(id, name, duration_minutes, price)
        `)
        .order('scheduled_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        user: item.user?.[0] || item.user,
        profile: item.profile?.[0] || item.profile,
        appointment_type: item.appointment_type?.[0] || item.appointment_type,
      })) as AdminAppointment[];
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<AdminAppointment>;
    }) => {
      const { error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      toast.success('Консультация обновлена');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка обновления: ${error.message}`);
    },
  });
}












