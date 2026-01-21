/**
 * Компонент для записи аудио на сессии
 * Перенесено из PsiPilot для Balansity
 */

import { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Pause, Play, Square, Upload, Loader2, AlertCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { LocalRecording, deleteLocalRecording } from '@/lib/local-recording-storage';
import { uploadAudioFile, createRecording } from '@/lib/supabase-recordings';
import { decryptBlob, base64ToKey, base64ToIv } from '@/lib/recording-encryption';
import { cn } from '@/lib/utils';

interface RecordingCardProps {
  appointmentId: string;
  specialistId: string;
  userId: string;
  onRecordingUploaded?: (recordingId: string) => void;
  className?: string;
}

// Форматирование времени
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Форматирование размера файла
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function RecordingCard({
  appointmentId,
  specialistId,
  userId,
  onRecordingUploaded,
  className,
}: RecordingCardProps) {
  const { toast } = useToast();
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());

  const {
    state,
    isRecording,
    isPaused,
    duration,
    error,
    audioLevel,
    localRecordings,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    refreshRecordings,
  } = useAudioRecorder({
    appointmentId,
    specialistId,
    enableEncryption: true, // Шифрование включено
    onRecordingComplete: (recording) => {
      toast({
        title: 'Запись сохранена',
        description: `Длительность: ${formatDuration(recording.durationSeconds)}. Зашифровано локально.`,
      });
    },
    onError: (err) => {
      toast({
        title: 'Ошибка записи',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  // Загрузка записи на сервер
  const uploadRecording = useCallback(async (recording: LocalRecording) => {
    // Проверяем наличие данных (либо blob, либо encryptedBlob)
    const hasData = recording.blob || recording.encryptedBlob;
    if (!hasData || uploadingIds.has(recording.id)) return;

    setUploadingIds(prev => new Set(prev).add(recording.id));

    try {
      let uploadBlob: Blob;

      // Если запись зашифрована, расшифровываем перед загрузкой
      if (recording.encryptedBlob && recording.encryptionKey && recording.iv) {
        const key = await base64ToKey(recording.encryptionKey);
        const iv = base64ToIv(recording.iv);
        uploadBlob = await decryptBlob(recording.encryptedBlob, key, iv, recording.mimeType);
      } else if (recording.blob) {
        uploadBlob = recording.blob;
      } else {
        throw new Error('No audio data available');
      }

      // Создаём File из Blob
      const file = new File([uploadBlob], `recording_${recording.id}.webm`, {
        type: recording.mimeType,
      });

      // Загружаем файл
      const filePath = await uploadAudioFile(file, appointmentId, userId);

      // Создаём запись в БД
      const dbRecording = await createRecording({
        appointmentId,
        userId,
        filePath,
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: recording.mimeType,
        durationSeconds: recording.durationSeconds,
      });

      // Удаляем локальную запись
      await deleteLocalRecording(recording.id);
      await refreshRecordings();

      toast({
        title: 'Запись загружена',
        description: 'Аудио успешно сохранено на сервер',
      });

      onRecordingUploaded?.(dbRecording.id);
    } catch (err) {
      console.error('Upload error:', err);
      toast({
        title: 'Ошибка загрузки',
        description: err instanceof Error ? err.message : 'Не удалось загрузить запись',
        variant: 'destructive',
      });
    } finally {
      setUploadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(recording.id);
        return newSet;
      });
    }
  }, [appointmentId, userId, uploadingIds, refreshRecordings, toast, onRecordingUploaded]);

  // Удаление локальной записи
  const handleDeleteLocal = useCallback(async (recordingId: string) => {
    try {
      await deleteLocalRecording(recordingId);
      await refreshRecordings();
      toast({
        title: 'Запись удалена',
        description: 'Локальная запись удалена',
      });
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить запись',
        variant: 'destructive',
      });
    }
  }, [refreshRecordings, toast]);

  // Незагруженные записи
  const pendingRecordings = localRecordings.filter(
    r => r.status === 'completed' || r.status === 'failed'
  );

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Mic className="h-4 w-4" />
          Аудиозапись
          <Badge variant="outline" className="ml-auto text-xs font-normal gap-1">
            <Lock className="h-3 w-3" />
            E2E
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Визуализация уровня звука */}
        {(isRecording || isPaused) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {isPaused ? 'На паузе' : 'Запись...'}
              </span>
              <span className="font-mono font-medium">
                {formatDuration(duration)}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-100',
                  isPaused ? 'bg-yellow-500' : 'bg-red-500'
                )}
                style={{ width: `${Math.min(audioLevel * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Кнопки управления */}
        <div className="flex items-center gap-2">
          {state === 'idle' && (
            <Button onClick={startRecording} variant="default" size="sm" className="gap-2">
              <Mic className="h-4 w-4" />
              Начать запись
            </Button>
          )}

          {isRecording && (
            <>
              <Button onClick={pauseRecording} variant="outline" size="sm" className="gap-2">
                <Pause className="h-4 w-4" />
                Пауза
              </Button>
              <Button
                onClick={stopRecording}
                variant="destructive"
                size="sm"
                className="gap-2"
              >
                <Square className="h-4 w-4" />
                Стоп
              </Button>
            </>
          )}

          {isPaused && (
            <>
              <Button onClick={resumeRecording} variant="default" size="sm" className="gap-2">
                <Play className="h-4 w-4" />
                Продолжить
              </Button>
              <Button
                onClick={stopRecording}
                variant="destructive"
                size="sm"
                className="gap-2"
              >
                <Square className="h-4 w-4" />
                Стоп
              </Button>
              <Button
                onClick={cancelRecording}
                variant="ghost"
                size="sm"
              >
                Отмена
              </Button>
            </>
          )}

          {state === 'stopping' && (
            <Button disabled variant="outline" size="sm" className="gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Сохранение...
            </Button>
          )}
        </div>

        {/* Ошибка */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error.message}
          </div>
        )}

        {/* Незагруженные записи */}
        {pendingRecordings.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="text-sm font-medium text-muted-foreground">
              Ожидают загрузки ({pendingRecordings.length})
            </div>
            {pendingRecordings.map((recording) => (
              <div
                key={recording.id}
                className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  {recording.status === 'failed' ? (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  ) : recording.encryptedBlob ? (
                    <Lock className="h-4 w-4 text-green-600" />
                  ) : (
                    <Mic className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div className="text-sm">
                    <div className="flex items-center gap-1">
                      {formatDuration(recording.durationSeconds)}
                      {recording.encryptedBlob && (
                        <span className="text-xs text-green-600">(зашифровано)</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(recording.fileSizeBytes)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {uploadingIds.has(recording.id) ? (
                    <Button disabled variant="ghost" size="sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => uploadRecording(recording)}
                        variant="ghost"
                        size="sm"
                        title="Загрузить на сервер"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteLocal(recording.id)}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        title="Удалить"
                      >
                        <MicOff className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
