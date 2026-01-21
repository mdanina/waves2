/**
 * API для работы с Case Summary (сводка по клиенту)
 * Case Summary - комплексный обзор клиента на основе всех сессий и заметок
 */

import { supabase } from './supabase';
import { logger } from './logger';

// URL backend сервиса для AI endpoints
const AI_API_URL = import.meta.env.VITE_AI_API_URL || '';

/**
 * Получить заголовки для аутентификации
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Необходима авторизация');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
}

export interface CaseSummary {
  id: string;
  client_user_id: string;
  specialist_user_id: string;
  title: string;
  summary_type: 'auto' | 'manual';

  // Секции сводки
  presenting_concerns: string | null;       // Первичные обращения
  therapy_goals: string | null;             // Цели терапии
  progress_summary: string | null;          // Прогресс терапии
  key_themes: string[] | null;              // Ключевые темы
  treatment_approach: string | null;        // Подход к лечению
  recommendations: string | null;           // Рекомендации
  risk_assessment: string | null;           // Оценка рисков

  // Статистика
  sessions_count: number;
  last_session_date: string | null;
  notes_count: number;

  // Метаданные
  generation_status: 'pending' | 'generating' | 'completed' | 'failed';
  last_generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCaseSummaryParams {
  clientUserId: string;
  specialistUserId: string;
  title?: string;
}

export interface UpdateCaseSummaryParams {
  presentingConcerns?: string | null;
  therapyGoals?: string | null;
  progressSummary?: string | null;
  keyThemes?: string[] | null;
  treatmentApproach?: string | null;
  recommendations?: string | null;
  riskAssessment?: string | null;
}

/**
 * Получить Case Summary для клиента
 */
export async function getCaseSummary(clientUserId: string): Promise<CaseSummary | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  const { data, error } = await supabase
    .from('case_summaries')
    .select('*')
    .eq('client_user_id', clientUserId)
    .eq('specialist_user_id', user.id)
    .maybeSingle();

  if (error) {
    logger.error('Error fetching case summary:', error);
    throw new Error(`Failed to fetch case summary: ${error.message}`);
  }

  return data as CaseSummary | null;
}

/**
 * Создать новую Case Summary
 */
export async function createCaseSummary(params: CreateCaseSummaryParams): Promise<CaseSummary> {
  const { clientUserId, specialistUserId, title } = params;

  // Проверяем, нет ли уже сводки
  const existing = await getCaseSummary(clientUserId);
  if (existing) {
    return existing;
  }

  // Получаем статистику по клиенту
  const { sessionsCount, lastSessionDate, notesCount } = await getClientStats(clientUserId, specialistUserId);

  const { data, error } = await supabase
    .from('case_summaries')
    .insert({
      client_user_id: clientUserId,
      specialist_user_id: specialistUserId,
      title: title || 'Case Summary',
      summary_type: 'manual',
      sessions_count: sessionsCount,
      last_session_date: lastSessionDate,
      notes_count: notesCount,
      generation_status: 'pending',
    })
    .select()
    .single();

  if (error) {
    logger.error('Error creating case summary:', error);
    throw new Error(`Failed to create case summary: ${error.message}`);
  }

  return data as CaseSummary;
}

/**
 * Обновить Case Summary
 */
export async function updateCaseSummary(
  summaryId: string,
  updates: UpdateCaseSummaryParams
): Promise<CaseSummary> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.presentingConcerns !== undefined) {
    updateData.presenting_concerns = updates.presentingConcerns;
  }
  if (updates.therapyGoals !== undefined) {
    updateData.therapy_goals = updates.therapyGoals;
  }
  if (updates.progressSummary !== undefined) {
    updateData.progress_summary = updates.progressSummary;
  }
  if (updates.keyThemes !== undefined) {
    updateData.key_themes = updates.keyThemes;
  }
  if (updates.treatmentApproach !== undefined) {
    updateData.treatment_approach = updates.treatmentApproach;
  }
  if (updates.recommendations !== undefined) {
    updateData.recommendations = updates.recommendations;
  }
  if (updates.riskAssessment !== undefined) {
    updateData.risk_assessment = updates.riskAssessment;
  }

  const { data, error } = await supabase
    .from('case_summaries')
    .update(updateData)
    .eq('id', summaryId)
    .eq('specialist_user_id', user.id)
    .select()
    .single();

  if (error) {
    logger.error('Error updating case summary:', error);
    throw new Error(`Failed to update case summary: ${error.message}`);
  }

  return data as CaseSummary;
}

/**
 * Обновить статистику Case Summary
 */
export async function refreshCaseSummaryStats(summaryId: string): Promise<CaseSummary> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  // Получаем текущую сводку
  const { data: summary, error: fetchError } = await supabase
    .from('case_summaries')
    .select('client_user_id')
    .eq('id', summaryId)
    .single();

  if (fetchError || !summary) {
    throw new Error('Case summary not found');
  }

  // Получаем обновленную статистику
  const { sessionsCount, lastSessionDate, notesCount } = await getClientStats(
    summary.client_user_id,
    user.id
  );

  const { data, error } = await supabase
    .from('case_summaries')
    .update({
      sessions_count: sessionsCount,
      last_session_date: lastSessionDate,
      notes_count: notesCount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', summaryId)
    .select()
    .single();

  if (error) {
    logger.error('Error refreshing case summary stats:', error);
    throw new Error(`Failed to refresh stats: ${error.message}`);
  }

  return data as CaseSummary;
}

/**
 * Удалить Case Summary
 */
export async function deleteCaseSummary(summaryId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  const { error } = await supabase
    .from('case_summaries')
    .delete()
    .eq('id', summaryId)
    .eq('specialist_user_id', user.id);

  if (error) {
    logger.error('Error deleting case summary:', error);
    throw new Error(`Failed to delete case summary: ${error.message}`);
  }
}

/**
 * Получить статистику по клиенту
 */
async function getClientStats(
  clientUserId: string,
  specialistUserId: string
): Promise<{ sessionsCount: number; lastSessionDate: string | null; notesCount: number }> {
  // Количество сессий
  const { count: sessionsCount, data: sessionsData } = await supabase
    .from('appointments')
    .select('scheduled_at', { count: 'exact' })
    .eq('user_id', clientUserId)
    .eq('specialist_id', specialistUserId)
    .eq('status', 'completed')
    .order('scheduled_at', { ascending: false })
    .limit(1);

  // Количество клинических заметок
  const { count: notesCount } = await supabase
    .from('clinical_notes')
    .select('*', { count: 'exact', head: true })
    .eq('client_user_id', clientUserId)
    .eq('user_id', specialistUserId)
    .is('deleted_at', null);

  return {
    sessionsCount: sessionsCount || 0,
    lastSessionDate: sessionsData?.[0]?.scheduled_at || null,
    notesCount: notesCount || 0,
  };
}

/**
 * Получить все Case Summaries для специалиста
 */
export async function getMyCaseSummaries(): Promise<CaseSummary[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  const { data, error } = await supabase
    .from('case_summaries')
    .select('*')
    .eq('specialist_user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    logger.error('Error fetching case summaries:', error);
    throw new Error(`Failed to fetch case summaries: ${error.message}`);
  }

  return (data || []) as CaseSummary[];
}

/**
 * Результат AI-генерации Case Summary
 */
export interface GeneratedCaseSummaryResult {
  caseSummary: string; // HTML контент сводки
  basedOnSessionsCount: number;
  basedOnNotesCount: number;
  keyThemes: string[];
  presentingConcerns: string | null;
  therapyGoals: string | null;
  progressSummary: string | null;
  treatmentApproach: string | null;
  recommendations: string | null;
  riskAssessment: string | null;
}

/**
 * Сгенерировать Case Summary с помощью AI
 * Собирает все клинические заметки и транскрипты сессий клиента
 * и генерирует комплексную сводку
 */
export async function generateClientCaseSummary(
  clientUserId: string
): Promise<GeneratedCaseSummaryResult> {
  // Проверяем, настроен ли AI API
  if (!AI_API_URL) {
    throw new Error('AI сервис не настроен. Обратитесь к администратору.');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  // Получаем или создаём Case Summary
  let summary = await getCaseSummary(clientUserId);
  if (!summary) {
    summary = await createCaseSummary({
      clientUserId,
      specialistUserId: user.id,
      title: 'Case Summary',
    });
  }

  // Обновляем статус на "generating"
  await supabase
    .from('case_summaries')
    .update({
      generation_status: 'generating',
      updated_at: new Date().toISOString(),
    })
    .eq('id', summary.id);

  try {
    // Собираем данные для AI
    const sourceData = await collectClientData(clientUserId, user.id);

    if (sourceData.sessionsCount === 0 && sourceData.notesCount === 0) {
      throw new Error('Нет данных для генерации. Добавьте сессии или клинические заметки.');
    }

    // Вызываем AI API
    const result = await callAIForCaseSummary(summary.id, sourceData);

    // Сохраняем результат в БД
    await supabase
      .from('case_summaries')
      .update({
        summary_type: 'auto',
        presenting_concerns: result.presentingConcerns,
        therapy_goals: result.therapyGoals,
        progress_summary: result.progressSummary,
        key_themes: result.keyThemes.length > 0 ? result.keyThemes : null,
        treatment_approach: result.treatmentApproach,
        recommendations: result.recommendations,
        risk_assessment: result.riskAssessment,
        sessions_count: result.basedOnSessionsCount,
        notes_count: result.basedOnNotesCount,
        generation_status: 'completed',
        last_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', summary.id);

    return result;
  } catch (error) {
    // Обновляем статус на "failed"
    await supabase
      .from('case_summaries')
      .update({
        generation_status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', summary.id);

    throw error;
  }
}

/**
 * Собрать все данные клиента для AI анализа
 */
interface ClientSourceData {
  sessionsCount: number;
  notesCount: number;
  sessions: Array<{
    id: string;
    date: string;
    transcript: string | null;
    notes: string | null;
    summary: string | null;
  }>;
  clinicalNotes: Array<{
    id: string;
    date: string;
    content: string;
    sections: Array<{
      name: string;
      content: string | null;
      aiContent: string | null;
    }>;
  }>;
}

async function collectClientData(
  clientUserId: string,
  specialistUserId: string
): Promise<ClientSourceData> {
  // Получаем specialist_id
  const { data: specialist } = await supabase
    .from('specialists')
    .select('id')
    .eq('user_id', specialistUserId)
    .single();

  if (!specialist) {
    throw new Error('Специалист не найден');
  }

  // Получаем сессии клиента
  const { data: sessionsData } = await supabase
    .from('appointments')
    .select('id, scheduled_at, transcript, notes, summary')
    .eq('user_id', clientUserId)
    .eq('specialist_id', specialist.id)
    .in('status', ['completed', 'in_progress'])
    .order('scheduled_at', { ascending: false });

  const sessions = (sessionsData || []).map((s) => ({
    id: s.id,
    date: s.scheduled_at,
    transcript: s.transcript,
    notes: s.notes,
    summary: s.summary,
  }));

  // Получаем клинические заметки
  const { data: notesData } = await supabase
    .from('clinical_notes')
    .select(`
      id,
      created_at,
      source_transcript,
      source_notes,
      sections:clinical_note_sections (
        name,
        content,
        ai_content
      )
    `)
    .eq('client_user_id', clientUserId)
    .eq('user_id', specialistUserId)
    .is('deleted_at', null)
    .in('status', ['finalized', 'signed', 'draft'])
    .order('created_at', { ascending: false });

  const clinicalNotes = (notesData || []).map((n) => ({
    id: n.id,
    date: n.created_at,
    content: n.source_transcript || n.source_notes || '',
    sections: (n.sections || []).map((s: any) => ({
      name: s.name,
      content: s.content,
      aiContent: s.ai_content,
    })),
  }));

  return {
    sessionsCount: sessions.filter((s) => s.transcript || s.notes).length,
    notesCount: clinicalNotes.length,
    sessions,
    clinicalNotes,
  };
}

/**
 * Вызов AI API для генерации Case Summary
 */
async function callAIForCaseSummary(
  summaryId: string,
  sourceData: ClientSourceData
): Promise<GeneratedCaseSummaryResult> {
  const response = await fetch(`${AI_API_URL}/api/ai/case-summary`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({
      summary_id: summaryId,
      sessions: sourceData.sessions,
      clinical_notes: sourceData.clinicalNotes,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `AI сервис недоступен: ${response.status}`);
  }

  const data = await response.json();
  return data.data as GeneratedCaseSummaryResult;
}

