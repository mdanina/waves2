/**
 * Утилиты для вычислений и форматирования результатов оценок
 */

/**
 * Получить текст статуса на русском языке
 */
export function getStatusText(status: string): string {
  switch (status) {
    case 'concerning':
    case 'high_impact':
      return 'Тревожно';
    case 'borderline':
    case 'medium_impact':
      return 'Погранично';
    case 'typical':
    case 'low_impact':
      return 'Все в порядке';
    default:
      return 'Неизвестно';
  }
}

/**
 * Получить цвет статуса для отображения
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'concerning':
    case 'high_impact':
      return 'text-white bg-coral';
    case 'borderline':
    case 'medium_impact':
      return 'text-white bg-yellow-400';
    case 'typical':
    case 'low_impact':
      return 'text-white bg-secondary';
    default:
      return 'text-white bg-secondary';
  }
}

/**
 * Получить линейный символ статуса для визуального отображения
 */
export function getStatusEmoji(status: string): string {
  switch (status) {
    case 'concerning':
    case 'high_impact':
      return '⚠'; // предупреждение
    case 'borderline':
    case 'medium_impact':
      return '○'; // нейтральный круг
    case 'typical':
    case 'low_impact':
      return '✓'; // галочка
    default:
      return '○';
  }
}

/**
 * Рассчитать процент прогресс-бара (0-100%)
 */
export function getProgressPercentage(score: number, maxScore: number): number {
  return Math.min((score / maxScore) * 100, 100);
}

