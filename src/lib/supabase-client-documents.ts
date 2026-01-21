/**
 * API для работы с документами клиентов
 * Перенесено из PsiPilot для Balansity
 *
 * Хранение файлов: PDF, изображения, документы
 * Привязка к клиенту (user_id)
 */

import { supabase } from './supabase';
import { logger } from './logger';

export interface ClientDocument {
  id: string;
  client_user_id: string;
  uploaded_by_user_id: string;
  file_path: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  description: string | null;
  category: 'medical' | 'assessment' | 'consent' | 'other';
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentParams {
  clientUserId: string;
  uploadedByUserId: string;
  filePath: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  description?: string;
  category?: 'medical' | 'assessment' | 'consent' | 'other';
}

/**
 * Получить все документы клиента
 */
export async function getClientDocuments(clientUserId: string): Promise<ClientDocument[]> {
  const { data, error } = await supabase
    .from('client_documents')
    .select('*')
    .eq('client_user_id', clientUserId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching client documents:', error);
    throw new Error(`Failed to fetch documents: ${error.message}`);
  }

  return data || [];
}

/**
 * Создать запись о документе
 */
export async function createClientDocument(params: CreateDocumentParams): Promise<ClientDocument> {
  const {
    clientUserId,
    uploadedByUserId,
    filePath,
    fileName,
    fileSizeBytes,
    mimeType,
    description,
    category = 'other',
  } = params;

  const { data, error } = await supabase
    .from('client_documents')
    .insert({
      client_user_id: clientUserId,
      uploaded_by_user_id: uploadedByUserId,
      file_path: filePath,
      file_name: fileName,
      file_size_bytes: fileSizeBytes,
      mime_type: mimeType,
      description: description || null,
      category,
    })
    .select()
    .single();

  if (error) {
    logger.error('Error creating client document:', error);
    throw new Error(`Failed to create document: ${error.message}`);
  }

  if (!data) {
    throw new Error('Failed to create document: No data returned');
  }

  return data;
}

/**
 * Обновить описание или категорию документа
 */
export async function updateClientDocument(
  documentId: string,
  updates: { description?: string; category?: 'medical' | 'assessment' | 'consent' | 'other' }
): Promise<ClientDocument> {
  const { data, error } = await supabase
    .from('client_documents')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', documentId)
    .select()
    .single();

  if (error) {
    logger.error('Error updating client document:', error);
    throw new Error(`Failed to update document: ${error.message}`);
  }

  if (!data) {
    throw new Error('Failed to update document: No data returned');
  }

  return data;
}

/**
 * Soft delete документа
 */
export async function deleteClientDocument(documentId: string): Promise<void> {
  const { error } = await supabase
    .from('client_documents')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', documentId);

  if (error) {
    logger.error('Error deleting client document:', error);
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}

/**
 * Загрузить файл документа в storage
 */
export async function uploadDocumentFile(
  file: File,
  clientUserId: string,
  uploadedByUserId: string
): Promise<string> {
  // Генерируем путь: documents/{client_id}/{uploader_id}/{timestamp}_{filename}
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${clientUserId}/${uploadedByUserId}/${timestamp}_${safeName}`;

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    logger.error('Error uploading document file:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  return data.path;
}

/**
 * Получить URL для скачивания документа
 */
export async function getDocumentUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, 3600); // 1 hour

  if (error) {
    logger.error('Error getting document URL:', error);
    throw new Error(`Failed to get document URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Удалить файл из storage
 */
export async function deleteDocumentFile(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('documents')
    .remove([filePath]);

  if (error) {
    logger.error('Error deleting document file:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Получить иконку по MIME типу
 */
export function getDocumentIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
  return '📎';
}

/**
 * Получить название категории
 */
export function getCategoryLabel(category: string): string {
  switch (category) {
    case 'medical':
      return 'Медицинский';
    case 'assessment':
      return 'Диагностика';
    case 'consent':
      return 'Согласие';
    case 'other':
    default:
      return 'Другое';
  }
}
