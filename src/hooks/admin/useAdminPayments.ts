import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface AdminPayment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  payment_method: string | null;
  external_payment_id: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    email: string | null;
  };
}

export function useAdminPayments() {
  return useQuery<AdminPayment[]>({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          user:users!payments_user_id_fkey(id, email)
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        user: item.user?.[0] || item.user,
      })) as AdminPayment[];
    },
  });
}












