import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, adminUser, loading, isStaff, loadUserData } = useAdminAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const isMountedRef = useRef(true);
  const hasRedirectedRef = useRef(false);

  // Объединенный useEffect для предотвращения race conditions
  useEffect(() => {
    isMountedRef.current = true;
    hasRedirectedRef.current = false;

    async function checkAdminAccess() {
      // Если компонент размонтирован, не выполняем проверку
      if (!isMountedRef.current) return;

      // Ждем завершения загрузки
      if (loading) {
        return;
      }

      // Если нет пользователя, редиректим
      if (!user) {
        if (!hasRedirectedRef.current && isMountedRef.current) {
          hasRedirectedRef.current = true;
          navigate('/admin/login', { replace: true });
        }
        setIsChecking(false);
        return;
      }

      // Если данные пользователя еще не загружены, загружаем их
      if (!adminUser && user) {
        try {
          await loadUserData(user.id);
          // После загрузки данных проверка продолжится в следующем рендере
          return;
        } catch (error) {
          console.error('Error loading admin user data:', error);
          if (!hasRedirectedRef.current && isMountedRef.current) {
            hasRedirectedRef.current = true;
            navigate('/admin/login', { replace: true });
          }
          setIsChecking(false);
          return;
        }
      }

      // Проверяем права доступа
      if (!adminUser || !isStaff) {
        if (!hasRedirectedRef.current && isMountedRef.current) {
          hasRedirectedRef.current = true;
          navigate('/admin/login', { replace: true });
        }
        setIsChecking(false);
        return;
      }

      // Все проверки пройдены
      if (isMountedRef.current) {
        setIsChecking(false);
      }
    }

    checkAdminAccess();

    // Cleanup функция
    return () => {
      isMountedRef.current = false;
    };
  }, [user, adminUser, loading, isStaff, navigate, loadUserData]);

  if (loading || isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user || !adminUser || !isStaff) {
    return null; // Редирект уже произошел
  }

  return <>{children}</>;
}

