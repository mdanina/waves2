/**
 * Панель источников данных для анализа
 * Содержит вкладки: Запись, Транскрипт, Заметки, Файлы
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TranscriptView } from './TranscriptView';
import { NotesView } from './NotesView';
import { FilesView } from './FilesView';
import { RecordingCard } from '@/components/specialist/RecordingCard';
import type { Appointment } from '../AnalysisLayout';

interface SourcePanelProps {
  appointmentId: string;
  appointment: Appointment;
}

export function SourcePanel({ appointmentId, appointment }: SourcePanelProps) {
  const [activeTab, setActiveTab] = useState('recording');

  return (
    <div className="h-full flex flex-col border-r bg-muted/30">
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Источники данных</h2>
        <p className="text-sm text-muted-foreground">
          Записывайте или загружайте материалы сессии
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-4 grid grid-cols-4">
          <TabsTrigger value="recording">Запись</TabsTrigger>
          <TabsTrigger value="transcript">Транскрипт</TabsTrigger>
          <TabsTrigger value="notes">Заметки</TabsTrigger>
          <TabsTrigger value="files">Файлы</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="recording" className="h-full m-0 mt-4">
            <ScrollArea className="h-full px-4">
              <div className="pb-4">
                <RecordingCard
                  appointmentId={appointmentId}
                  specialistId={appointment.specialist_id || ''}
                  userId={appointment.user_id}
                />
                <p className="text-xs text-muted-foreground mt-4">
                  Записи сохраняются локально до загрузки на сервер.
                  После загрузки они появятся во вкладке "Файлы".
                </p>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="transcript" className="h-full m-0 mt-4">
            <TranscriptView appointmentId={appointmentId} appointment={appointment} />
          </TabsContent>

          <TabsContent value="notes" className="h-full m-0 mt-4">
            <NotesView appointmentId={appointmentId} />
          </TabsContent>

          <TabsContent value="files" className="h-full m-0 mt-4">
            <FilesView appointmentId={appointmentId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
