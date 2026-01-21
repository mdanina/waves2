/**
 * Локальное хранилище аудиозаписей в IndexedDB
 * Перенесено из PsiPilot для Balansity
 *
 * Обеспечивает:
 * - Сохранение записей локально до загрузки на сервер
 * - Шифрование записей (опционально)
 * - Recovery механизм для незагруженных записей
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { logger } from './logger';

// Имя базы данных для Balansity
const DB_NAME = 'balansity-recordings';
const DB_VERSION = 1;

// Статусы локальной записи
export type LocalRecordingStatus =
  | 'recording'      // Запись в процессе
  | 'paused'         // Запись на паузе
  | 'completed'      // Запись завершена, ожидает загрузки
  | 'uploading'      // Идёт загрузка
  | 'uploaded'       // Загружено на сервер
  | 'failed';        // Ошибка загрузки

export interface LocalRecording {
  id: string;                      // Уникальный ID записи
  appointmentId: string;           // ID консультации
  specialistId: string;            // ID специалиста
  blob?: Blob;                     // Аудио данные (не шифрованные)
  encryptedBlob?: Blob;            // Зашифрованные данные
  iv?: string;                     // IV для расшифровки (base64)
  encryptionKey?: string;          // Ключ шифрования (base64)
  mimeType: string;                // MIME тип аудио
  durationSeconds: number;         // Длительность в секундах
  fileSizeBytes: number;           // Размер файла
  status: LocalRecordingStatus;    // Текущий статус
  remoteId?: string;               // ID записи на сервере (после загрузки)
  remotePath?: string;             // Путь к файлу на сервере
  errorMessage?: string;           // Сообщение об ошибке
  retryCount: number;              // Количество попыток загрузки
  createdAt: string;               // Время создания
  updatedAt: string;               // Время обновления
}

// Схема базы данных
interface RecordingsDBSchema extends DBSchema {
  recordings: {
    key: string;
    value: LocalRecording;
    indexes: {
      'by-appointment': string;
      'by-status': LocalRecordingStatus;
      'by-specialist': string;
    };
  };
}

// Singleton для подключения к БД
let dbPromise: Promise<IDBPDatabase<RecordingsDBSchema>> | null = null;

/**
 * Получить подключение к базе данных
 */
async function getDB(): Promise<IDBPDatabase<RecordingsDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<RecordingsDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Создаём хранилище записей
        const store = db.createObjectStore('recordings', { keyPath: 'id' });
        store.createIndex('by-appointment', 'appointmentId');
        store.createIndex('by-status', 'status');
        store.createIndex('by-specialist', 'specialistId');
      },
      blocked() {
        logger.warn('IndexedDB blocked - another tab may be upgrading the database');
      },
      blocking() {
        logger.warn('IndexedDB blocking - this tab is blocking another upgrade');
      },
    });
  }
  return dbPromise;
}

/**
 * Генерация уникального ID записи
 */
export function generateRecordingId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Сохранить новую запись
 */
export async function saveLocalRecording(recording: LocalRecording): Promise<void> {
  const db = await getDB();
  await db.put('recordings', {
    ...recording,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Получить запись по ID
 */
export async function getLocalRecording(id: string): Promise<LocalRecording | undefined> {
  const db = await getDB();
  return await db.get('recordings', id);
}

/**
 * Получить все записи для консультации
 */
export async function getRecordingsByAppointment(appointmentId: string): Promise<LocalRecording[]> {
  const db = await getDB();
  return await db.getAllFromIndex('recordings', 'by-appointment', appointmentId);
}

/**
 * Получить все записи специалиста
 */
export async function getRecordingsBySpecialist(specialistId: string): Promise<LocalRecording[]> {
  const db = await getDB();
  return await db.getAllFromIndex('recordings', 'by-specialist', specialistId);
}

/**
 * Получить записи по статусу
 */
export async function getRecordingsByStatus(status: LocalRecordingStatus): Promise<LocalRecording[]> {
  const db = await getDB();
  return await db.getAllFromIndex('recordings', 'by-status', status);
}

/**
 * Получить все незагруженные записи (для recovery)
 */
export async function getPendingRecordings(): Promise<LocalRecording[]> {
  const db = await getDB();
  const allRecordings = await db.getAll('recordings');
  return allRecordings.filter(
    r => r.status === 'completed' || r.status === 'failed'
  );
}

/**
 * Обновить статус записи
 */
export async function updateRecordingStatus(
  id: string,
  status: LocalRecordingStatus,
  extra?: Partial<LocalRecording>
): Promise<void> {
  const db = await getDB();
  const recording = await db.get('recordings', id);

  if (!recording) {
    throw new Error(`Recording not found: ${id}`);
  }

  await db.put('recordings', {
    ...recording,
    ...extra,
    status,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Обновить запись после успешной загрузки
 */
export async function markRecordingUploaded(
  id: string,
  remoteId: string,
  remotePath: string
): Promise<void> {
  await updateRecordingStatus(id, 'uploaded', {
    remoteId,
    remotePath,
  });
}

/**
 * Отметить ошибку загрузки
 */
export async function markRecordingFailed(
  id: string,
  errorMessage: string
): Promise<void> {
  const db = await getDB();
  const recording = await db.get('recordings', id);

  if (!recording) {
    throw new Error(`Recording not found: ${id}`);
  }

  await db.put('recordings', {
    ...recording,
    status: 'failed',
    errorMessage,
    retryCount: recording.retryCount + 1,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Удалить запись из локального хранилища
 */
export async function deleteLocalRecording(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('recordings', id);
}

/**
 * Удалить все загруженные записи (очистка)
 */
export async function cleanupUploadedRecordings(): Promise<number> {
  const db = await getDB();
  const uploaded = await db.getAllFromIndex('recordings', 'by-status', 'uploaded');

  for (const recording of uploaded) {
    await db.delete('recordings', recording.id);
  }

  return uploaded.length;
}

/**
 * Получить размер всех локальных записей
 */
export async function getTotalStorageSize(): Promise<number> {
  const db = await getDB();
  const allRecordings = await db.getAll('recordings');

  return allRecordings.reduce((total, recording) => {
    return total + (recording.fileSizeBytes || 0);
  }, 0);
}

/**
 * Проверить, есть ли незагруженные записи
 */
export async function hasPendingUploads(): Promise<boolean> {
  const pending = await getPendingRecordings();
  return pending.length > 0;
}

/**
 * Получить количество незагруженных записей
 */
export async function getPendingUploadsCount(): Promise<number> {
  const pending = await getPendingRecordings();
  return pending.length;
}
