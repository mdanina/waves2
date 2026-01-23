// Типы целей тренировок
export type GoalId =
  | 'concentration'
  | 'activity'
  | 'anxiety'
  | 'sleep'
  | 'impulsivity'
  | 'emotional';

// Определение цели
export interface Goal {
  id: GoalId;
  title: string;
  description: string;
  icon: string; // emoji
  questions: GoalQuestion[];
}

// Типы вопросов
export type QuestionType = 'single' | 'multiple' | 'scale';

// Вопрос в опроснике
export interface GoalQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  label: string;
  value: string | number;
}

// Ответ пользователя
export interface GoalAnswer {
  questionId: string;
  value: string | string[] | number;
}

// Сохранённые цели профиля
export interface ProfileGoals {
  profileId: string;
  goals: GoalId[];
  answers: Record<GoalId, GoalAnswer[]>;
  recommendations?: GoalRecommendations;
  updatedAt: string;
}

// Рекомендации на основе ответов
export interface GoalRecommendations {
  intensity: 'light' | 'moderate' | 'intensive';
  sessionsPerWeek: number;
  sessionDuration: number; // минуты
  focusAreas: GoalId[];
  tips: string[];
}

// Все доступные цели с вопросами
export const TRAINING_GOALS: Goal[] = [
  {
    id: 'concentration',
    title: 'Концентрация внимания',
    description: 'Сложно удерживать фокус на задачах',
    icon: '🎯',
    questions: [
      {
        id: 'concentration_frequency',
        text: 'Как часто возникают трудности с концентрацией?',
        type: 'single',
        options: [
          { id: 'rarely', label: 'Редко', value: 1 },
          { id: 'sometimes', label: 'Иногда', value: 2 },
          { id: 'often', label: 'Часто', value: 3 },
          { id: 'always', label: 'Постоянно', value: 4 },
        ],
      },
      {
        id: 'concentration_situations',
        text: 'В каких ситуациях это проявляется?',
        type: 'multiple',
        options: [
          { id: 'study', label: 'Учёба / уроки', value: 'study' },
          { id: 'reading', label: 'Чтение книг', value: 'reading' },
          { id: 'homework', label: 'Домашние задания', value: 'homework' },
          { id: 'conversations', label: 'Разговоры', value: 'conversations' },
          { id: 'games', label: 'Игры / хобби', value: 'games' },
          { id: 'work', label: 'Работа', value: 'work' },
        ],
      },
      {
        id: 'concentration_duration',
        text: 'Как давно это беспокоит?',
        type: 'single',
        options: [
          { id: 'recent', label: 'Недавно (до месяца)', value: 1 },
          { id: 'months', label: 'Несколько месяцев', value: 2 },
          { id: 'year', label: 'Около года', value: 3 },
          { id: 'years', label: 'Больше года', value: 4 },
        ],
      },
    ],
  },
  {
    id: 'activity',
    title: 'Управление активностью',
    description: 'Сложно усидеть на месте, много энергии',
    icon: '⚡',
    questions: [
      {
        id: 'activity_frequency',
        text: 'Как часто сложно усидеть на месте?',
        type: 'single',
        options: [
          { id: 'rarely', label: 'Редко', value: 1 },
          { id: 'sometimes', label: 'Иногда', value: 2 },
          { id: 'often', label: 'Часто', value: 3 },
          { id: 'always', label: 'Постоянно', value: 4 },
        ],
      },
      {
        id: 'activity_manifestation',
        text: 'Как это обычно проявляется?',
        type: 'multiple',
        options: [
          { id: 'fidgeting', label: 'Ёрзание, постукивание', value: 'fidgeting' },
          { id: 'standing', label: 'Встаёт, когда нужно сидеть', value: 'standing' },
          { id: 'running', label: 'Бегает, когда неуместно', value: 'running' },
          { id: 'talking', label: 'Много говорит', value: 'talking' },
          { id: 'restless', label: 'Внутреннее беспокойство', value: 'restless' },
        ],
      },
      {
        id: 'activity_impact',
        text: 'Насколько это мешает в повседневной жизни?',
        type: 'single',
        options: [
          { id: 'not_much', label: 'Почти не мешает', value: 1 },
          { id: 'slightly', label: 'Немного мешает', value: 2 },
          { id: 'moderately', label: 'Умеренно мешает', value: 3 },
          { id: 'significantly', label: 'Сильно мешает', value: 4 },
        ],
      },
    ],
  },
  {
    id: 'anxiety',
    title: 'Снижение тревожности',
    description: 'Беспокойство, волнение, переживания',
    icon: '😌',
    questions: [
      {
        id: 'anxiety_frequency',
        text: 'Как часто возникает чувство тревоги?',
        type: 'single',
        options: [
          { id: 'rarely', label: 'Редко', value: 1 },
          { id: 'sometimes', label: 'Иногда', value: 2 },
          { id: 'often', label: 'Часто', value: 3 },
          { id: 'always', label: 'Почти всегда', value: 4 },
        ],
      },
      {
        id: 'anxiety_triggers',
        text: 'Что обычно вызывает тревогу?',
        type: 'multiple',
        options: [
          { id: 'school', label: 'Школа / учёба', value: 'school' },
          { id: 'social', label: 'Общение с людьми', value: 'social' },
          { id: 'new_situations', label: 'Новые ситуации', value: 'new_situations' },
          { id: 'performance', label: 'Выступления, оценка', value: 'performance' },
          { id: 'separation', label: 'Разлука с близкими', value: 'separation' },
          { id: 'no_reason', label: 'Без видимой причины', value: 'no_reason' },
        ],
      },
      {
        id: 'anxiety_physical',
        text: 'Есть ли физические проявления?',
        type: 'multiple',
        options: [
          { id: 'heart', label: 'Учащённое сердцебиение', value: 'heart' },
          { id: 'sweating', label: 'Потливость', value: 'sweating' },
          { id: 'stomach', label: 'Дискомфорт в животе', value: 'stomach' },
          { id: 'tension', label: 'Мышечное напряжение', value: 'tension' },
          { id: 'none', label: 'Нет физических проявлений', value: 'none' },
        ],
      },
    ],
  },
  {
    id: 'sleep',
    title: 'Качество сна',
    description: 'Трудности с засыпанием, беспокойный сон',
    icon: '🌙',
    questions: [
      {
        id: 'sleep_problems',
        text: 'Какие проблемы со сном беспокоят?',
        type: 'multiple',
        options: [
          { id: 'falling_asleep', label: 'Трудно заснуть', value: 'falling_asleep' },
          { id: 'staying_asleep', label: 'Просыпается ночью', value: 'staying_asleep' },
          { id: 'early_wake', label: 'Просыпается слишком рано', value: 'early_wake' },
          { id: 'not_rested', label: 'Не чувствует себя отдохнувшим', value: 'not_rested' },
          { id: 'nightmares', label: 'Кошмары', value: 'nightmares' },
        ],
      },
      {
        id: 'sleep_frequency',
        text: 'Как часто возникают проблемы со сном?',
        type: 'single',
        options: [
          { id: 'rarely', label: 'Редко (раз в неделю)', value: 1 },
          { id: 'sometimes', label: 'Несколько раз в неделю', value: 2 },
          { id: 'often', label: 'Почти каждый день', value: 3 },
          { id: 'always', label: 'Каждый день', value: 4 },
        ],
      },
      {
        id: 'sleep_duration',
        text: 'Сколько обычно длится сон?',
        type: 'single',
        options: [
          { id: 'less_6', label: 'Менее 6 часов', value: 1 },
          { id: '6_7', label: '6-7 часов', value: 2 },
          { id: '7_8', label: '7-8 часов', value: 3 },
          { id: 'more_8', label: 'Более 8 часов', value: 4 },
        ],
      },
    ],
  },
  {
    id: 'impulsivity',
    title: 'Контроль импульсивности',
    description: 'Сложно сдерживать порывы и реакции',
    icon: '💪',
    questions: [
      {
        id: 'impulsivity_frequency',
        text: 'Как часто действует не подумав?',
        type: 'single',
        options: [
          { id: 'rarely', label: 'Редко', value: 1 },
          { id: 'sometimes', label: 'Иногда', value: 2 },
          { id: 'often', label: 'Часто', value: 3 },
          { id: 'always', label: 'Постоянно', value: 4 },
        ],
      },
      {
        id: 'impulsivity_manifestation',
        text: 'Как это обычно проявляется?',
        type: 'multiple',
        options: [
          { id: 'interrupts', label: 'Перебивает других', value: 'interrupts' },
          { id: 'blurts', label: 'Выкрикивает ответы', value: 'blurts' },
          { id: 'impatient', label: 'Не может ждать своей очереди', value: 'impatient' },
          { id: 'risky', label: 'Рискованные поступки', value: 'risky' },
          { id: 'emotional', label: 'Эмоциональные вспышки', value: 'emotional' },
        ],
      },
      {
        id: 'impulsivity_consequences',
        text: 'К каким последствиям это приводит?',
        type: 'multiple',
        options: [
          { id: 'conflicts', label: 'Конфликты с окружающими', value: 'conflicts' },
          { id: 'regret', label: 'Сожаление о сказанном/сделанном', value: 'regret' },
          { id: 'mistakes', label: 'Ошибки по невнимательности', value: 'mistakes' },
          { id: 'injuries', label: 'Травмы, несчастные случаи', value: 'injuries' },
          { id: 'none', label: 'Особых последствий нет', value: 'none' },
        ],
      },
    ],
  },
  {
    id: 'emotional',
    title: 'Эмоциональный баланс',
    description: 'Перепады настроения, раздражительность',
    icon: '💚',
    questions: [
      {
        id: 'emotional_frequency',
        text: 'Как часто меняется настроение?',
        type: 'single',
        options: [
          { id: 'rarely', label: 'Редко', value: 1 },
          { id: 'sometimes', label: 'Иногда', value: 2 },
          { id: 'often', label: 'Часто', value: 3 },
          { id: 'always', label: 'Несколько раз в день', value: 4 },
        ],
      },
      {
        id: 'emotional_manifestation',
        text: 'Какие эмоции сложнее всего контролировать?',
        type: 'multiple',
        options: [
          { id: 'anger', label: 'Гнев, раздражение', value: 'anger' },
          { id: 'sadness', label: 'Грусть, подавленность', value: 'sadness' },
          { id: 'frustration', label: 'Разочарование', value: 'frustration' },
          { id: 'excitement', label: 'Чрезмерное возбуждение', value: 'excitement' },
          { id: 'sensitivity', label: 'Обидчивость', value: 'sensitivity' },
        ],
      },
      {
        id: 'emotional_triggers',
        text: 'Что обычно вызывает эмоциональные реакции?',
        type: 'multiple',
        options: [
          { id: 'criticism', label: 'Критика, замечания', value: 'criticism' },
          { id: 'changes', label: 'Изменение планов', value: 'changes' },
          { id: 'failures', label: 'Неудачи, ошибки', value: 'failures' },
          { id: 'fatigue', label: 'Усталость', value: 'fatigue' },
          { id: 'no_reason', label: 'Без видимой причины', value: 'no_reason' },
        ],
      },
    ],
  },
];

// Функция получения цели по ID
export function getGoalById(id: GoalId): Goal | undefined {
  return TRAINING_GOALS.find(g => g.id === id);
}

// Функция генерации рекомендаций на основе ответов
export function generateRecommendations(
  goals: GoalId[],
  answers: Record<GoalId, GoalAnswer[]>
): GoalRecommendations {
  // Подсчитываем общую "тяжесть" на основе ответов
  let totalSeverity = 0;
  let answerCount = 0;

  for (const goalId of goals) {
    const goalAnswers = answers[goalId] || [];
    for (const answer of goalAnswers) {
      if (typeof answer.value === 'number') {
        totalSeverity += answer.value;
        answerCount++;
      }
    }
  }

  const avgSeverity = answerCount > 0 ? totalSeverity / answerCount : 2;

  // Определяем интенсивность
  let intensity: GoalRecommendations['intensity'] = 'moderate';
  let sessionsPerWeek = 4;
  let sessionDuration = 20;

  if (avgSeverity <= 1.5) {
    intensity = 'light';
    sessionsPerWeek = 3;
    sessionDuration = 15;
  } else if (avgSeverity >= 3) {
    intensity = 'intensive';
    sessionsPerWeek = 5;
    sessionDuration = 25;
  }

  // Определяем основные фокусы (первые 2 цели с наибольшей "тяжестью")
  const focusAreas = goals.slice(0, 2);

  // Генерируем советы
  const tips: string[] = [];

  if (goals.includes('concentration')) {
    tips.push('Начинайте тренировки в тихом месте без отвлекающих факторов');
  }
  if (goals.includes('activity')) {
    tips.push('Перед тренировкой полезно сделать небольшую физическую разминку');
  }
  if (goals.includes('anxiety')) {
    tips.push('Практикуйте глубокое дыхание перед началом сессии');
  }
  if (goals.includes('sleep')) {
    tips.push('Проводите вечернюю тренировку за 1-2 часа до сна');
  }
  if (goals.includes('impulsivity')) {
    tips.push('Отмечайте моменты, когда удалось сдержаться — это усилит прогресс');
  }
  if (goals.includes('emotional')) {
    tips.push('Ведите дневник настроения, чтобы отслеживать улучшения');
  }

  return {
    intensity,
    sessionsPerWeek,
    sessionDuration,
    focusAreas,
    tips,
  };
}
