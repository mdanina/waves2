// Контекст для управления авторизацией админов
import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

export type UserRole = 'user' | 'support' | 'admin' | 'super_admin';

interface AdminUser {
  id: string;
  email: string | null;
  role: UserRole;
}

interface AdminAuthContextType {
  user: User | null;
  adminUser: AdminUser | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loadUserData: (userId: string) => Promise<AdminUser | null>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  // Используем данные из AuthContext вместо дублирования
  const { user, session, loading: authLoading } = useAuth();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [userDataLoading, setUserDataLoading] = useState(false);

  // Загружаем данные пользователя из таблицы users
  const loadAdminUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', userId)
        .single();

      if (error) {
        logger.error('Error loading admin user:', error);
        return null;
      }

      return data as AdminUser;
    } catch (error) {
      logger.error('Error loading admin user:', error);
      return null;
    }
  };

  // Загружаем данные пользователя (без проверки роли - проверка происходит в AdminProtectedRoute)
  const loadUserData = useCallback(async (userId: string) => {
    setUserDataLoading(true);
    try {
      const adminData = await loadAdminUser(userId);
      if (adminData) {
        setAdminUser(adminData);
        setUserDataLoading(false);
        return adminData;
      }
      // Если данных нет, просто очищаем adminUser, но не делаем signOut
      setAdminUser(null);
      setUserDataLoading(false);
      return null;
    } catch (error) {
      setUserDataLoading(false);
      return null;
    }
  }, []);

  // Отслеживаем, была ли уже попытка загрузки для текущего пользователя
  const loadingAttemptedRef = useRef<string | null>(null);

  // Очищаем adminUser при изменении пользователя и загружаем данные при появлении user
  useEffect(() => {
    if (!user) {
      setAdminUser(null);
      loadingAttemptedRef.current = null;
      return;
    }

    // Если user есть, но adminUser еще не загружен и не идет загрузка, загружаем данные
    // Проверяем, что мы еще не пытались загрузить данные для этого пользователя
    if (user && !adminUser && !userDataLoading && loadingAttemptedRef.current !== user.id) {
      loadingAttemptedRef.current = user.id;
      loadUserData(user.id).catch((error) => {
        logger.error('Error auto-loading admin user data:', error);
        loadingAttemptedRef.current = null; // Разрешаем повторную попытку при ошибке
      });
    }
  }, [user, adminUser, userDataLoading, loadUserData]);

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
      const adminData = await loadUserData(data.user.id);
      if (!adminData || !['admin', 'super_admin', 'support'].includes(adminData.role)) {
        // Если пользователь не админ, выходим из админ-сессии
        await supabase.auth.signOut();
        return { error: { message: 'Доступ запрещен. Требуются права администратора.' } };
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAdminUser(null);
  };

  const isAdmin = adminUser?.role === 'admin' || adminUser?.role === 'super_admin';
  const isStaff = adminUser?.role === 'support' || isAdmin;

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        adminUser,
        session,
        loading: authLoading || userDataLoading, // Учитываем оба состояния загрузки
        isAdmin,
        isStaff,
        signIn,
        signOut,
        loadUserData,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

