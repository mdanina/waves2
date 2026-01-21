/**
 * 3-колоночный layout для анализа сессии
 * Структура как в PsiPilot:
 * - Левая колонка (35%): Транскрипт, записи, заметки, элементы управления записью
 * - Центральная колонка (30%): Шаблоны, генерация
 * - Правая колонка (35%): Результат AI заметок
 */

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { SourcePanel } from './source-panel/SourcePanel';
import { TemplatesPanel } from './templates-panel/TemplatesPanel';
import { ResultPanel } from './result-panel/ResultPanel';
import type { GeneratedClinicalNote } from '@/types/ai.types';

export interface Appointment {
  id: string;
  user_id: string;
  profile_id: string | null;
  appointment_type_id: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  transcript: string | null;
  transcript_status: string | null;
  summary: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  specialist_id: string | null;
  created_at: string;
  updated_at: string;
}

interface AnalysisLayoutProps {
  appointmentId: string;
  appointment: Appointment;
  clinicalNotes: GeneratedClinicalNote[];
  onNotesUpdate: () => void;
}

/**
 * 3-колоночный layout для анализа сессии
 */
export function AnalysisLayout({
  appointmentId,
  appointment,
  clinicalNotes,
  onNotesUpdate,
}: AnalysisLayoutProps) {
  return (
    <div className="flex-1 overflow-hidden h-full">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Левая колонка - Источники */}
        <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
          <SourcePanel appointmentId={appointmentId} appointment={appointment} />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Центральная колонка - Шаблоны и генерация */}
        <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
          <TemplatesPanel
            appointmentId={appointmentId}
            appointment={appointment}
            onNotesUpdate={onNotesUpdate}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Правая колонка - Результат */}
        <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
          <ResultPanel
            clinicalNotes={clinicalNotes}
            onNotesUpdate={onNotesUpdate}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
