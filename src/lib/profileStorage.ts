// Утилиты для работы с профилями (profiles) в Supabase
import { supabase } from './supabase';
import type { Database } from './supabase';
import { logger } from './logger';
import { inclineFirstname } from 'lvovich';
import type { AgeGroup } from '@/data/checkupQuestions';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export interface FamilyMemberInput {
  firstName: string;
  lastName?: string;
  dateOfBirth?: string;
  relationship: 'parent' | 'child' | 'partner' | 'sibling' | 'caregiver' | 'other';
  sex?: 'male' | 'female' | 'other';
  pronouns?: string;
  referral?: string;
  seekingCare?: 'yes' | 'no';
  worryTags?: string[];
}

/**
 * Получить текущего пользователя
 */
export async function getCurrentUser() {
  // Используем getSession вместо getUser для более надежной работы
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

/**
 * Получить все профили текущего пользователя
 * @param userId - ID пользователя (опционально, если не указан, будет получен из сессии)
 */
export async function getProfiles(userId?: string): Promise<Profile[]> {
  try {
    let user: { id: string } | null;
    if (userId) {
      // Если userId передан, используем его
      user = { id: userId };
    } else {
      // Иначе получаем из сессии
      user = await getCurrentUser();
    }
    
    if (!user) {
      logger.warn('getProfiles: User not authenticated');
      throw new Error('User not authenticated');
    }

    logger.log('getProfiles: Fetching profiles for user:', user.id);
    logger.log('getProfiles: Supabase client initialized:', !!supabase);

    const startTime = Date.now();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    const duration = Date.now() - startTime;
    
    logger.log(`getProfiles: Query completed in ${duration}ms`);

    if (error) {
      logger.error('getProfiles: Supabase error:', error);
      logger.error('getProfiles: Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    logger.log('getProfiles: Query completed. Data:', data);
    logger.log('getProfiles: Successfully loaded', data?.length || 0, 'profiles');
    
    if (data && data.length > 0) {
      logger.log('getProfiles: Profile IDs:', data.map(p => p.id));
    } else {
      logger.warn('getProfiles: No profiles found for user:', user.id);
    }
    
    return data || [];
  } catch (error) {
    logger.error('Error getting profiles:', error);
    throw error;
  }
}

/**
 * Получить профиль по ID
 */
export async function getProfile(profileId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting profile:', error);
    return null;
  }
}

/**
 * Создать новый профиль
 */
export async function createProfile(member: FamilyMemberInput): Promise<Profile> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const profileData: ProfileInsert = {
      user_id: user.id,
      type: member.relationship,
      first_name: member.firstName,
      last_name: member.lastName || null,
      dob: member.dateOfBirth || null,
      gender: member.sex || null,
      pronouns: member.pronouns || null,
      referral: member.referral || null,
      seeking_care: member.seekingCare || null,
      worry_tags: member.worryTags || null,
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error('Error creating profile:', error);
    throw error;
  }
}

/**
 * Обновить профиль
 */
export async function updateProfile(
  profileId: string,
  updates: Partial<FamilyMemberInput>
): Promise<Profile> {
  try {
    const updateData: ProfileUpdate = {};

    if (updates.firstName) updateData.first_name = updates.firstName;
    if (updates.lastName !== undefined) updateData.last_name = updates.lastName || null;
    if (updates.dateOfBirth) updateData.dob = updates.dateOfBirth;
    if (updates.relationship) updateData.type = updates.relationship;
    if (updates.sex) updateData.gender = updates.sex;
    if (updates.pronouns !== undefined) updateData.pronouns = updates.pronouns || null;
    if (updates.referral !== undefined) updateData.referral = updates.referral || null;
    if (updates.seekingCare) updateData.seeking_care = updates.seekingCare;
    // worryTags может быть массивом (даже пустым) или undefined
    if (updates.worryTags !== undefined) {
      updateData.worry_tags = updates.worryTags.length > 0 ? updates.worryTags : null;
      logger.log('Updating worry_tags:', {
        profileId,
        worryTags: updates.worryTags,
        updateData: updateData.worry_tags
      });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      logger.error('Supabase update error:', error);
      throw error;
    }
    
    logger.log('Profile update result:', {
      profileId: data.id,
      worry_tags: data.worry_tags
    });

    return data;
  } catch (error) {
    logger.error('Error updating profile:', error);
    throw error;
  }
}

/**
 * Удалить профиль
 */
export async function deleteProfile(profileId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting profile:', error);
    throw error;
  }
}

/**
 * Вычислить возраст из даты рождения
 */
export function calculateAge(dateOfBirth: string): number {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Минимальный и максимальный возраст для прохождения чекапа
 */
export const CHECKUP_MIN_AGE = 3;
export const CHECKUP_MAX_AGE = 18;

/**
 * Проверить, подходит ли ребенок по возрасту для прохождения чекапа
 * @param dateOfBirth - дата рождения в формате ISO
 * @returns объект с полями eligible (подходит ли) и reason (причина)
 */
export function isEligibleForCheckup(dateOfBirth: string | null | undefined): {
  eligible: boolean;
  reason?: 'too_young' | 'too_old' | 'no_dob';
  age?: number;
} {
  if (!dateOfBirth) {
    return { eligible: false, reason: 'no_dob' };
  }

  const age = calculateAge(dateOfBirth);

  if (age < CHECKUP_MIN_AGE) {
    return { eligible: false, reason: 'too_young', age };
  }

  if (age > CHECKUP_MAX_AGE) {
    return { eligible: false, reason: 'too_old', age };
  }

  return { eligible: true, age };
}

/**
 * Определить возрастную группу ребенка для чекапа
 * @param dateOfBirth - дата рождения в формате ISO
 * @returns 'preschool' (3-6 лет), 'elementary' (7-11 лет) или 'teenager' (12-18 лет)
 */
export function getAgeGroup(dateOfBirth: string | null | undefined): AgeGroup {
  if (!dateOfBirth) {
    return 'elementary'; // По умолчанию - младшие школьники
  }

  const age = calculateAge(dateOfBirth);

  if (age >= 3 && age <= 6) {
    return 'preschool';
  } else if (age >= 7 && age <= 11) {
    return 'elementary';
  } else {
    return 'teenager'; // 12+ лет
  }
}

/**
 * Получить название возрастной группы на русском
 */
export function getAgeGroupLabel(ageGroup: AgeGroup): string {
  switch (ageGroup) {
    case 'preschool':
      return 'Дошкольник (3-6 лет)';
    case 'elementary':
      return 'Младший школьник (7-11 лет)';
    case 'teenager':
      return 'Подросток (12-18 лет)';
    default:
      return 'Ребенок';
  }
}

/**
 * Склонить имя в предложный падеж (о ком? о чём?)
 * Используется для заголовков типа "Пожалуйста, ответьте на вопросы о Маше"
 * @param firstName - имя в именительном падеже
 * @param gender - пол ('male' | 'female' | 'other')
 * @returns имя в предложном падеже или оригинальное имя если склонение не удалось
 */
export function getPrepositionalName(
  firstName: string | null | undefined,
  gender?: 'male' | 'female' | 'other' | null
): string {
  if (!firstName) {
    return 'вашем ребенке';
  }

  try {
    // lvovich использует 'male' и 'female', для 'other' пробуем определить автоматически
    const lvovichGender = gender === 'male' ? 'male' : gender === 'female' ? 'female' : undefined;

    const result = inclineFirstname(firstName, 'prepositional', lvovichGender);

    // Если библиотека вернула то же самое имя, значит не смогла склонить
    if (result && result !== firstName) {
      return result;
    }

    // Фоллбэк: простое правило для русских имен
    return simplePrepositionalDeclension(firstName, gender);
  } catch (error) {
    logger.warn('Failed to decline name to prepositional:', firstName, error);
    return simplePrepositionalDeclension(firstName, gender);
  }
}

/**
 * Простое склонение имени в предложный падеж (о ком? о чём?)
 * Используется как фоллбэк если библиотека не справилась
 * Примеры: Маша → Маше, Иван → Иване, Мария → Марии, Дмитрий → Дмитрии
 */
function simplePrepositionalDeclension(
  name: string,
  gender?: 'male' | 'female' | 'other' | null
): string {
  if (!name) return 'вашем ребенке';

  const trimmedName = name.trim();
  const lastChar = trimmedName.slice(-1).toLowerCase();
  const lastTwoChars = trimmedName.slice(-2).toLowerCase();

  // ВАЖНО: Проверки на -ия и -ий должны быть ПЕРВЫМИ, до проверок на -а/-я и -й

  // Имена на -ия → -ии (Мария → Марии, Виктория → Виктории)
  if (lastTwoChars === 'ия') {
    return trimmedName.slice(0, -2) + 'ии';
  }

  // Имена на -ий → -ии (Дмитрий → Дмитрии, Василий → Василии)
  if (lastTwoChars === 'ий') {
    return trimmedName.slice(0, -2) + 'ии';
  }

  // Женские имена на -а → -е (Маша → Маше, Анна → Анне)
  if (lastChar === 'а') {
    return trimmedName.slice(0, -1) + 'е';
  }

  // Имена на -я → -е (Настя → Насте, Катя → Кате)
  if (lastChar === 'я') {
    return trimmedName.slice(0, -1) + 'е';
  }

  // Имена на -й → -е (Андрей → Андрее, Сергей → Сергее)
  if (lastChar === 'й') {
    return trimmedName.slice(0, -1) + 'е';
  }

  // Имена на -ь (Игорь → Игоре, Олег → Олеге)
  if (lastChar === 'ь') {
    return trimmedName.slice(0, -1) + 'е';
  }

  // Мужские имена на согласную → +е (Иван → Иване, Петр → Петре)
  if (gender === 'male' || (!gender && /[бвгджзклмнпрстфхцчшщ]$/i.test(trimmedName))) {
    return trimmedName + 'е';
  }

  // Если ничего не подошло, возвращаем как есть
  return trimmedName;
}

/**
 * Склонить имя в родительный падеж (кого? чего?)
 * Используется для фраз типа "Ментальное здоровье Маши", "Результаты Ивана"
 * @param firstName - имя в именительном падеже
 * @param gender - пол ('male' | 'female' | 'other')
 * @returns имя в родительном падеже или оригинальное имя если склонение не удалось
 */
export function getGenitiveName(
  firstName: string | null | undefined,
  gender?: 'male' | 'female' | 'other' | null
): string {
  if (!firstName) {
    return 'вашего ребенка';
  }

  try {
    const lvovichGender = gender === 'male' ? 'male' : gender === 'female' ? 'female' : undefined;
    const result = inclineFirstname(firstName, 'genitive', lvovichGender);

    if (result && result !== firstName) {
      return result;
    }

    return simpleGenitiveDeclension(firstName, gender);
  } catch (error) {
    logger.warn('Failed to decline name to genitive:', firstName, error);
    return simpleGenitiveDeclension(firstName, gender);
  }
}

/**
 * Простое склонение имени в родительный падеж (кого? чего?)
 * Используется как фоллбэк если библиотека не справилась
 * Примеры: Маша → Маши, Иван → Ивана, Мария → Марии, Дмитрий → Дмитрия
 */
function simpleGenitiveDeclension(
  name: string,
  gender?: 'male' | 'female' | 'other' | null
): string {
  if (!name) return 'вашего ребенка';

  const trimmedName = name.trim();
  const lastChar = trimmedName.slice(-1).toLowerCase();
  const lastTwoChars = trimmedName.slice(-2).toLowerCase();

  // ВАЖНО: Проверки на -ия и -ий должны быть ПЕРВЫМИ, до проверок на -а/-я и -й

  // Имена на -ия → -ии (Мария → Марии, Виктория → Виктории)
  if (lastTwoChars === 'ия') {
    return trimmedName.slice(0, -2) + 'ии';
  }

  // Имена на -ий → -ия (Дмитрий → Дмитрия, Василий → Василия)
  if (lastTwoChars === 'ий') {
    return trimmedName.slice(0, -2) + 'ия';
  }

  // Женские имена на -а → -ы или -и (Маша → Маши, Анна → Анны)
  if (lastChar === 'а') {
    // После г, к, х, ж, ш, щ, ч пишется -и (правило русского языка: жи-ши пиши с и)
    if (/[гкхжшщч]а$/i.test(trimmedName)) {
      return trimmedName.slice(0, -1) + 'и';
    }
    return trimmedName.slice(0, -1) + 'ы';
  }

  // Имена на -я → -и (Настя → Насти, Катя → Кати)
  if (lastChar === 'я') {
    return trimmedName.slice(0, -1) + 'и';
  }

  // Имена на -й → -я (Андрей → Андрея, Сергей → Сергея)
  if (lastChar === 'й') {
    return trimmedName.slice(0, -1) + 'я';
  }

  // Имена на -ь (Игорь → Игоря, Олег → Олега)
  if (lastChar === 'ь') {
    return trimmedName.slice(0, -1) + 'я';
  }

  // Мужские имена на согласную → +а (Иван → Ивана, Петр → Петра)
  if (gender === 'male' || (!gender && /[бвгджзклмнпрстфхцчшщ]$/i.test(trimmedName))) {
    return trimmedName + 'а';
  }

  // Если ничего не подошло, возвращаем как есть
  return trimmedName;
}

