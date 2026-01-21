// Утилиты для работы с оценками (assessments) и ответами (answers) в Supabase
import { supabase } from './supabase';
import type { Database } from './supabase';
import { logger } from './logger';

type Assessment = Database['public']['Tables']['assessments']['Row'];
type AssessmentInsert = Database['public']['Tables']['assessments']['Insert'];
type AssessmentUpdate = Database['public']['Tables']['assessments']['Update'];
type Answer = Database['public']['Tables']['answers']['Row'];
type AnswerInsert = Database['public']['Tables']['answers']['Insert'];

export interface AnswerData {
  questionId: number;
  questionCode: string;
  category: string;
  value: number;
  answerType?: string;
  stepNumber: number;
}

// ============================================
// Работа с оценками (Assessments)
// ============================================

/**
 * Получить или создать активную оценку для профиля
 * Сохраняет текущие worry tags при создании новой оценки
 */
export async function getOrCreateAssessment(
  profileId: string,
  assessmentType: 'checkup' | 'parent' | 'family',
  totalSteps?: number
): Promise<string> {
  try {
    // Сначала проверяем, есть ли уже активная оценка
    const existingAssessment = await getActiveAssessment(profileId, assessmentType);
    
    let assessmentId: string;
    
    if (existingAssessment) {
      // Если есть активная оценка, используем её
      assessmentId = existingAssessment.id;
    } else {
      // Если нет активной оценки, создаем новую и сохраняем текущие worry tags
      const { getProfiles } = await import('./profileStorage');
      const profiles = await getProfiles();
      
      const childProfile = profiles.find(p => p.id === profileId && p.type === 'child');
      const parentProfile = profiles.find(p => p.type === 'parent');
      const partnerProfile = profiles.find(p => p.type === 'partner');
      
      // Собираем worry tags из профилей
      const worryTags: { child?: string[]; personal?: string[]; family?: string[] } = {};
      
      if (childProfile?.worry_tags) {
        worryTags.child = childProfile.worry_tags;
      }
      
      if (parentProfile?.worry_tags) {
        // Разделяем на personal и family
        const personalWorries = [
          "Выгорание",
          "Тревожность",
          "Пониженное настроение",
          "Трудности с концентрацией внимания",
          "Общий стресс",
        ];
        const familyWorries = [
          "Разделение/развод",
          "Семейный стресс",
          "Отношения с партнером",
          "Психическое здоровье партнера",
          "Воспитание",
          "Семейный конфликт",
        ];
        
        worryTags.personal = parentProfile.worry_tags.filter(w => personalWorries.includes(w));
        worryTags.family = parentProfile.worry_tags.filter(w => familyWorries.includes(w));
      }
      
      if (partnerProfile?.worry_tags) {
        worryTags.family = partnerProfile.worry_tags;
      }
      
      // Создаем новую оценку с worry tags
      const { data: newAssessment, error: createError } = await supabase
        .from('assessments')
        .insert({
          profile_id: profileId,
          assessment_type: assessmentType,
          status: 'in_progress',
          current_step: 1,
          total_steps: totalSteps || null,
          worry_tags: Object.keys(worryTags).length > 0 ? worryTags : null,
        })
        .select('id')
        .single();
      
      if (createError) throw createError;
      
      assessmentId = newAssessment.id;
    }

    // Обновляем total_steps если нужно
    if (totalSteps) {
      await supabase
        .from('assessments')
        .update({ total_steps: totalSteps })
        .eq('id', assessmentId);
    }

    return assessmentId;
  } catch (error) {
    logger.error('Error getting/creating assessment:', error);
    throw error;
  }
}

export interface GetOrCreateAssessmentResult {
  id: string;
  assessment: Assessment;
}

/**
 * Получить или создать активную оценку для профиля (оптимизированная версия)
 * Возвращает полный объект Assessment, избегая повторного запроса
 */
export async function getOrCreateAssessmentFull(
  profileId: string,
  assessmentType: 'checkup' | 'parent' | 'family',
  totalSteps?: number
): Promise<GetOrCreateAssessmentResult> {
  try {
    // Сначала проверяем, есть ли уже активная оценка
    const existingAssessment = await getActiveAssessment(profileId, assessmentType);

    if (existingAssessment) {
      // Обновляем total_steps если нужно
      if (totalSteps && existingAssessment.total_steps !== totalSteps) {
        await supabase
          .from('assessments')
          .update({ total_steps: totalSteps })
          .eq('id', existingAssessment.id);
        existingAssessment.total_steps = totalSteps;
      }
      return { id: existingAssessment.id, assessment: existingAssessment };
    }

    // Создаем новую оценку и сохраняем текущие worry tags
    const { getProfiles } = await import('./profileStorage');
    const profiles = await getProfiles();

    const childProfile = profiles.find(p => p.id === profileId && p.type === 'child');
    const parentProfile = profiles.find(p => p.type === 'parent');
    const partnerProfile = profiles.find(p => p.type === 'partner');

    // Собираем worry tags из профилей
    const worryTags: { child?: string[]; personal?: string[]; family?: string[] } = {};

    if (childProfile?.worry_tags) {
      worryTags.child = childProfile.worry_tags;
    }

    if (parentProfile?.worry_tags) {
      const personalWorries = [
        "Выгорание", "Тревожность", "Пониженное настроение",
        "Трудности с концентрацией внимания", "Общий стресс",
      ];
      const familyWorries = [
        "Разделение/развод", "Семейный стресс", "Отношения с партнером",
        "Психическое здоровье партнера", "Воспитание", "Семейный конфликт",
      ];
      worryTags.personal = parentProfile.worry_tags.filter(w => personalWorries.includes(w));
      worryTags.family = parentProfile.worry_tags.filter(w => familyWorries.includes(w));
    }

    if (partnerProfile?.worry_tags) {
      worryTags.family = partnerProfile.worry_tags;
    }

    // Создаем новую оценку с worry tags и возвращаем полный объект
    const { data: newAssessment, error: createError } = await supabase
      .from('assessments')
      .insert({
        profile_id: profileId,
        assessment_type: assessmentType,
        status: 'in_progress',
        current_step: 1,
        total_steps: totalSteps || null,
        worry_tags: Object.keys(worryTags).length > 0 ? worryTags : null,
      })
      .select('*')
      .single();

    if (createError) {
      logger.error('Error creating assessment:', createError);
      throw createError;
    }

    // Защита от race condition: проверяем актуальное состояние и возвращаем правильную запись
    const { data: allInProgress } = await supabase
      .from('assessments')
      .select('*')
      .eq('profile_id', profileId)
      .eq('assessment_type', assessmentType)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: true });

    // Нет записей - маловероятно, но вернём созданную
    if (!allInProgress || allInProgress.length === 0) {
      return { id: newAssessment.id, assessment: newAssessment };
    }

    // Одна запись - возвращаем её (может быть наша или наша была удалена конкурентным запросом)
    if (allInProgress.length === 1) {
      return { id: allInProgress[0].id, assessment: allInProgress[0] };
    }

    // Несколько записей - race condition, удаляем все кроме самой ранней
    const [earliest, ...rest] = allInProgress;
    const duplicateIds = rest.map(d => d.id);

    logger.warn(`Race condition detected: found ${allInProgress.length} in_progress assessments. Keeping earliest, deleting ${duplicateIds.length} duplicates.`);

    await supabase
      .from('assessments')
      .delete()
      .in('id', duplicateIds);

    return { id: earliest.id, assessment: earliest };
  } catch (error) {
    logger.error('Error getting/creating assessment:', error);
    throw error;
  }
}

/**
 * Получить активную оценку
 */
export async function getActiveAssessment(
  profileId: string,
  assessmentType: 'checkup' | 'parent' | 'family'
): Promise<Assessment | null> {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('profile_id', profileId)
      .eq('assessment_type', assessmentType)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Error getting active assessment:', error);
    return null;
  }
}

/**
 * Обновить текущий шаг оценки
 */
export async function updateAssessmentStep(
  assessmentId: string,
  currentStep: number
): Promise<void> {
  try {
    const { error } = await supabase
      .from('assessments')
      .update({ current_step: currentStep, updated_at: new Date().toISOString() })
      .eq('id', assessmentId);

    if (error) throw error;
  } catch (error) {
    logger.error('Error updating assessment step:', error);
    throw error;
  }
}

/**
 * Сохранить ответ на вопрос
 */
export async function saveAnswer(
  assessmentId: string,
  answer: AnswerData
): Promise<void> {
  try {
    const answerData: AnswerInsert = {
      assessment_id: assessmentId,
      question_code: answer.questionCode,
      question_id: answer.questionId,
      category: answer.category,
      value: answer.value,
      answer_type: answer.answerType || null,
      step_number: answer.stepNumber,
    };

    // Используем upsert для обновления существующего ответа или создания нового
    const { error } = await supabase
      .from('answers')
      .upsert(answerData, {
        onConflict: 'assessment_id,question_id',
      })
      .select();

    if (error) {
      throw error;
    }
  } catch (error) {
    logger.error('Error saving answer:', error);
    throw error;
  }
}

/**
 * Получить все ответы для оценки
 */
export async function getAnswers(assessmentId: string): Promise<Answer[]> {
  try {
    const { data, error } = await supabase
      .from('answers')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('question_id', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Error getting answers:', error);
    throw error;
  }
}

/**
 * Получить ответ на конкретный вопрос
 */
export async function getAnswer(
  assessmentId: string,
  questionId: number
): Promise<Answer | null> {
  try {
    const { data, error } = await supabase
      .from('answers')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('question_id', questionId)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Error getting answer:', error);
    return null;
  }
}

/**
 * Завершить оценку и рассчитать результаты
 */
export async function completeAssessment(assessmentId: string): Promise<Record<string, any>> {
  try {
    const { data, error } = await supabase.rpc('complete_assessment', {
      assessment_uuid: assessmentId,
    });

    if (error) throw error;

    return data as Record<string, any>;
  } catch (error) {
    logger.error('Error completing assessment:', error);
    throw error;
  }
}

/**
 * Получить результаты оценки
 */
export async function getAssessmentResults(assessmentId: string): Promise<Record<string, any> | null> {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('results_summary, is_paid')
      .eq('id', assessmentId)
      .single();

    if (error) throw error;

    return {
      results: data.results_summary,
      isPaid: data.is_paid,
    };
  } catch (error) {
    logger.error('Error getting assessment results:', error);
    return null;
  }
}

/**
 * Получить все оценки для профиля
 */
export async function getAssessmentsForProfile(profileId: string): Promise<Assessment[]> {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    logger.error('Error getting assessments for profile:', error);
    throw error;
  }
}

/**
 * Получить завершенную оценку определенного типа
 */
export async function getCompletedAssessment(
  profileId: string,
  assessmentType: 'checkup' | 'parent' | 'family'
): Promise<Assessment | null> {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('profile_id', profileId)
      .eq('assessment_type', assessmentType)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error('Error getting completed assessment:', error);
    return null;
  }
}

/**
 * Пересчитать результаты для завершенной оценки
 */
export async function recalculateAssessmentResults(assessmentId: string): Promise<Record<string, any> | null> {
  try {
    const { data, error } = await supabase.rpc('complete_assessment', {
      assessment_uuid: assessmentId,
    });

    if (error) throw error;

    return data as Record<string, any>;
  } catch (error) {
    logger.error('Error recalculating assessment results:', error);
    return null;
  }
}

/**
 * Получить завершенные оценки для нескольких профилей одним запросом
 * КРИТИЧНО: Исправляет N+1 проблему
 * 
 * @param profileIds - Массив ID профилей
 * @param assessmentType - Тип оценки
 * @returns Map где ключ - profile_id, значение - Assessment или null
 */
export async function getCompletedAssessmentsForProfiles(
  profileIds: string[],
  assessmentType: 'checkup' | 'parent' | 'family'
): Promise<Record<string, Assessment | null>> {
  if (profileIds.length === 0) {
    return {};
  }

  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .in('profile_id', profileIds)
      .eq('assessment_type', assessmentType)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (error) throw error;

    // Группируем по profile_id, берем последнюю завершенную оценку для каждого профиля
    // Пропускаем чекапы с NULL profile_id (для удаленных профилей)
    const assessmentMap = data?.reduce((acc, assessment) => {
      // Пропускаем чекапы с NULL profile_id (удаленные профили)
      if (!assessment.profile_id) {
        return acc;
      }
      
      const existing = acc[assessment.profile_id];
      
      // Если еще нет оценки для этого профиля, или эта новее - сохраняем
      if (!existing || 
          (!existing.completed_at && assessment.completed_at) ||
          (existing.completed_at && assessment.completed_at &&
           new Date(assessment.completed_at) > new Date(existing.completed_at))) {
        acc[assessment.profile_id] = assessment;
      }
      return acc;
    }, {} as Record<string, Assessment>) || {};

    // Возвращаем Map со всеми профилями (null для тех, у кого нет оценок)
    const result: Record<string, Assessment | null> = {};
    for (const profileId of profileIds) {
      result[profileId] = assessmentMap[profileId] || null;
    }

    return result;
  } catch (error) {
    logger.error('Error getting assessments for profiles:', error);
    throw error;
  }
}

/**
 * Получить активные оценки для нескольких профилей одним запросом
 * 
 * @param profileIds - Массив ID профилей
 * @param assessmentType - Тип оценки
 * @returns Map где ключ - profile_id, значение - Assessment или null
 */
export async function getActiveAssessmentsForProfiles(
  profileIds: string[],
  assessmentType: 'checkup' | 'parent' | 'family'
): Promise<Record<string, Assessment | null>> {
  if (profileIds.length === 0) {
    return {};
  }

  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .in('profile_id', profileIds)
      .eq('assessment_type', assessmentType)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Группируем по profile_id, берем последнюю активную оценку для каждого профиля
    // Пропускаем чекапы с NULL profile_id (для удаленных профилей)
    const assessmentMap = data?.reduce((acc, assessment) => {
      // Пропускаем чекапы с NULL profile_id (удаленные профили)
      if (!assessment.profile_id) {
        return acc;
      }
      
      const existing = acc[assessment.profile_id];
      
      // Если еще нет оценки для этого профиля, или эта новее - сохраняем
      if (!existing || 
          (!existing.created_at && assessment.created_at) ||
          (existing.created_at && assessment.created_at &&
           new Date(assessment.created_at) > new Date(existing.created_at))) {
        acc[assessment.profile_id] = assessment;
      }
      return acc;
    }, {} as Record<string, Assessment>) || {};

    // Возвращаем Map со всеми профилями (null для тех, у кого нет активных оценок)
    const result: Record<string, Assessment | null> = {};
    for (const profileId of profileIds) {
      result[profileId] = assessmentMap[profileId] || null;
    }

    return result;
  } catch (error) {
    logger.error('Error getting active assessments for profiles:', error);
    throw error;
  }
}

/**
 * Получить все чекапы для всех профилей пользователя
 * Включает завершенные и незавершенные чекапы для истории
 */
export async function getAllAssessmentsForUser(): Promise<Assessment[]> {
  try {
    const { getCurrentUser, getProfiles } = await import('./profileStorage');
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Получаем все профили пользователя
    const profiles = await getProfiles();
    const profileIds = profiles.map(p => p.id);

    if (profileIds.length === 0) {
      return [];
    }

    // Получаем все чекапы для этих профилей
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .in('profile_id', profileIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    logger.error('Error getting all assessments for user:', error);
    throw error;
  }
}

type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * Найти следующего ребенка без завершенного чекапа
 * Оптимизировано: один запрос вместо N (исправлена N+1 проблема)
 *
 * @param currentProfileId - ID текущего профиля (исключается из поиска)
 * @returns Профиль следующего ребенка без чекапа или null
 */
export async function findNextChildWithoutCheckup(
  currentProfileId: string
): Promise<Profile | null> {
  try {
    const { getProfiles } = await import('./profileStorage');
    const profiles = await getProfiles();

    // Фильтруем детей, исключая текущего
    const children = profiles.filter(
      p => p.type === 'child' && p.id !== currentProfileId
    );

    if (children.length === 0) {
      return null;
    }

    // Один запрос для всех детей вместо N запросов
    const childIds = children.map(c => c.id);
    const assessmentsMap = await getCompletedAssessmentsForProfiles(childIds, 'checkup');

    // Находим первого ребенка без завершенного чекапа
    const childWithoutCheckup = children.find(child => {
      const assessment = assessmentsMap[child.id];
      return !assessment || assessment.status !== 'completed';
    });

    return childWithoutCheckup || null;
  } catch (error) {
    logger.error('Error finding next child without checkup:', error);
    return null;
  }
}
