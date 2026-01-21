import { useState, useEffect } from 'react';
import { Calendar, Copy, Check, RefreshCw, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  generateCalendarFeedToken,
  revokeCalendarFeedToken,
  getExistingCalendarToken,
  buildFeedUrl,
} from '@/lib/calendar-feed';

interface CalendarFeedDialogProps {
  trigger?: React.ReactNode;
}

export function CalendarFeedDialog({ trigger }: CalendarFeedDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedUrl, setFeedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Загружаем существующий токен при открытии
  useEffect(() => {
    if (open) {
      loadExistingToken();
    }
  }, [open]);

  const loadExistingToken = async () => {
    setLoading(true);
    try {
      const token = await getExistingCalendarToken();
      if (token) {
        setFeedUrl(buildFeedUrl(token));
      } else {
        setFeedUrl(null);
      }
    } catch (error) {
      console.error('Ошибка загрузки токена:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const result = await generateCalendarFeedToken();
      setFeedUrl(result.feedUrl);
      toast({
        title: 'Ссылка создана',
        description: 'Скопируйте ссылку и добавьте в свой календарь',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось создать ссылку',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeLink = async () => {
    setLoading(true);
    try {
      await revokeCalendarFeedToken();
      setFeedUrl(null);
      toast({
        title: 'Ссылка отозвана',
        description: 'Старая ссылка больше не работает',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось отозвать ссылку',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!feedUrl) return;

    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      toast({
        title: 'Скопировано',
        description: 'Ссылка скопирована в буфер обмена',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось скопировать ссылку',
        variant: 'destructive',
      });
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="text-xs sm:text-sm">
      <Calendar className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">Добавить в календарь</span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Добавьте сессии себе в календарь
          </DialogTitle>
          <DialogDescription>
            Создайте ссылку и добавьте её в календарь.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Инструкции */}
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium">Google Календарь</p>
              <p className="text-muted-foreground">
                Меню «Другие календари» — «Добавить по URL»
              </p>
            </div>
            <div>
              <p className="font-medium">Apple Календарь</p>
              <p className="text-muted-foreground">
                Меню «Файл» — «Подписка на новый календарь...»
              </p>
            </div>
          </div>

          {/* Ссылка или кнопка создания */}
          {feedUrl ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={feedUrl}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  disabled={loading}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateLink}
                  disabled={loading}
                  className="flex-1"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Обновить ссылку
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRevokeLink}
                  disabled={loading}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={handleGenerateLink}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4 mr-2" />
              )}
              Создать ссылку
            </Button>
          )}

          {/* Примечание */}
          <p className="text-xs text-muted-foreground">
            Календарь будет автоматически обновляться при изменении ваших сессий.
            Не передавайте эту ссылку третьим лицам.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
