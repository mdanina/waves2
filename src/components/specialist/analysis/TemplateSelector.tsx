import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ChevronDown } from 'lucide-react';
import { getNoteTemplates, getBlockTemplates } from '@/lib/supabase-ai';
import type { ClinicalNoteTemplate, NoteBlockTemplate } from '@/types/ai.types';

interface TemplateSelectorProps {
  selectedTemplateId: string | null;
  onTemplateSelect: (templateId: string) => void;
}

export function TemplateSelector({
  selectedTemplateId,
  onTemplateSelect,
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<ClinicalNoteTemplate[]>([]);
  const [blocks, setBlocks] = useState<NoteBlockTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [templatesData, blocksData] = await Promise.all([
        getNoteTemplates(),
        getBlockTemplates(),
      ]);
      setTemplates(templatesData);
      setBlocks(blocksData);

      // Выбираем шаблон по умолчанию, если не выбран
      if (templatesData.length > 0 && !selectedTemplateId) {
        const defaultTemplate = templatesData.find(t => t.is_default) || templatesData[0];
        onTemplateSelect(defaultTemplate.id);
      }
    } catch (err) {
      console.error('Error loading templates:', err);
      setError(err instanceof Error ? err.message : 'Не удалось загрузить шаблоны');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const selectedBlocks = selectedTemplate
    ? selectedTemplate.block_template_ids
        .map(id => blocks.find(b => b.id === id))
        .filter(Boolean) as NoteBlockTemplate[]
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Загрузка шаблонов...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">
        {error}
        <Button variant="link" size="sm" onClick={loadTemplates}>
          Попробовать снова
        </Button>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Нет доступных шаблонов
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Шаблон заметки:</label>
        <Select value={selectedTemplateId || ''} onValueChange={onTemplateSelect}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Выберите шаблон">
              {selectedTemplate && (
                <span>{selectedTemplate.name}</span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                <div className="flex flex-col">
                  <span>{template.name}</span>
                  {template.description && (
                    <span className="text-xs text-muted-foreground">
                      {template.description}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedTemplate && selectedBlocks.length > 0 && (
        <div className="border rounded-lg p-4 bg-muted/30">
          <p className="text-sm font-medium mb-2">Секции шаблона:</p>
          <div className="flex flex-wrap gap-2">
            {selectedBlocks.map((block, index) => (
              <span
                key={block.id}
                className="inline-flex items-center px-2 py-1 text-xs bg-background border rounded-md"
              >
                {index + 1}. {block.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
