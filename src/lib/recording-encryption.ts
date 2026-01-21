/**
 * Шифрование аудиозаписей с использованием Web Crypto API
 * Перенесено из PsiPilot для Balansity
 *
 * Используется AES-GCM 256-bit для шифрования аудио на клиенте
 */

// Константы для шифрования
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM

/**
 * Генерация случайного вектора инициализации (IV)
 */
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Генерация нового ключа шифрования
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Экспорт ключа в raw формат для хранения
 */
export async function exportKey(key: CryptoKey): Promise<ArrayBuffer> {
  return await crypto.subtle.exportKey('raw', key);
}

/**
 * Импорт ключа из raw формата
 */
export async function importKey(keyData: ArrayBuffer): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Шифрование данных
 * @returns объект с зашифрованными данными и IV
 */
export async function encryptData(
  data: ArrayBuffer,
  key: CryptoKey
): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> {
  const iv = generateIV();

  const encrypted = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv,
    },
    key,
    data
  );

  return { encrypted, iv };
}

/**
 * Дешифрование данных
 */
export async function decryptData(
  encryptedData: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  return await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv,
    },
    key,
    encryptedData
  );
}

/**
 * Шифрование Blob (например, аудиофайла)
 */
export async function encryptBlob(
  blob: Blob,
  key: CryptoKey
): Promise<{ encryptedBlob: Blob; iv: Uint8Array }> {
  const arrayBuffer = await blob.arrayBuffer();
  const { encrypted, iv } = await encryptData(arrayBuffer, key);

  // Сохраняем тип оригинального файла в метаданных
  const encryptedBlob = new Blob([encrypted], { type: 'application/octet-stream' });

  return { encryptedBlob, iv };
}

/**
 * Дешифрование Blob
 */
export async function decryptBlob(
  encryptedBlob: Blob,
  key: CryptoKey,
  iv: Uint8Array,
  originalMimeType: string = 'audio/webm'
): Promise<Blob> {
  const encryptedData = await encryptedBlob.arrayBuffer();
  const decryptedData = await decryptData(encryptedData, key, iv);

  return new Blob([decryptedData], { type: originalMimeType });
}

/**
 * Конвертация ключа в base64 строку для хранения
 */
export async function keyToBase64(key: CryptoKey): Promise<string> {
  const exported = await exportKey(key);
  const bytes = new Uint8Array(exported);
  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

/**
 * Восстановление ключа из base64 строки
 */
export async function base64ToKey(base64: string): Promise<CryptoKey> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return await importKey(bytes.buffer);
}

/**
 * Конвертация IV в base64 строку
 */
export function ivToBase64(iv: Uint8Array): string {
  let binary = '';
  iv.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

/**
 * Восстановление IV из base64 строки
 */
export function base64ToIv(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
