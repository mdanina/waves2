/**
 * Компонент для управления документами клиента
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  Upload,
  Download,
  Trash2,
  FileText,
  Image,
  File,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  getClientDocuments,
  createClientDocument,
  deleteClientDocument,
  uploadDocumentFile,
  getDocumentUrl,
  getCategoryLabel,
  type ClientDocument,
} from '@/lib/supabase-client-documents';

interface ClientDocumentsProps {
  clientUserId: string;
  currentUserId: string;
}

type DocumentCategory = 'medical' | 'assessment' | 'consent' | 'other';

// Иконка по MIME типу
function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <Image className="h-5 w-5" />;
  if (mimeType === 'application/pdf') return <FileText className="h-5 w-5" />;
  return <File className="h-5 w-5" />;
}

// Форматирование размера
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ClientDocuments({ clientUserId, currentUserId }: ClientDocumentsProps) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Форма загрузки
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('other');

  // Загрузка документов
  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const docs = await getClientDocuments(clientUserId);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить документы',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [clientUserId, toast]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Загрузка нового документа
  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);

      // Загружаем файл в Storage
      const filePath = await uploadDocumentFile(selectedFile, clientUserId, currentUserId);

      // Создаём запись в БД
      await createClientDocument({
        clientUserId,
        uploadedByUserId: currentUserId,
        filePath,
        fileName: selectedFile.name,
        fileSizeBytes: selectedFile.size,
        mimeType: selectedFile.type,
        description: description || undefined,
        category,
      });

      // Обновляем список
      await loadDocuments();

      // Сбрасываем форму
      setSelectedFile(null);
      setDescription('');
      setCategory('other');
      setIsDialogOpen(false);

      toast({
        title: 'Документ загружен',
        description: `Файл "${selectedFile.name}" успешно загружен`,
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Ошибка загрузки',
        description: error instanceof Error ? error.message : 'Не удалось загрузить документ',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Скачивание документа
  const handleDownload = async (document: ClientDocument) => {
    try {
      const url = await getDocumentUrl(document.file_path);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось получить ссылку для скачивания',
        variant: 'destructive',
      });
    }
  };

  // Удаление документа
  const handleDelete = async (documentId: string) => {
    try {
      await deleteClientDocument(documentId);
      await loadDocuments();

      toast({
        title: 'Документ удалён',
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить документ',
        variant: 'destructive',
      });
    }
  };

  // Выбор файла
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Проверка размера (максимум 10 MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Файл слишком большой',
          description: 'Максимальный размер файла — 10 МБ',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Кнопка загрузки */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Загрузить документ
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Загрузить документ</DialogTitle>
              <DialogDescription>
                Выберите файл для загрузки. Поддерживаются PDF, изображения и документы.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Выбор файла */}
              <div className="space-y-2">
                <Label htmlFor="file">Файл</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif"
                  onChange={handleFileChange}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>

              {/* Категория */}
              <div className="space-y-2">
                <Label htmlFor="category">Категория</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medical">Медицинский</SelectItem>
                    <SelectItem value="assessment">Диагностика</SelectItem>
                    <SelectItem value="consent">Согласие</SelectItem>
                    <SelectItem value="other">Другое</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Описание */}
              <div className="space-y-2">
                <Label htmlFor="description">Описание (опционально)</Label>
                <Input
                  id="description"
                  placeholder="Краткое описание документа"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isUploading}
              >
                Отмена
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Загрузить
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Список документов */}
      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Нет документов</p>
            <p className="text-sm mt-1">
              Загрузите первый документ для этого клиента
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map((document) => (
            <Card key={document.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      {getFileIcon(document.mime_type)}
                    </div>
                    <div>
                      <p className="font-medium">{document.file_name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatFileSize(document.file_size_bytes)}</span>
                        <span>•</span>
                        <span>{new Date(document.created_at).toLocaleDateString('ru-RU')}</span>
                      </div>
                      {document.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {document.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{getCategoryLabel(document.category)}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(document)}
                      title="Скачать"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Удалить документ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Документ "{document.file_name}" будет удалён. Это действие нельзя отменить.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(document.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Удалить
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
