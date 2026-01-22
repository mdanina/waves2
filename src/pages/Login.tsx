// Страница входа
import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input as DesignSystemInput } from '@/components/design-system/Input';
import { Alert as DesignSystemAlert } from '@/components/design-system/Alert';
import { SerifHeading } from '@/components/design-system/SerifHeading';
import { AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { loginSchema, type LoginInput } from '@/lib/validation/schemas';
import { handleApiError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';
import { useRateLimit } from '@/hooks/useRateLimit';
import bgImage from '@/assets/bg.png';
import { Logo } from '@/components/design-system/Logo';

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
        } else {
          // Профиль заполнен → идем в кабинет
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
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="container mx-auto max-w-2xl px-4 py-12 flex flex-col items-center">
        <Logo size="2xl" variant="default" className="!w-36 !h-auto sm:!w-44 md:!w-56 mb-6 [&_img]:!w-full [&_img]:!h-auto" />
        <Card className="w-full rounded-[20px] border-2 p-8 shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
          style={{
            background: 'rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
          }}
        >
          <div className="space-y-8 mt-8">
            <div className="text-center">
              <SerifHeading size="2xl" className="mb-4">
                Войдите в свой аккаунт для продолжения
              </SerifHeading>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {isBlocked && (
                <DesignSystemAlert
                  variant="error"
                  message={`Слишком много неудачных попыток входа. Попробуйте снова через ${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}`}
                  icon={<AlertCircle className="h-5 w-5" />}
                />
              )}

              {!isBlocked && attemptsRemaining < 5 && attemptsRemaining > 0 && (
                <DesignSystemAlert
                  variant="warning"
                  message={`Осталось попыток: ${attemptsRemaining}`}
                  icon={<Clock className="h-5 w-5" />}
                />
              )}

              <DesignSystemInput
                id="email"
                type="email"
                label="Email"
                {...register('email')}
                placeholder="your@email.com"
                error={errors.email?.message}
                disabled={isBlocked}
              />

              <div className="space-y-2">
                <DesignSystemInput
                  id="password"
                  type="password"
                  label="Пароль"
                  {...register('password')}
                  placeholder="••••••••"
                  error={errors.password?.message}
                  disabled={isBlocked}
                />
                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Забыли пароль?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting || isBlocked}
                className="h-14 w-full text-base font-medium"
              >
                {isSubmitting ? 'Вход...' : 'Войти'}
              </Button>
            </form>

            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">
                Нет аккаунта?{' '}
                <Link to="/register" className="text-foreground hover:underline transition-colors">
                  Зарегистрироваться
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

