export interface ParentQuestion {
  id: number;
  text: string;
  category: string;
  answerType: 'frequency' | 'default';
  isReverse?: boolean; // Для обратных вопросов (reverse scoring)
}

export const parentQuestions: ParentQuestion[] = [
  { id: 1, text: "Чувство нервозности, тревоги или беспокойства", category: "О вас", answerType: 'frequency' },
  { id: 2, text: "Невозможность остановить или контролировать беспокойство", category: "О вас", answerType: 'frequency' },
  { id: 3, text: "Малый интерес или удовольствие от занятий", category: "О вас", answerType: 'frequency' },
  { id: 4, text: "Чувство подавленности, депрессии или безнадежности", category: "О вас", answerType: 'frequency' },
];

export const frequencyOptions = [
  { value: 0, label: "Совсем нет" },
  { value: 1, label: "Несколько дней" },
  { value: 2, label: "Больше половины дней" },
  { value: 3, label: "Почти каждый день" },
];
