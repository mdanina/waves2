import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sparkles,
  Loader2,
  FileText,
  History,
  Plus,
  Brain,
  AlertCircle,
  User,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  TemplateSelector,
  TranscriptInput,
  GenerationProgress,
  ClinicalNoteOutput,
} from '@/components/specialist/analysis';
import {
  getMyClinicalNotes,
  generateClinicalNote,
  getClinicalNote,
} from '@/lib/supabase-ai';
import { getAssignedClients, type Client } from '@/lib/supabase-appointments';
import { getClientName, formatDate } from '@/lib/client-utils';
import type { GeneratedClinicalNote, GenerateRequest } from '@/types/ai.types';

export default function SpecialistAIAnalysis() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  // Состояние клиентов
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  // Состояние шаблона и данных
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [notes, setNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);

  // Текущая заметка
  const [currentNote, setCurrentNote] = useState<GeneratedClinicalNote | null>(null);

  // История заметок
  const [myNotes, setMyNotes] = useState<GeneratedClinicalNote[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Загружаем клиентов при монтировании
  useEffect(() => {
    loadClients();
  }, []);

  // Загружаем историю заметок
  useEffect(() => {
    loadMyNotes();
  }, []);

  // Проверяем параметр noteId в URL
  useEffect(() => {
    const noteId = searchParams.get('noteId');
    if (noteId && !currentNote) {
      loadNote(noteId);
    }
  }, [searchParams]);

  const loadClients = async () => {
    try {
      setIsLoadingClients(true);
      const data = await getAssignedClients();
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setIsLoadingClients(false);
    }
  };

  const loadMyNotes = async () => {
    try {
      setIsLoadingNotes(true);
      const notes = await getMyClinicalNotes();
      setMyNotes(notes);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const loadNote = async (noteId: string) => {
    try {
      const note = await getClinicalNote(noteId);
      setCurrentNote(note);
      if (note.source_transcript) setTranscript(note.source_transcript);
      if (note.source_notes) setNotes(note.source_notes);
      if (note.client_user_id) setSelectedClientId(note.client_user_id);
    } catch (error) {
      console.error('Error loading note:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить заметку',
        variant: 'destructive',
      });
    }
  };

  const handleCreateNote = async () => {
    if (!selectedTemplateId) {
      toast({
        title: 'Выберите шаблон',
        description: 'Необходимо выбрать шаблон заметки',
        variant: 'destructive',
      });
      return;
    }

    if (!transcript && !notes) {
      toast({
        title: 'Добавьте данные',
        description: 'Необходимо добавить транскрипт или заметки',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCreating(true);

      const request: GenerateRequest = {
        template_id: selectedTemplateId,
        source_type: transcript && notes ? 'combined' : transcript ? 'transcript' : 'notes',
        transcript: transcript || undefined,
        notes: notes || undefined,
        client_user_id: selectedClientId || undefined,
      };

      const result = await generateClinicalNote(request);

      // Загружаем созданную заметку
      const note = await getClinicalNote(result.clinical_note_id);
      setCurrentNote(note);

      // Обновляем URL
      setSearchParams({ noteId: result.clinical_note_id });

      toast({
        title: 'Заметка создана',
        description: `Создано ${result.sections_count} секций`,
      });

      // Обновляем историю
      loadMyNotes();
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: 'Ошибка создания',
        description: error instanceof Error ? error.message : 'Не удалось создать заметку',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleNoteUpdate = useCallback(async () => {
    if (currentNote) {
      const updated = await getClinicalNote(currentNote.id);
      setCurrentNote(updated);
      loadMyNotes();
    }
  }, [currentNote]);

  const handleSelectHistoryNote = (note: GeneratedClinicalNote) => {
    setCurrentNote(note);
    if (note.source_transcript) setTranscript(note.source_transcript);
    if (note.source_notes) setNotes(note.source_notes);
    if (note.client_user_id) setSelectedClientId(note.client_user_id);
    setSearchParams({ noteId: note.id });
    setShowHistory(false);
  };

  const handleNewNote = () => {
    setCurrentNote(null);
    setTranscript('');
    setNotes('');
    setSelectedClientId(null);
    setSearchParams({});
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI-анализ
          </h1>
          <p className="text-muted-foreground">
            Создание клинических заметок на основе транскриптов сессий
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            История
            {myNotes.length > 0 && (
              <Badge variant="secondary">{myNotes.length}</Badge>
            )}
          </Button>
          {currentNote && (
            <Button variant="outline" onClick={handleNewNote} className="gap-2">
              <Plus className="h-4 w-4" />
              Новая заметка
            </Button>
          )}
        </div>
      </div>

      {/* История заметок */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              Мои заметки
            </CardTitle>
            <CardDescription>
              Ранее созданные клинические заметки
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingNotes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : myNotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Пока нет созданных заметок</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {myNotes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                        currentNote?.id === note.id ? 'bg-muted border-primary' : ''
                      }`}
                      onClick={() => handleSelectHistoryNote(note)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{note.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(note.created_at, {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              note.status === 'finalized' || note.status === 'signed'
                                ? 'default'
                                : 'outline'
                            }
                          >
                            {note.status === 'finalized' || note.status === 'signed'
                              ? 'Сохранено'
                              : 'Черновик'}
                          </Badge>
                          {note.sections && (
                            <span className="text-xs text-muted-foreground">
                              {note.sections.length} секций
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      {/* Основной контент */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Левая колонка: ввод данных */}
        <div className="space-y-6">
          {/* Выбор клиента */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Клиент
              </CardTitle>
              <CardDescription>
                Выберите клиента для привязки заметки (опционально)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingClients ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Загрузка клиентов...
                </div>
              ) : clients.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Нет назначенных клиентов
                </p>
              ) : (
                <Select
                  value={selectedClientId || 'none'}
                  onValueChange={(value) => setSelectedClientId(value === 'none' ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Без привязки к клиенту" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без привязки к клиенту</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {getClientName(client.profile, client.email)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {/* Выбор шаблона */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Шаблон заметки
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TemplateSelector
                selectedTemplateId={selectedTemplateId}
                onTemplateSelect={setSelectedTemplateId}
              />
            </CardContent>
          </Card>

          {/* Ввод транскрипта/заметок */}
          <TranscriptInput
            transcript={transcript}
            notes={notes}
            onTranscriptChange={setTranscript}
            onNotesChange={setNotes}
            isLoading={isCreating}
          />

          {/* Кнопка создания */}
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={handleCreateNote}
            disabled={isCreating || !selectedTemplateId || (!transcript && !notes)}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Создание заметки...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Создать клиническую заметку
              </>
            )}
          </Button>

          {/* Подсказка */}
          {!currentNote && (
            <Card className="bg-lavender-pale border-lavender">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-lavender-light rounded-lg">
                    <AlertCircle className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Как работает AI-анализ</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      1. Выберите клиента (опционально)<br />
                      2. Выберите шаблон заметки<br />
                      3. Добавьте транскрипт сессии или свои заметки<br />
                      4. Нажмите «Создать клиническую заметку»<br />
                      5. AI сгенерирует содержимое по каждой секции<br />
                      6. Отредактируйте при необходимости и сохраните
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Правая колонка: результат */}
        <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-200px)]">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5" />
                {currentNote ? 'Клиническая заметка' : 'Результат анализа'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-80px)]">
              {/* Прогресс генерации */}
              {currentNote && currentNote.generation_status === 'generating' && (
                <div className="p-4 border-b">
                  <GenerationProgress
                    clinicalNoteId={currentNote.id}
                    onComplete={handleNoteUpdate}
                  />
                </div>
              )}

              {/* Результат */}
              <ClinicalNoteOutput
                clinicalNote={currentNote}
                onUpdate={handleNoteUpdate}
                onError={(error) => {
                  toast({
                    title: 'Ошибка',
                    description: error,
                    variant: 'destructive',
                  });
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
