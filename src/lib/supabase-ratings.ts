/**
 * API функции для системы оценки специалистов
 */
import { supabase } from './supabase';

// ============================================
// Типы
// ============================================

export interface PendingRating {
  appointment_id: string;
  scheduled_at: string;
  specialist_id: string;
  specialist_name: string;
  specialist_avatar: string | null;
  specialization_codes: string[];
}

export interface SpecialistRatingsSummary {
  rating_avg: number | null;
  rating_count: number;
  ratings_distribution: Record<string, number> | null;
}

export interface CreateRatingParams {
  appointment_id: string;
  specialist_id: string;
  rating: number;
  review_text?: string;
}

// ============================================
// Функции для клиента
// ============================================

/**
 * Получить незаоценённую консультацию для текущего пользователя
 * Возвращает одну самую старую консультацию, требующую оценки
 */
export async function getPendingRating(): Promise<PendingRating | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .rpc('get_pending_ratings_for_user', { p_user_id: user.id });

  if (error) {
    console.error('Error fetching pending rating:', error);
    return null;
  }

  if (!data || data.length === 0) return null;

  return data[0] as PendingRating;
}

/**
 * Отправить оценку специалиста
 */
export async function submitRating(params: CreateRatingParams): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Пользователь не авторизован' };
  }

  const { error } = await supabase
    .from('specialist_ratings')
    .insert({
      appointment_id: params.appointment_id,
      client_user_id: user.id,
      specialist_id: params.specialist_id,
      rating: params.rating,
      review_text: params.review_text || null,
    });

  if (error) {
    console.error('Error submitting rating:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Пропустить оценку консультации (навсегда)
 */
export async function skipRating(appointmentId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('appointments')
    .update({ rating_skipped: true })
    .eq('id', appointmentId);

  if (error) {
    console.error('Error skipping rating:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================
// Функции для специалиста
// ============================================

/**
 * Получить сводку по оценкам специалиста
 */
export async function getSpecialistRatingsSummary(specialistId: string): Promise<SpecialistRatingsSummary | null> {
  const { data, error } = await supabase
    .rpc('get_specialist_ratings_summary', { p_specialist_id: specialistId });

  if (error) {
    console.error('Error fetching specialist ratings summary:', error);
    return null;
  }

  if (!data || data.length === 0) return null;

  return data[0] as SpecialistRatingsSummary;
}

/**
 * Получить рейтинг специалиста из кэша (быстрый способ)
 */
export async function getSpecialistRating(specialistId: string): Promise<{ rating_avg: number | null; rating_count: number } | null> {
  const { data, error } = await supabase
    .from('specialists')
    .select('rating_avg, rating_count')
    .eq('id', specialistId)
    .single();

  if (error) {
    console.error('Error fetching specialist rating:', error);
    return null;
  }

  return data;
}

// ============================================
// Вспомогательные функции
// ============================================

/**
 * Получить названия специализаций по кодам
 */
export async function getSpecializationNames(codes: string[]): Promise<string> {
  if (!codes || codes.length === 0) return '';

  const { data, error } = await supabase
    .from('specializations')
    .select('name')
    .in('code', codes);

  if (error) {
    console.error('Error fetching specialization names:', error);
    return '';
  }

  return data?.map(s => s.name).join(', ') || '';
}

/**
 * Форматировать дату консультации для отображения
 */
export function formatAppointmentDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  });
}
