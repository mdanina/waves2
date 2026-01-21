import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getProfiles } from '@/lib/profileStorage';
import { getCompletedAssessment, recalculateAssessmentResults } from '@/lib/assessmentStorage';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import type { Database } from '@/lib/supabase';
import type { AgeGroup } from '@/data/checkupQuestions';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Assessment = Database['public']['Tables']['assessments']['Row'];

// Тип статуса шкалы
export type ScaleStatus = 'concerning' | 'borderline' | 'typical';

// Результат по одной шкале
export interface ScaleResult {
  score: number;
  max_score?: number;
  status: ScaleStatus;
}

// ============================================
// Новые 10 шкал (версия 2)
// ============================================
export interface CheckupResultsV2 {
  version: 2;
  age_group: AgeGroup;
  emotion_regulation?: ScaleResult;
  behavior?: ScaleResult;
  executive_functions?: ScaleResult;
  sensory_processing?: ScaleResult;
  communication?: ScaleResult;
  social_cognition?: ScaleResult;
  identity?: ScaleResult;
  learning?: ScaleResult;
  motivation?: ScaleResult;
  trauma?: ScaleResult;
  calculated_at?: string;
}

// ============================================
// Старые 5 шкал (версия 1, для обратной совместимости)
// ============================================
export interface CheckupResultsV1 {
  version?: 1 | undefined;
  emotional?: ScaleResult;
  conduct?: ScaleResult;
  hyperactivity?: ScaleResult;
  peer_problems?: ScaleResult;
  prosocial?: ScaleResult;
  impact_child?: { score: number; status: 'concerning' | 'typical' };
  impact_parent?: { score: number; status: 'concerning' | 'typical' };
  impact_family?: { score: number; status: 'concerning' | 'typical' };
  impact?: { score: number; status: 'high_impact' | 'medium_impact' | 'low_impact' };
  total_difficulties?: number;
}

// Объединенный тип результатов (поддерживает обе версии)
export type CheckupResults = CheckupResultsV1 | CheckupResultsV2;

// Хелпер для проверки версии результатов
export function isCheckupResultsV2(results: CheckupResults): results is CheckupResultsV2 {
  return 'version' in results && results.version === 2;
}

export interface ChildCheckupData {
  profile: Profile;
  assessment: Assessment;
  results: CheckupResults;
}

interface UseResultsDataReturn {
  loading: boolean;
  parentProfile: Profile | null;
  partnerProfile: Profile | null;
  childrenCheckups: ChildCheckupData[];
  parentAssessment: Assessment | null;
  familyAssessment: Assessment | null;
}

export function useResultsData(
  user: { id: string } | null,
  authLoading: boolean,
  specificAssessmentId?: string | null
): UseResultsDataReturn {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState(true);
  const [parentProfile, setParentProfile] = useState<Profile | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);
  const [childrenCheckups, setChildrenCheckups] = useState<ChildCheckupData[]>([]);
  const [parentAssessment, setParentAssessment] = useState<Assessment | null>(null);
  const [familyAssessment, setFamilyAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    async function loadResults() {
      if (authLoading) {
        return; // Ждем завершения загрузки авторизации
      }
      
      if (!user) {
        if (!cancelled) {
          navigate("/cabinet");
        }
        return;
      }

      try {
        if (!cancelled) {
          setLoading(true);
        }
        
        // Загружаем все профили пользователя
        const profiles = await getProfiles();
        if (cancelled) return;
        
        // Находим профиль родителя и партнера
        const parent = profiles.find(p => p.type === 'parent');
        const partner = profiles.find(p => p.type === 'partner');
        const children = profiles.filter(p => p.type === 'child');
        
        // Отладка: логируем загруженные профили
        if (parent && !cancelled) {
          logger.log('Loaded parent profile:', {
            id: parent.id,
            first_name: parent.first_name,
            worry_tags: parent.worry_tags,
            worry_tags_type: typeof parent.worry_tags,
            worry_tags_is_array: Array.isArray(parent.worry_tags)
          });
          setParentProfile(parent);
        } else if (!parent && !cancelled) {
          logger.warn('Parent profile not found in loaded profiles');
        }
        if (partner && !cancelled) {
          setPartnerProfile(partner);
        }
        
        // ОДИН запрос для ВСЕХ завершенных оценок пользователя
        // Это исправляет катастрофическую проблему N+1 запросов!
        const profileIds = profiles.map(p => p.id);
        const { data: allAssessments, error: assessmentsError } = await supabase
          .from('assessments')
          .select('*')
          .in('profile_id', profileIds)
          .eq('status', 'completed')
          .in('assessment_type', ['parent', 'family', 'checkup']);

        if (cancelled) return;

        if (assessmentsError) {
          throw assessmentsError;
        }

        // Разделение по типам оценок
        const parentAssessments = allAssessments?.filter(a => a.assessment_type === 'parent') || [];
        const familyAssessments = allAssessments?.filter(a => a.assessment_type === 'family') || [];
        const checkupAssessments = allAssessments?.filter(a => a.assessment_type === 'checkup') || [];

        // Находим parent и family оценки (приоритет - по профилю родителя, если есть)
        let foundParentAssess: Assessment | null = null;
        let foundFamilyAssess: Assessment | null = null;

        if (parent) {
          // Ищем по профилю родителя
          foundParentAssess = parentAssessments.find(a => a.profile_id === parent.id) || null;
          foundFamilyAssess = familyAssessments.find(a => a.profile_id === parent.id) || null;
        }

        // Если не нашли, берем любую найденную
        if (!foundParentAssess && parentAssessments.length > 0) {
          foundParentAssess = parentAssessments[0]; // Берем первую найденную
        }
        if (!foundFamilyAssess && familyAssessments.length > 0) {
          foundFamilyAssess = familyAssessments[0]; // Берем первую найденную
        }

        // Пересчитываем результаты, если нужно
        const recalculateIfNeeded = async (assessment: Assessment | null): Promise<Assessment | null> => {
          if (!assessment) return null;
          
          const needsRecalc = !assessment.results_summary || 
            Object.keys(assessment.results_summary).length === 0 || 
            (assessment.results_summary as any).status === 'completed';
          
          if (needsRecalc) {
            try {
              await recalculateAssessmentResults(assessment.id);
              // Перезагружаем оценку после пересчета
              const updated = await getCompletedAssessment(assessment.profile_id, assessment.assessment_type);
              return updated;
            } catch (error) {
              logger.error(`Error recalculating ${assessment.assessment_type} assessment:`, error);
              return assessment; // Возвращаем оригинальную, если пересчет не удался
            }
          }
          return assessment;
        };

        // Параллелизуем запросы пересчета
        const [recalculatedParent, recalculatedFamily] = await Promise.all([
          recalculateIfNeeded(foundParentAssess),
          recalculateIfNeeded(foundFamilyAssess)
        ]);
        
        if (cancelled) return;
        
        // Устанавливаем найденные оценки в state
        if (recalculatedParent && !cancelled) {
          setParentAssessment(recalculatedParent);
        }
        if (recalculatedFamily && !cancelled) {
          setFamilyAssessment(recalculatedFamily);
        }
        
        // Обрабатываем checkup оценки для детей (уже загружены одним запросом!)
        const childrenData: ChildCheckupData[] = [];

        // Если указан конкретный assessmentId, показываем только его
        if (specificAssessmentId) {
          const specificAssessment = checkupAssessments.find(a => a.id === specificAssessmentId);
          if (specificAssessment && specificAssessment.results_summary) {
            const childProfile = children.find(c => c.id === specificAssessment.profile_id);
            if (childProfile) {
              childrenData.push({
                profile: childProfile,
                assessment: specificAssessment,
                results: specificAssessment.results_summary as CheckupResults,
              });
            }
          }
        } else {
          // Стандартное поведение: последняя оценка для каждого ребенка
          const checkupsMap = new Map(checkupAssessments.map(a => [a.profile_id, a]));
          for (const child of children) {
            const checkupAssessment = checkupsMap.get(child.id);
            if (checkupAssessment && checkupAssessment.results_summary) {
              childrenData.push({
                profile: child,
                assessment: checkupAssessment,
                results: checkupAssessment.results_summary as CheckupResults,
              });
            }
          }
        }
        
        if (!cancelled) {
          setChildrenCheckups(childrenData);
        }
        
        // Если нет ни одной завершенной оценки, показываем ошибку
        if (!cancelled && childrenData.length === 0 && !recalculatedParent && !recalculatedFamily) {
          toast.error('Завершенные оценки не найдены');
          navigate("/cabinet");
        }
      } catch (error) {
        if (!cancelled) {
          logger.error('Error loading results:', error);
          toast.error('Ошибка при загрузке результатов');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (!authLoading) {
      if (user) {
        loadResults();
      } else {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, navigate, location.pathname, specificAssessmentId]);

  return {
    loading,
    parentProfile,
    partnerProfile,
    childrenCheckups,
    parentAssessment,
    familyAssessment,
  };
}












