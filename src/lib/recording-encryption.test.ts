import { describe, it, expect, beforeAll } from 'vitest';
import {
  generateIV,
  generateEncryptionKey,
  exportKey,
  importKey,
  encryptData,
  decryptData,
  encryptBlob,
  decryptBlob,
  keyToBase64,
  base64ToKey,
  ivToBase64,
  base64ToIv,
} from './recording-encryption';

describe('recording-encryption', () => {
  describe('generateIV', () => {
    it('should generate a Uint8Array', () => {
      const iv = generateIV();
      expect(iv).toBeInstanceOf(Uint8Array);
    });

    it('should generate IV with length 12 (96 bits for GCM)', () => {
      const iv = generateIV();
      expect(iv.length).toBe(12);
    });

    it('should generate unique IVs', () => {
      const iv1 = generateIV();
      const iv2 = generateIV();
      // Convert to strings for comparison
      const iv1Str = Array.from(iv1).join(',');
      const iv2Str = Array.from(iv2).join(',');
      expect(iv1Str).not.toBe(iv2Str);
    });

    it('should generate cryptographically random values', () => {
      const ivs: Uint8Array[] = [];
      for (let i = 0; i < 10; i++) {
        ivs.push(generateIV());
      }
      // All IVs should be unique
      const uniqueIvs = new Set(ivs.map(iv => Array.from(iv).join(',')));
      expect(uniqueIvs.size).toBe(10);
    });
  });

  describe('generateEncryptionKey', () => {
    it('should generate a CryptoKey', async () => {
      const key = await generateEncryptionKey();
      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
    });

    it('should generate an AES-GCM key', async () => {
      const key = await generateEncryptionKey();
      expect(key.algorithm.name).toBe('AES-GCM');
    });

    it('should generate a 256-bit key', async () => {
      const key = await generateEncryptionKey();
      expect((key.algorithm as AesKeyGenParams).length).toBe(256);
    });

    it('should generate extractable key', async () => {
      const key = await generateEncryptionKey();
      expect(key.extractable).toBe(true);
    });

    it('should support encrypt and decrypt operations', async () => {
      const key = await generateEncryptionKey();
      expect(key.usages).toContain('encrypt');
      expect(key.usages).toContain('decrypt');
    });
  });

  describe('exportKey / importKey', () => {
    it('should export key to buffer-like object', async () => {
      const key = await generateEncryptionKey();
      const exported = await exportKey(key);
      // Check it has byteLength property (works with both ArrayBuffer and polyfills)
      expect(exported.byteLength).toBeDefined();
    });

    it('should export key with 32 bytes (256 bits)', async () => {
      const key = await generateEncryptionKey();
      const exported = await exportKey(key);
      expect(exported.byteLength).toBe(32);
    });

    it('should import key from ArrayBuffer', async () => {
      const originalKey = await generateEncryptionKey();
      const exported = await exportKey(originalKey);
      const importedKey = await importKey(exported);

      expect(importedKey.type).toBe('secret');
      expect(importedKey.algorithm.name).toBe('AES-GCM');
    });

    it('should be able to use imported key for encryption', async () => {
      const originalKey = await generateEncryptionKey();
      const exported = await exportKey(originalKey);
      const importedKey = await importKey(exported);

      const data = new TextEncoder().encode('test data').buffer;
      const { encrypted } = await encryptData(data, importedKey);
      // Check it has byteLength property
      expect(encrypted.byteLength).toBeDefined();
    });
  });

  describe('encryptData / decryptData', () => {
    let key: CryptoKey;

    beforeAll(async () => {
      key = await generateEncryptionKey();
    });

    it('should encrypt data and return encrypted buffer and IV', async () => {
      const data = new TextEncoder().encode('Hello, World!').buffer;
      const result = await encryptData(data, key);

      expect(result.encrypted.byteLength).toBeDefined();
      expect(result.iv).toBeInstanceOf(Uint8Array);
      expect(result.iv.length).toBe(12);
    });

    it('should encrypt data with different size than original', async () => {
      const data = new TextEncoder().encode('test').buffer;
      const { encrypted } = await encryptData(data, key);

      // GCM adds 16 bytes of authentication tag
      expect(encrypted.byteLength).toBeGreaterThan(data.byteLength);
    });

    it('should decrypt data correctly', async () => {
      const originalText = 'Test encryption and decryption';
      const data = new TextEncoder().encode(originalText).buffer;

      const { encrypted, iv } = await encryptData(data, key);
      const decrypted = await decryptData(encrypted, key, iv);

      const decryptedText = new TextDecoder().decode(decrypted);
      expect(decryptedText).toBe(originalText);
    });

    it('should handle empty data', async () => {
      const data = new ArrayBuffer(0);
      const { encrypted, iv } = await encryptData(data, key);
      const decrypted = await decryptData(encrypted, key, iv);

      expect(decrypted.byteLength).toBe(0);
    });

    it('should handle large data', async () => {
      // Create 1MB of data
      const largeData = new Uint8Array(1024 * 1024);
      for (let i = 0; i < largeData.length; i++) {
        largeData[i] = i % 256;
      }

      const { encrypted, iv } = await encryptData(largeData.buffer, key);
      const decrypted = await decryptData(encrypted, key, iv);

      const decryptedArray = new Uint8Array(decrypted);
      expect(decryptedArray.length).toBe(largeData.length);
      // Verify first and last bytes
      expect(decryptedArray[0]).toBe(largeData[0]);
      expect(decryptedArray[1023]).toBe(largeData[1023]);
    });

    it('should produce different ciphertext for same data with different IVs', async () => {
      const data = new TextEncoder().encode('same data').buffer;

      const result1 = await encryptData(data, key);
      const result2 = await encryptData(data, key);

      // IVs should be different
      expect(Array.from(result1.iv).join(',')).not.toBe(Array.from(result2.iv).join(','));

      // Ciphertext should be different due to different IVs
      const cipher1 = Array.from(new Uint8Array(result1.encrypted)).join(',');
      const cipher2 = Array.from(new Uint8Array(result2.encrypted)).join(',');
      expect(cipher1).not.toBe(cipher2);
    });

    it('should fail decryption with wrong key', async () => {
      const data = new TextEncoder().encode('secret').buffer;
      const { encrypted, iv } = await encryptData(data, key);

      const wrongKey = await generateEncryptionKey();

      await expect(decryptData(encrypted, wrongKey, iv)).rejects.toThrow();
    });

    it('should fail decryption with wrong IV', async () => {
      const data = new TextEncoder().encode('secret').buffer;
      const { encrypted } = await encryptData(data, key);

      const wrongIv = generateIV();

      await expect(decryptData(encrypted, key, wrongIv)).rejects.toThrow();
    });
  });

  // Note: Blob.arrayBuffer() is not available in jsdom, so we skip blob encryption tests.
  // These functions work correctly in browser environments.
  describe('encryptBlob / decryptBlob', () => {
    it('should have encryptBlob function exported', () => {
      expect(typeof encryptBlob).toBe('function');
    });

    it('should have decryptBlob function exported', () => {
      expect(typeof decryptBlob).toBe('function');
    });
  });

  describe('keyToBase64 / base64ToKey', () => {
    it('should convert key to base64 string', async () => {
      const key = await generateEncryptionKey();
      const base64 = await keyToBase64(key);

      expect(typeof base64).toBe('string');
      // Base64 of 32 bytes should be 44 characters (with padding)
      expect(base64.length).toBe(44);
    });

    it('should convert base64 string back to key', async () => {
      const originalKey = await generateEncryptionKey();
      const base64 = await keyToBase64(originalKey);
      const restoredKey = await base64ToKey(base64);

      expect(restoredKey.type).toBe('secret');
      expect(restoredKey.algorithm.name).toBe('AES-GCM');
    });

    it('should be able to encrypt/decrypt with restored key', async () => {
      const originalKey = await generateEncryptionKey();
      const base64 = await keyToBase64(originalKey);
      const restoredKey = await base64ToKey(base64);

      const data = new TextEncoder().encode('test with restored key').buffer;
      const { encrypted, iv } = await encryptData(data, restoredKey);
      const decrypted = await decryptData(encrypted, restoredKey, iv);

      const text = new TextDecoder().decode(decrypted);
      expect(text).toBe('test with restored key');
    });

    it('should produce valid base64 format', async () => {
      const key = await generateEncryptionKey();
      const base64 = await keyToBase64(key);

      // Should only contain valid base64 characters
      expect(base64).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });
  });

  describe('ivToBase64 / base64ToIv', () => {
    it('should convert IV to base64 string', () => {
      const iv = generateIV();
      const base64 = ivToBase64(iv);

      expect(typeof base64).toBe('string');
      // Base64 of 12 bytes should be 16 characters
      expect(base64.length).toBe(16);
    });

    it('should convert base64 string back to IV', () => {
      const originalIv = generateIV();
      const base64 = ivToBase64(originalIv);
      const restoredIv = base64ToIv(base64);

      expect(restoredIv).toBeInstanceOf(Uint8Array);
      expect(restoredIv.length).toBe(12);
      expect(Array.from(restoredIv)).toEqual(Array.from(originalIv));
    });

    it('should produce valid base64 format', () => {
      const iv = generateIV();
      const base64 = ivToBase64(iv);

      // Should only contain valid base64 characters
      expect(base64).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it('should roundtrip correctly', () => {
      const iv = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      const base64 = ivToBase64(iv);
      const restored = base64ToIv(base64);

      expect(Array.from(restored)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });
  });

  describe('full encryption/decryption workflow', () => {
    it('should work end-to-end with base64 serialization (without blob)', async () => {
      // 1. Generate key
      const key = await generateEncryptionKey();

      // 2. Encrypt data (using ArrayBuffer directly since Blob.arrayBuffer() not in jsdom)
      const originalText = 'Sensitive audio recording data';
      const data = new TextEncoder().encode(originalText).buffer;
      const { encrypted, iv } = await encryptData(data, key);

      // 3. Serialize key and IV for storage
      const keyBase64 = await keyToBase64(key);
      const ivBase64 = ivToBase64(iv);

      // 4. Later: restore key and IV
      const restoredKey = await base64ToKey(keyBase64);
      const restoredIv = base64ToIv(ivBase64);

      // 5. Decrypt
      const decrypted = await decryptData(encrypted, restoredKey, restoredIv);
      const decryptedText = new TextDecoder().decode(decrypted);

      expect(decryptedText).toBe(originalText);
    });

    it('should handle Cyrillic text', async () => {
      const key = await generateEncryptionKey();
      const cyrillicText = 'Привет, мир! Это тестовые данные на русском языке.';
      const data = new TextEncoder().encode(cyrillicText).buffer;

      const { encrypted, iv } = await encryptData(data, key);
      const decrypted = await decryptData(encrypted, key, iv);

      const decryptedText = new TextDecoder().decode(decrypted);
      expect(decryptedText).toBe(cyrillicText);
    });
  });
});
