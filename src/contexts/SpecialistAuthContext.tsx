// Контекст для управления авторизацией специалистов
import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

export type UserRole = 'user' | 'support' | 'admin' | 'super_admin' | 'specialist';

export interface NotificationSettings {
  email_notifications: boolean;
  appointment_reminders: boolean;
  new_client_notifications: boolean;
}

export interface SpecialistProfile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  experience_years: number | null;
  specialization_id: string | null; // Основная специализация из справочника
  specialization_codes: string[]; // Направления работы (темы)
  is_available: boolean;
  accepts_new_clients: boolean;
  video_intro_url: string | null;
  // Настройки уведомлений
  notification_settings: NotificationSettings;
  // Рейтинг специалиста
  rating_avg: number | null;
  rating_count: number;
}

export interface SpecialistEducation {
  id: string;
  specialist_id: string;
  institution: string;
  specialty: string | null;
  degree: string | null;
  year_start: number | null;
  year_end: number | null;
  education_type: 'higher' | 'additional' | 'certification' | 'course';
  document_url: string | null;
  display_order: number;
}

interface SpecialistUser {
  id: string;
  email: string | null;
  role: UserRole;
  specialist?: SpecialistProfile;
}

interface SpecialistAuthContextType {
  user: User | null;
  specialistUser: SpecialistUser | null;
  session: Session | null;
  loading: boolean;
  isSpecialist: boolean;
  isCoordinator: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loadUserData: (userId: string) => Promise<SpecialistUser | null>;
  refreshSpecialistProfile: () => Promise<void>;
}

const SpecialistAuthContext = createContext<SpecialistAuthContextType | undefined>(undefined);

export function SpecialistAuthProvider({ children }: { children: ReactNode }) {
  // Используем данные из AuthContext вместо дублирования
  const { user, session, loading: authLoading } = useAuth();
  const [specialistUser, setSpecialistUser] = useState<SpecialistUser | null>(null);
  const [userDataLoading, setUserDataLoading] = useState(false);

  // Загружаем профиль специалиста
  const loadSpecialistProfile = async (userId: string): Promise<SpecialistProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('specialists')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Если профиль не найден, это нормально для нового специалиста
        if (error.code === 'PGRST116') {
          return null;
        }
        logger.error('Error loading specialist profile:', error);
        return null;
      }

      return data as SpecialistProfile;
    } catch (error) {
      logger.error('Error loading specialist profile:', error);
      return null;
    }
  };

  // Загружаем данные пользователя из таблицы users + профиль специалиста
  const loadSpecialistUser = async (userId: string): Promise<SpecialistUser | null> => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', userId)
        .single();

      if (userError) {
        logger.error('Error loading specialist user:', userError);
        return null;
      }

      const specialistData: SpecialistUser = {
        id: userData.id,
        email: userData.email,
        role: userData.role as UserRole,
      };

      // Если пользователь — специалист, загружаем его профиль
      if (userData.role === 'specialist') {
        const profile = await loadSpecialistProfile(userId);
        if (profile) {
          specialistData.specialist = profile;
        }
      }

      return specialistData;
    } catch (error) {
      logger.error('Error loading specialist user:', error);
      return null;
    }
  };

  // Загружаем данные пользователя
  const loadUserData = useCallback(async (userId: string) => {
    setUserDataLoading(true);
    try {
      const userData = await loadSpecialistUser(userId);
      if (userData) {
        setSpecialistUser(userData);
        setUserDataLoading(false);
        return userData;
      }
      setSpecialistUser(null);
      setUserDataLoading(false);
      return null;
    } catch (error) {
      setUserDataLoading(false);
      return null;
    }
  }, []);

  // Обновить профиль специалиста (без перезагрузки всего)
  const refreshSpecialistProfile = useCallback(async () => {
    if (!user || !specialistUser) return;

    const profile = await loadSpecialistProfile(user.id);
    if (profile) {
      setSpecialistUser(prev => prev ? { ...prev, specialist: profile } : null);
    }
  }, [user, specialistUser]);

  // Отслеживаем, была ли уже попытка загрузки для текущего пользователя
  const loadingAttemptedRef = useRef<string | null>(null);

  // Очищаем specialistUser при изменении пользователя и загружаем данные при появлении user
  useEffect(() => {
    if (!user) {
      setSpecialistUser(null);
      loadingAttemptedRef.current = null;
      return;
    }

    // Если user есть, но specialistUser еще не загружен и не идет загрузка, загружаем данные
    if (user && !specialistUser && !userDataLoading && loadingAttemptedRef.current !== user.id) {
      loadingAttemptedRef.current = user.id;
      loadUserData(user.id).catch((error) => {
        logger.error('Error auto-loading specialist user data:', error);
        loadingAttemptedRef.current = null;
      });
    }
  }, [user, specialistUser, userDataLoading, loadUserData]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    // После успешного входа загружаем данные и проверяем роль
    if (data.user) {
      const userData = await loadUserData(data.user.id);
      if (!userData || userData.role !== 'specialist') {
        // Если пользователь не специалист, выходим
        await supabase.auth.signOut();
        return { error: { message: 'Доступ запрещён. Требуются права специалиста.' } };
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSpecialistUser(null);
  };

  const isSpecialist = specialistUser?.role === 'specialist';
  // Координатор определяется через специализацию, а не через роль
  const isCoordinator = specialistUser?.specialist?.specialization_codes?.includes('coordinator') ?? false;

  return (
    <SpecialistAuthContext.Provider
      value={{
        user,
        specialistUser,
        session,
        loading: authLoading || userDataLoading,
        isSpecialist,
        isCoordinator,
        signIn,
        signOut,
        loadUserData,
        refreshSpecialistProfile,
      }}
    >
      {children}
    </SpecialistAuthContext.Provider>
  );
}

export function useSpecialistAuth() {
  const context = useContext(SpecialistAuthContext);
  if (context === undefined) {
    throw new Error('useSpecialistAuth must be used within a SpecialistAuthProvider');
  }
  return context;
}
