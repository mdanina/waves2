/**
 * Баннер для уведомления о незагруженных записях
 * Показывается если есть локальные записи, ожидающие загрузки
 */

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Upload, Loader2, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  getPendingRecordings,
  markRecordingUploaded,
  markRecordingFailed,
  deleteLocalRecording,
  type LocalRecording,
} from '@/lib/local-recording-storage';
import { uploadAudioFile, createRecording } from '@/lib/supabase-recordings';
import { decryptBlob, base64ToKey, base64ToIv } from '@/lib/recording-encryption';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export function PendingRecoveryBanner() {
  const { toast } = useToast();
  const [pendingRecordings, setPendingRecordings] = useState<LocalRecording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  // Проверка незагруженных записей
  const checkPendingRecordings = useCallback(async () => {
    try {
      setIsLoading(true);
      const pending = await getPendingRecordings();
      setPendingRecordings(pending);
    } catch (error) {
      logger.error('Error checking pending recordings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPendingRecordings();
  }, [checkPendingRecordings]);

  // Загрузка одной записи
  const uploadSingleRecording = async (recording: LocalRecording): Promise<boolean> => {
    try {
      // Получаем blob (дешифруем если нужно)
      let blob: Blob;

      if (recording.encryptedBlob && recording.encryptionKey && recording.iv) {
        const key = await base64ToKey(recording.encryptionKey);
        const iv = base64ToIv(recording.iv);
        blob = await decryptBlob(recording.encryptedBlob, key, iv, recording.mimeType);
      } else if (recording.blob) {
        blob = recording.blob;
      } else {
        throw new Error('No blob data available');
      }

      // Получаем текущего пользователя
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Создаём File
      const file = new File([blob], `recording_${recording.id}.webm`, {
        type: recording.mimeType,
      });

      // Загружаем файл
      const filePath = await uploadAudioFile(file, recording.appointmentId, user.id);

      // Создаём запись в БД
      const dbRecording = await createRecording({
        appointmentId: recording.appointmentId,
        userId: user.id,
        filePath,
        fileName: file.name,
        fileSizeBytes: recording.fileSizeBytes,
        mimeType: recording.mimeType,
        durationSeconds: recording.durationSeconds,
      });

      // Помечаем как загруженную
      await markRecordingUploaded(recording.id, dbRecording.id, filePath);

      // Удаляем из локального хранилища
      await deleteLocalRecording(recording.id);

      return true;
    } catch (error) {
      logger.error('Error uploading recording:', error);
      await markRecordingFailed(
        recording.id,
        error instanceof Error ? error.message : 'Upload failed'
      );
      return false;
    }
  };

  // Загрузка всех ожидающих записей
  const uploadAllPending = async () => {
    if (pendingRecordings.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setCurrentIndex(0);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < pendingRecordings.length; i++) {
      setCurrentIndex(i);
      setUploadProgress(Math.round((i / pendingRecordings.length) * 100));

      const success = await uploadSingleRecording(pendingRecordings[i]);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    setUploadProgress(100);
    setIsUploading(false);

    // Обновляем список
    await checkPendingRecordings();

    // Показываем результат
    if (failCount === 0) {
      toast({
        title: 'Все записи загружены',
        description: `Успешно загружено ${successCount} записей`,
      });
    } else {
      toast({
        title: 'Загрузка завершена',
        description: `Загружено: ${successCount}, ошибок: ${failCount}`,
        variant: failCount > successCount ? 'destructive' : 'default',
      });
    }
  };

  // Удаление всех ожидающих
  const deleteAllPending = async () => {
    try {
      for (const recording of pendingRecordings) {
        await deleteLocalRecording(recording.id);
      }
      setPendingRecordings([]);
      toast({
        title: 'Записи удалены',
        description: 'Все локальные записи удалены',
      });
    } catch (error) {
      logger.error('Error deleting pending recordings:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить записи',
        variant: 'destructive',
      });
    }
  };

  // Не показываем если нет записей или компонент скрыт
  if (isLoading || pendingRecordings.length === 0 || isDismissed) {
    return null;
  }

  // Форматирование размера
  const totalSize = pendingRecordings.reduce((sum, r) => sum + r.fileSizeBytes, 0);
  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Alert variant="default" className="mb-4 border-yellow-500 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="flex items-center justify-between">
        <span className="text-yellow-800">
          Незагруженные записи ({pendingRecordings.length})
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription className="text-yellow-700">
        <p className="mb-3">
          У вас есть {pendingRecordings.length} локальных записей
          (общий размер: {formatSize(totalSize)}), которые не были загружены на сервер.
          Загрузите их, чтобы не потерять данные.
        </p>

        {isUploading && (
          <div className="mb-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>
                Загрузка {currentIndex + 1} из {pendingRecordings.length}...
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={uploadAllPending}
            disabled={isUploading}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Загрузка...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Загрузить все
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={checkPendingRecordings}
            disabled={isUploading}
            className="border-yellow-600 text-yellow-700 hover:bg-yellow-100"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Обновить
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={deleteAllPending}
            disabled={isUploading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Удалить все
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
