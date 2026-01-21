export interface FamilyQuestion {
  id: number;
  text: string;
  category: string;
  answerType: 'wellbeing' | 'relationship' | 'frequency';
  isReverse?: boolean; // Для обратных вопросов (reverse scoring)
}

export const familyQuestions: FamilyQuestion[] = [
  { id: 1, text: "Как дела у вашей семьи?", category: "О семье", answerType: 'wellbeing' },
  { id: 2, text: "Как часто вы думаете, что отношения между вами и вашим партнером складываются хорошо?", category: "О семье", answerType: 'relationship' },
  { id: 3, text: "Как часто вы с партнером ссоритесь?", category: "О семье", answerType: 'frequency', isReverse: true },
  { id: 4, text: "Как часто вы и партнер(ы) по воспитанию вашего ребенка работаете вместе в воспитании вашего ребенка?", category: "О семье", answerType: 'frequency' },
  { id: 5, text: "Как часто вы и партнер(ы) по воспитанию спорите о том, как воспитывать вашего ребенка?", category: "О семье", answerType: 'frequency', isReverse: true },
];

export const wellbeingOptions = [
  { value: 0, label: "Все в порядке" },
  { value: 1, label: "Мы в стрессе, но справляемся" },
  { value: 2, label: "Мы очень напряжены" },
  { value: 3, label: "Мы скоро не сможем справиться" },
  { value: 4, label: "Мы в кризисе" },
];

export const relationshipOptions = [
  { value: 0, label: "Все время" },
  { value: 1, label: "Большую часть времени" },
  { value: 2, label: "Чаще да, чем нет" },
  { value: 3, label: "Иногда" },
  { value: 4, label: "Редко" },
  { value: 5, label: "Никогда" },
  { value: 6, label: "Не применимо" },
];

export const frequencyOptions = [
  { value: 0, label: "Все время" },
  { value: 1, label: "Большую часть времени" },
  { value: 2, label: "Чаще да, чем нет" },
  { value: 3, label: "Иногда" },
  { value: 4, label: "Редко" },
  { value: 5, label: "Никогда" },
  { value: 6, label: "Не применимо" },
];
