/**
 * Страница админки для назначения клиентов специалистам
 * - Показывает записи без назначенного специалиста
 * - Позволяет выбрать специалиста и назначить клиента
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Calendar,
  UserPlus,
  RefreshCw,
  CheckCircle2,
  Clock,
  Search,
  Edit,
  Eye,
  Briefcase,
  ArrowLeftRight,
  XCircle,
  Check,
  X,
  Plus,
  CreditCard,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

import {
  useUnassignedAppointments,
  useAvailableSpecialists,
  useAssignClientToSpecialist,
  useAllClientAssignments,
  useUpdateAssignment,
  useChangeRequests,
  useProcessChangeRequest,
  UnassignedAppointment,
  AvailableSpecialist,
  SpecialistChangeRequest,
} from '@/hooks/admin/useCoordinatorAssignments';
import { CreateAdminAppointmentDialog } from '@/components/admin/CreateAdminAppointmentDialog';

// Названия специализаций
const SPECIALIZATION_NAMES: Record<string, string> = {
  child_psychology: 'Детский психолог',
  family_therapy: 'Семейный терапевт',
  cbt: 'КПТ',
  trauma: 'Травматерапевт',
  anxiety: 'Тревожные расстройства',
  depression: 'Депрессия',
  adhd: 'СДВГ',
  autism: 'Аутизм',
  eating_disorders: 'РПП',
  parenting: 'Родительство',
  psychologist: 'Психолог',
  psychiatrist: 'Психиатр',
  psychotherapist: 'Психотерапевт',
  clinical_psychologist: 'Клинический психолог',
  child_psychologist: 'Детский психолог',
  family_therapist: 'Семейный терапевт',
  neuropsychologist: 'Нейропсихолог',
  logopedist: 'Логопед',
  defectologist: 'Дефектолог',
  art_therapist: 'Арт-терапевт',
  coordinator: 'Координатор',
};

export default function ClientAssignments() {
  const [selectedAppointment, setSelectedAppointment] = useState<UnassignedAppointment | null>(null);
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>('');
  const [assignmentType, setAssignmentType] = useState<'primary' | 'consultant' | 'temporary'>('primary');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Поиск
  const [assignmentsSearch, setAssignmentsSearch] = useState('');
  const [specialistsSearch, setSpecialistsSearch] = useState('');

  // Редактирование назначения
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);
  const [editType, setEditType] = useState<'primary' | 'consultant' | 'temporary'>('primary');
  const [editStatus, setEditStatus] = useState<string>('active');
  const [editNotes, setEditNotes] = useState('');
  const [editSpecialistId, setEditSpecialistId] = useState<string>('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Просмотр специалиста
  const [viewingSpecialist, setViewingSpecialist] = useState<AvailableSpecialist | null>(null);

  // Обработка запроса на смену специалиста
  const [processingRequest, setProcessingRequest] = useState<SpecialistChangeRequest | null>(null);
  const [processAction, setProcessAction] = useState<'approve' | 'reject' | null>(null);
  const [newSpecialistForRequest, setNewSpecialistForRequest] = useState<string>('');
  const [processNotes, setProcessNotes] = useState('');
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);

  // Создание записи с оплатой (горячий флоу)
  const [isCreateAppointmentOpen, setIsCreateAppointmentOpen] = useState(false);

  const {
    data: unassignedAppointments,
    isLoading: isLoadingAppointments,
    refetch: refetchAppointments,
  } = useUnassignedAppointments();

  const {
    data: specialists,
    isLoading: isLoadingSpecialists,
  } = useAvailableSpecialists();

  const {
    data: allAssignments,
    isLoading: isLoadingAssignments,
    refetch: refetchAssignments,
  } = useAllClientAssignments();

  const {
    data: changeRequests,
    isLoading: isLoadingChangeRequests,
    refetch: refetchChangeRequests,
  } = useChangeRequests();

  const assignMutation = useAssignClientToSpecialist();
  const updateMutation = useUpdateAssignment();
  const processRequestMutation = useProcessChangeRequest();

  // Открыть диалог назначения
  const handleAssignClick = (appointment: UnassignedAppointment) => {
    setSelectedAppointment(appointment);
    setSelectedSpecialist('');
    setAssignmentType('primary');
    setAssignmentNotes('');
    setIsDialogOpen(true);
  };

  // Выполнить назначение
  const handleAssign = async () => {
    if (!selectedAppointment || !selectedSpecialist) return;

    await assignMutation.mutateAsync({
      appointmentId: selectedAppointment.id,
      clientUserId: selectedAppointment.user_id,
      specialistId: selectedSpecialist,
      profileId: selectedAppointment.profile_id, // Передаём профиль из записи
      assignmentType,
      notes: assignmentNotes || undefined,
    });

    setIsDialogOpen(false);
    setSelectedAppointment(null);
  };

  // Получить имя профиля (для кого консультация)
  const getProfileName = (appointment: UnassignedAppointment) => {
    if (appointment.profile_first_name) {
      const name = appointment.profile_last_name
        ? `${appointment.profile_first_name} ${appointment.profile_last_name}`
        : appointment.profile_first_name;
      const typeLabel = appointment.profile_type === 'child' ? 'ребёнок' :
                       appointment.profile_type === 'parent' ? 'родитель' :
                       appointment.profile_type === 'partner' ? 'партнёр' : '';
      return typeLabel ? `${name} (${typeLabel})` : name;
    }
    return null;
  };

  // Получить email/контакт клиента
  const getClientContact = (appointment: UnassignedAppointment) => {
    return appointment.user_email || appointment.user_phone || 'Клиент';
  };

  // Форматирование даты
  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: ru });
  };

  // Бейдж загрузки специалиста
  const getSpecialistLoadBadge = (specialist: AvailableSpecialist) => {
    const loadPercent = (specialist.current_clients_count / specialist.max_clients) * 100;
    if (loadPercent >= 90) {
      return <Badge variant="destructive">Загружен</Badge>;
    }
    if (loadPercent >= 70) {
      return <Badge variant="secondary">Почти загружен</Badge>;
    }
    return <Badge variant="default">Свободен</Badge>;
  };

  // Открыть диалог редактирования
  const handleEditClick = (assignment: any) => {
    setEditingAssignment(assignment);
    setEditType(assignment.assignment_type);
    setEditStatus(assignment.status);
    setEditNotes(assignment.notes || '');
    setEditSpecialistId(assignment.specialist_id || '');
    setIsEditDialogOpen(true);
  };

  // Сохранить редактирование
  const handleSaveEdit = async () => {
    if (!editingAssignment) return;

    // Если специалист изменился - завершаем текущее назначение и создаём новое
    if (editSpecialistId && editSpecialistId !== editingAssignment.specialist_id) {
      // Завершаем текущее назначение
      await updateMutation.mutateAsync({
        id: editingAssignment.id,
        status: 'completed',
        notes: editNotes || null,
      });

      // Создаём новое назначение
      await assignMutation.mutateAsync({
        appointmentId: '', // Переназначение без записи
        clientUserId: editingAssignment.client_user_id,
        specialistId: editSpecialistId,
        profileId: editingAssignment.profile_id || undefined,
        assignmentType: editType,
        notes: editNotes || undefined,
      });
    } else {
      // Просто обновляем существующее назначение
      await updateMutation.mutateAsync({
        id: editingAssignment.id,
        assignment_type: editType,
        status: editStatus,
        notes: editNotes || null,
      });
    }

    setIsEditDialogOpen(false);
    setEditingAssignment(null);
  };

  // Получить название специализации
  const getSpecializationName = (code: string) => {
    return SPECIALIZATION_NAMES[code] || code;
  };

  // Открыть диалог обработки запроса на смену
  const handleProcessRequest = (request: SpecialistChangeRequest, action: 'approve' | 'reject') => {
    setProcessingRequest(request);
    setProcessAction(action);
    setNewSpecialistForRequest('');
    setProcessNotes('');
    setIsProcessDialogOpen(true);
  };

  // Выполнить обработку запроса
  const handleConfirmProcess = async () => {
    if (!processingRequest || !processAction) return;

    await processRequestMutation.mutateAsync({
      requestId: processingRequest.id,
      newSpecialistId: processAction === 'approve' ? newSpecialistForRequest : null,
      status: processAction === 'approve' ? 'approved' : 'rejected',
      notes: processNotes || undefined,
    });

    setIsProcessDialogOpen(false);
    setProcessingRequest(null);
    setProcessAction(null);
  };

  // Количество ожидающих запросов на смену
  const pendingChangeRequestsCount = changeRequests?.filter(r => r.status === 'pending').length || 0;

  // Фильтрация назначений
  const filteredAssignments = allAssignments?.filter((a) => {
    if (!assignmentsSearch) return true;
    const search = assignmentsSearch.toLowerCase();
    const clientName = `${a.client_first_name || ''} ${a.client_last_name || ''}`.toLowerCase();
    const email = (a.client_email || '').toLowerCase();
    const specialist = (a.specialist_name || '').toLowerCase();
    return clientName.includes(search) || email.includes(search) || specialist.includes(search);
  });

  // Фильтрация специалистов
  const filteredSpecialists = specialists?.filter((s) => {
    if (!specialistsSearch) return true;
    const search = specialistsSearch.toLowerCase();
    const name = s.display_name.toLowerCase();
    const specs = s.specialization_codes.map(c => getSpecializationName(c).toLowerCase()).join(' ');
    return name.includes(search) || specs.includes(search);
  });

  if (isLoadingAppointments || isLoadingSpecialists) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Назначение клиентов</h1>
          <p className="text-muted-foreground mt-1">
            Привязка клиентов к специалистам
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateAppointmentOpen(true)}>
            <CreditCard className="mr-2 h-4 w-4" />
            Создать запись с оплатой
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              refetchAppointments();
              refetchAssignments();
              refetchChangeRequests();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Обновить
          </Button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ожидают назначения</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unassignedAppointments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">записей без специалиста</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Запросы на смену</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingChangeRequestsCount}</div>
            <p className="text-xs text-muted-foreground">ожидают рассмотрения</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Доступные специалисты</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {specialists?.filter(s => s.accepts_new_clients).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">принимают новых клиентов</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего назначений</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allAssignments?.filter(a => a.status === 'active').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">активных назначений</p>
          </CardContent>
        </Card>
      </div>

      {/* Табы */}
      <Tabs defaultValue="unassigned">
        <TabsList>
          <TabsTrigger value="unassigned">
            Без специалиста ({unassignedAppointments?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="change-requests" className="relative">
            Запросы на смену
            {pendingChangeRequestsCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1">
                {pendingChangeRequestsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="assignments">
            Все назначения
          </TabsTrigger>
          <TabsTrigger value="specialists">
            Специалисты
          </TabsTrigger>
        </TabsList>

        {/* Записи без специалиста */}
        <TabsContent value="unassigned">
          <Card>
            <CardHeader>
              <CardTitle>Записи ожидающие назначения</CardTitle>
              <CardDescription>
                Клиенты, которые записались на консультацию, но ещё не привязаны к специалисту
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!unassignedAppointments || unassignedAppointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Все записи назначены специалистам</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Клиент / Профиль</TableHead>
                      <TableHead>Дата и время</TableHead>
                      <TableHead>Тип консультации</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unassignedAppointments.map((appointment) => {
                      const profileName = getProfileName(appointment);
                      return (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div>
                            {profileName && (
                              <p className="font-medium">{profileName}</p>
                            )}
                            <p className={profileName ? "text-sm text-muted-foreground" : "font-medium"}>
                              {getClientContact(appointment)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDateTime(appointment.scheduled_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {appointment.appointment_type_name || 'Не указан'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            appointment.status === 'pending_specialist' ? 'destructive' :
                            appointment.status === 'scheduled' ? 'secondary' : 'default'
                          }>
                            {appointment.status === 'pending_specialist' ? 'Ожидает специалиста' :
                             appointment.status === 'scheduled' ? 'Запланировано' : 'В процессе'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleAssignClick(appointment)}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Назначить
                          </Button>
                        </TableCell>
                      </TableRow>
                    );})}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Запросы на смену специалиста */}
        <TabsContent value="change-requests">
          <Card>
            <CardHeader>
              <CardTitle>Запросы на смену специалиста</CardTitle>
              <CardDescription>
                Запросы клиентов на смену назначенного специалиста
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingChangeRequests ? (
                <Skeleton className="h-32" />
              ) : !changeRequests || changeRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ArrowLeftRight className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Нет запросов на смену специалиста</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Клиент</TableHead>
                      <TableHead>Текущий специалист</TableHead>
                      <TableHead>Причина</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Дата</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {changeRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {request.client_first_name
                                ? `${request.client_first_name} ${request.client_last_name || ''}`
                                : request.client_email || 'Клиент'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {request.client_email || '—'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{request.current_specialist_name || '—'}</p>
                          {request.new_specialist_name && (
                            <p className="text-xs text-muted-foreground">
                              → {request.new_specialist_name}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {request.reason ? (
                            <span className="text-sm truncate max-w-[200px] block" title={request.reason}>
                              {request.reason.length > 50
                                ? `${request.reason.substring(0, 50)}...`
                                : request.reason}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Не указана</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              request.status === 'pending'
                                ? 'secondary'
                                : request.status === 'approved'
                                ? 'default'
                                : request.status === 'rejected'
                                ? 'destructive'
                                : 'outline'
                            }
                          >
                            {request.status === 'pending'
                              ? 'Ожидает'
                              : request.status === 'approved'
                              ? 'Одобрен'
                              : request.status === 'rejected'
                              ? 'Отклонён'
                              : 'Отменён'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDateTime(request.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          {request.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleProcessRequest(request, 'approve')}
                              >
                                <Check className="mr-1 h-4 w-4" />
                                Одобрить
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleProcessRequest(request, 'reject')}
                              >
                                <X className="mr-1 h-4 w-4" />
                                Отклонить
                              </Button>
                            </div>
                          )}
                          {request.status !== 'pending' && request.coordinator_notes && (
                            <span className="text-xs text-muted-foreground" title={request.coordinator_notes}>
                              {request.coordinator_notes.length > 30
                                ? `${request.coordinator_notes.substring(0, 30)}...`
                                : request.coordinator_notes}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Все назначения */}
        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>История назначений</CardTitle>
              <CardDescription>
                Все назначения клиентов специалистам
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Поиск */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по клиенту или специалисту..."
                    value={assignmentsSearch}
                    onChange={(e) => setAssignmentsSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {isLoadingAssignments ? (
                <Skeleton className="h-32" />
              ) : !filteredAssignments || filteredAssignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>{assignmentsSearch ? 'Ничего не найдено' : 'Пока нет назначений'}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Клиент / Профиль</TableHead>
                      <TableHead>Специалист</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Комментарий</TableHead>
                      <TableHead>Дата</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssignments.map((assignment) => {
                      // Профиль, к которому привязан специалист (ребёнок)
                      const profileLabel = assignment.profile_first_name
                        ? `${assignment.profile_first_name} ${assignment.profile_last_name || ''}${assignment.profile_type === 'child' ? ' (ребёнок)' : assignment.profile_type === 'parent' ? ' (родитель)' : ''}`
                        : null;
                      // ФИО клиента (родителя)
                      const clientName = assignment.client_first_name
                        ? `${assignment.client_first_name} ${assignment.client_last_name || ''}`
                        : null;
                      return (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div>
                            {profileLabel && (
                              <p className="font-medium">{profileLabel}</p>
                            )}
                            <p className={profileLabel ? "text-sm text-muted-foreground" : "font-medium"}>
                              {clientName || assignment.client_email || 'Клиент'}
                            </p>
                            {clientName && assignment.client_email && (
                              <p className="text-xs text-muted-foreground">{assignment.client_email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{assignment.specialist_name || '—'}</p>
                            {assignment.specialist_specializations?.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {assignment.specialist_specializations
                                  .slice(0, 2)
                                  .map(getSpecializationName)
                                  .join(', ')}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {assignment.assignment_type === 'primary'
                              ? 'Основной'
                              : assignment.assignment_type === 'consultant'
                              ? 'Консультант'
                              : 'Временный'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={assignment.status === 'active' ? 'default' : 'secondary'}
                          >
                            {assignment.status === 'active'
                              ? 'Активно'
                              : assignment.status === 'completed'
                              ? 'Завершено'
                              : assignment.status === 'paused'
                              ? 'Приостановлено'
                              : 'Отменено'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {assignment.notes ? (
                            <span className="text-sm text-muted-foreground truncate max-w-[150px] block" title={assignment.notes}>
                              {assignment.notes.length > 30
                                ? `${assignment.notes.substring(0, 30)}...`
                                : assignment.notes}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDateTime(assignment.assigned_at)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(assignment)}
                            title="Редактировать"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );})}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Специалисты */}
        <TabsContent value="specialists">
          <Card>
            <CardHeader>
              <CardTitle>Доступные специалисты</CardTitle>
              <CardDescription>
                Список специалистов и их загрузка
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Поиск */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по имени или специализации..."
                    value={specialistsSearch}
                    onChange={(e) => setSpecialistsSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {!filteredSpecialists || filteredSpecialists.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>{specialistsSearch ? 'Ничего не найдено' : 'Нет доступных специалистов'}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Специалист</TableHead>
                      <TableHead>Специализации</TableHead>
                      <TableHead>Клиенты</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Загрузка</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSpecialists.map((specialist) => (
                      <TableRow
                        key={specialist.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setViewingSpecialist(specialist)}
                      >
                        <TableCell className="font-medium">
                          {specialist.display_name}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {specialist.specialization_codes.slice(0, 2).map((code) => (
                              <Badge key={code} variant="outline" className="text-xs">
                                {getSpecializationName(code)}
                              </Badge>
                            ))}
                            {specialist.specialization_codes.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{specialist.specialization_codes.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {specialist.current_clients_count} / {specialist.max_clients}
                        </TableCell>
                        <TableCell>
                          {specialist.accepts_new_clients ? (
                            <Badge variant="default">Принимает</Badge>
                          ) : (
                            <Badge variant="secondary">Не принимает</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {getSpecialistLoadBadge(specialist)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingSpecialist(specialist);
                            }}
                            title="Подробнее"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Диалог назначения */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Назначить специалиста</DialogTitle>
            <DialogDescription>
              {selectedAppointment && (
                <>
                  {getProfileName(selectedAppointment) ? (
                    <>
                      Профиль: <strong>{getProfileName(selectedAppointment)}</strong>
                      <br />
                      Клиент: {getClientContact(selectedAppointment)}
                    </>
                  ) : (
                    <>Клиент: <strong>{getClientContact(selectedAppointment)}</strong></>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Специалист</Label>
              <Select value={selectedSpecialist} onValueChange={setSelectedSpecialist}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите специалиста" />
                </SelectTrigger>
                <SelectContent>
                  {specialists?.filter(s => s.accepts_new_clients).map((specialist) => (
                    <SelectItem key={specialist.id} value={specialist.id}>
                      <div className="flex items-center gap-2">
                        <span>{specialist.display_name}</span>
                        <span className="text-muted-foreground text-xs">
                          ({specialist.current_clients_count}/{specialist.max_clients})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Тип назначения</Label>
              <Select
                value={assignmentType}
                onValueChange={(v) => setAssignmentType(v as typeof assignmentType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Основной специалист</SelectItem>
                  <SelectItem value="consultant">Консультант</SelectItem>
                  <SelectItem value="temporary">Временный</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Заметки (опционально)</Label>
              <Textarea
                placeholder="Дополнительная информация о назначении..."
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedSpecialist || assignMutation.isPending}
            >
              {assignMutation.isPending ? 'Назначение...' : 'Назначить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования назначения */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать назначение</DialogTitle>
            <DialogDescription>
              {editingAssignment && (
                <>
                  Клиент:{' '}
                  <strong>
                    {editingAssignment.client_first_name
                      ? `${editingAssignment.client_first_name} ${editingAssignment.client_last_name || ''}`
                      : editingAssignment.client_email}
                  </strong>
                  <br />
                  Специалист: <strong>{editingAssignment.specialist_name}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Специалист</Label>
              <Select value={editSpecialistId} onValueChange={setEditSpecialistId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите специалиста" />
                </SelectTrigger>
                <SelectContent>
                  {specialists?.map((specialist) => (
                    <SelectItem key={specialist.id} value={specialist.id}>
                      <div className="flex items-center gap-2">
                        <span>{specialist.display_name}</span>
                        {specialist.id === editingAssignment?.specialist_id && (
                          <Badge variant="outline" className="text-xs">текущий</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editSpecialistId && editSpecialistId !== editingAssignment?.specialist_id && (
                <p className="text-xs text-orange-600">
                  При смене специалиста текущее назначение будет завершено
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Тип назначения</Label>
              <Select
                value={editType}
                onValueChange={(v) => setEditType(v as typeof editType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Основной специалист</SelectItem>
                  <SelectItem value="consultant">Консультант</SelectItem>
                  <SelectItem value="temporary">Временный</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Статус</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Активно</SelectItem>
                  <SelectItem value="paused">Приостановлено</SelectItem>
                  <SelectItem value="completed">Завершено</SelectItem>
                  <SelectItem value="cancelled">Отменено</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Комментарий</Label>
              <Textarea
                placeholder="Комментарий к назначению..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending || assignMutation.isPending}>
              {updateMutation.isPending || assignMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Панель информации о специалисте */}
      <Sheet open={!!viewingSpecialist} onOpenChange={(open) => !open && setViewingSpecialist(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{viewingSpecialist?.display_name}</SheetTitle>
            <SheetDescription>Информация о специалисте</SheetDescription>
          </SheetHeader>

          {viewingSpecialist && (
            <div className="mt-6 space-y-6">
              {/* Специализации */}
              <div>
                <h4 className="text-sm font-medium mb-2">Специализации</h4>
                <div className="flex flex-wrap gap-2">
                  {viewingSpecialist.specialization_codes.map((code) => (
                    <Badge key={code} variant="secondary">
                      {getSpecializationName(code)}
                    </Badge>
                  ))}
                  {viewingSpecialist.specialization_codes.length === 0 && (
                    <span className="text-sm text-muted-foreground">Не указаны</span>
                  )}
                </div>
              </div>

              {/* Статистика */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Users className="h-4 w-4" />
                    Клиенты
                  </div>
                  <p className="text-lg font-semibold">
                    {viewingSpecialist.current_clients_count} / {viewingSpecialist.max_clients}
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Briefcase className="h-4 w-4" />
                    Загрузка
                  </div>
                  <p className="text-lg font-semibold">
                    {Math.round((viewingSpecialist.current_clients_count / viewingSpecialist.max_clients) * 100)}%
                  </p>
                </div>
              </div>

              {/* Статусы */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Доступен для работы</span>
                  <Badge variant={viewingSpecialist.is_available ? 'default' : 'secondary'}>
                    {viewingSpecialist.is_available ? 'Да' : 'Нет'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Принимает новых клиентов</span>
                  <Badge variant={viewingSpecialist.accepts_new_clients ? 'default' : 'secondary'}>
                    {viewingSpecialist.accepts_new_clients ? 'Да' : 'Нет'}
                  </Badge>
                </div>
              </div>

              {/* Кнопка закрытия */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setViewingSpecialist(null)}
              >
                Закрыть
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Диалог обработки запроса на смену */}
      <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {processAction === 'approve' ? 'Одобрить запрос' : 'Отклонить запрос'}
            </DialogTitle>
            <DialogDescription>
              {processingRequest && (
                <>
                  Клиент:{' '}
                  <strong>
                    {processingRequest.client_first_name
                      ? `${processingRequest.client_first_name} ${processingRequest.client_last_name || ''}`
                      : processingRequest.client_email}
                  </strong>
                  <br />
                  Текущий специалист: <strong>{processingRequest.current_specialist_name}</strong>
                  {processingRequest.reason && (
                    <>
                      <br />
                      Причина: {processingRequest.reason}
                    </>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {processAction === 'approve' && (
              <div className="space-y-2">
                <Label>Новый специалист *</Label>
                <Select value={newSpecialistForRequest} onValueChange={setNewSpecialistForRequest}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите специалиста" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialists?.filter(s => s.accepts_new_clients && s.id !== processingRequest?.current_specialist_id).map((specialist) => (
                      <SelectItem key={specialist.id} value={specialist.id}>
                        <div className="flex items-center gap-2">
                          <span>{specialist.display_name}</span>
                          <span className="text-muted-foreground text-xs">
                            ({specialist.current_clients_count}/{specialist.max_clients})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Комментарий {processAction === 'reject' ? '(рекомендуется указать причину)' : '(опционально)'}</Label>
              <Textarea
                placeholder={processAction === 'approve'
                  ? 'Комментарий к переназначению...'
                  : 'Укажите причину отклонения запроса...'
                }
                value={processNotes}
                onChange={(e) => setProcessNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProcessDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleConfirmProcess}
              disabled={
                processRequestMutation.isPending ||
                (processAction === 'approve' && !newSpecialistForRequest)
              }
              variant={processAction === 'approve' ? 'default' : 'destructive'}
            >
              {processRequestMutation.isPending
                ? 'Обработка...'
                : processAction === 'approve'
                ? 'Одобрить'
                : 'Отклонить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог создания записи с оплатой */}
      <CreateAdminAppointmentDialog
        open={isCreateAppointmentOpen}
        onOpenChange={setIsCreateAppointmentOpen}
        specialists={specialists || []}
        onSuccess={() => {
          refetchAppointments();
          refetchAssignments();
        }}
      />
    </div>
  );
}
