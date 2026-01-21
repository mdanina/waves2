/**
 * Правая панель - результат AI анализа
 * Содержит: список секций, редактирование, экспорт
 */

import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import { updateSectionContent } from '@/lib/supabase-ai';
import { useToast } from '@/hooks/use-toast';
import type { GeneratedClinicalNote, ClinicalNoteSection } from '@/types/ai.types';

interface ResultPanelProps {
  clinicalNotes: GeneratedClinicalNote[];
  onNotesUpdate: () => void;
}

export function ResultPanel({ clinicalNotes, onNotesUpdate }: ResultPanelProps) {
  const { toast } = useToast();
  const [activeNoteId, setActiveNoteId] = useState<string | null>(
    clinicalNotes[0]?.id || null
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Обновляем активную заметку при изменении списка
  useEffect(() => {
    if (clinicalNotes.length > 0) {
      const noteExists = clinicalNotes.some((n) => n.id === activeNoteId);
      if (!noteExists || !activeNoteId) {
        setActiveNoteId(clinicalNotes[0].id);
      }
    }
  }, [clinicalNotes, activeNoteId]);

  // Раскрываем все секции по умолчанию
  useEffect(() => {
    const activeNote = clinicalNotes.find((n) => n.id === activeNoteId);
    if (activeNote?.sections) {
      const sectionIds = new Set(activeNote.sections.map((s) => s.id));
      setExpandedSections(sectionIds);
    }
  }, [activeNoteId, clinicalNotes]);

  const activeNote = clinicalNotes.find((note) => note.id === activeNoteId);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleEdit = (section: ClinicalNoteSection) => {
    setEditingSection(section.id);
    setEditContent(section.content);
  };

  const handleSave = async (sectionId: string) => {
    try {
      setIsSaving(true);
      await updateSectionContent(sectionId, editContent);
      toast({
        title: 'Сохранено',
        description: 'Секция обновлена',
      });
      setEditingSection(null);
      onNotesUpdate();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить изменения',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async (content: string, sectionId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedSection(sectionId);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch {
      toast({
        title: 'Ошибка',
        description: 'Не удалось скопировать текст',
        variant: 'destructive',
      });
    }
  };

  const handleCopyAll = async () => {
    if (!activeNote?.sections) return;

    const allContent = activeNote.sections
      .map((s) => `## ${s.section_name}\n\n${s.content}`)
      .join('\n\n---\n\n');

    try {
      await navigator.clipboard.writeText(allContent);
      toast({
        title: 'Скопировано',
        description: 'Все секции скопированы в буфер обмена',
      });
    } catch {
      toast({
        title: 'Ошибка',
        description: 'Не удалось скопировать текст',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'generating':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Генерация
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="text-green-600 border-green-200">
            <Check className="h-3 w-3 mr-1" />
            Готово
          </Badge>
        );
      case 'finalized':
        return (
          <Badge variant="default">
            <Check className="h-3 w-3 mr-1" />
            Финализировано
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (clinicalNotes.length === 0) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="border-b px-4 py-3">
          <h2 className="text-lg font-semibold">Результат</h2>
          <p className="text-sm text-muted-foreground">AI-заметки появятся здесь</p>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
            <div>
              <p className="font-medium text-muted-foreground">Нет заметок</p>
              <p className="text-sm text-muted-foreground">
                Выберите шаблон и нажмите "Сгенерировать"
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Результат</h2>
            <p className="text-sm text-muted-foreground">
              {clinicalNotes.length} заметок
            </p>
          </div>
          {activeNote?.sections && activeNote.sections.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleCopyAll}>
              <Copy className="h-4 w-4 mr-2" />
              Копировать всё
            </Button>
          )}
        </div>
      </div>

      {/* Notes tabs */}
      {clinicalNotes.length > 1 && (
        <div className="border-b px-4 py-2">
          <Tabs value={activeNoteId || undefined} onValueChange={setActiveNoteId}>
            <TabsList className="w-full justify-start">
              {clinicalNotes.map((note, index) => (
                <TabsTrigger key={note.id} value={note.id} className="text-xs">
                  Заметка {index + 1}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Status */}
      {activeNote && (
        <div className="px-4 py-2 border-b flex items-center justify-between">
          {getStatusBadge(activeNote.generation_status)}
          {activeNote.template && (
            <span className="text-xs text-muted-foreground">
              Шаблон: {activeNote.template.name}
            </span>
          )}
        </div>
      )}

      {/* Sections */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {activeNote?.sections?.map((section) => (
            <div
              key={section.id}
              className="border rounded-lg overflow-hidden bg-card"
            >
              {/* Section header */}
              <div
                className="flex items-center justify-between px-3 py-2 bg-muted/50 cursor-pointer hover:bg-muted/70"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center gap-2">
                  {expandedSections.has(section.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span className="font-medium text-sm">{section.section_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {editingSection !== section.id && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(section);
                        }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(section.content, section.id);
                        }}
                      >
                        {copiedSection === section.id ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Section content */}
              {expandedSections.has(section.id) && (
                <div className="p-3">
                  {editingSection === section.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={6}
                        className="text-sm"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingSection(null)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Отмена
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSave(section.id)}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-1" />
                          )}
                          Сохранить
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm whitespace-pre-wrap text-muted-foreground">
                      {section.content}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {activeNote?.generation_status === 'generating' && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">
                  Генерация заметки...
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
