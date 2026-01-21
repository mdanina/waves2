// Утилиты для работы с данными пользователя (users) в Supabase
import { supabase } from './supabase';
import { getCurrentUser } from './profileStorage';
import { logger } from './logger';

export interface UserData {
  email?: string;
  phone?: string;
  region?: string;
  marketing_consent?: boolean;
}

/**
 * Получить данные текущего пользователя
 */
export async function getCurrentUserData(): Promise<UserData | null> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Пользователь не найден - это нормально для нового пользователя
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Error getting user data:', error);
    return null;
  }
}

/**
 * Обновить данные пользователя
 */
export async function updateUserData(updates: UserData): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;
  } catch (error) {
    logger.error('Error updating user data:', error);
    throw error;
  }
}

export class PhoneAlreadyExistsError extends Error {
  constructor() {
    super('Пользователь с таким номером телефона уже зарегистрирован');
    this.name = 'PhoneAlreadyExistsError';
  }
}

/**
 * Создать или обновить данные пользователя
 */
export async function upsertUserData(data: UserData): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email || data.email,
        ...data,
      }, {
        onConflict: 'id',
      });

    if (error) {
      // Проверяем ошибку уникальности телефона (код 23505 - unique_violation)
      if (error.code === '23505' && error.message?.includes('users_phone_unique')) {
        throw new PhoneAlreadyExistsError();
      }
      throw error;
    }
  } catch (error) {
    logger.error('Error upserting user data:', error);
    throw error;
  }
}















