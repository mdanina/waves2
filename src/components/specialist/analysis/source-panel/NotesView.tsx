/**
 * Компонент для отображения и добавления заметок сессии
 */

import { useState, useEffect } from 'react';
import { Loader2, FileText, Plus, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  getSessionNotes,
  createSessionNote,
  deleteSessionNote,
  type SessionNote,
} from '@/lib/supabase-session-notes';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface NotesViewProps {
  appointmentId: string;
}

export function NotesView({ appointmentId }: NotesViewProps) {
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadNotes();
  }, [appointmentId]);

  const loadNotes = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const sessionNotes = await getSessionNotes(appointmentId);
      setNotes(sessionNotes);
    } catch (err) {
      console.error('Error loading notes:', err);
      setError(err instanceof Error ? err.message : 'Не удалось загрузить заметки');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;

    try {
      setIsSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Необходима авторизация');
      }

      await createSessionNote({
        appointmentId,
        userId: user.id,
        content: newNoteContent.trim(),
        source: 'manual',
      });

      setNewNoteContent('');
      setIsAdding(false);
      await loadNotes();

      toast({
        title: 'Заметка добавлена',
        description: 'Заметка успешно сохранена',
      });
    } catch (err) {
      console.error('Error adding note:', err);
      toast({
        title: 'Ошибка',
        description: err instanceof Error ? err.message : 'Не удалось добавить заметку',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteSessionNote(noteId);
      await loadNotes();

      toast({
        title: 'Заметка удалена',
      });
    } catch (err) {
      console.error('Error deleting note:', err);
      toast({
        title: 'Ошибка',
        description: err instanceof Error ? err.message : 'Не удалось удалить заметку',
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Необходима авторизация');
      }

      const text = await file.text();

      await createSessionNote({
        appointmentId,
        userId: user.id,
        content: text,
        source: 'file',
        originalFilename: file.name,
      });

      await loadNotes();

      toast({
        title: 'Файл загружен',
        description: `Заметка из файла "${file.name}" добавлена`,
      });
    } catch (err) {
      console.error('Error uploading file:', err);
      toast({
        title: 'Ошибка',
        description: err instanceof Error ? err.message : 'Не удалось загрузить файл',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      event.target.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex-shrink-0 px-4 pb-4 flex items-center gap-2">
        <input
          type="file"
          id="notes-upload"
          accept=".txt,.md"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('notes-upload')?.click()}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Из файла
            </>
          )}
        </Button>

        {!isAdding && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Новая заметка
          </Button>
        )}
      </div>

      {/* Add new note form */}
      {isAdding && (
        <div className="flex-shrink-0 px-4 pb-4 space-y-2">
          <Textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Введите заметку..."
            className="min-h-[100px]"
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={isSaving || !newNoteContent.trim()}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Добавить'
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setNewNoteContent('');
              }}
            >
              Отмена
            </Button>
          </div>
        </div>
      )}

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            Нет заметок для этой сессии
          </p>
        </div>
      ) : (
        <ScrollArea className="flex-1 px-4">
          <div className="pb-4 space-y-3">
            {notes.map((note) => (
              <Card key={note.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      {note.original_filename && (
                        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {note.original_filename}
                        </div>
                      )}
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {note.content}
                      </pre>
                      <div className="text-xs text-muted-foreground mt-2">
                        {new Date(note.created_at).toLocaleString('ru-RU')}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
