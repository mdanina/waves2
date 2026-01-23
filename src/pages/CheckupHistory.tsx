import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SerifHeading } from "@/components/design-system/SerifHeading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  History,
  Calendar,
  User,
  FileText,
  Clock
} from "lucide-react";
import { getAllAssessmentsForUser } from "@/lib/assessmentStorage";
import { getProfiles } from "@/lib/profileStorage";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import type { Database } from "@/lib/supabase";
type Profile = Database['public']['Tables']['profiles']['Row'];
type Assessment = Database['public']['Tables']['assessments']['Row'];

interface AssessmentWithProfile extends Assessment {
  profile?: Profile | null;
}

export default function CheckupHistory() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Загружаем данные
  useEffect(() => {
    async function loadData() {
      if (authLoading) return;

      if (!user) {
        navigate("/cabinet");
        return;
      }

      try {
        setLoading(true);

        const [profilesResult, assessmentsResult] = await Promise.allSettled([
          getProfiles(),
          getAllAssessmentsForUser(),
        ]);

        const profilesData = profilesResult.status === 'fulfilled' ? profilesResult.value : [];
        const assessmentsData = assessmentsResult.status === 'fulfilled' ? assessmentsResult.value : [];

        if (profilesResult.status === 'rejected') {
          logger.error('Error loading profiles:', profilesResult.reason);
        }
        if (assessmentsResult.status === 'rejected') {
          logger.error('Error loading assessments:', assessmentsResult.reason);
          toast.error('Ошибка при загрузке истории чекапов');
        }

        // Объединяем чекапы с профилями
        const assessmentsWithProfiles: AssessmentWithProfile[] = assessmentsData.map(assessment => ({
          ...assessment,
          profile: assessment.profile_id
            ? profilesData.find(p => p.id === assessment.profile_id) || null
            : null,
        }));

        setAssessments(assessmentsWithProfiles);
      } catch (error) {
        logger.error('Error loading checkup history:', error);
        toast.error('Ошибка при загрузке истории чекапов');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, authLoading, navigate]);

  // Фильтруем: только завершённые чекапы детей (тип 'checkup')
  const childCheckups = useMemo(() => {
    return assessments.filter(assessment =>
      assessment.status === 'completed' &&
      assessment.assessment_type === 'checkup'
    );
  }, [assessments]);

  const handleViewReport = (assessment: AssessmentWithProfile) => {
    if (assessment.profile_id) {
      navigate(`/results-report/${assessment.profile_id}?assessmentId=${assessment.id}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-8">
        {/* Заголовок */}
        <div className="mb-8">
          <SerifHeading size="2xl">Прогресс</SerifHeading>
        </div>

        {/* Список чекапов */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Clock className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Загрузка истории...</span>
        </div>
      ) : childCheckups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <History className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">История пуста</h3>
              <p className="text-muted-foreground text-center mb-4">
                Вы еще не проходили чекапы. Начните с дашборда!
              </p>
              <Button onClick={() => navigate("/cabinet")}>
                Перейти к дашборду
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {childCheckups.map((assessment) => {
              const date = assessment.completed_at || assessment.created_at;
              const dateFormatted = new Date(date).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4" />
                        {dateFormatted}
                      </div>
                      {assessment.profile && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {assessment.profile.first_name} {assessment.profile.last_name || ''}
                          </span>
                        </div>
                      )}
                    </div>
                    {assessment.profile_id && (
                      <Button
                        onClick={() => handleViewReport(assessment)}
                        size="sm"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Просмотреть отчет
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
    </div>
  );
}
