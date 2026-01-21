/**
 * API для работы с аудиозаписями сессий
 * Перенесено из PsiPilot для Balansity
 */

import { supabase } from './supabase';

export interface Recording {
  id: string;
  appointment_id: string;
  user_id: string;
  file_path: string;
  file_name: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  duration_seconds: number | null;
  transcript: string | null;
  transcript_status: 'pending' | 'processing' | 'completed' | 'failed';
  transcript_id: string | null;
  upload_status: 'pending' | 'uploading' | 'completed' | 'failed';
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRecordingParams {
  appointmentId: string;
  userId: string;
  filePath: string;
  fileName?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  durationSeconds?: number;
}

/**
 * Получить все записи для консультации
 */
export async function getAppointmentRecordings(appointmentId: string): Promise<Recording[]> {
  const { data, error } = await supabase
    .from('recordings')
    .select('*')
    .eq('appointment_id', appointmentId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching recordings:', error);
    throw new Error(`Failed to fetch recordings: ${error.message}`);
  }

  return data || [];
}

/**
 * Создать запись об аудиофайле
 */
export async function createRecording(params: CreateRecordingParams): Promise<Recording> {
  const { appointmentId, userId, filePath, fileName, fileSizeBytes, mimeType, durationSeconds } = params;

  const { data, error } = await supabase
    .from('recordings')
    .insert({
      appointment_id: appointmentId,
      user_id: userId,
      file_path: filePath,
      file_name: fileName || null,
      file_size_bytes: fileSizeBytes || null,
      mime_type: mimeType || null,
      duration_seconds: durationSeconds || null,
      transcript_status: 'pending',
      upload_status: 'completed',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating recording:', error);
    throw new Error(`Failed to create recording: ${error.message}`);
  }

  if (!data) {
    throw new Error('Failed to create recording: No data returned');
  }

  return data;
}

/**
 * Обновить транскрипт записи
 */
export async function updateRecordingTranscript(
  recordingId: string,
  transcript: string,
  status: 'completed' | 'failed' = 'completed'
): Promise<Recording> {
  const { data, error } = await supabase
    .from('recordings')
    .update({
      transcript,
      transcript_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', recordingId)
    .select()
    .single();

  if (error) {
    console.error('Error updating recording transcript:', error);
    throw new Error(`Failed to update recording transcript: ${error.message}`);
  }

  if (!data) {
    throw new Error('Failed to update recording: No data returned');
  }

  return data;
}

/**
 * Soft delete записи
 */
export async function deleteRecording(recordingId: string): Promise<void> {
  const { error } = await supabase
    .from('recordings')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', recordingId);

  if (error) {
    console.error('Error deleting recording:', error);
    throw new Error(`Failed to delete recording: ${error.message}`);
  }
}

/**
 * Загрузить аудиофайл в storage
 */
export async function uploadAudioFile(
  file: File,
  appointmentId: string,
  userId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'webm';
  const fileName = `${userId}/${appointmentId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('recordings')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error('Error uploading audio file:', error);
    throw new Error(`Failed to upload audio file: ${error.message}`);
  }

  return data.path;
}

/**
 * Получить URL для скачивания аудиофайла
 */
export async function getRecordingUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('recordings')
    .createSignedUrl(filePath, 3600); // 1 hour

  if (error) {
    console.error('Error getting recording URL:', error);
    throw new Error(`Failed to get recording URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Получить комбинированный транскрипт всех записей консультации
 */
export async function getCombinedTranscript(appointmentId: string): Promise<string> {
  const recordings = await getAppointmentRecordings(appointmentId);

  const completedRecordings = recordings.filter(
    r => r.transcript_status === 'completed' && r.transcript
  );

  if (completedRecordings.length === 0) {
    return '';
  }

  return completedRecordings
    .map(r => r.transcript)
    .filter(Boolean)
    .join('\n\n---\n\n');
}
