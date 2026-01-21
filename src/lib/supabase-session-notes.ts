/**
 * API для работы с заметками сессий
 * Перенесено из PsiPilot для Balansity
 */

import { supabase } from './supabase';

export interface SessionNote {
  id: string;
  appointment_id: string;
  user_id: string;
  content: string;
  source: 'manual' | 'file';
  original_filename: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSessionNoteParams {
  appointmentId: string;
  userId: string;
  content: string;
  source: 'manual' | 'file';
  originalFilename?: string | null;
}

/**
 * Получить все заметки для консультации
 */
export async function getSessionNotes(appointmentId: string): Promise<SessionNote[]> {
  const { data, error } = await supabase
    .from('session_notes')
    .select('*')
    .eq('appointment_id', appointmentId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching session notes:', error);
    throw new Error(`Failed to fetch session notes: ${error.message}`);
  }

  return data || [];
}

/**
 * Создать новую заметку сессии
 */
export async function createSessionNote(params: CreateSessionNoteParams): Promise<SessionNote> {
  const { appointmentId, userId, content, source, originalFilename } = params;

  const { data, error } = await supabase
    .from('session_notes')
    .insert({
      appointment_id: appointmentId,
      user_id: userId,
      content,
      source,
      original_filename: originalFilename || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating session note:', error);
    throw new Error(`Failed to create session note: ${error.message}`);
  }

  if (!data) {
    throw new Error('Failed to create session note: No data returned');
  }

  return data;
}

/**
 * Обновить заметку сессии
 */
export async function updateSessionNote(
  noteId: string,
  content: string
): Promise<SessionNote> {
  const { data, error } = await supabase
    .from('session_notes')
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)
    .select()
    .single();

  if (error) {
    console.error('Error updating session note:', error);
    throw new Error(`Failed to update session note: ${error.message}`);
  }

  if (!data) {
    throw new Error('Failed to update session note: No data returned');
  }

  return data;
}

/**
 * Удалить заметку сессии
 */
export async function deleteSessionNote(noteId: string): Promise<void> {
  const { error } = await supabase
    .from('session_notes')
    .delete()
    .eq('id', noteId);

  if (error) {
    console.error('Error deleting session note:', error);
    throw new Error(`Failed to delete session note: ${error.message}`);
  }
}

/**
 * Получить комбинированный транскрипт с заметками специалиста
 */
export function getCombinedTranscriptWithNotes(
  transcriptText: string,
  notes: SessionNote[]
): string {
  if (notes.length === 0) {
    return transcriptText;
  }

  const notesText = notes
    .map((note) => note.content)
    .join('\n\n');

  if (!transcriptText) {
    return `--- Комментарии специалиста ---\n\n${notesText}`;
  }

  return `${transcriptText}\n\n--- Комментарии специалиста ---\n\n${notesText}`;
}
