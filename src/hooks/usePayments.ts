// Хуки для работы с платежами через React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getPayment,
  getPayments,
  createPayment,
  updatePaymentStatus,
  checkPaymentStatus,
  type CreatePaymentParams,
  type PaymentResult,
  type PaymentStatus,
} from '@/lib/payment';
import type { Database } from '@/lib/supabase';
import { toast } from 'sonner';

type Payment = Database['public']['Tables']['payments']['Row'];

/**
 * Хук для получения платежа по ID
 */
export function usePayment(paymentId: string | null) {
  return useQuery<Payment | null>({
    queryKey: ['payment', paymentId],
    queryFn: () => {
      if (!paymentId) return Promise.resolve(null);
      return getPayment(paymentId);
    },
    enabled: !!paymentId,
    staleTime: 30 * 1000, // 30 секунд - статус платежа может быстро меняться
    gcTime: 2 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: true, // Обновляем при фокусе - важно для статуса платежа
    refetchInterval: (query) => {
      // Автоматически обновляем статус каждые 5 секунд, если платеж в процессе
      const payment = query.state.data;
      if (payment && (payment.status === 'pending' || payment.status === 'processing')) {
        return 5000;
      }
      return false;
    },
  });
}

/**
 * Хук для получения всех платежей пользователя
 */
export function usePayments() {
  const { user } = useAuth();

  return useQuery<Payment[]>({
    queryKey: ['payments', user?.id],
    queryFn: getPayments,
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 минута
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

/**
 * Хук для создания платежа
 */
export function useCreatePayment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<PaymentResult, Error, CreatePaymentParams>({
    mutationFn: createPayment,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['payments', user?.id] });
      queryClient.setQueryData(['payment', result.payment.id], result.payment);
      toast.success('Платеж создан');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка при создании платежа: ${error.message}`);
    },
  });
}

/**
 * Хук для обновления статуса платежа
 */
export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<
    Payment,
    Error,
    { paymentId: string; status: PaymentStatus; externalPaymentId?: string }
  >({
    mutationFn: ({ paymentId, status, externalPaymentId }) =>
      updatePaymentStatus(paymentId, status, externalPaymentId),
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: ['payments', user?.id] });
      queryClient.setQueryData(['payment', payment.id], payment);
      
      // Показываем уведомление в зависимости от статуса
      if (payment.status === 'completed') {
        toast.success('Платеж успешно завершен');
      } else if (payment.status === 'failed') {
        toast.error('Платеж не прошел');
      } else if (payment.status === 'cancelled') {
        toast.info('Платеж отменен');
      }
    },
    onError: (error: Error) => {
      toast.error(`Ошибка при обновлении статуса платежа: ${error.message}`);
    },
  });
}

/**
 * Хук для проверки статуса платежа
 */
export function useCheckPaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation<PaymentStatus, Error, string>({
    mutationFn: checkPaymentStatus,
    onSuccess: (status, paymentId) => {
      // Обновляем статус в кеше
      queryClient.setQueryData(['payment', paymentId], (old: Payment | null) => {
        if (old) {
          return { ...old, status };
        }
        return old;
      });
      queryClient.invalidateQueries({ queryKey: ['payment', paymentId] });
    },
    onError: (error: Error) => {
      toast.error(`Ошибка при проверке статуса платежа: ${error.message}`);
    },
  });
}













