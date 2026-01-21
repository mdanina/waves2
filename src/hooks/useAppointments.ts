// Хуки для работы с консультациями через React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAppointmentTypes,
  getAppointmentType,
  getAppointments,
  getAppointment,
  getUpcomingAppointments,
  getAppointmentsWithType,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getActiveFreeConsultation,
  hasCompletedFreeConsultation,
  checkFreeConsultationExpiry,
  FREE_CONSULTATION_EXPIRY_DAYS,
} from '@/lib/appointmentStorage';
import type { Database } from '@/lib/supabase';
import { toast } from 'sonner';

type AppointmentType = Database['public']['Tables']['appointment_types']['Row'];
type Appointment = Database['public']['Tables']['appointments']['Row'];

/**
 * Хук для получения всех типов консультаций
 */
export function useAppointmentTypes() {
  return useQuery<AppointmentType[]>({
    queryKey: ['appointment-types'],
    queryFn: getAppointmentTypes,
    staleTime: 10 * 60 * 1000, // 10 минут - типы консультаций редко меняются
    gcTime: 30 * 60 * 1000, // 30 минут
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Хук для получения типа консультации по ID
 */
export function useAppointmentType(typeId: string | null) {
  return useQuery<AppointmentType | null>({
    queryKey: ['appointment-type', typeId],
    queryFn: () => {
      if (!typeId) return Promise.resolve(null);
      return getAppointmentType(typeId);
    },
    enabled: !!typeId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Хук для получения всех консультаций пользователя
 */
export function useAppointments() {
  const { user } = useAuth();

  return useQuery<Appointment[]>({
    queryKey: ['appointments', user?.id],
    queryFn: getAppointments,
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 минуты
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

/**
 * Хук для получения консультаций с информацией о типе
 */
export function useAppointmentsWithType() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['appointments-with-type', user?.id],
    queryFn: () => {
      if (!user?.id) {
        throw new Error('User ID is required');
      }
      return getAppointmentsWithType(user.id);
    },
    enabled: !!user?.id, // Запрос только если пользователь авторизован и есть ID
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

/**
 * Хук для получения предстоящих консультаций
 */
export function useUpcomingAppointments() {
  const { user } = useAuth();

  return useQuery<Appointment[]>({
    queryKey: ['upcoming-appointments', user?.id],
    queryFn: getUpcomingAppointments,
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 минута - предстоящие консультации меняются чаще
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

/**
 * Хук для получения консультации по ID
 */
export function useAppointment(appointmentId: string | null) {
  return useQuery<Appointment | null>({
    queryKey: ['appointment', appointmentId],
    queryFn: () => {
      if (!appointmentId) return Promise.resolve(null);
      return getAppointment(appointmentId);
    },
    enabled: !!appointmentId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Хук для получения активной бесплатной консультации
 */
export function useActiveFreeConsultation() {
  const { user } = useAuth();

  return useQuery<(Appointment & { appointment_type: AppointmentType }) | null>({
    queryKey: ['active-free-consultation', user?.id],
    queryFn: getActiveFreeConsultation,
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 минута
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

/**
 * Хук для проверки, была ли завершена бесплатная консультация
 */
export function useCompletedFreeConsultation() {
  const { user } = useAuth();

  return useQuery<boolean>({
    queryKey: ['completed-free-consultation', user?.id],
    queryFn: hasCompletedFreeConsultation,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 минут
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

/**
 * Хук для проверки срока действия бесплатной консультации
 * Возвращает информацию об истечении срока (14 дней с момента первого чекапа)
 */
export function useFreeConsultationExpiry() {
  const { user } = useAuth();

  return useQuery<{
    expired: boolean;
    expiryDate: Date | null;
    daysLeft: number | null;
  }>({
    queryKey: ['free-consultation-expiry', user?.id],
    queryFn: checkFreeConsultationExpiry,
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 минута
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

// Реэкспортируем константу для использования в компонентах
export { FREE_CONSULTATION_EXPIRY_DAYS };

/**
 * Хук для создания консультации
 */
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({
      appointmentTypeId,
      scheduledAt,
      profileId,
      notes,
      paymentId,
      specialistId,
    }: {
      appointmentTypeId: string;
      scheduledAt: string;
      profileId?: string | null;
      notes?: string;
      paymentId?: string | null;
      specialistId?: string | null;
    }) => createAppointment(appointmentTypeId, scheduledAt, profileId, notes, paymentId, specialistId),
    onSuccess: () => {
      // Инвалидируем кеш консультаций групповой инвалидацией
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === 'appointments' || 
                 key === 'upcoming-appointments' ||
                 key === 'appointments-with-type' ||
                 key === 'active-free-consultation';
        }
      });
      toast.success('Консультация успешно записана');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка при записи на консультацию: ${error.message}`);
    },
  });
}

/**
 * Хук для обновления консультации
 */
export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({
      appointmentId,
      updates,
    }: {
      appointmentId: string;
      updates: Parameters<typeof updateAppointment>[1];
    }) => updateAppointment(appointmentId, updates),
    onSuccess: (_, variables) => {
      // Инвалидируем конкретную консультацию и групповые запросы
      queryClient.invalidateQueries({ queryKey: ['appointment', variables.appointmentId] });
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === 'appointments' || 
                 key === 'upcoming-appointments' ||
                 key === 'appointments-with-type' ||
                 key === 'active-free-consultation';
        }
      });
      toast.success('Консультация обновлена');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка при обновлении консультации: ${error.message}`);
    },
  });
}

/**
 * Хук для отмены консультации
 */
export function useCancelAppointment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (appointmentId: string) => cancelAppointment(appointmentId),
    onSuccess: () => {
      // Инвалидируем кеш консультаций групповой инвалидацией
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === 'appointments' || 
                 key === 'upcoming-appointments' ||
                 key === 'appointments-with-type' ||
                 key === 'active-free-consultation';
        }
      });
      toast.success('Консультация отменена');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка при отмене консультации: ${error.message}`);
    },
  });
}

