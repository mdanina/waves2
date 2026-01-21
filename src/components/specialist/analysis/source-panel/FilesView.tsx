/**
 * Компонент для отображения загруженных файлов (аудиозаписей)
 */

import { useState, useEffect } from 'react';
import { Loader2, FileText, Music, Upload, Trash2, Download } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getAppointmentRecordings,
  uploadAudioFile,
  createRecording,
  deleteRecording,
  getRecordingUrl,
  type Recording,
} from '@/lib/supabase-recordings';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface FilesViewProps {
  appointmentId: string;
}

export function FilesView({ appointmentId }: FilesViewProps) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadRecordings();
  }, [appointmentId]);

  const loadRecordings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getAppointmentRecordings(appointmentId);
      setRecordings(data);
    } catch (err) {
      console.error('Error loading recordings:', err);
      setError(err instanceof Error ? err.message : 'Не удалось загрузить записи');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Необходима авторизация');
      }

      // Загружаем файл в storage
      const filePath = await uploadAudioFile(file, appointmentId, user.id);

      // Создаем запись в БД
      await createRecording({
        appointmentId,
        userId: user.id,
        filePath,
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type,
      });

      await loadRecordings();

      toast({
        title: 'Файл загружен',
        description: `Аудиофайл "${file.name}" успешно загружен`,
      });
    } catch (err) {
      console.error('Error uploading file:', err);
      toast({
        title: 'Ошибка загрузки',
        description: err instanceof Error ? err.message : 'Не удалось загрузить файл',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleDelete = async (recordingId: string) => {
    try {
      await deleteRecording(recordingId);
      await loadRecordings();

      toast({
        title: 'Запись удалена',
      });
    } catch (err) {
      console.error('Error deleting recording:', err);
      toast({
        title: 'Ошибка',
        description: err instanceof Error ? err.message : 'Не удалось удалить запись',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async (recording: Recording) => {
    try {
      const url = await getRecordingUrl(recording.file_path);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error getting download URL:', err);
      toast({
        title: 'Ошибка',
        description: 'Не удалось получить ссылку для скачивания',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'неизвестно';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return 'неизвестно';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTranscriptStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Расшифровано</Badge>;
      case 'processing':
        return <Badge variant="secondary">Расшифровка...</Badge>;
      case 'failed':
        return <Badge variant="destructive">Ошибка</Badge>;
      default:
        return <Badge variant="outline">Ожидание</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex-shrink-0 px-4 pb-4 flex items-center gap-2">
        <input
          type="file"
          id="audio-upload"
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('audio-upload')?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Загрузить аудио
            </>
          )}
        </Button>
        <span className="text-xs text-muted-foreground">
          MP3, WAV, WebM и другие форматы
        </span>
      </div>

      {/* Recordings list */}
      {recordings.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
          <Music className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            Нет загруженных аудиозаписей
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Загрузите аудиофайл для транскрибации
          </p>
        </div>
      ) : (
        <ScrollArea className="flex-1 px-4">
          <div className="pb-4 space-y-3">
            {recordings.map((recording) => (
              <Card key={recording.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Music className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                          {recording.file_name || 'Аудиозапись'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-2">
                        <span>{formatFileSize(recording.file_size_bytes)}</span>
                        {recording.duration_seconds && (
                          <>
                            <span>•</span>
                            <span>{formatDuration(recording.duration_seconds)}</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {getTranscriptStatusBadge(recording.transcript_status)}
                      </div>

                      {recording.transcript && (
                        <div className="mt-3 p-2 bg-muted rounded text-xs">
                          <p className="line-clamp-3">{recording.transcript}</p>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground mt-2">
                        {new Date(recording.created_at).toLocaleString('ru-RU')}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(recording)}
                        className="h-8 w-8 p-0"
                        title="Скачать"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(recording.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
