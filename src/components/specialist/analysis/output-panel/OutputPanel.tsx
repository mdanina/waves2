/**
 * Панель результата анализа
 * Содержит: выбор шаблона, список секций, кнопку генерации
 */

import { useState, useEffect } from 'react';
import { TemplateSelector } from './TemplateSelector';
import { SectionsList } from './SectionsList';
import { GenerateButton } from './GenerateButton';
import { GenerationProgress } from '../GenerationProgress';
import { getNoteTemplates, getClinicalNotesForAppointment } from '@/lib/supabase-ai';
import { getCombinedTranscript } from '@/lib/supabase-recordings';
import { getSessionNotes, getCombinedTranscriptWithNotes } from '@/lib/supabase-session-notes';
import { Loader2, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { Appointment } from '../AnalysisLayout';
import type { GeneratedClinicalNote, ClinicalNoteTemplate } from '@/types/ai.types';

interface OutputPanelProps {
  appointmentId: string;
  appointment: Appointment;
  clinicalNotes: GeneratedClinicalNote[];
  onNotesUpdate: () => void;
}

export function OutputPanel({
  appointmentId,
  appointment,
  clinicalNotes,
  onNotesUpdate,
}: OutputPanelProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(
    clinicalNotes[0]?.id || null
  );
  const [templates, setTemplates] = useState<ClinicalNoteTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [sourceData, setSourceData] = useState<{ transcript: string; notes: string }>({
    transcript: '',
    notes: '',
  });

  // Загружаем шаблоны
  useEffect(() => {
    loadTemplates();
  }, []);

  // Загружаем данные источников для генерации
  useEffect(() => {
    loadSourceData();
  }, [appointmentId]);

  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
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
      setTemplatesLoading(false);
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
          notesText = sessionNotes.map(n => n.content).join('\n\n');
        }
      } catch {
        // Нет заметок
      }

      setSourceData({ transcript, notes: notesText });
    } catch (error) {
      console.error('Error loading source data:', error);
    }
  };

  // Обновляем активную заметку при изменении списка
  useEffect(() => {
    if (clinicalNotes.length > 0 && !activeNoteId) {
      setActiveNoteId(clinicalNotes[0].id);
    } else if (clinicalNotes.length > 0) {
      // Проверяем, что активная заметка еще есть в списке
      const noteExists = clinicalNotes.some(n => n.id === activeNoteId);
      if (!noteExists) {
        setActiveNoteId(clinicalNotes[0].id);
      }
    }
  }, [clinicalNotes, activeNoteId]);

  const activeNote = clinicalNotes.find((note) => note.id === activeNoteId);
  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId);

  // Проверяем наличие данных для анализа
  const hasSourceData = sourceData.transcript || sourceData.notes;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Клиническая заметка</h2>
            <p className="text-sm text-muted-foreground">
              {clinicalNotes.length > 0
                ? `${clinicalNotes.length} заметок`
                : 'Выберите шаблон и сгенерируйте заметку'}
            </p>
          </div>
          {selectedTemplateId && (
            <GenerateButton
              appointmentId={appointmentId}
              templateId={selectedTemplateId}
              transcript={sourceData.transcript}
              notes={sourceData.notes}
              onSuccess={() => {
                onNotesUpdate();
                loadSourceData();
              }}
              disabled={!hasSourceData}
            />
          )}
        </div>

        {/* Template Selector */}
        {templatesLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Загрузка шаблонов...
          </div>
        ) : (
          <TemplateSelector
            templates={templates || []}
            selectedTemplateId={selectedTemplateId}
            onSelect={setSelectedTemplateId}
          />
        )}

        {/* Data status */}
        <div className="mt-4 flex flex-wrap gap-2">
          {sourceData.transcript && (
            <Badge variant="outline" className="text-green-600 border-green-200">
              Транскрипт: {sourceData.transcript.length} символов
            </Badge>
          )}
          {sourceData.notes && (
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              Заметки: {sourceData.notes.length} символов
            </Badge>
          )}
          {!hasSourceData && (
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              Нет данных для анализа
            </Badge>
          )}
        </div>
      </div>

      {/* Clinical Notes Tabs */}
      {clinicalNotes.length > 1 && (
        <div className="border-b px-6 py-2">
          <Tabs value={activeNoteId || undefined} onValueChange={setActiveNoteId}>
            <TabsList>
              {clinicalNotes.map((note, index) => (
                <TabsTrigger key={note.id} value={note.id}>
                  Заметка {index + 1}
                  {note.status === 'finalized' && (
                    <span className="ml-1 text-green-500">✓</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Active Note Content */}
      {activeNote && (
        <>
          {/* Generation Progress */}
          {activeNote.generation_status === 'generating' && (
            <GenerationProgress
              clinicalNoteId={activeNote.id}
              onComplete={onNotesUpdate}
            />
          )}

          {/* Sections List */}
          <div className="flex-1 overflow-hidden">
            <SectionsList
              clinicalNote={activeNote}
              onUpdate={onNotesUpdate}
            />
          </div>
        </>
      )}

      {/* Empty State */}
      {!activeNote && selectedTemplate && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
            {hasSourceData ? (
              <p className="text-muted-foreground">
                Нажмите "Сгенерировать заметку" для создания клинической заметки
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  Добавьте транскрипт или заметки во вкладках слева
                </p>
                <p className="text-sm text-muted-foreground">
                  Затем вы сможете создать клиническую заметку с помощью AI
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
