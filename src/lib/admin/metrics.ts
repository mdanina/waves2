// Утилиты для расчета метрик продукта
import { supabase } from '@/lib/supabase';

export interface Metrics {
  users: {
    total: number;
    newThisPeriod: number;
    activeThisPeriod: number;
    byRegion: Array<{ region: string | null; count: number }>;
    marketingConsent: number;
  };
  profiles: {
    total: number;
    byType: Array<{ type: string; count: number }>;
    averageFamilySize: number;
    childrenByAge: Array<{ ageRange: string; count: number }>;
  };
  assessments: {
    total: number;
    completed: number;
    abandoned: number;
    inProgress: number;
    byType: Array<{ type: string; count: number }>;
    conversionRate: number;
    averageCompletionTime: number | null;
    paid: number;
    byWorryTags: Array<{ tag: string; count: number }>;
  };
  appointments: {
    scheduled: number;
    completed: number;
    cancelled: number;
    noShow: number;
    inProgress: number;
    byType: Array<{ type: string; count: number }>;
  };
  payments: {
    totalRevenue: number;
    revenueThisPeriod: number;
    successful: number;
    failed: number;
    averageCheck: number;
    byMethod: Array<{ method: string; count: number }>;
  };
  packages: {
    sold: number;
    sessionsUsed: number;
    sessionsRemaining: number;
  };
}

export interface MetricsPeriod {
  startDate: string;
  endDate: string;
}

// Получение метрик за период
export async function getMetrics(period?: MetricsPeriod): Promise<Metrics> {
  try {
    const startDate = period?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = period?.endDate || new Date().toISOString();

    // Параллельно загружаем все метрики
    const [
      usersMetrics,
      profilesMetrics,
      assessmentsMetrics,
      appointmentsMetrics,
      paymentsMetrics,
      packagesMetrics,
    ] = await Promise.all([
      getUsersMetrics(startDate, endDate),
      getProfilesMetrics(),
      getAssessmentsMetrics(startDate, endDate),
      getAppointmentsMetrics(startDate, endDate),
      getPaymentsMetrics(startDate, endDate),
      getPackagesMetrics(startDate, endDate),
    ]);

    return {
      users: usersMetrics,
      profiles: profilesMetrics,
      assessments: assessmentsMetrics,
      appointments: appointmentsMetrics,
      payments: paymentsMetrics,
      packages: packagesMetrics,
    };
  } catch (error) {
    console.error('Error in getMetrics:', error);
    // Возвращаем пустые метрики вместо падения
    return {
      users: {
        total: 0,
        newThisPeriod: 0,
        activeThisPeriod: 0,
        byRegion: [],
        marketingConsent: 0,
      },
      profiles: {
        total: 0,
        byType: [],
        averageFamilySize: 0,
        childrenByAge: [],
      },
      assessments: {
        total: 0,
        completed: 0,
        abandoned: 0,
        inProgress: 0,
        byType: [],
        conversionRate: 0,
        averageCompletionTime: null,
        paid: 0,
        byWorryTags: [],
      },
      appointments: {
        scheduled: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
        inProgress: 0,
        byType: [],
      },
      payments: {
        totalRevenue: 0,
        revenueThisPeriod: 0,
        successful: 0,
        failed: 0,
        averageCheck: 0,
        byMethod: [],
      },
      packages: {
        sold: 0,
        sessionsUsed: 0,
        sessionsRemaining: 0,
      },
    };
  }
}

async function getUsersMetrics(startDate: string, endDate: string) {
  try {
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, region, marketing_consent, created_at');
    
    if (allUsersError) {
      console.error('Error fetching all users:', allUsersError);
      throw allUsersError;
    }

    const { data: newUsers, error: newUsersError } = await supabase
      .from('users')
      .select('id')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (newUsersError) {
      console.error('Error fetching new users:', newUsersError);
      throw newUsersError;
    }

    // Активные пользователи - те, кто начал действие (создал оценку или записался на консультацию) за период
    // Примечание: учитываются любые действия, не только завершенные
    const { data: activeAssessments, error: assessmentsError } = await supabase
      .from('assessments')
      .select('profile_id')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (assessmentsError) {
      console.error('Error fetching active assessments:', assessmentsError);
      throw assessmentsError;
    }

    const { data: activeAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('user_id')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (appointmentsError) {
      console.error('Error fetching active appointments:', appointmentsError);
      throw appointmentsError;
    }

    const activeUserIds = new Set<string>();
    
    // Добавляем пользователей из оценок - ИСПРАВЛЕНО: один запрос вместо N+1
    if (activeAssessments && activeAssessments.length > 0) {
      const profileIds = activeAssessments
        .map(a => a.profile_id)
        .filter((id): id is string => Boolean(id));
      
      if (profileIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id')
          .in('id', profileIds);
        
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          // Продолжаем без профилей
        } else if (profiles) {
          profiles.forEach(profile => {
            if (profile.user_id) {
              activeUserIds.add(profile.user_id);
            }
          });
        }
      }
    }

    // Добавляем пользователей из консультаций
    if (activeAppointments) {
      activeAppointments.forEach((apt) => {
        if (apt.user_id) {
          activeUserIds.add(apt.user_id);
        }
      });
    }

    // Распределение по регионам
    const byRegion = (allUsers || []).reduce((acc, user) => {
      const region = user.region || 'Не указан';
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: allUsers?.length || 0,
      newThisPeriod: newUsers?.length || 0,
      activeThisPeriod: activeUserIds.size,
      byRegion: Object.entries(byRegion).map(([region, count]) => ({ region, count })),
      marketingConsent: (allUsers || []).filter((u) => u.marketing_consent).length,
    };
  } catch (error) {
    console.error('Error in getUsersMetrics:', error);
    return {
      total: 0,
      newThisPeriod: 0,
      activeThisPeriod: 0,
      byRegion: [],
      marketingConsent: 0,
    };
  }
}

async function getProfilesMetrics() {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('type, dob, user_id');

    if (error) {
      console.error('Error fetching profiles:', error);
      throw error;
    }

  const byType = (profiles || []).reduce((acc, profile) => {
    acc[profile.type] = (acc[profile.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Распределение детей по возрастам
  const children = (profiles || []).filter((p) => p.type === 'child' && p.dob);
  const childrenByAge = children.reduce((acc, child) => {
    if (!child.dob) return acc;
    const age = Math.floor((Date.now() - new Date(child.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    const ageRange = age < 3 ? '0-2' : age < 6 ? '3-5' : age < 10 ? '6-9' : age < 14 ? '10-13' : '14+';
    acc[ageRange] = (acc[ageRange] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Средний размер семьи
  const usersWithProfiles = new Set((profiles || []).map((p) => p.user_id));
  const averageFamilySize =
    usersWithProfiles.size > 0
      ? (profiles || []).length / usersWithProfiles.size
      : 0;

    return {
      total: profiles?.length || 0,
      byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
      averageFamilySize: Math.round(averageFamilySize * 10) / 10,
      childrenByAge: Object.entries(childrenByAge).map(([ageRange, count]) => ({ ageRange, count })),
    };
  } catch (error) {
    console.error('Error in getProfilesMetrics:', error);
    return {
      total: 0,
      byType: [],
      averageFamilySize: 0,
      childrenByAge: [],
    };
  }
}

async function getAssessmentsMetrics(startDate: string, endDate: string) {
  try {
    // Загружаем все оценки, созданные в периоде (для "Всего оценок")
    const { data: allAssessments, error } = await supabase
      .from('assessments')
      .select('id, assessment_type, status, is_paid, started_at, completed_at, updated_at, worry_tags')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) {
      console.error('Error fetching assessments:', error);
      throw error;
    }

    // Загружаем завершенные оценки за период (по completed_at)
    const { data: completedAssessments, error: completedError } = await supabase
      .from('assessments')
      .select('id, assessment_type, status, is_paid, started_at, completed_at, worry_tags')
      .eq('status', 'completed')
      .gte('completed_at', startDate)
      .lte('completed_at', endDate);

    if (completedError) {
      console.error('Error fetching completed assessments:', completedError);
      // Продолжаем без завершенных
    }

    // Загружаем брошенные оценки за период (по updated_at, когда статус стал abandoned)
    const { data: abandonedAssessments, error: abandonedError } = await supabase
      .from('assessments')
      .select('id, assessment_type, status, is_paid, started_at, completed_at, updated_at, worry_tags')
      .eq('status', 'abandoned')
      .gte('updated_at', startDate)
      .lte('updated_at', endDate);

    if (abandonedError) {
      console.error('Error fetching abandoned assessments:', abandonedError);
      // Продолжаем без брошенных
    }

    // Фильтруем оценки, созданные в периоде
    const completed = (allAssessments || []).filter((a) => a.status === 'completed');
    const abandoned = (allAssessments || []).filter((a) => a.status === 'abandoned');
    const inProgress = (allAssessments || []).filter((a) => a.status === 'in_progress');

    // Для метрик используем оценки, завершенные/брошенные в периоде
    const completedInPeriod = completedAssessments || [];
    const abandonedInPeriod = abandonedAssessments || [];

    const byType = (allAssessments || []).reduce((acc, assessment) => {
      acc[assessment.assessment_type] = (acc[assessment.assessment_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Конверсия: завершенные / (завершенные + брошенные)
    // Считаем только среди оценок, которые были завершены или брошены в периоде
    const started = completedInPeriod.length + abandonedInPeriod.length;
    const conversionRate = started > 0 ? (completedInPeriod.length / started) * 100 : 0;

  // Среднее активное время прохождения - считаем по времени между первым и последним ответом
  // Это более точная метрика, чем календарное время между started_at и completed_at
  const assessmentIds = completedInPeriod.map(a => a.id);
  
  let averageCompletionTime: number | null = null;
  
  if (assessmentIds.length > 0) {
    // Получаем время первого и последнего ответа для каждой оценки
    const { data: answersData, error: answersError } = await supabase
      .from('answers')
      .select('assessment_id, created_at')
      .in('assessment_id', assessmentIds)
      .order('created_at', { ascending: true });

    if (!answersError && answersData) {
      // Группируем ответы по assessment_id
      const answersByAssessment = answersData.reduce((acc, answer) => {
        if (!acc[answer.assessment_id]) {
          acc[answer.assessment_id] = [];
        }
        acc[answer.assessment_id].push(new Date(answer.created_at).getTime());
        return acc;
      }, {} as Record<string, number[]>);

      // Считаем активное время для каждой оценки (от первого до последнего ответа)
      const activeTimes: number[] = [];
      for (const assessmentId of assessmentIds) {
        const times = answersByAssessment[assessmentId];
        if (times && times.length > 1) {
          const activeTimeMs = times[times.length - 1] - times[0];
          const activeTimeMinutes = activeTimeMs / (1000 * 60);
          
          // Фильтруем выбросы: исключаем оценки, где активное время > 2 часов (120 минут)
          // Это разумный лимит для одной сессии диагностики
          if (activeTimeMinutes > 0 && activeTimeMinutes <= 120) {
            activeTimes.push(activeTimeMinutes);
          }
        }
      }

      if (activeTimes.length > 0) {
        averageCompletionTime = Math.round(
          activeTimes.reduce((sum, time) => sum + time, 0) / activeTimes.length
        );
      }
    }
  }

    // Worry tags считаем из всех оценок за период
    const allAssessmentsForTags = [...(allAssessments || []), ...(completedInPeriod || []), ...(abandonedInPeriod || [])];
    const uniqueAssessmentsForTags = Array.from(
      new Map(allAssessmentsForTags.map(a => [a.id, a])).values()
    );

    const worryTagsCount: Record<string, number> = {};
    uniqueAssessmentsForTags.forEach((a) => {
      if (a.worry_tags) {
        const tags = typeof a.worry_tags === 'object' && !Array.isArray(a.worry_tags)
          ? Object.values(a.worry_tags).flat()
          : Array.isArray(a.worry_tags)
          ? a.worry_tags
          : [];
        tags.forEach((tag: string) => {
          worryTagsCount[tag] = (worryTagsCount[tag] || 0) + 1;
        });
      }
    });

    // Оплаченные отчеты - из завершенных за период
    const paidInPeriod = completedInPeriod.filter((a) => a.is_paid).length;

    return {
      total: allAssessments?.length || 0, // Всего созданных в периоде
      completed: completedInPeriod.length, // Завершенных в периоде
      abandoned: abandonedInPeriod.length, // Брошенных в периоде
      inProgress: inProgress.length, // В процессе (созданных в периоде)
      byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
      conversionRate: Math.round(conversionRate * 10) / 10,
      averageCompletionTime: averageCompletionTime ? Math.round(averageCompletionTime) : null,
      paid: paidInPeriod, // Оплаченных среди завершенных за период
      byWorryTags: Object.entries(worryTagsCount)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count),
    };
  } catch (error) {
    console.error('Error in getAssessmentsMetrics:', error);
    return {
      total: 0,
      completed: 0,
      abandoned: 0,
      inProgress: 0,
      byType: [],
      conversionRate: 0,
      averageCompletionTime: null,
      paid: 0,
      byWorryTags: [],
    };
  }
}

async function getAppointmentsMetrics(startDate: string, endDate: string) {
  try {
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id, status, appointment_type_id, scheduled_at')
      .gte('scheduled_at', startDate)
      .lte('scheduled_at', endDate);

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
      throw appointmentsError;
    }

    if (!appointments || appointments.length === 0) {
      return {
        scheduled: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
        inProgress: 0,
        byType: [],
      };
    }

    const scheduled = appointments.filter((a) => a.status === 'scheduled');
    const completed = appointments.filter((a) => a.status === 'completed');
    const cancelled = appointments.filter((a) => a.status === 'cancelled');
    const noShow = appointments.filter((a) => a.status === 'no_show');
    const inProgress = appointments.filter((a) => a.status === 'in_progress');

    // По типам консультаций - оптимизировано: запрашиваем только если есть appointments
    const typeIds = [...new Set(appointments.map((a) => a.appointment_type_id).filter(Boolean))];
    let types: Array<{ id: string; name: string }> = [];
    
    if (typeIds.length > 0) {
      const { data: typesData, error: typesError } = await supabase
        .from('appointment_types')
        .select('id, name')
        .in('id', typeIds);

      if (typesError) {
        console.error('Error fetching appointment types:', typesError);
        // Продолжаем без типов
      } else {
        types = typesData || [];
      }
    }

    const byType: Record<string, number> = {};
    appointments.forEach((a) => {
      const type = types.find((t) => t.id === a.appointment_type_id);
      const typeName = type?.name || 'Неизвестно';
      byType[typeName] = (byType[typeName] || 0) + 1;
    });

    return {
      scheduled: scheduled.length,
      completed: completed.length,
      cancelled: cancelled.length,
      noShow: noShow.length,
      inProgress: inProgress.length,
      byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
    };
  } catch (error) {
    console.error('Error in getAppointmentsMetrics:', error);
    return {
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      inProgress: 0,
      byType: [],
    };
  }
}

async function getPaymentsMetrics(startDate: string, endDate: string) {
  try {
    const { data: allPayments, error: allPaymentsError } = await supabase
      .from('payments')
      .select('id, amount, status, payment_method, created_at');

    if (allPaymentsError) {
      console.error('Error fetching all payments:', allPaymentsError);
      throw allPaymentsError;
    }

    const { data: periodPayments, error: periodPaymentsError } = await supabase
      .from('payments')
      .select('id, amount, status, payment_method')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (periodPaymentsError) {
      console.error('Error fetching period payments:', periodPaymentsError);
      throw periodPaymentsError;
    }

  // Успешные платежи за все время (для общей статистики)
  const successfulAllTime = (allPayments || []).filter((p) => p.status === 'completed');
  // Успешные платежи за период
  const successfulInPeriod = (periodPayments || []).filter((p) => p.status === 'completed');
  // Неудачные платежи за период
  const failedInPeriod = (periodPayments || []).filter((p) => p.status === 'failed');

  // Общая выручка за все время
  const totalRevenueAllTime = successfulAllTime.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  // Выручка за период
  const revenueThisPeriod = successfulInPeriod.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // Средний чек за период
  const averageCheck = successfulInPeriod.length > 0 ? revenueThisPeriod / successfulInPeriod.length : 0;

  // Распределение по методам оплаты за период
  const byMethod = (periodPayments || []).reduce((acc, payment) => {
    const method = payment.payment_method || 'Неизвестно';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

    return {
      totalRevenue: Math.round(totalRevenueAllTime * 100) / 100, // Общая выручка за все время
      revenueThisPeriod: Math.round(revenueThisPeriod * 100) / 100, // Выручка за период
      successful: successfulInPeriod.length, // Успешных платежей за период
      failed: failedInPeriod.length, // Неудачных платежей за период
      averageCheck: Math.round(averageCheck * 100) / 100, // Средний чек за период
      byMethod: Object.entries(byMethod).map(([method, count]) => ({ method, count })),
    };
  } catch (error) {
    console.error('Error in getPaymentsMetrics:', error);
    return {
      totalRevenue: 0,
      revenueThisPeriod: 0,
      successful: 0,
      failed: 0,
      averageCheck: 0,
      byMethod: [],
    };
  }
}

async function getPackagesMetrics(startDate: string, endDate: string) {
  try {
    // Загружаем покупки пакетов за период
    const { data: periodPurchases, error: purchasesError } = await supabase
      .from('package_purchases')
      .select('id, package_id, sessions_remaining, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (purchasesError) {
      console.error('Error fetching package purchases:', purchasesError);
      throw purchasesError;
    }

    if (!periodPurchases || periodPurchases.length === 0) {
      return {
        sold: 0,
        sessionsUsed: 0,
        sessionsRemaining: 0,
      };
    }

    // Получаем уникальные package_id
    const packageIds = [...new Set(periodPurchases.map(p => p.package_id).filter(Boolean))];
    
    // Загружаем packages одним запросом
    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select('id, session_count')
      .in('id', packageIds);

    if (packagesError) {
      console.error('Error fetching packages:', packagesError);
      throw packagesError;
    }

    // Считаем оставшиеся сессии для покупок за период
    const totalSessions = (periodPurchases || []).reduce((sum, p) => sum + p.sessions_remaining, 0);

    // Подсчитываем использованные сессии для покупок за период
    let sessionsUsed = 0;
    (periodPurchases || []).forEach((purchase) => {
      const pkg = packages?.find((p) => p.id === purchase.package_id);
      if (pkg) {
        sessionsUsed += pkg.session_count - purchase.sessions_remaining;
      }
    });

    return {
      sold: periodPurchases.length,
      sessionsUsed,
      sessionsRemaining: totalSessions,
    };
  } catch (error) {
    console.error('Error in getPackagesMetrics:', error);
    return {
      sold: 0,
      sessionsUsed: 0,
      sessionsRemaining: 0,
    };
  }
}

