// Страница входа
import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { loginSchema, type LoginInput } from '@/lib/validation/schemas';
import { handleApiError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';
import { useRateLimit } from '@/hooks/useRateLimit';
// import logo from "@/assets/noroot (2).png";
const logo = "/logo.png"; // Новый логотип из public

export default function Login() {
  const navigate = useNavigate();
  const { signIn, user, loading: authLoading } = useAuth();
  const { isBlocked, attemptsRemaining, timeRemaining, recordFailedAttempt, resetAttempts } = useRateLimit();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // Если пользователь уже авторизован, редиректим на dashboard
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/cabinet', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const onSubmit = async (data: LoginInput) => {
    // Проверяем блокировку перед попыткой входа
    if (isBlocked) {
      toast.error('Слишком много неудачных попыток. Попробуйте позже.');
      return;
    }

    try {
      const { error } = await handleApiError(
        () => signIn(data.email, data.password),
        'Ошибка при входе'
      );

      if (error) {
        // Проверяем, не связана ли ошибка с неподтвержденным email
        const isEmailNotConfirmed =
          error.message?.toLowerCase().includes('email not confirmed') ||
          error.message?.toLowerCase().includes('email is not confirmed') ||
          error.message?.toLowerCase().includes('confirmation');

        if (isEmailNotConfirmed) {
          toast.error('Необходимо подтвердить email');
          navigate('/verify-email', { state: { email: data.email } });
          return;
        }

        // Записываем неудачную попытку
        recordFailedAttempt();
        toast.error(error.message || 'Ошибка при входе');
        return;
      }

      // Сбрасываем счетчик при успешном входе
      resetAttempts();
      toast.success('Вход выполнен успешно!');
      
      // Проверяем, заполнен ли профиль пользователя
      const { getCurrentUserData } = await import('@/lib/userStorage');
      const { getProfiles } = await import('@/lib/profileStorage');
      
      try {
        const userData = await getCurrentUserData();
        const profiles = await getProfiles();
        const parentProfile = profiles.find(p => p.type === 'parent');
        
        // Если профиль не заполнен или нет профиля родителя, идем на страницу профиля
        if (!userData || !userData.phone || !parentProfile) {
          navigate('/profile');
        } else if (!userData.region) {
          // Если регион не заполнен, идем на выбор региона
          navigate('/region');
        } else {
          navigate('/cabinet');
        }
      } catch (profileError) {
        logger.error('Error loading user profile:', profileError);
        // Продолжаем на dashboard даже если ошибка загрузки профиля
        navigate('/cabinet');
      }
    } catch (err) {
      logger.error('Login exception:', err);
      // Ошибка уже обработана в handleApiError
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Link to="/">
                <img src={logo} alt="Waves" className="h-10 w-auto" />
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Войдите в свой аккаунт для продолжения</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {isBlocked && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Слишком много неудачных попыток входа. Попробуйте снова через{' '}
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </AlertDescription>
              </Alert>
            )}

            {!isBlocked && attemptsRemaining < 5 && attemptsRemaining > 0 && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Осталось попыток: {attemptsRemaining}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="your@email.com"
                className="h-12"
                aria-invalid={errors.email ? 'true' : 'false'}
                disabled={isBlocked}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Пароль</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Забыли пароль?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="h-12"
                aria-invalid={errors.password ? 'true' : 'false'}
                disabled={isBlocked}
              />
              {errors.password && (
                <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting || isBlocked}
              className="h-12 w-full"
            >
              {isSubmitting ? 'Вход...' : 'Войти'}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Нет аккаунта?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

