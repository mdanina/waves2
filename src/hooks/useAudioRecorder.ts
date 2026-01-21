/**
 * Хук для аудиозаписи сессий
 * Перенесено из PsiPilot для Balansity
 *
 * Использует MediaRecorder API с поддержкой:
 * - Запись, пауза, возобновление
 * - Автоматическое сохранение в IndexedDB
 * - Опциональное шифрование
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  LocalRecording,
  generateRecordingId,
  saveLocalRecording,
  updateRecordingStatus,
  getRecordingsByAppointment,
} from '@/lib/local-recording-storage';
import {
  generateEncryptionKey,
  encryptBlob,
  keyToBase64,
  ivToBase64,
} from '@/lib/recording-encryption';
import { logger } from '@/lib/logger';

export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopping';

export interface UseAudioRecorderOptions {
  appointmentId: string;
  specialistId: string;
  enableEncryption?: boolean;
  mimeType?: string;
  onRecordingComplete?: (recording: LocalRecording) => void;
  onError?: (error: Error) => void;
}

export interface UseAudioRecorderResult {
  // Состояние
  state: RecordingState;
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  error: Error | null;

  // Записи
  currentRecordingId: string | null;
  localRecordings: LocalRecording[];

  // Управление
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<LocalRecording | null>;
  cancelRecording: () => void;

  // Данные
  audioLevel: number;
  refreshRecordings: () => Promise<void>;
}

// Предпочтительные MIME типы в порядке приоритета
const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
  'audio/wav',
];

function getSupportedMimeType(): string {
  for (const mimeType of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return 'audio/webm'; // Fallback
}

export function useAudioRecorder(options: UseAudioRecorderOptions): UseAudioRecorderResult {
  const {
    appointmentId,
    specialistId,
    enableEncryption = false,
    mimeType: preferredMimeType,
    onRecordingComplete,
    onError,
  } = options;

  // Состояние
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentRecordingId, setCurrentRecordingId] = useState<string | null>(null);
  const [localRecordings, setLocalRecordings] = useState<LocalRecording[]>([]);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Используемый MIME тип
  const mimeType = preferredMimeType || getSupportedMimeType();

  // Загрузка локальных записей при монтировании
  const refreshRecordings = useCallback(async () => {
    try {
      const recordings = await getRecordingsByAppointment(appointmentId);
      setLocalRecordings(recordings);
    } catch (err) {
      logger.error('Failed to load local recordings:', err);
    }
  }, [appointmentId]);

  useEffect(() => {
    refreshRecordings();
  }, [refreshRecordings]);

  // Очистка ресурсов
  const cleanup = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    analyserRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setAudioLevel(0);
  }, []);

  // Обновление уровня звука
  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    setAudioLevel(average / 255);

    if (state === 'recording') {
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [state]);

  // Обновление длительности
  const updateDuration = useCallback(() => {
    if (startTimeRef.current > 0) {
      const elapsed = Date.now() - startTimeRef.current - pausedDurationRef.current;
      setDuration(Math.floor(elapsed / 1000));
    }
  }, []);

  // Запуск записи
  const startRecording = useCallback(async () => {
    try {
      setError(null);

      // Запрашиваем доступ к микрофону
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Создаём анализатор для визуализации
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Создаём MediaRecorder
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      // Генерируем ID записи
      const recordingId = generateRecordingId();
      setCurrentRecordingId(recordingId);

      // Обработчики событий
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        const err = new Error('Recording error occurred');
        setError(err);
        onError?.(err);
        cleanup();
        setState('idle');
      };

      // Запускаем запись
      recorder.start(1000); // Чанки каждую секунду

      // Сохраняем начальную запись в IndexedDB
      const initialRecording: LocalRecording = {
        id: recordingId,
        appointmentId,
        specialistId,
        mimeType,
        durationSeconds: 0,
        fileSizeBytes: 0,
        status: 'recording',
        retryCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveLocalRecording(initialRecording);
      await refreshRecordings();

      // Запускаем таймер
      startTimeRef.current = Date.now();
      pausedDurationRef.current = 0;
      durationIntervalRef.current = setInterval(updateDuration, 1000);

      // Запускаем визуализацию
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);

      setState('recording');
      logger.log('Recording started:', recordingId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start recording');
      setError(error);
      onError?.(error);
      cleanup();
      logger.error('Failed to start recording:', err);
    }
  }, [appointmentId, specialistId, mimeType, cleanup, refreshRecordings, updateDuration, updateAudioLevel, onError]);

  // Пауза записи
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.pause();
      pausedDurationRef.current = Date.now() - startTimeRef.current - (duration * 1000);
      setState('paused');

      if (currentRecordingId) {
        updateRecordingStatus(currentRecordingId, 'paused').catch(logger.error);
      }

      logger.log('Recording paused');
    }
  }, [state, duration, currentRecordingId]);

  // Возобновление записи
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === 'paused') {
      mediaRecorderRef.current.resume();
      startTimeRef.current = Date.now() - (duration * 1000);
      pausedDurationRef.current = 0;
      setState('recording');

      if (currentRecordingId) {
        updateRecordingStatus(currentRecordingId, 'recording').catch(logger.error);
      }

      // Возобновляем визуализацию
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);

      logger.log('Recording resumed');
    }
  }, [state, duration, currentRecordingId, updateAudioLevel]);

  // Остановка записи
  const stopRecording = useCallback(async (): Promise<LocalRecording | null> => {
    if (!mediaRecorderRef.current || !currentRecordingId) {
      return null;
    }

    setState('stopping');

    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current!;
      const recordingId = currentRecordingId!;

      recorder.onstop = async () => {
        try {
          // Собираем все чанки
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const fileSizeBytes = blob.size;
          const durationSeconds = duration;

          let recording: LocalRecording = {
            id: recordingId,
            appointmentId,
            specialistId,
            blob,
            mimeType,
            durationSeconds,
            fileSizeBytes,
            status: 'completed',
            retryCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Шифрование, если включено
          if (enableEncryption) {
            const encryptionKey = await generateEncryptionKey();
            const { encryptedBlob, iv } = await encryptBlob(blob, encryptionKey);

            recording = {
              ...recording,
              blob: undefined,
              encryptedBlob,
              iv: ivToBase64(iv),
              encryptionKey: await keyToBase64(encryptionKey),
            };
          }

          // Сохраняем в IndexedDB
          await saveLocalRecording(recording);
          await refreshRecordings();

          cleanup();
          setState('idle');
          setDuration(0);
          setCurrentRecordingId(null);

          onRecordingComplete?.(recording);
          logger.log('Recording completed:', recordingId, { durationSeconds, fileSizeBytes });

          resolve(recording);
        } catch (err) {
          logger.error('Error processing recording:', err);
          const error = err instanceof Error ? err : new Error('Failed to process recording');
          setError(error);
          onError?.(error);
          cleanup();
          setState('idle');
          resolve(null);
        }
      };

      recorder.stop();
    });
  }, [
    currentRecordingId,
    appointmentId,
    specialistId,
    mimeType,
    duration,
    enableEncryption,
    cleanup,
    refreshRecordings,
    onRecordingComplete,
    onError,
  ]);

  // Отмена записи
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    cleanup();
    setState('idle');
    setDuration(0);
    setCurrentRecordingId(null);
    logger.log('Recording cancelled');
  }, [cleanup]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    state,
    isRecording: state === 'recording',
    isPaused: state === 'paused',
    duration,
    error,
    currentRecordingId,
    localRecordings,
    audioLevel,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    refreshRecordings,
  };
}
