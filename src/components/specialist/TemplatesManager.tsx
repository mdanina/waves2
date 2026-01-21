/**
 * Компонент управления шаблонами AI-заметок специалиста
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  GripVertical,
  Trash2,
  Copy,
  Loader2,
  FileText,
  Star,
  Lock,
  Pencil,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getBlockTemplates,
  getNoteTemplates,
  createNoteTemplate,
  addBlockToTemplate,
  removeBlockFromTemplate,
  updateNoteTemplateBlockOrder,
} from '@/lib/supabase-ai';
import { supabase } from '@/lib/supabase';
import type { NoteBlockTemplate, ClinicalNoteTemplate } from '@/types/ai.types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableBlockProps {
  block: NoteBlockTemplate;
  onRemove: () => void;
  canRemove: boolean;
}

function SortableBlock({ block, onRemove, canRemove }: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border"
    >
      <button
        className="cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{block.name}</p>
        {block.description && (
          <p className="text-xs text-muted-foreground truncate">{block.description}</p>
        )}
      </div>
      <Badge variant="outline" className="text-xs flex-shrink-0">
        {block.category}
      </Badge>
      {canRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function TemplatesManager() {
  const { toast } = useToast();

  const [templates, setTemplates] = useState<ClinicalNoteTemplate[]>([]);
  const [availableBlocks, setAvailableBlocks] = useState<NoteBlockTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<ClinicalNoteTemplate | null>(null);
  const [templateBlocks, setTemplateBlocks] = useState<NoteBlockTemplate[]>([]);

  // Диалог создания шаблона
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Диалог добавления блока
  const [addBlockDialogOpen, setAddBlockDialogOpen] = useState(false);
  const [isAddingBlock, setIsAddingBlock] = useState(false);

  // Удаление шаблона
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<ClinicalNoteTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Сохранение порядка
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [templatesData, blocksData] = await Promise.all([
        getNoteTemplates(),
        getBlockTemplates(),
      ]);
      setTemplates(templatesData);
      setAvailableBlocks(blocksData);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить шаблоны',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = (template: ClinicalNoteTemplate) => {
    setSelectedTemplate(template);
    // Загружаем блоки шаблона
    const blocks = template.block_template_ids
      .map(id => availableBlocks.find(b => b.id === id))
      .filter(Boolean) as NoteBlockTemplate[];
    setTemplateBlocks(blocks);
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите название шаблона',
        variant: 'destructive',
      });
      return;
    }

    if (selectedBlockIds.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Выберите хотя бы один блок',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCreating(true);
      const newTemplate = await createNoteTemplate(
        newTemplateName.trim(),
        null,
        newTemplateDescription.trim() || null,
        selectedBlockIds,
        templates.filter(t => !t.is_system).length === 0 // Первый пользовательский шаблон будет по умолчанию
      );

      setTemplates(prev => [...prev, newTemplate]);
      setCreateDialogOpen(false);
      setNewTemplateName('');
      setNewTemplateDescription('');
      setSelectedBlockIds([]);

      toast({
        title: 'Шаблон создан',
        description: 'Новый шаблон успешно создан',
      });

      // Автоматически выбираем созданный шаблон
      handleSelectTemplate(newTemplate);
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось создать шаблон',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDuplicateTemplate = async (template: ClinicalNoteTemplate) => {
    try {
      const newTemplate = await createNoteTemplate(
        `${template.name} (копия)`,
        null,
        template.description,
        template.block_template_ids,
        false
      );

      setTemplates(prev => [...prev, newTemplate]);

      toast({
        title: 'Шаблон скопирован',
        description: 'Копия шаблона создана',
      });
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось скопировать шаблон',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      setIsDeleting(true);

      const { error } = await supabase
        .from('clinical_note_templates')
        .update({ is_active: false })
        .eq('id', templateToDelete.id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id));

      if (selectedTemplate?.id === templateToDelete.id) {
        setSelectedTemplate(null);
        setTemplateBlocks([]);
      }

      setDeleteDialogOpen(false);
      setTemplateToDelete(null);

      toast({
        title: 'Шаблон удалён',
        description: 'Шаблон успешно удалён',
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить шаблон',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddBlock = async (blockId: string) => {
    if (!selectedTemplate) return;

    try {
      setIsAddingBlock(true);
      await addBlockToTemplate(selectedTemplate.id, blockId);

      const block = availableBlocks.find(b => b.id === blockId);
      if (block) {
        setTemplateBlocks(prev => [...prev, block]);
        setSelectedTemplate(prev => prev ? {
          ...prev,
          block_template_ids: [...prev.block_template_ids, blockId],
        } : null);
      }

      setAddBlockDialogOpen(false);

      toast({
        title: 'Блок добавлен',
        description: 'Блок успешно добавлен в шаблон',
      });
    } catch (error) {
      console.error('Error adding block:', error);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось добавить блок',
        variant: 'destructive',
      });
    } finally {
      setIsAddingBlock(false);
    }
  };

  const handleRemoveBlock = async (blockId: string) => {
    if (!selectedTemplate) return;

    try {
      await removeBlockFromTemplate(selectedTemplate.id, blockId);

      setTemplateBlocks(prev => prev.filter(b => b.id !== blockId));
      setSelectedTemplate(prev => prev ? {
        ...prev,
        block_template_ids: prev.block_template_ids.filter(id => id !== blockId),
      } : null);

      toast({
        title: 'Блок удалён',
        description: 'Блок удалён из шаблона',
      });
    } catch (error) {
      console.error('Error removing block:', error);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось удалить блок',
        variant: 'destructive',
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !selectedTemplate) return;

    const oldIndex = templateBlocks.findIndex(b => b.id === active.id);
    const newIndex = templateBlocks.findIndex(b => b.id === over.id);

    const newBlocks = arrayMove(templateBlocks, oldIndex, newIndex);
    setTemplateBlocks(newBlocks);

    try {
      setIsSavingOrder(true);
      await updateNoteTemplateBlockOrder(
        selectedTemplate.id,
        newBlocks.map(b => b.id)
      );

      setSelectedTemplate(prev => prev ? {
        ...prev,
        block_template_ids: newBlocks.map(b => b.id),
      } : null);
    } catch (error) {
      console.error('Error saving block order:', error);
      // Откатываем изменения
      setTemplateBlocks(templateBlocks);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить порядок блоков',
        variant: 'destructive',
      });
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Блоки, которые ещё не добавлены в выбранный шаблон
  const availableBlocksForAdd = availableBlocks.filter(
    block => !selectedTemplate?.block_template_ids.includes(block.id)
  );

  const canEditTemplate = selectedTemplate && !selectedTemplate.is_system;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Шаблоны AI-заметок</h3>
          <p className="text-sm text-muted-foreground">
            Создавайте и настраивайте шаблоны для генерации клинических заметок
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Новый шаблон
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Список шаблонов */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Мои шаблоны</CardTitle>
            <CardDescription>
              Выберите шаблон для редактирования
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                У вас пока нет шаблонов. Создайте первый шаблон.
              </p>
            ) : (
              templates.map(template => (
                <div
                  key={template.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleSelectTemplate(template)}
                >
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{template.name}</span>
                      {template.is_default && (
                        <Star className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
                      )}
                      {template.is_system && (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    {template.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {template.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {template.block_template_ids.length} блоков
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateTemplate(template);
                      }}
                      title="Копировать"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {!template.is_system && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTemplateToDelete(template);
                          setDeleteDialogOpen(true);
                        }}
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Редактор блоков */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {selectedTemplate ? selectedTemplate.name : 'Блоки шаблона'}
                </CardTitle>
                <CardDescription>
                  {selectedTemplate
                    ? canEditTemplate
                      ? 'Перетаскивайте блоки для изменения порядка'
                      : 'Системный шаблон (только просмотр)'
                    : 'Выберите шаблон слева'}
                </CardDescription>
              </div>
              {canEditTemplate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddBlockDialogOpen(true)}
                  disabled={availableBlocksForAdd.length === 0}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Добавить блок
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedTemplate ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Выберите шаблон для просмотра и редактирования блоков
              </p>
            ) : templateBlocks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                В шаблоне пока нет блоков
              </p>
            ) : canEditTemplate ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={templateBlocks.map(b => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {templateBlocks.map(block => (
                      <SortableBlock
                        key={block.id}
                        block={block}
                        onRemove={() => handleRemoveBlock(block.id)}
                        canRemove={templateBlocks.length > 1}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="space-y-2">
                {templateBlocks.map((block, index) => (
                  <div
                    key={block.id}
                    className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border"
                  >
                    <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{block.name}</p>
                      {block.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {block.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {block.category}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            {isSavingOrder && (
              <div className="flex items-center justify-center mt-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Сохранение...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Диалог создания шаблона */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Новый шаблон</DialogTitle>
            <DialogDescription>
              Создайте собственный шаблон для генерации AI-заметок
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Название шаблона</Label>
              <Input
                id="template-name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Например: Мой шаблон для EMDR"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Описание (опционально)</Label>
              <Textarea
                id="template-description"
                value={newTemplateDescription}
                onChange={(e) => setNewTemplateDescription(e.target.value)}
                placeholder="Краткое описание шаблона"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Выберите блоки</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Выберите блоки, которые будут включены в шаблон. Порядок можно изменить после создания.
              </p>
              <div className="border rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                {availableBlocks.map(block => (
                  <label
                    key={block.id}
                    className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedBlockIds.includes(block.id)}
                      onCheckedChange={(checked) => {
                        setSelectedBlockIds(prev =>
                          checked
                            ? [...prev, block.id]
                            : prev.filter(id => id !== block.id)
                        );
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{block.name}</p>
                      {block.description && (
                        <p className="text-xs text-muted-foreground">
                          {block.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {block.category}
                    </Badge>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Выбрано блоков: {selectedBlockIds.length}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setNewTemplateName('');
                setNewTemplateDescription('');
                setSelectedBlockIds([]);
              }}
            >
              Отмена
            </Button>
            <Button onClick={handleCreateTemplate} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Создание...
                </>
              ) : (
                'Создать шаблон'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог добавления блока */}
      <Dialog open={addBlockDialogOpen} onOpenChange={setAddBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить блок</DialogTitle>
            <DialogDescription>
              Выберите блок для добавления в шаблон
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {availableBlocksForAdd.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Все доступные блоки уже добавлены в шаблон
              </p>
            ) : (
              availableBlocksForAdd.map(block => (
                <div
                  key={block.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleAddBlock(block.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{block.name}</p>
                    {block.description && (
                      <p className="text-xs text-muted-foreground">
                        {block.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {block.category}
                  </Badge>
                </div>
              ))
            )}
          </div>

          {isAddingBlock && (
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Добавление...
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить шаблон?</AlertDialogTitle>
            <AlertDialogDescription>
              Шаблон "{templateToDelete?.name}" будет удалён. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Удаление...
                </>
              ) : (
                'Удалить'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
