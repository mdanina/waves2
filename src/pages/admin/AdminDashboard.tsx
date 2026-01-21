import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminMetrics } from '@/hooks/admin/useAdminMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Users, FileText, Calendar, CreditCard, TrendingUp, Package } from 'lucide-react';

type Period = 'day' | 'week' | 'month' | 'all';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('month');

  // Мемоизируем periodDates, чтобы избежать постоянных перезапросов
  const periodDates = useMemo((): { startDate: string; endDate: string } | undefined => {
    if (period === 'all') return undefined;

    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(endDate.getDate() - 30);
        break;
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }, [period]); // Пересчитываем только при изменении period

  const { data: metrics, isLoading, error } = useAdminMetrics(periodDates);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive">
        Ошибка загрузки метрик. Попробуйте обновить страницу.
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Дэшборд</h1>
          <p className="text-muted-foreground mt-1">
            Обзор метрик продукта
          </p>
        </div>
        <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Последний день</SelectItem>
            <SelectItem value="week">Последняя неделя</SelectItem>
            <SelectItem value="month">Последний месяц</SelectItem>
            <SelectItem value="all">Все время</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Пользователи */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Пользователи</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate('/admin/users')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.users.total}</div>
              <p className="text-xs text-muted-foreground">
                Новых за период: {metrics.users.newThisPeriod}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активных пользователей</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.users.activeThisPeriod}</div>
              <p className="text-xs text-muted-foreground">
                За выбранный период
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Согласие на маркетинг</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.users.marketingConsent}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.users.total > 0
                  ? Math.round((metrics.users.marketingConsent / metrics.users.total) * 100)
                  : 0}
                % от всех пользователей
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Средний размер семьи</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.profiles.averageFamilySize}</div>
              <p className="text-xs text-muted-foreground">
                Всего профилей: {metrics.profiles.total}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Оценки */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Оценки</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate('/admin/assessments')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего оценок</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.assessments.total}</div>
              <p className="text-xs text-muted-foreground">
                Завершено: {metrics.assessments.completed}
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate('/admin/assessments')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Конверсия</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.assessments.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                Брошено: {metrics.assessments.abandoned}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Среднее время</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.assessments.averageCompletionTime
                  ? `${Math.round(metrics.assessments.averageCompletionTime)} мин`
                  : '—'}
              </div>
              <p className="text-xs text-muted-foreground">
                Прохождения оценки
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Консультации */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Консультации</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate('/admin/appointments')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Запланировано</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.appointments.scheduled}</div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate('/admin/appointments')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Завершено</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.appointments.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Отменено</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.appointments.cancelled}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">No-show</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.appointments.noShow}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">В процессе</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.appointments.inProgress}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Платежи */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Платежи</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate('/admin/payments')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Общая выручка</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.payments.totalRevenue.toLocaleString()} ₽</div>
              <p className="text-xs text-muted-foreground">
                За период: {metrics.payments.revenueThisPeriod.toLocaleString()} ₽
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate('/admin/payments')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Успешных платежей</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.payments.successful}</div>
              <p className="text-xs text-muted-foreground">
                Неудачных: {metrics.payments.failed}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Средний чек</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.payments.averageCheck.toLocaleString()} ₽</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Пакеты</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.packages.sold}</div>
              <p className="text-xs text-muted-foreground">
                Использовано сессий: {metrics.packages.sessionsUsed}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

