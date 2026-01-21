import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import { workFormatOptions } from '@/lib/validation/schemas';

interface SpecialistApplication {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  specialization_code: string;
  primary_method: string;
  base_education_hours: number;
  certification_hours: number;
  experience_years: number;
  total_clients_count: number | null;
  current_clients_count: number | null;
  available_capacity: number | null;
  supervision_frequency: string | null;
  therapy_frequency: string | null;
  therapy_hours: number | null;
  supervision_hours: number | null;
  work_formats: string[];
  psychiatrist_experience: boolean;
  social_links: string | null;
  additional_info: string | null;
  status: 'new' | 'reviewing' | 'approved' | 'rejected' | 'waiting_interview' | 'waiting_demo';
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ApplicationStats {
  total_count: number;
  new_count: number;
  reviewing_count: number;
  approved_count: number;
  rejected_count: number;
  waiting_interview_count: number;
  waiting_demo_count: number;
}

interface Specialization {
  code: string;
  name: string;
}

const statusLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: 'Новая', color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3" /> },
  reviewing: { label: 'На рассмотрении', color: 'bg-yellow-100 text-yellow-800', icon: <Eye className="h-3 w-3" /> },
  approved: { label: 'Одобрена', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
  rejected: { label: 'Отклонена', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
  waiting_interview: { label: 'Ожидает собеседование', color: 'bg-purple-100 text-purple-800', icon: <Clock className="h-3 w-3" /> },
  waiting_demo: { label: 'Ожидает демо-сессию', color: 'bg-indigo-100 text-indigo-800', icon: <Clock className="h-3 w-3" /> },
};

export default function SpecialistApplicationsManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;
  const statusFilter = searchParams.get('status') || 'all';

  const [applications, setApplications] = useState<SpecialistApplication[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedApplication, setSelectedApplication] = useState<SpecialistApplication | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    loadData();
  }, [page, statusFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Загружаем статистику
      const { data: statsData } = await supabase.rpc('get_specialist_applications_stats');
      if (statsData && statsData[0]) {
        setStats(statsData[0]);
      }

      // Загружаем специализации
      const { data: specData } = await supabase
        .from('specializations')
        .select('code, name')
        .eq('is_active', true);
      setSpecializations(specData || []);

      // Загружаем заявки с пагинацией и фильтром
      let query = supabase
        .from('specialist_applications')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setApplications(data || []);
      setTotal(count || 0);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Не удалось загрузить данные');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({
      page: newPage.toString(),
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    });
  };

  const handleStatusFilterChange = (value: string) => {
    setSearchParams({
      page: '1',
      ...(value !== 'all' ? { status: value } : {}),
    });
  };

  const handleViewApplication = (application: SpecialistApplication) => {
    setSelectedApplication(application);
    setAdminNotes(application.admin_notes || '');
    setNewStatus(application.status);
    setIsViewDialogOpen(true);
  };

  const handleUpdateApplication = async () => {
    if (!selectedApplication) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('specialist_applications')
        .update({
          status: newStatus,
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedApplication.id);

      if (error) throw error;

      toast.success('Заявка обновлена');
      setIsViewDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Не удалось обновить заявку');
    } finally {
      setIsUpdating(false);
    }
  };

  const getSpecializationName = (code: string) => {
    const spec = specializations.find((s) => s.code === code);
    return spec?.name || code;
  };

  const getWorkFormatLabels = (formats: string[]) => {
    return formats
      .map((f) => workFormatOptions.find((o) => o.value === f)?.label || f)
      .join(', ');
  };

  const filteredApplications = applications.filter(
    (app) =>
      app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.phone.includes(searchQuery)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Заявки специалистов</h1>
          <p className="text-muted-foreground mt-1">
            Управление заявками от внешних специалистов
          </p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Обновить
        </Button>
      </div>

      {/* Статистика */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total_count}</div>
              <p className="text-xs text-muted-foreground">Всего</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-700">{stats.new_count}</div>
              <p className="text-xs text-blue-600">Новые</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-700">{stats.reviewing_count}</div>
              <p className="text-xs text-yellow-600">На рассмотрении</p>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-purple-700">{stats.waiting_interview_count}</div>
              <p className="text-xs text-purple-600">Ожидают собеседование</p>
            </CardContent>
          </Card>
          <Card className="border-indigo-200 bg-indigo-50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-indigo-700">{stats.waiting_demo_count}</div>
              <p className="text-xs text-indigo-600">Ожидают демо</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-700">{stats.approved_count}</div>
              <p className="text-xs text-green-600">Одобрены</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-700">{stats.rejected_count}</div>
              <p className="text-xs text-red-600">Отклонены</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по ФИО, email или телефону..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="new">Новые</SelectItem>
                <SelectItem value="reviewing">На рассмотрении</SelectItem>
                <SelectItem value="waiting_interview">Ожидают собеседование</SelectItem>
                <SelectItem value="waiting_demo">Ожидают демо</SelectItem>
                <SelectItem value="approved">Одобренные</SelectItem>
                <SelectItem value="rejected">Отклонённые</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Таблица заявок */}
      <Card>
        <CardHeader>
          <CardTitle>Список заявок</CardTitle>
          <CardDescription>
            Показано {filteredApplications.length} из {total} заявок
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ФИО</TableHead>
                <TableHead>Контакты</TableHead>
                <TableHead>Специализация</TableHead>
                <TableHead>Образование</TableHead>
                <TableHead>Опыт</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((app) => {
                const meetsEducation = app.base_education_hours >= 1100;
                const meetsCertification = app.certification_hours >= 700;
                const meetsRequirements = meetsEducation && meetsCertification;

                return (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.full_name}</TableCell>
                    <TableCell>
                      <div className="text-sm">{app.email}</div>
                      <div className="text-xs text-muted-foreground">{app.phone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{getSpecializationName(app.specialization_code)}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {app.primary_method}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {meetsRequirements ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        )}
                        <span className="text-sm">
                          {app.base_education_hours}ч / {app.certification_hours}ч
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{app.experience_years} лет</TableCell>
                    <TableCell>
                      <Badge className={statusLabels[app.status]?.color}>
                        <span className="flex items-center gap-1">
                          {statusLabels[app.status]?.icon}
                          {statusLabels[app.status]?.label}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(app.created_at), 'dd.MM.yyyy', { locale: ru })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewApplication(app)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredApplications.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Заявки не найдены
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Пагинация */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="text-sm text-muted-foreground">
              Страница {page} из {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Диалог просмотра заявки */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Заявка специалиста</DialogTitle>
            <DialogDescription>
              Подана {selectedApplication && format(new Date(selectedApplication.created_at), 'd MMMM yyyy, HH:mm', { locale: ru })}
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Основная информация */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">ФИО</Label>
                  <p className="font-medium">{selectedApplication.full_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Специализация</Label>
                  <p className="font-medium">
                    {getSpecializationName(selectedApplication.specialization_code)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p>{selectedApplication.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Телефон</Label>
                  <p>{selectedApplication.phone}</p>
                </div>
              </div>

              {/* Метод работы */}
              <div>
                <Label className="text-muted-foreground">Основной метод работы</Label>
                <p>{selectedApplication.primary_method}</p>
              </div>

              {/* Образование */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-muted-foreground">Базовое образование</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">{selectedApplication.base_education_hours}</span>
                    <span className="text-muted-foreground">часов</span>
                    {selectedApplication.base_education_hours >= 1100 ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Соответствует
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Мало (мин. 1100)
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Сертификации в методе</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">{selectedApplication.certification_hours}</span>
                    <span className="text-muted-foreground">часов</span>
                    {selectedApplication.certification_hours >= 700 ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Соответствует
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Мало (мин. 700)
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Опыт */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-muted-foreground">Стаж работы</Label>
                  <p className="font-medium">{selectedApplication.experience_years} лет</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Всего клиентов</Label>
                  <p className="font-medium">{selectedApplication.total_clients_count || '—'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Сейчас в работе</Label>
                  <p className="font-medium">{selectedApplication.current_clients_count || '—'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Готовы взять ещё</Label>
                  <p className="font-medium">{selectedApplication.available_capacity || '—'}</p>
                </div>
              </div>

              {/* Терапия и супервизия */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-muted-foreground">Частота терапии</Label>
                  <p>{selectedApplication.therapy_frequency || '—'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Часов терапии</Label>
                  <p>{selectedApplication.therapy_hours || '—'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Частота супервизии</Label>
                  <p>{selectedApplication.supervision_frequency || '—'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Часов супервизии</Label>
                  <p>{selectedApplication.supervision_hours || '—'}</p>
                </div>
              </div>

              {/* Форматы работы */}
              {selectedApplication.work_formats && selectedApplication.work_formats.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Форматы работы</Label>
                  <p>{getWorkFormatLabels(selectedApplication.work_formats)}</p>
                </div>
              )}

              {/* Опыт с психиатром */}
              <div>
                <Label className="text-muted-foreground">Опыт работы с психиатром</Label>
                <p>{selectedApplication.psychiatrist_experience ? 'Да' : 'Нет'}</p>
              </div>

              {/* Ссылки на соцсети */}
              {selectedApplication.social_links && (
                <div>
                  <Label className="text-muted-foreground">Ссылки на соцсети</Label>
                  <p className="whitespace-pre-wrap">{selectedApplication.social_links}</p>
                </div>
              )}

              {/* Дополнительная информация */}
              {selectedApplication.additional_info && (
                <div>
                  <Label className="text-muted-foreground">Дополнительная информация</Label>
                  <p className="whitespace-pre-wrap">{selectedApplication.additional_info}</p>
                </div>
              )}

              {/* Управление статусом */}
              <div className="border-t pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Статус заявки</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Новая</SelectItem>
                        <SelectItem value="reviewing">На рассмотрении</SelectItem>
                        <SelectItem value="waiting_interview">Ожидает собеседование</SelectItem>
                        <SelectItem value="waiting_demo">Ожидает демо-сессию</SelectItem>
                        <SelectItem value="approved">Одобрена</SelectItem>
                        <SelectItem value="rejected">Отклонена</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Заметки администратора</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Добавьте заметки по заявке..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Закрыть
            </Button>
            <Button onClick={handleUpdateApplication} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                'Сохранить изменения'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
