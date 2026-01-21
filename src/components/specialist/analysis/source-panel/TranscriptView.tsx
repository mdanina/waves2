/**
 * Компонент для отображения и редактирования транскрипта сессии
 */

import { useState, useEffect } from 'react';
import { Loader2, FileText, Upload } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getAppointmentRecordings, getCombinedTranscript } from '@/lib/supabase-recordings';
import { supabase } from '@/lib/supabase';
import type { Appointment } from '../AnalysisLayout';

interface TranscriptViewProps {
  appointmentId: string;
  appointment: Appointment;
}

export function TranscriptView({ appointmentId, appointment }: TranscriptViewProps) {
  const [transcript, setTranscript] = useState<string>(appointment.transcript || '');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTranscript();
  }, [appointmentId]);

  const loadTranscript = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Если есть транскрипт в appointment, используем его
      if (appointment.transcript) {
        setTranscript(appointment.transcript);
        setIsLoading(false);
        return;
      }

      // Пробуем загрузить из записей
      try {
        const combinedTranscript = await getCombinedTranscript(appointmentId);
        if (combinedTranscript) {
          setTranscript(combinedTranscript);
        }
      } catch (err) {
        console.log('No recordings found, using empty transcript');
      }
    } catch (err) {
      console.error('Error loading transcript:', err);
      setError(err instanceof Error ? err.message : 'Не удалось загрузить транскрипт');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('appointments')
        .update({
          transcript,
          updated_at: new Date().toISOString(),
        })
        .eq('id', appointmentId);

      if (error) throw error;

      setIsEditing(false);
    } catch (err) {
      console.error('Error saving transcript:', err);
      setError(err instanceof Error ? err.message : 'Не удалось сохранить транскрипт');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setTranscript(text);
      setIsEditing(true);
    } catch (err) {
      console.error('Error reading file:', err);
      setError('Не удалось прочитать файл');
    }

    // Reset input
    event.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !transcript) {
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
          id="transcript-upload"
          accept=".txt,.md"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('transcript-upload')?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          Загрузить
        </Button>

        {!isEditing && transcript && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            Редактировать
          </Button>
        )}

        {isEditing && (
          <>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Сохранить'
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTranscript(appointment.transcript || '');
                setIsEditing(false);
              }}
            >
              Отмена
            </Button>
          </>
        )}
      </div>

      {/* Content */}
      {!transcript && !isEditing ? (
        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-4">
            Нет транскрипта для этой сессии
          </p>
          <Button
            variant="outline"
            onClick={() => setIsEditing(true)}
          >
            Добавить транскрипт
          </Button>
        </div>
      ) : isEditing ? (
        <div className="flex-1 px-4 pb-4">
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Вставьте или введите транскрипт сессии..."
            className="h-full min-h-[300px] font-mono text-sm resize-none"
          />
        </div>
      ) : (
        <ScrollArea className="flex-1 px-4">
          <div className="pb-4">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {transcript}
            </pre>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
