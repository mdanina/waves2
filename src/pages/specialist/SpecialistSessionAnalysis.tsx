/**
 * Страница анализа сессии (консультации)
 * Использует 2-колоночный layout из PsiPilot
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ArrowLeft, Calendar, User, Clock, Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getClinicalNotesForAppointment, generateSessionSummary } from '@/lib/supabase-ai';
import { getClientName, formatDate } from '@/lib/client-utils';
import { AnalysisLayout, type Appointment } from '@/components/specialist/analysis';
import type { GeneratedClinicalNote } from '@/types/ai.types';
import { useToast } from '@/hooks/use-toast';

interface AppointmentWithDetails extends Appointment {
  appointment_type?: {
    name: string;
    duration_minutes: number;
  };
  profile?: {
    first_name: string;
    last_name: string | null;
  };
  client_user?: {
    email: string;
  };
}

export default function SpecialistSessionAnalysis() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [appointment, setAppointment] = useState<AppointmentWithDetails | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState<GeneratedClinicalNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  useEffect(() => {
    if (appointmentId) {
      loadData();
    }
  }, [appointmentId]);

  const loadData = async () => {
    if (!appointmentId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Загружаем консультацию
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          *,
          appointment_type:appointment_types (name, duration_minutes),
          profile:profiles (first_name, last_name),
          client_user:users!appointments_user_id_fkey (email)
        `)
        .eq('id', appointmentId)
        .single();

      if (appointmentError) throw appointmentError;
      if (!appointmentData) throw new Error('Консультация не найдена');

      setAppointment(appointmentData as AppointmentWithDetails);

      // Загружаем клинические заметки
      try {
        const notes = await getClinicalNotesForAppointment(appointmentId);
        setClinicalNotes(notes);
      } catch (err) {
        console.log('No clinical notes yet');
        setClinicalNotes([]);
      }
    } catch (err) {
      console.error('Error loading appointment:', err);
      setError(err instanceof Error ? err.message : 'Не удалось загрузить данные');
      toast({
        title: 'Ошибка',
        description: err instanceof Error ? err.message : 'Не удалось загрузить данные',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotesUpdate = useCallback(async () => {
    if (!appointmentId) return;

    try {
      const notes = await getClinicalNotesForAppointment(appointmentId);
      setClinicalNotes(notes);
    } catch (err) {
      console.error('Error refreshing notes:', err);
    }
  }, [appointmentId]);

  // Генерация сводки сессии
  const handleGenerateSummary = async () => {
    if (!appointmentId) return;

    try {
      setIsGeneratingSummary(true);
      const result = await generateSessionSummary(appointmentId);

      // Обновляем appointment с новой сводкой
      setAppointment((prev) =>
        prev ? { ...prev, summary: result.summary } : prev
      );
      setIsSummaryExpanded(true);

      toast({
        title: 'Сводка сгенерирована',
        description: 'AI создал краткую сводку сессии',
      });
    } catch (err) {
      console.error('Error generating summary:', err);
      toast({
        title: 'Ошибка генерации',
        description: err instanceof Error ? err.message : 'Не удалось сгенерировать сводку',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        {/* Header skeleton */}
        <div className="flex-shrink-0 border-b px-6 py-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-9" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
        </div>
        {/* Content skeleton */}
        <div className="flex-1 p-6">
          <Skeleton className="h-full" />
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error || 'Консультация не найдена'}</p>
          <Button variant="outline" onClick={() => navigate('/specialist/sessions')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Вернуться к списку
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b px-6 py-4 bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/specialist/sessions">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                {getClientName(appointment?.profile, appointment?.client_user?.email)}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(appointment.scheduled_at, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {appointment.appointment_type && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {appointment.appointment_type.name} ({appointment.appointment_type.duration_minutes} мин)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Кнопка генерации сводки */}
          <Button
            variant={appointment.summary ? 'outline' : 'default'}
            size="sm"
            onClick={handleGenerateSummary}
            disabled={isGeneratingSummary}
          >
            {isGeneratingSummary ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Генерация...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {appointment.summary ? 'Перегенерировать' : 'Сводка сессии'}
              </>
            )}
          </Button>
        </div>

        {/* Сводка сессии */}
        {appointment.summary && (
          <Collapsible open={isSummaryExpanded} onOpenChange={setIsSummaryExpanded} className="mt-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between px-2">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Сводка сессии
                  <Badge variant="secondary" className="text-xs">AI</Badge>
                </span>
                {isSummaryExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap">
                {appointment.summary}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      {/* Analysis Layout */}
      <div className="flex-1 overflow-hidden">
        <AnalysisLayout
          appointmentId={appointmentId!}
          appointment={appointment}
          clinicalNotes={clinicalNotes}
          onNotesUpdate={handleNotesUpdate}
        />
      </div>
    </div>
  );
}
