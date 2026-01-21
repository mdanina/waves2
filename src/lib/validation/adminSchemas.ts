// Схемы валидации для админ-панели
import { z } from 'zod';

// Схема для редактирования пользователя
export const editUserSchema = z.object({
  email: z
    .string()
    .email('Некорректный email')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Некорректный номер телефона')
    .optional()
    .or(z.literal('')),
  region: z.string().max(100, 'Регион слишком длинный').optional().or(z.literal('')),
  role: z.enum(['user', 'support', 'admin', 'super_admin'], {
    errorMap: () => ({ message: 'Выберите роль' }),
  }),
  marketing_consent: z.boolean(),
});

export type EditUserInput = z.infer<typeof editUserSchema>;












