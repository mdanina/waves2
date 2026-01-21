/**
 * Детальная страница клиента для специалиста
 * Аналог PatientDetailPage из PsiPilot
 * Табы: Информация, Консультации, AI-заметки, Документы (заготовка)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Brain,
  Video,
  ChevronRight,
  Sparkles,
  MessageSquare,
  FolderOpen,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useSpecialistAuth } from '@/contexts/SpecialistAuthContext';
import { getClinicalNotesForClient } from '@/lib/supabase-ai';
import { ClientDocuments } from '@/components/specialist/ClientDocuments';
import { CaseSummaryCard } from '@/components/specialist/CaseSummaryCard';
import { ClientCheckupResults } from '@/components/specialist/ClientCheckupResults';
import {
  getClientName,
  getClientInitials,
  formatDate,
  getAppointmentStatusConfig,
} from '@/lib/client-utils';
import type { GeneratedClinicalNote } from '@/types/ai.types';

interface ClientProfile {
  first_name: string;
  last_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
}

// Профиль члена семьи
interface FamilyMember {
  id: string;
  first_name: string;
  last_name: string | null;
  type: string;
  date_of_birth: string | null;
}

interface ClientData {
  id: string;
  email: string | null;
  phone: string | null;
  region: string | null;
  created_at: string;
  profile?: ClientProfile;
}

interface ClientAssignment {
  id: string;
  assignment_type: 'primary' | 'consultant' | 'temporary';
  status: string;
  assigned_at: string;
  notes: string | null;
  // Профиль, к которому привязан специалист
  profile_id: string | null;
  profile_first_name: string | null;
  profile_last_name: string | null;
  profile_type: string | null;
}

interface ClientAppointment {
  id: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  transcript: string | null;
  appointment_type?: {
    name: string;
    duration_minutes: number;
  };
}

export default function SpecialistClientDetail() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { specialistUser } = useSpecialistAuth();

  const [client, setClient] = useState<ClientData | null>(null);
  const [assignment, setAssignment] = useState<ClientAssignment | null>(null);
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState<GeneratedClinicalNote[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (clientId) {
      loadClientData();
    }
  }, [clientId]);

  const loadClientData = async () => {
    if (!clientId) return;

    try {
      setIsLoading(true);

      // Используем RPC функцию (обходит RLS)
      const { data: clientsData, error: rpcError } = await supabase
        .rpc('get_specialist_clients');

      if (rpcError) throw rpcError;

      // Находим нужного клиента
      const clientRpc = clientsData?.find((c: { client_user_id: string }) => c.client_user_id === clientId);

      if (!clientRpc) {
        toast({
          title: 'Ошибка',
          description: 'Клиент не найден или не назначен вам',
          variant: 'destructive',
        });
        return;
      }

      // Загружаем все профили семьи клиента через RPC (обходит RLS)
      const { data: allProfiles, error: profilesError } = await supabase
        .rpc('get_client_profiles', { p_client_user_id: clientId });

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
      }

      // Находим профиль родителя для основной информации
      const parentProfile = allProfiles?.find((p: FamilyMember) => p.type === 'parent');
      const primaryProfile = parentProfile || allProfiles?.[0];

      setFamilyMembers(allProfiles || []);

      setClient({
        id: clientRpc.client_user_id,
        email: clientRpc.client_email,
        phone: clientRpc.client_phone,
        region: clientRpc.client_region,
        created_at: clientRpc.assigned_at, // Используем дату назначения как created_at
        profile: primaryProfile ? {
          first_name: primaryProfile.first_name,
          last_name: primaryProfile.last_name,
          date_of_birth: primaryProfile.date_of_birth,
          gender: primaryProfile.gender,
        } : undefined,
      });

      // Устанавливаем назначение из RPC данных
      setAssignment({
        id: clientRpc.assignment_id,
        assignment_type: clientRpc.assignment_type,
        status: clientRpc.assignment_status,
        assigned_at: clientRpc.assigned_at,
        notes: clientRpc.notes,
        profile_id: clientRpc.profile_id || null,
        profile_first_name: clientRpc.profile_first_name || null,
        profile_last_name: clientRpc.profile_last_name || null,
        profile_type: clientRpc.profile_type || null,
      });

      // Загружаем консультации
      if (specialistUser?.specialist?.id) {
        const { data: appointmentsData } = await supabase
          .from('appointments')
          .select(`
            id,
            scheduled_at,
            status,
            notes,
            transcript,
            appointment_type:appointment_types (name, duration_minutes)
          `)
          .eq('user_id', clientId)
          .eq('specialist_id', specialistUser.specialist.id)
          .order('scheduled_at', { ascending: false });

        setAppointments(appointmentsData || []);
      }

      // Загружаем AI-заметки клиента
      try {
        const notes = await getClinicalNotesForClient(clientId);
        setClinicalNotes(notes);
      } catch (err) {
        console.log('No clinical notes for client');
      }
    } catch (error) {
      console.error('Error loading client:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные клиента',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Хелпер для получения Badge статуса консультации
  const renderStatusBadge = (status: string) => {
    const config = getAppointmentStatusConfig(status);
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">Клиент не найден</p>
        <Button variant="outline" onClick={() => navigate('/specialist/clients')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Вернуться к списку
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/specialist/clients">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>

          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold">
            {getClientInitials(client?.profile, client?.email)}
          </div>

          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {getClientName(client?.profile, client?.email)}
              {assignment && (
                <Badge variant={assignment.assignment_type === 'primary' ? 'default' : 'secondary'}>
                  {assignment.assignment_type === 'primary' ? 'Основной' :
                   assignment.assignment_type === 'consultant' ? 'Консультант' : 'Временный'}
                </Badge>
              )}
            </h1>
            {assignment?.profile_first_name && (
              <p className="text-primary font-medium">
                Работаю с: {assignment.profile_first_name} {assignment.profile_last_name || ''}
                {assignment.profile_type === 'child' && ' (ребёнок)'}
                {assignment.profile_type === 'partner' && ' (партнёр)'}
              </p>
            )}
            <p className="text-muted-foreground">
              {client.email || client.phone}
            </p>
          </div>
        </div>

        <Button variant="outline" asChild>
          <Link to={`/specialist/messages?client=${clientId}`}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Написать
          </Link>
        </Button>
      </div>

      {/* Табы */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="info" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Информация
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Консультации
            {appointments.length > 0 && (
              <Badge variant="secondary" className="ml-1">{appointments.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI-заметки
            {clinicalNotes.length > 0 && (
              <Badge variant="secondary" className="ml-1">{clinicalNotes.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Документы
          </TabsTrigger>
        </TabsList>

        {/* Вкладка "Информация" */}
        <TabsContent value="info" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Контактные данные */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Контактные данные</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {client.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.region && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{client.region}</span>
                  </div>
                )}
                {client.profile?.date_of_birth && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(client.profile.date_of_birth)}</span>
                  </div>
                )}
                {client.profile?.gender && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{client.profile.gender === 'male' ? 'Мужской' :
                           client.profile.gender === 'female' ? 'Женский' : client.profile.gender}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Статистика */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Статистика</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Всего консультаций</span>
                  <span className="font-medium">{appointments.length}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Проведено</span>
                  <span className="font-medium">
                    {appointments.filter(a => a.status === 'completed').length}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">AI-заметок</span>
                  <span className="font-medium">{clinicalNotes.length}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Клиент с</span>
                  <span className="font-medium">{formatDate(client.created_at)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Состав семьи */}
            {familyMembers.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Состав семьи</CardTitle>
                  <CardDescription>Профили, зарегистрированные в аккаунте клиента</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {familyMembers.map((member) => (
                      <div
                        key={member.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                          assignment?.profile_id === member.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                          {member.first_name[0]}{member.last_name?.[0] || ''}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {member.first_name} {member.last_name || ''}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {member.type === 'parent' && 'Родитель'}
                            {member.type === 'child' && 'Ребёнок'}
                            {member.type === 'partner' && 'Партнёр'}
                            {!['parent', 'child', 'partner'].includes(member.type) && member.type}
                            {member.date_of_birth && ` • ${formatDate(member.date_of_birth)}`}
                          </p>
                        </div>
                        {assignment?.profile_id === member.id && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Работаю
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Заметки координатора */}
            {assignment?.notes && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Заметки от координатора</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{assignment.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Результаты чекапов */}
          {clientId && (
            <ClientCheckupResults clientUserId={clientId} />
          )}

          {/* Обзор кейса */}
          {clientId && specialistUser?.user?.id && client && (
            <CaseSummaryCard
              clientUserId={clientId}
              specialistUserId={specialistUser.user.id}
              clientName={getClientName(client.profile, client.email)}
            />
          )}
        </TabsContent>

        {/* Вкладка "Консультации" */}
        <TabsContent value="appointments" className="space-y-4">
          {appointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Нет консультаций</p>
                <p className="text-sm mt-1">Консультации назначаются администратором</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <Card
                  key={appointment.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/specialist/sessions/${appointment.id}`)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Video className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {appointment.appointment_type?.name || 'Консультация'}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(appointment.scheduled_at, {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {appointment.appointment_type?.duration_minutes && (
                              <>
                                <span>•</span>
                                <Clock className="h-3 w-3" />
                                {appointment.appointment_type.duration_minutes} мин
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {appointment.transcript && (
                          <Badge variant="outline" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            Транскрипт
                          </Badge>
                        )}
                        {renderStatusBadge(appointment.status)}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Вкладка "AI-заметки" */}
        <TabsContent value="notes" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              AI-сгенерированные клинические заметки по сессиям с клиентом
            </p>
            <Button asChild>
              <Link to="/specialist/sessions">
                <Sparkles className="mr-2 h-4 w-4" />
                Перейти к сессиям
              </Link>
            </Button>
          </div>

          {clinicalNotes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Brain className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Нет AI-заметок</p>
                <p className="text-sm mt-1">Создайте клиническую заметку на странице сессии</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {clinicalNotes.map((note) => (
                <Card
                  key={note.id}
                  className={note.appointment_id ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
                  onClick={() => note.appointment_id && navigate(`/specialist/sessions/${note.appointment_id}`)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Brain className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">{note.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(note.created_at, {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                            {note.sections && (
                              <> • {note.sections.length} секций</>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={note.status === 'finalized' ? 'default' : 'outline'}>
                          {note.status === 'finalized' ? 'Сохранено' :
                           note.status === 'draft' ? 'Черновик' : note.status}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Вкладка "Документы" */}
        <TabsContent value="documents">
          {specialistUser?.id ? (
            <ClientDocuments
              clientUserId={clientId!}
              currentUserId={specialistUser.id}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FolderOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Загрузка...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
