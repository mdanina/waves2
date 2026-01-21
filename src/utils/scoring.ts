/**
 * Утилиты для работы со шкалами оценок
 * Используются в CheckupQuestions, FamilyQuestions, ParentQuestions
 */

/**
 * Создаёт функцию обратного преобразования оценки для заданного максимума
 * @param max - максимальное значение шкалы
 * @returns функция, которая преобразует value в (max - value)
 */
export function createReverseScore(max: number) {
  return (value: number): number => {
    if (value < 0 || value > max) return value;
    return max - value;
  };
}

/**
 * Создаёт функцию обратного преобразования (unreverse) для заданного максимума
 * @param max - максимальное значение шкалы
 * @returns функция, которая преобразует value обратно в исходное значение
 */
export function createUnreverseScore(max: number) {
  return (value: number): number => {
    if (value < 0 || value > max) return value;
    return max - value;
  };
}

// Предопределённые функции для часто используемых шкал

/** Обратное преобразование для шкалы 0-4 (Checkup) */
export const reverseScore4 = createReverseScore(4);
export const unreverseScore4 = createUnreverseScore(4);

/** Обратное преобразование для шкалы 0-5 (Family) */
export const reverseScore5 = createReverseScore(5);
export const unreverseScore5 = createUnreverseScore(5);

/** Обратное преобразование для шкалы 0-3 (Parent) */
export const reverseScore3 = createReverseScore(3);
export const unreverseScore3 = createUnreverseScore(3);
