/**
 * Страница списка клиентов специалиста
 * Использует RPC функцию get_specialist_clients() для получения назначенных клиентов
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Search,
  Calendar,
  Users,
  ChevronRight,
  RefreshCw,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { subscribeToClientAssignments } from '@/lib/supabase-appointments';
import { useToast } from '@/hooks/use-toast';
import { useSpecialistAuth } from '@/contexts/SpecialistAuthContext';
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
  formatDate,
  formatRelativeDate,
  formatClientsCount,
} from '@/lib/client-utils';

const PAGE_SIZE = 20;

// Тип данных клиента из RPC функции get_specialist_clients()
interface SpecialistClient {
  assignment_id: string;
  client_user_id: string;
  client_email: string | null;
  client_phone: string | null;
  client_region: string | null;
  assignment_type: 'primary' | 'consultant' | 'temporary';
  assignment_status: string;
  assigned_at: string;
  notes: string | null;
  // Профиль, к которому привязан специалист (из assignment)
  profile_id: string | null;
  profile_first_name: string | null;
  profile_last_name: string | null;
  profile_type: string | null;
  last_appointment_at: string | null;
  next_appointment_at: string | null;
  total_appointments: number;
  completed_appointments: number;
  // Профиль клиента (родитель) - загружаем отдельно для отображения имени
  client_profile?: {
    first_name: string;
    last_name: string | null;
  };
}

export default function SpecialistClients() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { specialistUser } = useSpecialistAuth();

  const [clients, setClients] = useState<SpecialistClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Единая функция загрузки клиентов
  const loadClients = useCallback(async (isInitialLoad = false) => {
    try {
      setIsRefreshing(true);

      // Вызываем RPC функцию
      const { data: clientsData, error: clientsError } = await supabase
        .rpc('get_specialist_clients');

      if (clientsError) throw clientsError;

      if (!clientsData || clientsData.length === 0) {
        setClients([]);
        return;
      }

      // Загружаем профили клиентов (родителей) для отображения имён
      const clientUserIds = clientsData.map((c: SpecialistClient) => c.client_user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', clientUserIds)
        .eq('type', 'parent');

      // Объединяем данные
      const clientsWithProfiles = clientsData.map((client: SpecialistClient) => {
        const clientProfile = profilesData?.find(p => p.user_id === client.client_user_id);
        return {
          ...client,
          client_profile: clientProfile ? {
            first_name: clientProfile.first_name,
            last_name: clientProfile.last_name,
          } : undefined,
        };
      });

      setClients(clientsWithProfiles);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить список клиентов',
        variant: 'destructive',
      });
    } finally {
      if (isInitialLoad) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  // Загрузка при монтировании
  useEffect(() => {
    loadClients(true);
  }, [loadClients]);

  // Realtime подписка на изменения назначений клиентов
  useEffect(() => {
    const specialistId = specialistUser?.specialist?.id;
    if (!specialistId) return;

    const unsubscribe = subscribeToClientAssignments(specialistId, (event) => {
      // При любом изменении (добавление/удаление клиента) перезагружаем список
      if (event === 'INSERT' || event === 'DELETE' || event === 'UPDATE') {
        loadClients(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [specialistUser?.specialist?.id, loadClients]);

  // Функция для ручного обновления
  const handleRefresh = () => loadClients(false);

  // Сбрасываем страницу при смене поиска
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Фильтрация клиентов
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;

    const query = searchQuery.toLowerCase();
    return clients.filter((client) => {
      // Имя родителя (клиента)
      const clientName = client.client_profile
        ? `${client.client_profile.first_name} ${client.client_profile.last_name || ''}`.toLowerCase()
        : '';
      // Имя профиля (ребёнка), к которому привязан специалист
      const profileName = client.profile_first_name
        ? `${client.profile_first_name} ${client.profile_last_name || ''}`.toLowerCase()
        : '';
      return (
        clientName.includes(query) ||
        profileName.includes(query) ||
        client.client_email?.toLowerCase().includes(query) ||
        client.client_phone?.includes(query) ||
        client.client_region?.toLowerCase().includes(query)
      );
    });
  }, [clients, searchQuery]);

  // Пагинация на клиенте
  const totalPages = Math.ceil(filteredClients.length / PAGE_SIZE);
  const paginatedClients = useMemo(() => {
    const from = (currentPage - 1) * PAGE_SIZE;
    return filteredClients.slice(from, from + PAGE_SIZE);
  }, [filteredClients, currentPage]);

  // Бейдж типа назначения
  const getAssignmentBadge = (type: SpecialistClient['assignment_type']) => {
    switch (type) {
      case 'primary':
        return <Badge>Основной</Badge>;
      case 'consultant':
        return <Badge variant="secondary">Консультант</Badge>;
      case 'temporary':
        return <Badge variant="outline">Временный</Badge>;
    }
  };

  // Переход к клиенту
  const handleClientClick = (clientUserId: string) => {
    navigate(`/specialist/clients/${clientUserId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-10 w-full max-w-md" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Мои клиенты</h1>
          <p className="text-muted-foreground">
            Клиенты, назначенные вам координатором
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-sm font-medium">Всего клиентов</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-sm font-medium">Консультаций проведено</span>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.reduce((sum, c) => sum + (c.completed_appointments || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-sm font-medium">Запланировано</span>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.filter(c => c.next_appointment_at).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Поиск и таблица */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени, email или телефону..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Пока нет назначенных клиентов</p>
              <p className="text-sm mt-1">
                Координатор назначит вам клиентов после установочных встреч
              </p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Клиенты не найдены по запросу "{searchQuery}"</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead className="hidden md:table-cell">Консультации</TableHead>
                  <TableHead className="hidden lg:table-cell">Последняя встреча</TableHead>
                  <TableHead>Следующая встреча</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClients.map((client) => (
                  <TableRow
                    key={client.assignment_id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleClientClick(client.client_user_id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {getClientInitials(client.client_profile, client.client_email)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {getClientName(client.client_profile, client.client_email)}
                          </p>
                          {client.profile_first_name && (
                            <p className="text-sm text-primary">
                              {client.profile_first_name} {client.profile_last_name || ''}
                              {client.profile_type === 'child' && ' (ребёнок)'}
                              {client.profile_type === 'partner' && ' (партнёр)'}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {client.client_email || client.client_phone || ''}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getAssignmentBadge(client.assignment_type)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="font-medium">{client.completed_appointments}</span>
                      <span className="text-muted-foreground"> / {client.total_appointments}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {formatRelativeDate(client.last_appointment_at)}
                    </TableCell>
                    <TableCell>
                      {client.next_appointment_at ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4 text-primary" />
                          {formatDate(client.next_appointment_at, {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Не запланировано</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClientClick(client.client_user_id);
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Пагинация */}
          {totalPages > 1 && paginatedClients.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Показано {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filteredClients.length)} из {filteredClients.length}
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

          {/* Footer с подсчетом */}
          {clients.length > 0 && totalPages <= 1 && (
            <div className="pt-4 border-t mt-4 text-center text-sm text-muted-foreground">
              {searchQuery
                ? `Найдено: ${filteredClients.length} из ${clients.length}`
                : `Всего: ${formatClientsCount(clients.length)}`
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
