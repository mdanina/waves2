import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Bell,
  Send,
  Settings,
  BarChart3,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  UserCheck,
  Edit,
  Save,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Типы уведомлений и их описания
const notificationTypes = {
  // =====================================================
  // Для клиентов - Push
  // =====================================================
  new_appointment: {
    label: 'Запись подтверждена',
    description: 'Когда клиент записывается на консультацию',
    audience: 'clients',
    channel: 'push',
  },
  appointment_cancelled: {
    label: 'Консультация отменена',
    description: 'Когда консультация отменяется',
    audience: 'clients',
    channel: 'push',
  },
  specialist_assigned: {
    label: 'Назначен специалист',
    description: 'Первое назначение или переназначение специалиста клиенту',
    audience: 'clients',
    channel: 'push',
  },
  session_reminder_36h: {
    label: 'Напоминание за 36 часов',
    description: 'За 36 часов до сессии',
    audience: 'clients',
    channel: 'push',
  },
  session_reminder_1h: {
    label: 'Напоминание за 1 час',
    description: 'За 1 час до сессии',
    audience: 'clients',
    channel: 'push',
  },
  specialist_waiting: {
    label: 'Специалист ждёт в комнате',
    description: 'Когда специалист зашёл в видеокомнату',
    audience: 'clients',
    channel: 'push',
  },
  payment_success: {
    label: 'Успешная оплата',
    description: 'После успешной оплаты',
    audience: 'clients',
    channel: 'push',
  },
  first_session_memo: {
    label: 'Памятка перед первой сессией',
    description: 'После оплаты первой сессии',
    audience: 'clients',
    channel: 'push',
  },

  // =====================================================
  // Для клиентов - Telegram (те же события, другой канал)
  // =====================================================
  tg_client_new_appointment: {
    label: 'Запись подтверждена',
    description: 'Telegram: новая запись',
    audience: 'clients',
    channel: 'telegram',
  },
  tg_client_cancelled: {
    label: 'Консультация отменена',
    description: 'Telegram: отмена записи',
    audience: 'clients',
    channel: 'telegram',
  },
  tg_client_specialist_assigned: {
    label: 'Назначен специалист',
    description: 'Telegram: первое назначение или переназначение',
    audience: 'clients',
    channel: 'telegram',
  },
  tg_client_reminder_24h: {
    label: 'Напоминание за 24 часа',
    description: 'Telegram: напоминание за день',
    audience: 'clients',
    channel: 'telegram',
  },
  tg_client_reminder_1h: {
    label: 'Напоминание за 1 час',
    description: 'Telegram: напоминание с ссылкой',
    audience: 'clients',
    channel: 'telegram',
  },
  tg_client_specialist_waiting: {
    label: 'Специалист ждёт в комнате',
    description: 'Telegram: специалист в комнате',
    audience: 'clients',
    channel: 'telegram',
  },
  tg_client_payment_success: {
    label: 'Успешная оплата',
    description: 'Telegram: оплата прошла',
    audience: 'clients',
    channel: 'telegram',
  },
  tg_client_first_session: {
    label: 'Памятка перед первой сессией',
    description: 'Telegram: подготовка к сессии',
    audience: 'clients',
    channel: 'telegram',
  },

  // =====================================================
  // Для специалистов
  // =====================================================
  specialist_new_appointment: {
    label: 'Новая запись',
    description: 'Когда клиент записывается',
    audience: 'specialists',
    channel: 'push',
  },
  specialist_cancelled_appointment: {
    label: 'Отмена записи',
    description: 'Когда клиент отменяет запись',
    audience: 'specialists',
    channel: 'push',
  },
  appointment_reminder: {
    label: 'Напоминание о консультации',
    description: 'Напоминание специалисту',
    audience: 'specialists',
    channel: 'push',
  },
  new_client: {
    label: 'Новый клиент',
    description: 'Когда назначен новый клиент',
    audience: 'specialists',
    channel: 'push',
  },
  client_waiting: {
    label: 'Клиент ждёт в комнате',
    description: 'Когда клиент зашёл в комнату',
    audience: 'specialists',
    channel: 'push',
  },

  // =====================================================
  // Общие
  // =====================================================
  new_message: {
    label: 'Новое сообщение',
    description: 'При получении нового сообщения',
    audience: 'all',
    channel: 'push',
  },

  // =====================================================
  // Реанимация - Email
  // =====================================================
  email_onboarding_not_started: {
    label: 'Не начал онбординг',
    description: 'Email через 3 часа после регистрации',
    audience: 'reactivation',
    channel: 'email',
  },
  email_onboarding_not_completed: {
    label: 'Не закончил онбординг',
    description: 'Email через 3 часа после начала',
    audience: 'reactivation',
    channel: 'email',
  },
  email_checkup_not_started: {
    label: 'Не начал чекап',
    description: 'Email через 1 день после онбординга',
    audience: 'reactivation',
    channel: 'email',
  },
  email_checkup_not_completed: {
    label: 'Не закончил чекап',
    description: 'Email через 1 день после начала чекапа',
    audience: 'reactivation',
    channel: 'email',
  },
  email_free_session_not_booked: {
    label: 'Не записался на бесплатную',
    description: 'Email через 2 дня после чекапа',
    audience: 'reactivation',
    channel: 'email',
  },
  email_inactive_after_free_session: {
    label: 'Неактивен после сессии',
    description: 'Email через 7 дней после бесплатной',
    audience: 'reactivation',
    channel: 'email',
  },

  // =====================================================
  // Реанимация - Push
  // =====================================================
  reactivation_onboarding: {
    label: 'Завершите регистрацию',
    description: 'Push для незавершённого онбординга',
    audience: 'reactivation',
    channel: 'push',
  },
  reactivation_checkup: {
    label: 'Пройдите чекап',
    description: 'Push для непройденного чекапа',
    audience: 'reactivation',
    channel: 'push',
  },
  reactivation_booking: {
    label: 'Запишитесь на консультацию',
    description: 'Push для незаписавшихся',
    audience: 'reactivation',
    channel: 'push',
  },
  reactivation_return: {
    label: 'Мы скучаем!',
    description: 'Push для неактивных клиентов',
    audience: 'reactivation',
    channel: 'push',
  },

  // =====================================================
  // Реанимация - Telegram
  // =====================================================
  tg_reactivation_onboarding: {
    label: 'Завершите регистрацию',
    description: 'Telegram для незавершённого онбординга',
    audience: 'reactivation',
    channel: 'telegram',
  },
  tg_reactivation_checkup: {
    label: 'Пройдите чекап',
    description: 'Telegram для непройденного чекапа',
    audience: 'reactivation',
    channel: 'telegram',
  },
  tg_reactivation_booking: {
    label: 'Запишитесь на консультацию',
    description: 'Telegram для незаписавшихся',
    audience: 'reactivation',
    channel: 'telegram',
  },
  tg_reactivation_return: {
    label: 'Мы скучаем!',
    description: 'Telegram для неактивных клиентов',
    audience: 'reactivation',
    channel: 'telegram',
  },
} as const;

type NotificationType = keyof typeof notificationTypes;

interface NotificationTemplate {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  is_active: boolean;
  updated_at: string;
}

interface PushLog {
  id: string;
  user_id: string;
  title: string;
  body: string;
  notification_type: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  user_email?: string;
}

// Компонент отправки маркетинговых уведомлений
function MarketingSendTab() {
  const [audience, setAudience] = useState<'all' | 'clients' | 'specialists'>('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);

  // Получаем количество подписчиков
  const { data: subscriberCounts } = useQuery({
    queryKey: ['push-subscriber-counts'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_push_subscriber_counts');
      if (error) throw error;
      return data as { total: number; clients: number; specialists: number };
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('send_marketing_push', {
        p_audience: audience,
        p_title: title,
        p_body: body,
        p_target_url: targetUrl || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Уведомление отправлено ${data} пользователям`);
      setTitle('');
      setBody('');
      setTargetUrl('');
      setConfirmDialog(false);
    },
    onError: (error) => {
      toast.error('Ошибка отправки: ' + (error as Error).message);
    },
  });

  const handleSend = () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Заполните заголовок и текст');
      return;
    }
    setConfirmDialog(true);
  };

  const getAudienceCount = () => {
    if (!subscriberCounts) return '...';
    switch (audience) {
      case 'all':
        return subscriberCounts.total;
      case 'clients':
        return subscriberCounts.clients;
      case 'specialists':
        return subscriberCounts.specialists;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Отправить маркетинговое уведомление
          </CardTitle>
          <CardDescription>
            Отправьте push-уведомление выбранной аудитории
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Аудитория</Label>
            <Select value={audience} onValueChange={(v) => setAudience(v as typeof audience)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Все пользователи ({subscriberCounts?.total ?? '...'})
                  </div>
                </SelectItem>
                <SelectItem value="clients">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Только клиенты ({subscriberCounts?.clients ?? '...'})
                  </div>
                </SelectItem>
                <SelectItem value="specialists">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Только специалисты ({subscriberCounts?.specialists ?? '...'})
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Заголовок</Label>
            <Input
              id="title"
              placeholder="Заголовок уведомления"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">{title.length}/100</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Текст</Label>
            <Textarea
              id="body"
              placeholder="Текст уведомления"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">{body.length}/500</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetUrl">URL для перехода (опционально)</Label>
            <Input
              id="targetUrl"
              placeholder="/blog/new-article или https://..."
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
            />
          </div>

          <Button onClick={handleSend} disabled={!title.trim() || !body.trim()}>
            <Send className="h-4 w-4 mr-2" />
            Отправить {getAudienceCount()} пользователям
          </Button>
        </CardContent>
      </Card>

      {/* Диалог подтверждения */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтвердите отправку</DialogTitle>
            <DialogDescription>
              Уведомление будет отправлено {getAudienceCount()} пользователям.
              Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <div className="bg-muted p-3 rounded-lg">
              <p className="font-medium">{title}</p>
              <p className="text-sm text-muted-foreground mt-1">{body}</p>
              {targetUrl && (
                <p className="text-xs text-blue-600 mt-2">{targetUrl}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => sendMutation.mutate()}
              disabled={sendMutation.isPending}
            >
              {sendMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Отправить
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Компонент шаблонов уведомлений
function TemplatesTab() {
  const queryClient = useQueryClient();
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');

  const { data: templates, isLoading } = useQuery({
    queryKey: ['notification-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('type');
      if (error) throw error;
      return data as NotificationTemplate[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, title, body }: { id: string; title: string; body: string }) => {
      const { error } = await supabase
        .from('notification_templates')
        .update({ title, body, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast.success('Шаблон обновлён');
      setEditingTemplate(null);
    },
    onError: (error) => {
      toast.error('Ошибка: ' + (error as Error).message);
    },
  });

  const handleEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setEditTitle(template.title);
    setEditBody(template.body);
  };

  const handleSave = () => {
    if (!editingTemplate) return;
    updateMutation.mutate({
      id: editingTemplate.id,
      title: editTitle,
      body: editBody,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Группируем шаблоны по аудитории и каналу
  const clientPushTemplates = templates?.filter(
    (t) => {
      const info = notificationTypes[t.type as NotificationType];
      return info?.audience === 'clients' && info?.channel === 'push';
    }
  );
  const clientTelegramTemplates = templates?.filter(
    (t) => {
      const info = notificationTypes[t.type as NotificationType];
      return info?.audience === 'clients' && info?.channel === 'telegram';
    }
  );
  const specialistTemplates = templates?.filter(
    (t) => notificationTypes[t.type as NotificationType]?.audience === 'specialists'
  );
  const commonTemplates = templates?.filter(
    (t) => notificationTypes[t.type as NotificationType]?.audience === 'all'
  );
  // Реанимация по каналам
  const reactivationEmailTemplates = templates?.filter(
    (t) => {
      const info = notificationTypes[t.type as NotificationType];
      return info?.audience === 'reactivation' && info?.channel === 'email';
    }
  );
  const reactivationPushTemplates = templates?.filter(
    (t) => {
      const info = notificationTypes[t.type as NotificationType];
      return info?.audience === 'reactivation' && info?.channel === 'push';
    }
  );
  const reactivationTelegramTemplates = templates?.filter(
    (t) => {
      const info = notificationTypes[t.type as NotificationType];
      return info?.audience === 'reactivation' && info?.channel === 'telegram';
    }
  );

  const renderTemplateGroup = (title: string, items: NotificationTemplate[] | undefined, channel?: 'push' | 'telegram' | 'email') => {
    if (!items?.length) return null;
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {title}
            {channel === 'telegram' && (
              <Badge variant="outline" className="text-[#0088cc] border-[#0088cc]">Telegram</Badge>
            )}
            {channel === 'push' && (
              <Badge variant="outline">Push</Badge>
            )}
            {channel === 'email' && (
              <Badge variant="outline" className="text-orange-600 border-orange-600">Email</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Тип</TableHead>
                <TableHead>Заголовок</TableHead>
                <TableHead>Текст</TableHead>
                <TableHead className="w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((template) => {
                const typeInfo = notificationTypes[template.type as NotificationType];
                return (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{typeInfo?.label || template.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {typeInfo?.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {template.title}
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="truncate" title={template.body}>
                        {template.body.replace(/<[^>]*>/g, '').substring(0, 100)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Шаблоны уведомлений</h3>
          <p className="text-sm text-muted-foreground">
            Редактируйте тексты автоматических уведомлений
          </p>
        </div>
      </div>

      {renderTemplateGroup('Push-уведомления для клиентов', clientPushTemplates, 'push')}
      {renderTemplateGroup('Telegram-уведомления для клиентов', clientTelegramTemplates, 'telegram')}
      {renderTemplateGroup('Уведомления для специалистов', specialistTemplates, 'push')}
      {renderTemplateGroup('Общие уведомления', commonTemplates, 'push')}

      {/* Реанимация */}
      {(reactivationEmailTemplates?.length || reactivationPushTemplates?.length || reactivationTelegramTemplates?.length) && (
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-medium mb-4">Реанимация (автоматические напоминания)</h3>
          {renderTemplateGroup('Email-уведомления', reactivationEmailTemplates, 'email')}
          {renderTemplateGroup('Push-уведомления', reactivationPushTemplates, 'push')}
          {renderTemplateGroup('Telegram-уведомления', reactivationTelegramTemplates, 'telegram')}
        </div>
      )}

      {!templates?.length && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Шаблоны ещё не созданы</p>
            <p className="text-sm mt-2">
              Они будут автоматически созданы при первой отправке уведомлений
            </p>
          </CardContent>
        </Card>
      )}

      {/* Диалог редактирования */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Редактировать шаблон</DialogTitle>
            <DialogDescription>
              {editingTemplate &&
                notificationTypes[editingTemplate.type as NotificationType]?.label}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {(() => {
              const isTelegram = editingTemplate?.type.startsWith('tg_');
              const isEmail = editingTemplate?.type.startsWith('email_');
              const isReactivation = editingTemplate?.type.includes('reactivation') || isEmail;
              return (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Заголовок</Label>
                    <Input
                      id="edit-title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Заголовок уведомления"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-body">Текст</Label>
                    <Textarea
                      id="edit-body"
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      placeholder="Текст уведомления"
                      rows={isTelegram || isEmail ? 10 : 4}
                      className={(isTelegram || isEmail) ? 'font-mono text-sm' : ''}
                    />
                    <p className="text-xs text-muted-foreground">
                      {isEmail ? (
                        <>
                          Переменные: {'{link}'}, {'{email}'}
                          <br />
                          Используйте \n для переноса строки
                        </>
                      ) : isTelegram ? (
                        <>
                          Переменные: {isReactivation ? '{link}' : '{appointment_type}, {date}, {time}, {specialist_name}, {video_link}'}
                          <br />
                          HTML теги: {'<b>жирный</b>'}, {'<a href="...">ссылка</a>'}
                        </>
                      ) : (
                        <>Переменные: {'{client_name}'}, {'{specialist_name}'}, {'{date}'}, {'{time}'}</>
                      )}
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Компонент статистики
function StatsTab() {
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['push-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_push_notification_stats');
      if (error) throw error;
      return data as {
        total_sent: number;
        successful: number;
        failed: number;
        pending: number;
        today_sent: number;
        week_sent: number;
      };
    },
  });

  const { data: recentLogs, isLoading: logsLoading, refetch } = useQuery({
    queryKey: ['push-logs-recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('push_notification_logs')
        .select(`
          *,
          user:users(email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data.map((log: any) => ({
        ...log,
        user_email: log.user?.email,
      })) as PushLog[];
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="bg-success">Доставлено</Badge>;
      case 'failed':
        return <Badge variant="destructive">Ошибка</Badge>;
      case 'pending':
        return <Badge variant="secondary">В очереди</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-lavender-light rounded-lg">
                <Bell className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total_sent ?? '...'}</p>
                <p className="text-sm text-muted-foreground">Всего отправлено</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-sage-light rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.successful ?? '...'}</p>
                <p className="text-sm text-muted-foreground">Успешно</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.failed ?? '...'}</p>
                <p className="text-sm text-muted-foreground">Ошибок</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-honey-light rounded-lg">
                <Clock className="h-5 w-5 text-honey-dark" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.pending ?? '...'}</p>
                <p className="text-sm text-muted-foreground">В очереди</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Период */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Сегодня</p>
            <p className="text-xl font-bold">{stats?.today_sent ?? '...'} уведомлений</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">За неделю</p>
            <p className="text-xl font-bold">{stats?.week_sent ?? '...'} уведомлений</p>
          </CardContent>
        </Card>
      </div>

      {/* Логи */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Последние уведомления</CardTitle>
            <CardDescription>История отправленных push-уведомлений</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить
          </Button>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !recentLogs?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Нет отправленных уведомлений</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Заголовок</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {log.user_email || log.user_id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {notificationTypes[log.notification_type as NotificationType]?.label ||
                          log.notification_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {log.title}
                    </TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Главный компонент
export default function PushNotificationsManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Push-уведомления</h1>
        <p className="text-muted-foreground">
          Управление push-уведомлениями для клиентов и специалистов
        </p>
      </div>

      <Tabs defaultValue="send" className="space-y-6">
        <TabsList>
          <TabsTrigger value="send" className="gap-2">
            <Send className="h-4 w-4" />
            Отправка
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Settings className="h-4 w-4" />
            Шаблоны
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Статистика
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send">
          <MarketingSendTab />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesTab />
        </TabsContent>

        <TabsContent value="stats">
          <StatsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
