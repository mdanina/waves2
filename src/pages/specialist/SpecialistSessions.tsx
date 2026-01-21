/**
 * Страница списка сессий специалиста
 * С реальной загрузкой данных из appointments
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Search,
  Video,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  Filter,
  Brain,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSpecialistAuth } from '@/contexts/SpecialistAuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  getClientName,
  getClientInitials,
  formatDateTime,
  formatDuration,
  getAppointmentStatusConfig,
} from '@/lib/client-utils';

const PAGE_SIZE = 20;

type SessionStatus = 'payment_pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

interface AppointmentWithDetails {
  id: string;
  user_id: string;
  scheduled_at: string;
  status: SessionStatus;
  notes: string | null;
  transcript: string | null;
  transcript_status: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  appointment_type: {
    name: string;
    duration_minutes: number;
  } | null;
  profile: {
    first_name: string;
    last_name: string | null;
  } | null;
  client_user: {
    email: string;
    phone: string | null;
  } | null;
  recordings_count?: number;
  notes_count?: number;
  clinical_notes_count?: number;
}

export default function SpecialistSessions() {
  const { specialistUser } = useSpecialistAuth();
  const specialist = specialistUser?.specialist;
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SessionStatus | 'all'>('all');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  useEffect(() => {
    if (!specialist) return;

    let cancelled = false;

    const loadAppointments = async () => {
      try {
        setIsLoading(true);

        // Вычисляем диапазон для пагинации
        const from = (currentPage - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, error, count } = await supabase
          .from('appointments')
          .select(`
            id,
            user_id,
            scheduled_at,
            status,
            notes,
            transcript,
            transcript_status,
            started_at,
            ended_at,
            duration_seconds,
            appointment_type:appointment_types (name, duration_minutes),
            profile:profiles (first_name, last_name),
            client_user:users!appointments_user_id_fkey (email, phone)
          `, { count: 'exact' })
          .eq('specialist_id', specialist.id)
          .order('scheduled_at', { ascending: false })
          .range(from, to);

        if (cancelled) return;
        if (error) throw error;

        setTotalCount(count || 0);

        const appointments = data || [];

        // Batch-запрос для получения счетчиков контента (устраняет N+1)
        let appointmentsWithCounts: AppointmentWithDetails[];

        if (appointments.length > 0) {
          try {
            const appointmentIds = appointments.map(apt => apt.id);
            const { data: countsData, error: countsError } = await supabase
              .rpc('get_appointments_content_counts', { p_appointment_ids: appointmentIds });

            if (cancelled) return;

            if (countsError) {
              // Функция может не существовать - используем нулевые счетчики
              console.warn('Batch counts function not available:', countsError.message);
              appointmentsWithCounts = appointments.map(apt => ({
                ...apt,
                recordings_count: 0,
                notes_count: 0,
                clinical_notes_count: 0,
              }));
            } else {
              // Создаём Map для быстрого поиска O(1)
              const countsMap = new Map(
                (countsData || []).map((c: any) => [c.appointment_id, c])
              );

              appointmentsWithCounts = appointments.map(apt => {
                const counts = countsMap.get(apt.id);
                return {
                  ...apt,
                  recordings_count: counts?.recordings_count || 0,
                  notes_count: counts?.notes_count || 0,
                  clinical_notes_count: counts?.clinical_notes_count || 0,
                };
              });
            }
          } catch {
            if (cancelled) return;
            // Fallback: используем нулевые счетчики
            appointmentsWithCounts = appointments.map(apt => ({
              ...apt,
              recordings_count: 0,
              notes_count: 0,
              clinical_notes_count: 0,
            }));
          }
        } else {
          appointmentsWithCounts = [];
        }

        if (cancelled) return;
        setAppointments(appointmentsWithCounts as AppointmentWithDetails[]);
      } catch (err) {
        if (cancelled) return;
        console.error('Error loading appointments:', err);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить консультации',
          variant: 'destructive',
        });
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadAppointments();
    return () => { cancelled = true; };
  }, [specialist, currentPage, toast]);

  // Сбрасываем страницу при смене фильтров
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, statusFilter, searchQuery]);

  // Фильтрация
  const filteredAppointments = appointments.filter((apt) => {
    const clientName = apt.profile
      ? `${apt.profile.first_name} ${apt.profile.last_name || ''}`
      : apt.client_user?.email || '';

    const matchesSearch =
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.client_user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.client_user?.phone?.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;

    const now = new Date();
    const aptDate = new Date(apt.scheduled_at);

    if (activeTab === 'upcoming') {
      return matchesSearch && matchesStatus && aptDate >= now && apt.status === 'scheduled';
    } else if (activeTab === 'past') {
      return matchesSearch && matchesStatus && (aptDate < now || apt.status === 'completed');
    } else {
      return matchesSearch && matchesStatus;
    }
  });

  const renderStatusBadge = (status: SessionStatus) => {
    const config = getAppointmentStatusConfig(status);
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // Статистика
  const stats = {
    upcoming: appointments.filter(a => a.status === 'scheduled' && new Date(a.scheduled_at) >= new Date()).length,
    completed: appointments.filter(a => a.status === 'completed').length,
    total: appointments.length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Сессии</h1>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-10 w-full" />
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Сессии</h1>
          <p className="text-muted-foreground">
            История и управление консультациями
          </p>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Предстоящие</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcoming}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Проведено</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего сессий</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Табы и фильтры */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <TabsList>
                <TabsTrigger value="upcoming">
                  Предстоящие
                  {stats.upcoming > 0 && (
                    <Badge variant="secondary" className="ml-2">{stats.upcoming}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="past">Прошедшие</TabsTrigger>
                <TabsTrigger value="all">Все</TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-4">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по клиенту..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="payment_pending">Ожидает оплаты</SelectItem>
                    <SelectItem value="scheduled">Запланировано</SelectItem>
                    <SelectItem value="in_progress">Идёт</SelectItem>
                    <SelectItem value="completed">Завершено</SelectItem>
                    <SelectItem value="cancelled">Отменено</SelectItem>
                    <SelectItem value="no_show">Не явился</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value={activeTab} className="mt-6">
              {appointments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Video className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Пока нет сессий</p>
                  <p className="text-sm mt-1">
                    Сессии появятся когда координатор назначит вам клиентов
                  </p>
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Сессии не найдены по заданным фильтрам</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Клиент</TableHead>
                      <TableHead>Дата и время</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Длительность</TableHead>
                      <TableHead>Материалы</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.map((apt) => {
                      const { date, time } = formatDateTime(apt.scheduled_at);
                      const hasContent = (apt.recordings_count || 0) > 0 ||
                                        (apt.notes_count || 0) > 0 ||
                                        (apt.clinical_notes_count || 0) > 0 ||
                                        !!apt.transcript;

                      return (
                        <TableRow key={apt.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>
                                  {getClientInitials(apt.profile, apt.client_user?.email)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{getClientName(apt.profile, apt.client_user?.email)}</p>
                                {apt.client_user?.phone && (
                                  <p className="text-sm text-muted-foreground">
                                    {apt.client_user.phone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{date}</p>
                                <p className="text-sm text-muted-foreground">{time}</p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className="text-sm">{apt.appointment_type?.name || '—'}</span>
                          </TableCell>

                          <TableCell>{renderStatusBadge(apt.status)}</TableCell>

                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {apt.duration_seconds
                                  ? formatDuration(apt.duration_seconds)
                                  : apt.appointment_type?.duration_minutes
                                    ? `${apt.appointment_type.duration_minutes} мин`
                                    : '—'}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              {apt.transcript && (
                                <Badge variant="outline" className="text-xs">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Транскрипт
                                </Badge>
                              )}
                              {(apt.clinical_notes_count || 0) > 0 && (
                                <Badge variant="outline" className="text-xs text-purple-600 border-purple-200">
                                  <Brain className="h-3 w-3 mr-1" />
                                  AI-заметки
                                </Badge>
                              )}
                              {!hasContent && (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/specialist/sessions/${apt.id}`}>
                                <Brain className="mr-2 h-4 w-4" />
                                Анализ
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              {/* Пагинация */}
              {totalPages > 1 && filteredAppointments.length > 0 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Показано {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} из {totalCount}
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>

                      {/* Первая страница */}
                      {currentPage > 2 && (
                        <PaginationItem>
                          <PaginationLink onClick={() => setCurrentPage(1)} className="cursor-pointer">
                            1
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      {/* Текущая и соседние страницы */}
                      {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                        const page = Math.max(1, Math.min(currentPage - 1 + i, totalPages - 2 + i));
                        if (page < 1 || page > totalPages) return null;
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              isActive={page === currentPage}
                              onClick={() => setCurrentPage(page)}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      {/* Последняя страница */}
                      {currentPage < totalPages - 1 && totalPages > 3 && (
                        <PaginationItem>
                          <PaginationLink onClick={() => setCurrentPage(totalPages)} className="cursor-pointer">
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>

      {/* Подсказка */}
      <Card className="bg-lavender-pale border-lavender">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-lavender-light rounded-lg">
              <Brain className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">AI-анализ сессий</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Нажмите "Анализ" чтобы открыть 2-колоночный интерфейс для работы с транскриптом,
                заметками и создания AI-генерированных клинических заметок.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
