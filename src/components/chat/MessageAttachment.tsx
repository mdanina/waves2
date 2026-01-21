/**
 * Компонент отображения вложения в сообщении
 */

import { useState, useEffect } from 'react';
import { FileText, Image, Download, File, ImageOff, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAttachmentSignedUrl } from '@/lib/supabase-messages';

interface MessageAttachmentProps {
  url: string;
  name: string;
  type: string;
  size: number;
  isOwn?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return Image;
  if (type.includes('pdf')) return FileText;
  return File;
}

export function MessageAttachment({ url, name, type, size, isOwn }: MessageAttachmentProps) {
  const isImage = type.startsWith('image/');
  const FileIcon = getFileIcon(type);
  const [imageError, setImageError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url);

  // Сбрасываем ошибку при смене URL
  useEffect(() => {
    setCurrentUrl(url);
    setImageError(false);
  }, [url]);

  // Обработчик ошибки загрузки изображения
  const handleImageError = () => {
    setImageError(true);
  };

  // Обработчик обновления URL (если signed URL истёк)
  const handleRefreshUrl = async () => {
    setIsRefreshing(true);
    try {
      // Пытаемся получить новый signed URL
      // URL может быть path в storage или уже signed URL
      // Извлекаем path из URL если это signed URL
      let filePath = url;
      if (url.includes('/storage/v1/object/sign/')) {
        // Это signed URL - извлекаем path
        const match = url.match(/\/message-attachments\/([^?]+)/);
        if (match) {
          filePath = match[1];
        }
      } else if (!url.startsWith('http')) {
        // Это уже path
        filePath = url;
      }

      const newUrl = await getAttachmentSignedUrl(filePath);
      if (newUrl) {
        setCurrentUrl(newUrl);
        setImageError(false);
      }
    } catch (error) {
      console.error('Failed to refresh image URL:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isImage) {
    if (imageError) {
      // Показываем заглушку с кнопкой обновления
      return (
        <div className="mt-2">
          <div className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border ${isOwn ? 'border-primary-foreground/30 bg-primary-foreground/10' : 'border-border bg-muted'}`}>
            <ImageOff className={`h-8 w-8 ${isOwn ? 'opacity-50' : 'text-muted-foreground'}`} />
            <p className={`text-xs ${isOwn ? 'opacity-70' : 'text-muted-foreground'}`}>
              Не удалось загрузить изображение
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshUrl}
              disabled={isRefreshing}
              className="h-7 text-xs"
            >
              {isRefreshing ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              Обновить
            </Button>
          </div>
          <p className={`text-xs mt-1 ${isOwn ? 'opacity-70' : 'text-muted-foreground'}`}>
            {name} ({formatFileSize(size)})
          </p>
        </div>
      );
    }

    return (
      <div className="mt-2">
        <a href={currentUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={currentUrl}
            alt={name}
            className="max-w-[300px] max-h-[200px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onError={handleImageError}
          />
        </a>
        <p className={`text-xs mt-1 ${isOwn ? 'opacity-70' : 'text-muted-foreground'}`}>
          {name} ({formatFileSize(size)})
        </p>
      </div>
    );
  }

  return (
    <div className={`mt-2 flex items-center gap-2 p-2 rounded-lg ${isOwn ? 'bg-primary-foreground/10' : 'bg-background/50'}`}>
      <FileIcon className="h-8 w-8 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className={`text-xs ${isOwn ? 'opacity-70' : 'text-muted-foreground'}`}>
          {formatFileSize(size)}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 flex-shrink-0"
        asChild
      >
        <a href={url} download={name} target="_blank" rel="noopener noreferrer">
          <Download className="h-4 w-4" />
        </a>
      </Button>
    </div>
  );
}

interface AttachmentPreviewProps {
  file: File;
  onRemove: () => void;
}

export function AttachmentPreview({ file, onRemove }: AttachmentPreviewProps) {
  const isImage = file.type.startsWith('image/');
  const FileIcon = getFileIcon(file.type);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Создаём и очищаем blob URL для предотвращения утечки памяти
  useEffect(() => {
    if (!isImage) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, isImage]);

  return (
    <div className="relative inline-flex items-center gap-2 p-2 bg-muted rounded-lg max-w-[200px]">
      {isImage && previewUrl ? (
        <img
          src={previewUrl}
          alt={file.name}
          className="w-12 h-12 rounded object-cover"
        />
      ) : (
        <FileIcon className="h-8 w-8 text-muted-foreground" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
      </div>
      <button
        onClick={onRemove}
        className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center hover:bg-destructive/90"
      >
        ×
      </button>
    </div>
  );
}
