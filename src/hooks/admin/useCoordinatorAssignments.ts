/**
 * Хуки для функционала координатора
 * - Получение неназначенных записей (без специалиста)
 * - Получение списка специалистов
 * - Назначение клиента специалисту
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Тип неназначенной записи
export interface UnassignedAppointment {
  id: string;
  user_id: string;
  profile_id: string | null;
  scheduled_at: string;
  status: string;
  appointment_type_name: string | null;
  notes: string | null;
  created_at: string;
  user_email: string | null;
  user_phone: string | null;
  profile_first_name: string | null;
  profile_last_name: string | null;
  profile_type: string | null;
}

// Тип специалиста для выбора
export interface AvailableSpecialist {
  id: string;
  user_id: string;
  display_name: string;
  specialization_codes: string[];
  is_available: boolean;
  accepts_new_clients: boolean;
  current_clients_count: number;
  max_clients: number;
}

// Тип назначения
export interface ClientAssignment {
  id: string;
  client_user_id: string;
  specialist_id: string;
  profile_id: string | null;
  assignment_type: 'primary' | 'consultant' | 'temporary';
  status: string;
  assigned_at: string;
  notes: string | null;
}

/**
 * Получить неназначенные записи (без специалиста)
 */
export function useUnassignedAppointments() {
  return useQuery<UnassignedAppointment[]>({
    queryKey: ['coordinator-unassigned-appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          user_id,
          profile_id,
          scheduled_at,
          status,
          notes,
          created_at,
          appointment_type:appointment_types(name),
          user:users!appointments_user_id_fkey(email, phone),
          profile:profiles(first_name, last_name, type)
        `)
        .is('specialist_id', null)
        .in('status', ['pending_specialist', 'scheduled', 'in_progress'])
        .order('scheduled_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        profile_id: item.profile_id,
        scheduled_at: item.scheduled_at,
        status: item.status,
        notes: item.notes,
        created_at: item.created_at,
        appointment_type_name: item.appointment_type?.name || null,
        user_email: item.user?.email || null,
        user_phone: item.user?.phone || null,
        profile_first_name: item.profile?.first_name || null,
        profile_last_name: item.profile?.last_name || null,
        profile_type: item.profile?.type || null,
      }));
    },
    staleTime: 30 * 1000, // 30 секунд
  });
}

/**
 * Получить список доступных специалистов
 */
export function useAvailableSpecialists() {
  return useQuery<AvailableSpecialist[]>({
    queryKey: ['coordinator-available-specialists'],
    queryFn: async () => {
      // Получаем специалистов
      const { data: specialists, error: specError } = await supabase
        .from('specialists')
        .select('*')
        .eq('is_available', true)
        .order('display_name');

      if (specError) throw specError;

      // Получаем количество активных клиентов для каждого специалиста
      const specialistIds = (specialists || []).map(s => s.id);

      const { data: assignmentCounts, error: countError } = await supabase
        .from('client_assignments')
        .select('specialist_id')
        .in('specialist_id', specialistIds)
        .eq('status', 'active');

      if (countError) throw countError;

      // Считаем клиентов по специалистам
      const countMap: Record<string, number> = {};
      (assignmentCounts || []).forEach(a => {
        countMap[a.specialist_id] = (countMap[a.specialist_id] || 0) + 1;
      });

      return (specialists || []).map(s => ({
        id: s.id,
        user_id: s.user_id,
        display_name: s.display_name,
        specialization_codes: s.specialization_codes || [],
        is_available: s.is_available,
        accepts_new_clients: s.accepts_new_clients,
        current_clients_count: countMap[s.id] || 0,
        max_clients: s.max_clients || 50,
      }));
    },
    staleTime: 60 * 1000, // 1 минута
  });
}

/**
 * Назначить клиента специалисту
 */
export function useAssignClientToSpecialist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      appointmentId,
      clientUserId,
      specialistId,
      profileId,
      assignmentType = 'primary',
      notes,
    }: {
      appointmentId: string;
      clientUserId: string;
      specialistId: string;
      profileId?: string | null;
      assignmentType?: 'primary' | 'consultant' | 'temporary';
      notes?: string;
    }) => {
      // 1. Проверяем, есть ли уже активное назначение для этого профиля
      let query = supabase
        .from('client_assignments')
        .select('id')
        .eq('client_user_id', clientUserId)
        .eq('specialist_id', specialistId)
        .eq('status', 'active');

      // Если указан профиль, проверяем для конкретного профиля
      if (profileId) {
        query = query.eq('profile_id', profileId);
      } else {
        query = query.is('profile_id', null);
      }

      const { data: existingAssignment } = await query.maybeSingle();

      // 2. Если назначения нет - создаём
      if (!existingAssignment) {
        const { data: userData } = await supabase.auth.getUser();

        const { error: assignError } = await supabase
          .from('client_assignments')
          .insert({
            client_user_id: clientUserId,
            specialist_id: specialistId,
            profile_id: profileId || null,
            assignment_type: assignmentType,
            assigned_by: userData.user?.id,
            status: 'active',
            notes: notes || null,
            started_at: new Date().toISOString(),
          });

        if (assignError) throw assignError;
      }

      // 3. Обновляем запись - привязываем к специалисту и меняем статус на scheduled
      // Используем RPC функцию для корректной обработки уведомлений
      const { data: userData } = await supabase.auth.getUser();

      const { error: assignError2 } = await supabase
        .rpc('assign_specialist_to_appointment', {
          p_appointment_id: appointmentId,
          p_specialist_id: specialistId,
          p_assigned_by: userData.user?.id || null,
        });

      if (assignError2) throw assignError2;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coordinator-unassigned-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['coordinator-available-specialists'] });
      queryClient.invalidateQueries({ queryKey: ['coordinator-all-assignments'] });
      toast.success('Клиент успешно назначен специалисту');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка назначения: ${error.message}`);
    },
  });
}

/**
 * Получить все назначения (для координатора)
 */
export function useAllClientAssignments() {
  return useQuery<(ClientAssignment & {
    client_email: string | null;
    client_first_name: string | null;
    client_last_name: string | null;
    profile_first_name: string | null;
    profile_last_name: string | null;
    profile_type: string | null;
    specialist_name: string | null;
    specialist_specializations: string[];
  })[]>({
    queryKey: ['coordinator-all-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_assignments')
        .select(`
          *,
          client:users!client_assignments_client_user_id_fkey(
            email,
            client_profile:profiles(first_name, last_name)
          ),
          profile:profiles!client_assignments_profile_id_fkey(first_name, last_name, type),
          specialist:specialists!client_assignments_specialist_id_fkey(display_name, specialization_codes)
        `)
        .order('assigned_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => {
        const clientProfile = item.client?.client_profile?.[0] || item.client?.client_profile;
        return {
          id: item.id,
          client_user_id: item.client_user_id,
          specialist_id: item.specialist_id,
          profile_id: item.profile_id,
          assignment_type: item.assignment_type,
          status: item.status,
          assigned_at: item.assigned_at,
          notes: item.notes,
          client_email: item.client?.email || null,
          client_first_name: clientProfile?.first_name || null,
          client_last_name: clientProfile?.last_name || null,
          // Профиль, к которому привязан специалист (ребёнок)
          profile_first_name: item.profile?.first_name || null,
          profile_last_name: item.profile?.last_name || null,
          profile_type: item.profile?.type || null,
          specialist_name: item.specialist?.display_name || null,
          specialist_specializations: item.specialist?.specialization_codes || [],
        };
      });
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Обновить назначение
 */
export function useUpdateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      assignment_type,
      status,
      notes,
    }: {
      id: string;
      assignment_type?: 'primary' | 'consultant' | 'temporary';
      status?: string;
      notes?: string | null;
    }) => {
      const updates: Record<string, any> = {};
      if (assignment_type !== undefined) updates.assignment_type = assignment_type;
      if (status !== undefined) updates.status = status;
      if (notes !== undefined) updates.notes = notes;

      const { error } = await supabase
        .from('client_assignments')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coordinator-all-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['coordinator-available-specialists'] });
      toast.success('Назначение обновлено');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка обновления: ${error.message}`);
    },
  });
}

// Тип запроса на смену специалиста
export interface SpecialistChangeRequest {
  id: string;
  client_user_id: string;
  current_specialist_id: string;
  new_specialist_id: string | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  processed_by: string | null;
  processed_at: string | null;
  coordinator_notes: string | null;
  created_at: string;
  updated_at: string;
  // Связанные данные
  client_email: string | null;
  client_first_name: string | null;
  client_last_name: string | null;
  current_specialist_name: string | null;
  new_specialist_name: string | null;
}

/**
 * Получить все запросы на смену специалиста (для админа)
 */
export function useChangeRequests() {
  return useQuery<SpecialistChangeRequest[]>({
    queryKey: ['admin-change-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('specialist_change_requests')
        .select(`
          *,
          client:users!specialist_change_requests_client_user_id_fkey(
            email,
            profile:profiles(first_name, last_name)
          ),
          current_specialist:specialists!specialist_change_requests_current_specialist_id_fkey(display_name),
          new_specialist:specialists!specialist_change_requests_new_specialist_id_fkey(display_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => {
        const clientProfile = item.client?.profile?.[0] || item.client?.profile;
        return {
          id: item.id,
          client_user_id: item.client_user_id,
          current_specialist_id: item.current_specialist_id,
          new_specialist_id: item.new_specialist_id,
          reason: item.reason,
          status: item.status,
          processed_by: item.processed_by,
          processed_at: item.processed_at,
          coordinator_notes: item.coordinator_notes,
          created_at: item.created_at,
          updated_at: item.updated_at,
          client_email: item.client?.email || null,
          client_first_name: clientProfile?.first_name || null,
          client_last_name: clientProfile?.last_name || null,
          current_specialist_name: item.current_specialist?.display_name || null,
          new_specialist_name: item.new_specialist?.display_name || null,
        };
      });
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Обработать запрос на смену специалиста (одобрить/отклонить)
 */
export function useProcessChangeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      newSpecialistId,
      status,
      notes,
    }: {
      requestId: string;
      newSpecialistId: string | null;
      status: 'approved' | 'rejected';
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .rpc('process_specialist_change_request', {
          p_request_id: requestId,
          p_new_specialist_id: newSpecialistId,
          p_status: status,
          p_notes: notes || null,
        });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-change-requests'] });
      queryClient.invalidateQueries({ queryKey: ['coordinator-all-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['coordinator-available-specialists'] });

      if (variables.status === 'approved') {
        toast.success('Запрос одобрен, специалист изменён');
      } else {
        toast.success('Запрос отклонён');
      }
    },
    onError: (error: Error) => {
      toast.error(`Ошибка обработки запроса: ${error.message}`);
    },
  });
}
