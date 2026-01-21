/**
 * Центральная панель - шаблоны и генерация
 * Содержит: библиотеку шаблонов, кнопку генерации, прогресс
 */

import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, FileText, Check, Clock } from 'lucide-react';
import { getNoteTemplates, generateClinicalNote } from '@/lib/supabase-ai';
import { getCombinedTranscript } from '@/lib/supabase-recordings';
import { getSessionNotes } from '@/lib/supabase-session-notes';
import { useToast } from '@/hooks/use-toast';
import type { Appointment } from '../AnalysisLayout';
import type { ClinicalNoteTemplate } from '@/types/ai.types';

interface TemplatesPanelProps {
  appointmentId: string;
  appointment: Appointment;
  onNotesUpdate: () => void;
}

export function TemplatesPanel({
  appointmentId,
  appointment,
  onNotesUpdate,
}: TemplatesPanelProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ClinicalNoteTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sourceData, setSourceData] = useState<{ transcript: string; notes: string }>({
    transcript: '',
    notes: '',
  });

  // Загружаем шаблоны
  useEffect(() => {
    loadTemplates();
  }, []);

  // Загружаем данные источников
  useEffect(() => {
    loadSourceData();
  }, [appointmentId]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await getNoteTemplates();
      setTemplates(data);

      // Выбираем шаблон по умолчанию
      if (data.length > 0) {
        const defaultTemplate = data.find((t) => t.is_default) || data[0];
        setSelectedTemplateId(defaultTemplate.id);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSourceData = async () => {
    try {
      // Загружаем транскрипт
      let transcript = appointment.transcript || '';
      if (!transcript) {
        try {
          transcript = await getCombinedTranscript(appointmentId);
        } catch {
          // Нет записей
        }
      }

      // Загружаем заметки
      let notesText = '';
      try {
        const sessionNotes = await getSessionNotes(appointmentId);
        if (sessionNotes.length > 0) {
          notesText = sessionNotes.map((n) => n.content).join('\n\n');
        }
      } catch {
        // Нет заметок
      }

      setSourceData({ transcript, notes: notesText });
    } catch (error) {
      console.error('Error loading source data:', error);
    }
  };

  const handleGenerate = async () => {
    if (!selectedTemplateId) return;

    try {
      setIsGenerating(true);

      await generateClinicalNote({
        appointmentId,
        templateId: selectedTemplateId,
        transcript: sourceData.transcript,
        notes: sourceData.notes,
      });

      toast({
        title: 'Генерация запущена',
        description: 'Клиническая заметка генерируется...',
      });

      onNotesUpdate();
      loadSourceData();
    } catch (error) {
      console.error('Error generating note:', error);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось запустить генерацию',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const hasSourceData = sourceData.transcript || sourceData.notes;
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/30">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Загрузка шаблонов...
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-muted/30 border-x">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Шаблоны</h2>
        <p className="text-sm text-muted-foreground">
          Выберите шаблон для генерации заметки
        </p>
      </div>

      {/* Source data status */}
      <div className="px-4 py-3 border-b space-y-2">
        <div className="text-sm font-medium">Данные для анализа</div>
        <div className="flex flex-wrap gap-2">
          {sourceData.transcript ? (
            <Badge variant="outline" className="text-green-600 border-green-200">
              <Check className="h-3 w-3 mr-1" />
              Транскрипт
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              Нет транскрипта
            </Badge>
          )}
          {sourceData.notes ? (
            <Badge variant="outline" className="text-green-600 border-green-200">
              <Check className="h-3 w-3 mr-1" />
              Заметки
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              Нет заметок
            </Badge>
          )}
        </div>
      </div>

      {/* Templates list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-colors ${
                selectedTemplateId === template.id
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => setSelectedTemplateId(template.id)}
            >
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {template.name}
                  {template.is_default && (
                    <Badge variant="secondary" className="text-xs">По умолчанию</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              {template.description && (
                <CardContent className="p-3 pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}

          {templates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Нет доступных шаблонов</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Generate button */}
      <div className="p-4 border-t">
        <Button
          onClick={handleGenerate}
          disabled={!selectedTemplateId || !hasSourceData || isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Генерация...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Сгенерировать заметку
            </>
          )}
        </Button>
        {!hasSourceData && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Добавьте транскрипт или заметки слева
          </p>
        )}
      </div>
    </div>
  );
}
