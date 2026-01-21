import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpecialistAuth } from '@/contexts/SpecialistAuthContext';
import { Loader2 } from 'lucide-react';

interface SpecialistProtectedRouteProps {
  children: React.ReactNode;
}

export function SpecialistProtectedRoute({ children }: SpecialistProtectedRouteProps) {
  const { user, specialistUser, loading, isSpecialist, isCoordinator, loadUserData } = useSpecialistAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const isMountedRef = useRef(true);
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    hasRedirectedRef.current = false;

    async function checkSpecialistAccess() {
      if (!isMountedRef.current) return;

      // Ждем завершения загрузки
      if (loading) {
        return;
      }

      // Если нет пользователя, редиректим на логин
      if (!user) {
        if (!hasRedirectedRef.current && isMountedRef.current) {
          hasRedirectedRef.current = true;
          navigate('/specialist/login', { replace: true });
        }
        setIsChecking(false);
        return;
      }

      // Если данные пользователя еще не загружены, загружаем их
      if (!specialistUser && user) {
        try {
          await loadUserData(user.id);
          return;
        } catch (error) {
          console.error('Error loading specialist user data:', error);
          if (!hasRedirectedRef.current && isMountedRef.current) {
            hasRedirectedRef.current = true;
            navigate('/specialist/login', { replace: true });
          }
          setIsChecking(false);
          return;
        }
      }

      // Проверяем права доступа (специалист или координатор)
      if (!specialistUser || (!isSpecialist && !isCoordinator)) {
        if (!hasRedirectedRef.current && isMountedRef.current) {
          hasRedirectedRef.current = true;
          navigate('/specialist/login', { replace: true });
        }
        setIsChecking(false);
        return;
      }

      // Все проверки пройдены
      if (isMountedRef.current) {
        setIsChecking(false);
      }
    }

    checkSpecialistAccess();

    return () => {
      isMountedRef.current = false;
    };
  }, [user, specialistUser, loading, isSpecialist, isCoordinator, navigate, loadUserData]);

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

  if (!user || !specialistUser || (!isSpecialist && !isCoordinator)) {
    return null;
  }

  return <>{children}</>;
}
