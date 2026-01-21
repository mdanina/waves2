import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, MessageSquare, Loader2, X, Check } from 'lucide-react';

interface TranscriptInputProps {
  transcript: string;
  notes: string;
  onTranscriptChange: (transcript: string) => void;
  onNotesChange: (notes: string) => void;
  onFileUpload?: (file: File) => Promise<string>;
  isLoading?: boolean;
}

export function TranscriptInput({
  transcript,
  notes,
  onTranscriptChange,
  onNotesChange,
  onFileUpload,
  isLoading = false,
}: TranscriptInputProps) {
  const [activeTab, setActiveTab] = useState<'transcript' | 'notes'>('transcript');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверяем тип файла
    const allowedTypes = ['text/plain', 'text/markdown', 'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/mp4'];
    const isText = file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md');
    const isAudio = file.type.startsWith('audio/');

    if (!isText && !isAudio) {
      setUploadError('Поддерживаются только текстовые (.txt, .md) или аудио файлы');
      return;
    }

    setUploadStatus('uploading');
    setUploadError(null);

    try {
      if (isText) {
        // Читаем текстовый файл
        const text = await file.text();
        onTranscriptChange(text);
        setUploadStatus('success');
      } else if (isAudio && onFileUpload) {
        // Загружаем аудио для транскрибации
        const transcribedText = await onFileUpload(file);
        onTranscriptChange(transcribedText);
        setUploadStatus('success');
      } else {
        setUploadError('Загрузка аудио не настроена');
        setUploadStatus('error');
      }
    } catch (error) {
      console.error('File upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Ошибка загрузки файла');
      setUploadStatus('error');
    }

    // Сбрасываем input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearTranscript = () => {
    onTranscriptChange('');
    setUploadStatus('idle');
    setUploadError(null);
  };

  const getSourceInfo = () => {
    if (!transcript && !notes) return null;

    const parts = [];
    if (transcript) parts.push(`Транскрипт: ${transcript.length} символов`);
    if (notes) parts.push(`Заметки: ${notes.length} символов`);

    return parts.join(' | ');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Исходные данные для анализа
        </CardTitle>
        <CardDescription>
          Добавьте транскрипт сессии или заметки для AI-анализа
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transcript" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Транскрипт
              {transcript && <span className="text-xs text-muted-foreground">({transcript.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2">
              <FileText className="h-4 w-4" />
              Заметки
              {notes && <span className="text-xs text-muted-foreground">({notes.length})</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transcript" className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || uploadStatus === 'uploading'}
              >
                {uploadStatus === 'uploading' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Загрузить файл
                  </>
                )}
              </Button>
              <span className="text-xs text-muted-foreground">
                Поддерживаются .txt, .md файлы
              </span>
              {transcript && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearTranscript}
                  className="ml-auto"
                >
                  <X className="h-4 w-4 mr-1" />
                  Очистить
                </Button>
              )}
            </div>

            {uploadStatus === 'success' && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                Файл успешно загружен
              </div>
            )}

            {uploadError && (
              <div className="text-sm text-destructive">{uploadError}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="transcript">Транскрипт сессии</Label>
              <Textarea
                id="transcript"
                value={transcript}
                onChange={(e) => onTranscriptChange(e.target.value)}
                placeholder="Вставьте транскрипт сессии или загрузите файл..."
                className="min-h-[300px] font-mono text-sm"
                disabled={isLoading}
              />
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Заметки специалиста</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="Добавьте свои заметки о сессии..."
                className="min-h-[300px]"
                disabled={isLoading}
              />
            </div>
          </TabsContent>
        </Tabs>

        {getSourceInfo() && (
          <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
            {getSourceInfo()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
