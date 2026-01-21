import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminAppointments, useUpdateAppointment } from '@/hooks/admin/useAdminAppointments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Calendar, Video } from 'lucide-react';
import { format } from 'date-fns';

export default function AppointmentsManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);

  const highlightedId = searchParams.get('id');

  const { data: appointments, isLoading } = useAdminAppointments();
  const updateAppointment = useUpdateAppointment();

  // Скролл к выделенной строке при загрузке
  useEffect(() => {
    if (highlightedId && appointments && highlightedRowRef.current) {
      highlightedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Убираем параметр из URL через 3 секунды
      const timer = setTimeout(() => {
        setSearchParams({}, { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightedId, appointments, setSearchParams]);

  const filteredAppointments = appointments?.filter((appointment) => {
    const matchesSearch =
      appointment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.profile?.first_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateAppointment.mutateAsync({
      id,
      updates: { status: newStatus as any },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Управление консультациями</h1>
        <p className="text-muted-foreground mt-1">
          Всего консультаций: {appointments?.length || 0}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по email или имени..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="payment_pending">Ожидает оплаты</SelectItem>
              <SelectItem value="scheduled">Запланировано</SelectItem>
              <SelectItem value="in_progress">В процессе</SelectItem>
              <SelectItem value="completed">Завершено</SelectItem>
              <SelectItem value="cancelled">Отменено</SelectItem>
              <SelectItem value="no_show">No-show</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список консультаций</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата и время</TableHead>
                <TableHead>Тип консультации</TableHead>
                <TableHead>Пользователь</TableHead>
                <TableHead>Профиль</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Видео</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments?.map((appointment) => (
                <TableRow
                  key={appointment.id}
                  ref={appointment.id === highlightedId ? highlightedRowRef : undefined}
                  className={appointment.id === highlightedId ? 'bg-primary/10 animate-pulse' : ''}
                >
                  <TableCell>
                    {format(new Date(appointment.scheduled_at), 'dd.MM.yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    {appointment.appointment_type?.name || '—'}
                    {appointment.appointment_type && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({appointment.appointment_type.duration_minutes} мин,{' '}
                        {appointment.appointment_type.price} ₽)
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{appointment.user?.email || '—'}</TableCell>
                  <TableCell>
                    {appointment.profile
                      ? `${appointment.profile.first_name} ${appointment.profile.last_name || ''}`.trim()
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        appointment.status === 'completed'
                          ? 'default'
                          : appointment.status === 'cancelled' || appointment.status === 'no_show'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className={appointment.status === 'payment_pending' ? 'bg-amber-100 text-amber-800 border-amber-300' : ''}
                    >
                      {appointment.status === 'payment_pending'
                        ? 'Ожидает оплаты'
                        : appointment.status === 'scheduled'
                        ? 'Запланировано'
                        : appointment.status === 'in_progress'
                        ? 'В процессе'
                        : appointment.status === 'completed'
                        ? 'Завершено'
                        : appointment.status === 'cancelled'
                        ? 'Отменено'
                        : 'No-show'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {appointment.video_room_url && appointment.status !== 'completed' && appointment.status !== 'cancelled' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <a href={appointment.video_room_url} target="_blank" rel="noopener noreferrer">
                          <Video className="h-4 w-4 mr-1" />
                          Войти
                        </a>
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={appointment.status}
                      onValueChange={(value) => handleStatusChange(appointment.id, value)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="payment_pending">Ожидает оплаты</SelectItem>
                        <SelectItem value="scheduled">Запланировано</SelectItem>
                        <SelectItem value="in_progress">В процессе</SelectItem>
                        <SelectItem value="completed">Завершено</SelectItem>
                        <SelectItem value="cancelled">Отменено</SelectItem>
                        <SelectItem value="no_show">No-show</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

