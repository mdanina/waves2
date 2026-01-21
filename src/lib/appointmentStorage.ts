// Утилиты для работы с консультациями (appointments) в Supabase
import { supabase } from './supabase';
import type { Database } from './supabase';
import { logger } from './logger';
import { getCurrentUser } from './profileStorage';
import { createMoscowDateTime } from './moscowTime';

type Appointment = Database['public']['Tables']['appointments']['Row'];
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];
type AppointmentType = Database['public']['Tables']['appointment_types']['Row'];

// ============================================
// Работа с типами консультаций
// ============================================

/**
 * Получить все активные типы консультаций для клиентов
 * Исключает типы с admin_only = true
 */
export async function getAppointmentTypes(): Promise<AppointmentType[]> {
  try {
    const { data, error } = await supabase
      .from('appointment_types')
      .select('*')
      .eq('is_active', true)
      .eq('admin_only', false)
      .order('duration_minutes', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    logger.error('Error getting appointment types:', error);
    throw error;
  }
}

/**
 * Получить все активные типы консультаций (включая admin_only)
 * Используется в админке
 */
export async function getAllAppointmentTypes(): Promise<AppointmentType[]> {
  try {
    const { data, error } = await supabase
      .from('appointment_types')
      .select('*')
      .eq('is_active', true)
      .order('duration_minutes', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    logger.error('Error getting all appointment types:', error);
    throw error;
  }
}

/**
 * Получить тип консультации по ID
 */
export async function getAppointmentType(typeId: string): Promise<AppointmentType | null> {
  try {
    const { data, error } = await supabase
      .from('appointment_types')
      .select('*')
      .eq('id', typeId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Error getting appointment type:', error);
    return null;
  }
}

// ============================================
// Работа с назначениями специалистов
// ============================================

/**
 * Информация о назначенном специалисте для выбора
 */
export interface AssignedSpecialistOption {
  specialist_id: string;
  display_name: string;
  avatar_url: string | null;
  assignment_type: 'primary' | 'consultant' | 'temporary';
  profile_id: string | null;
  specialization_codes: string[];
}

/**
 * Получить всех назначенных специалистов для типа консультации
 * Используется для отображения выбора, если есть несколько вариантов
 * @param appointmentTypeId - ID типа консультации (определяет нужную специализацию)
 * @param profileId - ID профиля (опционально, для поиска специалиста для конкретного профиля)
 */
export async function getAllAssignedSpecialists(
  appointmentTypeId: string,
  profileId?: string | null
): Promise<AssignedSpecialistOption[]> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return [];
    }

    const { data, error } = await supabase.rpc('get_all_assigned_specialists_for_appointment', {
      p_user_id: user.id,
      p_profile_id: profileId || null,
      p_appointment_type_id: appointmentTypeId,
    });

    if (error) {
      logger.error('Error getting assigned specialists:', error);
      return [];
    }

    return (data || []) as AssignedSpecialistOption[];
  } catch (error) {
    logger.error('Error getting assigned specialists:', error);
    return [];
  }
}

/**
 * Получить назначенного специалиста для типа консультации
 * Если есть только один - возвращает его ID
 * Если несколько - возвращает null (нужен выбор пользователя)
 * @param appointmentTypeId - ID типа консультации (определяет нужную специализацию)
 * @param profileId - ID профиля (опционально, для поиска специалиста для конкретного профиля)
 */
export async function getAssignedSpecialistId(
  appointmentTypeId: string,
  profileId?: string | null
): Promise<string | null> {
  try {
    const specialists = await getAllAssignedSpecialists(appointmentTypeId, profileId);

    // Если нет назначенных специалистов - возвращаем null
    if (specialists.length === 0) {
      return null;
    }

    // Если только один специалист - автоматически выбираем его
    if (specialists.length === 1) {
      return specialists[0].specialist_id;
    }

    // Если несколько специалистов - нужен выбор пользователя
    // Возвращаем null, чтобы вызывающий код показал диалог выбора
    logger.info(`Multiple specialists found (${specialists.length}), user selection required`);
    return null;
  } catch (error) {
    logger.error('Error getting assigned specialist:', error);
    return null;
  }
}

// ============================================
// Работа с консультациями
// ============================================

/**
 * Получить все консультации текущего пользователя
 */
export async function getAppointments(): Promise<Appointment[]> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    logger.error('Error getting appointments:', error);
    throw error;
  }
}

/**
 * Получить консультацию по ID
 */
export async function getAppointment(appointmentId: string): Promise<Appointment | null> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Error getting appointment:', error);
    return null;
  }
}

/**
 * Создать запись на консультацию
 * Автоматически подтягивает назначенного специалиста, если он есть у клиента.
 *
 * Для ПЛАТНЫХ консультаций без специалиста:
 * - статус 'pending_specialist', автоотмена через 24 часа
 *
 * Для БЕСПЛАТНЫХ консультаций без специалиста:
 * - статус 'scheduled', без автоотмены (координатор назначит вручную)
 */
export async function createAppointment(
  appointmentTypeId: string,
  scheduledAt: string,
  profileId?: string | null,
  notes?: string,
  paymentId?: string | null,
  specialistId?: string | null
): Promise<Appointment> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Получаем информацию о типе консультации (нужно знать price)
    const { data: appointmentType, error: typeError } = await supabase
      .from('appointment_types')
      .select('price')
      .eq('id', appointmentTypeId)
      .single();

    if (typeError) {
      logger.warn('Could not get appointment type price, assuming paid:', typeError);
    }

    const isFreeConsultation = appointmentType?.price === 0;

    // Если специалист не передан явно, пытаемся найти назначенного специалиста
    // с нужной специализацией для данного типа консультации
    let effectiveSpecialistId = specialistId;
    if (!effectiveSpecialistId) {
      effectiveSpecialistId = await getAssignedSpecialistId(appointmentTypeId, profileId);
      if (effectiveSpecialistId) {
        logger.info(`Auto-assigned specialist ${effectiveSpecialistId} for appointment type ${appointmentTypeId}`);
      }
    }

    // Определяем статус в зависимости от наличия специалиста
    const hasSpecialist = !!effectiveSpecialistId;

    // Для бесплатных консультаций: всегда 'scheduled', координатор назначит специалиста вручную
    // Для платных консультаций без специалиста: 'pending_specialist' с автоотменой через 24 часа
    let status: string;
    let specialistAssignmentExpiresAt: string | null = null;

    if (hasSpecialist) {
      status = 'scheduled';
    } else if (isFreeConsultation) {
      // Бесплатная консультация без специалиста - не отменяем автоматически
      status = 'scheduled';
      logger.info('Free consultation created without specialist - coordinator will assign manually');
    } else {
      // Платная консультация без специалиста - ставим срок 24 часа
      status = 'pending_specialist';
      specialistAssignmentExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }

    const appointmentData: AppointmentInsert = {
      user_id: user.id,
      appointment_type_id: appointmentTypeId,
      scheduled_at: scheduledAt,
      profile_id: profileId || null,
      status,
      notes: notes || null,
      payment_id: paymentId || null,
      specialist_id: effectiveSpecialistId || null,
      specialist_assignment_expires_at: specialistAssignmentExpiresAt,
    };

    const { data, error } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error('Error creating appointment:', error);
    throw error;
  }
}

/**
 * Обновить консультацию
 */
export async function updateAppointment(
  appointmentId: string,
  updates: AppointmentUpdate
): Promise<Appointment> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error('Error updating appointment:', error);
    throw error;
  }
}

/**
 * Отменить консультацию
 * Если отменяется бесплатная консультация, сбрасывает флаг free_consultation_created
 */
export async function cancelAppointment(appointmentId: string): Promise<Appointment> {
  try {
    // Получаем консультацию с информацией о типе перед отменой
    const appointment = await getAppointment(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Получаем тип консультации
    const appointmentType = await getAppointmentType(appointment.appointment_type_id);
    
    // Отменяем консультацию
    const cancelledAppointment = await updateAppointment(appointmentId, { status: 'cancelled' });

    // Если это бесплатная консультация (price === 0), сбрасываем флаг
    if (appointmentType && appointmentType.price === 0) {
      const user = await getCurrentUser();
      if (user) {
        const { error } = await supabase
          .from('users')
          .update({ free_consultation_created: false })
          .eq('id', user.id);

        if (error) {
          logger.error('Error resetting free_consultation_created flag:', error);
          // Не бросаем ошибку, т.к. консультация уже отменена
        } else {
          logger.info('Free consultation flag reset after cancellation');
        }
      }
    }

    return cancelledAppointment;
  } catch (error) {
    logger.error('Error cancelling appointment:', error);
    throw error;
  }
}

/**
 * Получить предстоящие консультации
 */
export async function getUpcomingAppointments(): Promise<Appointment[]> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const now = new Date().toISOString();

    // Получаем все pending_specialist, scheduled и in_progress консультации
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['pending_specialist', 'scheduled', 'in_progress'])
      .order('scheduled_at', { ascending: true });

    if (error) throw error;

    // Фильтруем: scheduled и pending_specialist должны быть в будущем, in_progress показываем всегда
    const filtered = (data || []).filter(apt => {
      if (apt.status === 'in_progress') return true;
      if (apt.status === 'scheduled' || apt.status === 'pending_specialist') {
        return new Date(apt.scheduled_at) >= new Date(now);
      }
      return false;
    });

    return filtered;
  } catch (error) {
    logger.error('Error getting upcoming appointments:', error);
    throw error;
  }
}

/**
 * Получить консультации с информацией о типе
 * @param userId - ID пользователя (опционально, если не указан, будет получен из сессии)
 */
export async function getAppointmentsWithType(userId?: string): Promise<(Appointment & { appointment_type: AppointmentType })[]> {
  try {
    let user;
    if (userId) {
      // Если userId передан, используем его
      user = { id: userId } as any;
    } else {
      // Иначе получаем из сессии
      user = await getCurrentUser();
    }
    
    if (!user) {
      logger.warn('getAppointmentsWithType: User not authenticated');
      throw new Error('User not authenticated');
    }

    logger.log('getAppointmentsWithType: Fetching appointments for user:', user.id);

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        appointment_type:appointment_types(*),
        specialist:specialists(
          id,
          display_name,
          avatar_url,
          bio,
          experience_years,
          specialization_codes,
          video_intro_url,
          is_available
        )
      `)
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: false });

    if (error) {
      logger.error('getAppointmentsWithType: Supabase error:', error);
      logger.error('getAppointmentsWithType: Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    logger.log('getAppointmentsWithType: Query completed. Data:', data);
    logger.log('getAppointmentsWithType: Successfully loaded', data?.length || 0, 'appointments');
    
    if (data && data.length > 0) {
      logger.log('getAppointmentsWithType: Appointment IDs:', data.map(a => a.id));
    } else {
      logger.warn('getAppointmentsWithType: No appointments found for user:', user.id);
    }
    
    // Преобразуем данные для удобства
    return (data || []).map((appointment: any) => ({
      ...appointment,
      appointment_type: appointment.appointment_type as AppointmentType,
    }));
  } catch (error) {
    logger.error('Error getting appointments with type:', error);
    throw error;
  }
}

/**
 * Создать бесплатную консультацию после первого чекапа
 * Вызывается автоматически после завершения первого чекапа
 */
export async function createFreeConsultationAfterFirstCheckup(): Promise<Appointment | null> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Проверяем, была ли уже создана бесплатная консультация
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('free_consultation_created')
      .eq('id', user.id)
      .single();

    if (userError) throw userError;

    if (userData?.free_consultation_created) {
      logger.info('Free consultation already created for user');
      return null;
    }

    // Проверяем, есть ли у пользователя завершенные чекапы
    // Получаем все профили пользователя
    const { getProfiles } = await import('./profileStorage');
    const profiles = await getProfiles();
    const childProfiles = profiles.filter(p => p.type === 'child');

    if (childProfiles.length === 0) {
      logger.info('No child profiles found, skipping free consultation creation');
      return null;
    }

    // Проверяем, есть ли хотя бы один завершенный чекап
    const { getCompletedAssessmentsForProfiles } = await import('./assessmentStorage');
    const profileIds = childProfiles.map(p => p.id);
    const completedAssessments = await getCompletedAssessmentsForProfiles(profileIds, 'checkup');
    
    const hasCompletedCheckup = Object.values(completedAssessments).some(
      assessment => assessment?.status === 'completed'
    );

    if (!hasCompletedCheckup) {
      logger.info('No completed checkups found yet, skipping free consultation creation');
      return null;
    }

    // Находим тип консультации "Первичная встреча"
    const { data: appointmentType, error: typeError } = await supabase
      .from('appointment_types')
      .select('*')
      .eq('name', 'Первичная встреча')
      .eq('is_active', true)
      .single();

    if (typeError || !appointmentType) {
      logger.warn('Первичная встреча appointment type not found');
      return null;
    }

    // Создаем консультацию без даты (пользователь выберет позже)
    // Устанавливаем scheduled_at на неделю вперед как placeholder в московском времени
    const placeholderDate = new Date();
    placeholderDate.setDate(placeholderDate.getDate() + 7);
    const scheduledAt = createMoscowDateTime(placeholderDate, 10, 0); // 10:00 MSK

    const appointmentData: AppointmentInsert = {
      user_id: user.id,
      appointment_type_id: appointmentType.id,
      scheduled_at: scheduledAt,
      status: 'scheduled',
      profile_id: null, // Для родителя
      notes: 'Бесплатная консультация после первого чекапа',
    };

    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single();

    if (appointmentError) throw appointmentError;

    // Отмечаем, что бесплатная консультация создана
    const { error: updateError } = await supabase
      .from('users')
      .update({ free_consultation_created: true })
      .eq('id', user.id);

    if (updateError) {
      logger.error('Error updating free_consultation_created flag:', updateError);
      // Не бросаем ошибку, т.к. консультация уже создана
    }

    logger.info('Free consultation created successfully');
    return appointment;
  } catch (error) {
    logger.error('Error creating free consultation:', error);
    // Не бросаем ошибку, чтобы не прерывать процесс завершения чекапа
    return null;
  }
}

/**
 * Получить активную бесплатную консультацию пользователя
 * Возвращает консультацию со статусом 'scheduled' или 'in_progress' и типом с price = 0
 */
export async function getActiveFreeConsultation(): Promise<(Appointment & { appointment_type: AppointmentType }) | null> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return null;
    }

    // Получаем консультации пользователя с информацией о типе
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        appointment_type:appointment_types(*)
      `)
      .eq('user_id', user.id)
      .in('status', ['pending_specialist', 'scheduled', 'in_progress'])
      .order('scheduled_at', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return null;
    }

    // Ищем первую бесплатную консультацию (price = 0)
    for (const appointment of data) {
      const appointmentType = (appointment as any).appointment_type as AppointmentType;
      if (appointmentType && appointmentType.price === 0) {
        return {
          ...appointment,
          appointment_type: appointmentType,
        } as Appointment & { appointment_type: AppointmentType };
      }
    }

    return null;
  } catch (error) {
    logger.error('Error getting active free consultation:', error);
    return null;
  }
}

/**
 * Проверить, доступна ли бесплатная консультация
 */
export async function hasFreeConsultationAvailable(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return false;
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('free_consultation_created')
      .eq('id', user.id)
      .single();

    if (error) {
      logger.error('Error checking free consultation:', error);
      return false;
    }

    return !userData?.free_consultation_created;
  } catch (error) {
    logger.error('Error checking free consultation availability:', error);
    return false;
  }
}

/**
 * Проверить, была ли завершена бесплатная консультация
 * Возвращает true если есть консультация со статусом 'completed' и price = 0
 */
export async function hasCompletedFreeConsultation(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return false;
    }

    // Получаем завершённые консультации пользователя с информацией о типе
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        status,
        appointment_type:appointment_types(price)
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed');

    if (error) {
      logger.error('Error checking completed free consultation:', error);
      return false;
    }

    if (!data || data.length === 0) {
      return false;
    }

    // Ищем завершённую бесплатную консультацию (price = 0)
    for (const appointment of data) {
      const appointmentType = (appointment as any).appointment_type;
      if (appointmentType && appointmentType.price === 0) {
        return true;
      }
    }

    return false;
  } catch (error) {
    logger.error('Error checking completed free consultation:', error);
    return false;
  }
}

/**
 * Константа: срок действия бесплатной консультации в днях
 */
export const FREE_CONSULTATION_EXPIRY_DAYS = 14;

/**
 * Получить дату завершения первого чекапа пользователя
 * @returns Дата завершения первого чекапа или null, если чекапов нет
 */
export async function getFirstCompletedCheckupDate(): Promise<Date | null> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return null;
    }

    // Получаем все профили пользователя
    const { getProfiles } = await import('./profileStorage');
    const profiles = await getProfiles();
    const childProfiles = profiles.filter(p => p.type === 'child');

    if (childProfiles.length === 0) {
      return null;
    }

    const profileIds = childProfiles.map(p => p.id);

    // Получаем все завершенные чекапы для профилей
    const { data, error } = await supabase
      .from('assessments')
      .select('completed_at')
      .in('profile_id', profileIds)
      .eq('assessment_type', 'checkup')
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: true })
      .limit(1);

    if (error) {
      logger.error('Error getting first completed checkup date:', error);
      return null;
    }

    if (!data || data.length === 0 || !data[0].completed_at) {
      return null;
    }

    return new Date(data[0].completed_at);
  } catch (error) {
    logger.error('Error getting first completed checkup date:', error);
    return null;
  }
}

/**
 * Проверить, истек ли срок бесплатной консультации (14 дней с момента завершения первого чекапа)
 * @returns { expired: boolean, expiryDate: Date | null, daysLeft: number | null }
 */
export async function checkFreeConsultationExpiry(): Promise<{
  expired: boolean;
  expiryDate: Date | null;
  daysLeft: number | null;
}> {
  try {
    const firstCheckupDate = await getFirstCompletedCheckupDate();

    if (!firstCheckupDate) {
      return { expired: false, expiryDate: null, daysLeft: null };
    }

    const expiryDate = new Date(firstCheckupDate);
    expiryDate.setDate(expiryDate.getDate() + FREE_CONSULTATION_EXPIRY_DAYS);

    const now = new Date();
    const expired = now > expiryDate;

    // Рассчитываем оставшиеся дни
    const timeDiff = expiryDate.getTime() - now.getTime();
    const daysLeft = expired ? 0 : Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    return { expired, expiryDate, daysLeft };
  } catch (error) {
    logger.error('Error checking free consultation expiry:', error);
    return { expired: false, expiryDate: null, daysLeft: null };
  }
}

/**
 * Отметить, что бесплатная консультация была использована
 * Устанавливает флаг free_consultation_created = true в таблице users
 */
export async function markFreeConsultationAsUsed(): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('users')
      .update({ free_consultation_created: true })
      .eq('id', user.id);

    if (error) {
      logger.error('Error marking free consultation as used:', error);
      throw error;
    }

    logger.info('Free consultation marked as used');
  } catch (error) {
    logger.error('Error marking free consultation as used:', error);
    throw error;
  }
}
