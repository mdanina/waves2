// Схемы валидации с Zod
import { z } from 'zod';

// Базовые схемы
export const emailSchema = z
  .string()
  .min(1, 'Email обязателен')
  .email('Некорректный email');

export const passwordSchema = z
  .string()
  .min(6, 'Пароль должен быть не менее 6 символов')
  .max(100, 'Пароль слишком длинный')
  .regex(/^.{6,}$/, 'Пароль должен содержать минимум 6 символов');

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Некорректный номер телефона')
  .optional()
  .or(z.literal(''));

// Схема регистрации
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Подтверждение пароля обязательно'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

// Схема входа
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Пароль обязателен'),
});

// Схема профиля
export const profileSchema = z.object({
  firstName: z.string().min(1, 'Имя обязательно').max(100, 'Имя слишком длинное'),
  lastName: z.string().max(100, 'Фамилия слишком длинная').optional(),
  phone: phoneSchema,
  region: z.string().optional(),
});

// Схема для добавления члена семьи
export const familyMemberSchema = z.object({
  firstName: z.string().min(1, 'Имя обязательно').max(100, 'Имя слишком длинное'),
  lastName: z.string().max(100, 'Фамилия слишком длинная').optional(),
  relationship: z.enum(['parent', 'child', 'partner', 'sibling', 'caregiver', 'other'], {
    errorMap: () => ({ message: 'Выберите тип отношения' }),
  }),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  pronouns: z.string().max(50).optional(),
});

// Схема восстановления пароля (запрос)
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Схема сброса пароля
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Подтверждение пароля обязательно'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

// Схема заявки специалиста
export const specialistApplicationSchema = z.object({
  // Основная информация
  fullName: z
    .string()
    .min(2, 'Имя должно содержать минимум 2 символа')
    .max(255, 'Имя слишком длинное'),
  email: emailSchema,
  phone: z
    .string()
    .min(10, 'Введите корректный номер телефона')
    .max(20, 'Номер телефона слишком длинный'),

  // Специализация
  specializationCode: z.string().min(1, 'Выберите специализацию'),
  customSpecialization: z
    .string()
    .max(255, 'Название специализации слишком длинное')
    .optional()
    .or(z.literal('')),
  primaryMethod: z
    .string()
    .min(2, 'Укажите основной метод работы')
    .max(500, 'Описание метода слишком длинное'),

  // Образование
  baseEducationHours: z
    .number({ invalid_type_error: 'Введите число' })
    .int('Введите целое число')
    .min(0, 'Количество часов не может быть отрицательным')
    .max(10000, 'Слишком большое значение'),
  certificationHours: z
    .number({ invalid_type_error: 'Введите число' })
    .int('Введите целое число')
    .min(0, 'Количество часов не может быть отрицательным')
    .max(10000, 'Слишком большое значение'),
  
  // Описание образования
  educationDescription: z
    .string()
    .max(2000, 'Описание слишком длинное')
    .optional()
    .or(z.literal('')),
  canConfirmEducation: z.boolean().optional(),

  // Опыт работы
  experienceYears: z
    .number({ invalid_type_error: 'Введите число' })
    .int('Введите целое число')
    .min(0, 'Стаж не может быть отрицательным')
    .max(70, 'Слишком большое значение'),
  // Характер работы
  workTypePrivate: z.boolean().optional(),
  workTypePrivateYears: z
    .number({ invalid_type_error: 'Введите число' })
    .int('Введите целое число')
    .min(0, 'Стаж не может быть отрицательным')
    .max(70, 'Слишком большое значение')
    .optional()
    .nullable(),
  workTypeCenter: z.boolean().optional(),
  workTypeCenterYears: z
    .number({ invalid_type_error: 'Введите число' })
    .int('Введите целое число')
    .min(0, 'Стаж не может быть отрицательным')
    .max(70, 'Слишком большое значение')
    .optional()
    .nullable(),
  workTypeClinic: z.boolean().optional(),
  workTypeClinicYears: z
    .number({ invalid_type_error: 'Введите число' })
    .int('Введите целое число')
    .min(0, 'Стаж не может быть отрицательным')
    .max(70, 'Слишком большое значение')
    .optional()
    .nullable(),
  workTypeOnline: z.boolean().optional(),
  workTypeOnlineYears: z
    .number({ invalid_type_error: 'Введите число' })
    .int('Введите целое число')
    .min(0, 'Стаж не может быть отрицательным')
    .max(70, 'Слишком большое значение')
    .optional()
    .nullable(),
  
  // Партнерские проекты и сотрудничества
  partnerships: z.string().max(2000, 'Слишком длинный текст').optional(),

  // Формат работы (онлайн/оффлайн)
  worksOnline: z.boolean().optional(),
  worksOffline: z.boolean().optional(),
  offlineCity: z.string().max(100, 'Название города слишком длинное').optional(),
  offlineAddress: z.string().max(500, 'Адрес слишком длинный').optional(),
  providesHomeVisits: z.boolean().optional(),
  homeVisitCity: z.string().max(100, 'Название города слишком длинное').optional(),
  
  // Стоимость работы
  hourlyRateOffline: z
    .number({ invalid_type_error: 'Введите число' })
    .int('Введите целое число')
    .min(0, 'Стоимость не может быть отрицательной')
    .max(100000, 'Слишком большое значение')
    .optional()
    .nullable(),
  hourlyRateOnline: z
    .number({ invalid_type_error: 'Введите число' })
    .int('Введите целое число')
    .min(0, 'Стоимость не может быть отрицательной')
    .max(100000, 'Слишком большое значение')
    .optional()
    .nullable(),

  // Форматы работы
  workFormats: z.array(z.string()).optional(),

  // Дополнительно
  otherExperience: z.boolean().optional(),
  otherExperienceText: z
    .string()
    .min(2, 'Укажите дополнительную информацию')
    .max(1000, 'Слишком длинный текст')
    .optional(),
  socialLinks: z.string().max(1000, 'Слишком длинный текст').optional(),
  additionalInfo: z.string().max(2000, 'Слишком длинный текст').optional(),
})
  .superRefine((data, ctx) => {
    // Если выбрано "Другое", то customSpecialization обязателен
    if (data.specializationCode === 'other') {
      if (!data.customSpecialization || 
          typeof data.customSpecialization !== 'string' || 
          data.customSpecialization.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Укажите вашу специализацию',
          path: ['customSpecialization'],
        });
      }
    }
  })
  .refine(
    (data) => {
      // Если выбрано "Другое" в опыте, то otherExperienceText обязателен
      if (data.otherExperience) {
        return data.otherExperienceText && data.otherExperienceText.trim().length >= 2;
      }
      return true;
    },
    {
      message: 'Укажите дополнительную информацию',
      path: ['otherExperienceText'],
    }
  )
  .refine(
    (data) => {
      // Если выбрано "Работаю очно", то город обязателен
      if (data.worksOffline) {
        return data.offlineCity && data.offlineCity.trim().length >= 2;
      }
      return true;
    },
    {
      message: 'Укажите город для очной работы',
      path: ['offlineCity'],
    }
  )
  .refine(
    (data) => {
      // Если выбрано "Выезжаю на дом", то город для выезда обязателен
      if (data.providesHomeVisits) {
        return data.homeVisitCity && data.homeVisitCity.trim().length >= 2;
      }
      return true;
    },
    {
      message: 'Укажите город для выезда на дом',
      path: ['homeVisitCity'],
    }
  );

// Форматы работы специалиста
export const workFormatOptions = [
  { value: 'diagnostics', label: 'Диагностика' },
  { value: 'correction_individual', label: 'Коррекционные занятия индивидуально' },
  { value: 'consulting', label: 'Консультирование' },
  { value: 'family_work', label: 'Работа с семьей' },
  { value: 'parent_consulting', label: 'Консультирование родителей' },
  { value: 'group_work', label: 'Групповая работа' },
  { value: 'training', label: 'Тренинги' },
  { value: 'webinar', label: 'Вебинары' },
] as const;

// Экспорт типов
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type FamilyMemberInput = z.infer<typeof familyMemberSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type SpecialistApplicationInput = z.infer<typeof specialistApplicationSchema>;












