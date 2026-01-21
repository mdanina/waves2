/**
 * Компонент для отображения и редактирования секции
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, CheckCircle2, XCircle, Loader2, Edit2, Save, Copy, Check } from 'lucide-react';
import { regenerateSection, updateSectionContent } from '@/lib/supabase-ai';
import { useToast } from '@/hooks/use-toast';
import type { GeneratedSection } from '@/types/ai.types';

interface SectionItemProps {
  section: GeneratedSection;
  onUpdate: () => void;
}

export function SectionItem({ section, onUpdate }: SectionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(section.content || section.ai_content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Обновляем контент при изменении секции
  useEffect(() => {
    setContent(section.content || section.ai_content || '');
  }, [section.content, section.ai_content]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateSectionContent(section.id, content);
      setIsEditing(false);
      toast({
        title: 'Сохранено',
        description: 'Секция успешно обновлена',
      });
      onUpdate();
    } catch (error) {
      console.error('Error saving section:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить секцию',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      setIsRegenerating(true);
      const result = await regenerateSection(section.id);
      setContent(result.ai_content);
      toast({
        title: 'Перегенерировано',
        description: 'Секция успешно перегенерирована',
      });
      onUpdate();
    } catch (error) {
      console.error('Error regenerating section:', error);
      toast({
        title: 'Ошибка',
        description: error instanceof Error
          ? error.message
          : 'Не удалось перегенерировать секцию. AI сервис может быть недоступен.',
        variant: 'destructive',
      });
    } finally {
      setIsRegenerating(false);
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
      default:
        return (
          <Badge variant="outline">
            Ожидание
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{section.name}</CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {content && !isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 w-8 p-0"
                  title="Копировать"
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
                  title="Редактировать"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </>
            )}
            {section.generation_status === 'completed' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="h-8 w-8 p-0"
                title="Перегенерировать"
              >
                {isRegenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
        {section.generation_error && (
          <p className="text-sm text-destructive mt-2">
            {section.generation_error}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] font-sans"
              placeholder="Введите содержимое секции..."
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
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
            className="prose prose-sm max-w-none cursor-pointer hover:bg-muted/50 rounded p-2 -m-2 transition-colors"
            onClick={() => content && setIsEditing(true)}
            title={content ? 'Кликните для редактирования' : undefined}
          >
            {content ? (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {content}
              </pre>
            ) : (
              <p className="text-muted-foreground italic">
                {section.generation_status === 'pending'
                  ? 'Ожидание генерации...'
                  : section.generation_status === 'generating'
                  ? 'Генерация...'
                  : 'Контент отсутствует'}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
