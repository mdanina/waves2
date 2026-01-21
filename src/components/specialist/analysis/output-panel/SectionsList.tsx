/**
 * Список секций клинической заметки
 */

import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Copy, Save, CheckCircle2, Loader2 } from 'lucide-react';
import { SectionItem } from './SectionItem';
import { finalizeClinicalNote } from '@/lib/supabase-ai';
import { useToast } from '@/hooks/use-toast';
import type { GeneratedClinicalNote } from '@/types/ai.types';

interface SectionsListProps {
  clinicalNote: GeneratedClinicalNote;
  onUpdate: () => void;
}

export function SectionsList({ clinicalNote, onUpdate }: SectionsListProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const sections = clinicalNote.sections
    ? [...clinicalNote.sections].sort((a, b) => a.position - b.position)
    : [];

  const isFinalized = clinicalNote.status === 'finalized' || clinicalNote.status === 'signed';

  const handleFinalize = async () => {
    try {
      setIsSaving(true);
      await finalizeClinicalNote(clinicalNote.id);
      onUpdate();
      toast({
        title: 'Заметка сохранена',
        description: 'Клиническая заметка успешно финализирована',
      });
    } catch (error) {
      console.error('Error finalizing note:', error);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось сохранить заметку',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyAll = async () => {
    const allContent = sections
      .map((s) => `## ${s.name}\n\n${s.content || s.ai_content || ''}`)
      .join('\n\n---\n\n');

    await navigator.clipboard.writeText(allContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    toast({
      title: 'Скопировано',
      description: 'Все секции скопированы в буфер обмена',
    });
  };

  if (sections.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-sm text-muted-foreground">
          Нет секций в этой заметке
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Actions bar */}
      <div className="flex-shrink-0 px-6 py-3 border-b flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{clinicalNote.title}</span>
          {isFinalized && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Сохранено
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAll}
          >
            {copied ? (
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            Копировать всё
          </Button>
          <Button
            onClick={handleFinalize}
            disabled={isFinalized || isSaving}
            size="sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Сохранение...
              </>
            ) : isFinalized ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Сохранено
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Сохранить
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Sections */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-4">
          {sections.map((section) => (
            <SectionItem
              key={section.id}
              section={section}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
