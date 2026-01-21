import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, CheckCircle2, XCircle, Edit2, Copy, Check } from 'lucide-react';
import { updateSectionContent, finalizeClinicalNote } from '@/lib/supabase-ai';
import type { GeneratedClinicalNote, GeneratedSection } from '@/types/ai.types';

interface SectionCardProps {
  section: GeneratedSection;
  onSave: (sectionId: string, content: string) => Promise<void>;
}

function SectionCard({ section, onSave }: SectionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(section.content || section.ai_content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setContent(section.content || section.ai_content || '');
    setIsEditing(false);
  }, [section.content, section.ai_content]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(section.id, content);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving section:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = () => {
    switch (section.generation_status) {
      case 'completed':
        return (
          <Badge variant="outline" className="gap-1 text-green-600 border-green-200">
            <CheckCircle2 className="h-3 w-3" />
            Готово
          </Badge>
        );
      case 'generating':
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Генерация
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Ошибка
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1">
            Ожидание
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{section.name}</CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {content && !isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 w-8 p-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-8 w-8 p-0"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        {section.generation_error && (
          <p className="text-sm text-destructive mt-2">{section.generation_error}</p>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px]"
              placeholder="Введите содержимое секции..."
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Сохранить
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setContent(section.content || section.ai_content || '');
                  setIsEditing(false);
                }}
              >
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="whitespace-pre-wrap text-sm leading-relaxed cursor-pointer hover:bg-muted/50 rounded p-2 -m-2 transition-colors"
            onClick={() => content && setIsEditing(true)}
            title="Кликните для редактирования"
          >
            {content || (
              <span className="text-muted-foreground italic">
                {section.generation_status === 'pending'
                  ? 'Ожидание генерации...'
                  : section.generation_status === 'generating'
                  ? 'Генерация...'
                  : 'Контент отсутствует'}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ClinicalNoteOutputProps {
  clinicalNote: GeneratedClinicalNote | null;
  onUpdate: () => void;
  onError?: (error: string) => void;
}

export function ClinicalNoteOutput({
  clinicalNote,
  onUpdate,
  onError,
}: ClinicalNoteOutputProps) {
  const [isSaving, setIsSaving] = useState(false);

  if (!clinicalNote) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center">
        <div>
          <h4 className="font-semibold mb-2">Заметок пока нет</h4>
          <p className="text-sm text-muted-foreground">
            Добавьте транскрипт или заметки и нажмите "Создать заметку"
          </p>
        </div>
      </div>
    );
  }

  const sections = clinicalNote.sections
    ? [...clinicalNote.sections].sort((a, b) => a.position - b.position)
    : [];

  const handleSaveSection = async (sectionId: string, content: string) => {
    try {
      await updateSectionContent(sectionId, content);
      onUpdate();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось сохранить секцию';
      onError?.(message);
      throw error;
    }
  };

  const handleFinalize = async () => {
    try {
      setIsSaving(true);
      await finalizeClinicalNote(clinicalNote.id);
      onUpdate();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось сохранить заметку';
      onError?.(message);
    } finally {
      setIsSaving(false);
    }
  };

  const copyAll = async () => {
    const allContent = sections
      .map(s => `## ${s.name}\n\n${s.content || s.ai_content || ''}`)
      .join('\n\n---\n\n');
    await navigator.clipboard.writeText(allContent);
  };

  const isFinalized = clinicalNote.status === 'finalized' || clinicalNote.status === 'signed';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{clinicalNote.title}</h3>
          <p className="text-sm text-muted-foreground">
            {sections.length} секций
            {isFinalized && ' (сохранено)'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyAll}>
            <Copy className="h-4 w-4 mr-2" />
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
                Сохранить заметку
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Sections */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {sections.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Нет секций в этой заметке
            </p>
          ) : (
            sections.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                onSave={handleSaveSection}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
