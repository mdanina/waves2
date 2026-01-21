import { useState } from 'react';
import { useAdminPayments } from '@/hooks/admin/useAdminPayments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Loader2, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function PaymentsManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: payments, isLoading } = useAdminPayments();

  const filteredPayments = payments?.filter((payment) => {
    const matchesSearch =
      payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.external_payment_id?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalRevenue = payments
    ?.filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

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
        <h1 className="text-3xl font-bold">Управление платежами</h1>
        <p className="text-muted-foreground mt-1">
          Всего платежей: {payments?.length || 0} | Общая выручка: {totalRevenue.toLocaleString()} ₽
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
              placeholder="Поиск по ID, email или внешнему ID..."
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
              <SelectItem value="pending">Ожидает</SelectItem>
              <SelectItem value="processing">Обрабатывается</SelectItem>
              <SelectItem value="completed">Завершено</SelectItem>
              <SelectItem value="failed">Неудачно</SelectItem>
              <SelectItem value="cancelled">Отменено</SelectItem>
              <SelectItem value="refunded">Возврат</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список платежей</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Пользователь</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Метод оплаты</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Внешний ID</TableHead>
                <TableHead>Дата создания</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments?.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-mono text-xs">
                    {payment.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>{payment.user?.email || '—'}</TableCell>
                  <TableCell className="font-medium">
                    {Number(payment.amount || 0).toLocaleString()} {payment.currency}
                  </TableCell>
                  <TableCell>{payment.payment_method || '—'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        payment.status === 'completed'
                          ? 'default'
                          : payment.status === 'failed' || payment.status === 'cancelled'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {payment.status === 'pending'
                        ? 'Ожидает'
                        : payment.status === 'processing'
                        ? 'Обрабатывается'
                        : payment.status === 'completed'
                        ? 'Завершено'
                        : payment.status === 'failed'
                        ? 'Неудачно'
                        : payment.status === 'cancelled'
                        ? 'Отменено'
                        : 'Возврат'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {payment.external_payment_id || '—'}
                  </TableCell>
                  <TableCell>
                    {format(new Date(payment.created_at), 'dd.MM.yyyy HH:mm')}
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

