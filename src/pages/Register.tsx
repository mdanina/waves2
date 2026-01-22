// Страница регистрации
import { useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input as DesignSystemInput } from '@/components/design-system/Input';
import { SerifHeading } from '@/components/design-system/SerifHeading';
import { toast } from 'sonner';
import { registerSchema, type RegisterInput } from '@/lib/validation/schemas';
import { handleApiError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';
import bgImage from '@/assets/bg.png';
import { Logo } from '@/components/design-system/Logo';

export default function Register() {
  const navigate = useNavigate();
  const { signUp, user, loading: authLoading } = useAuth();

  // Флаг для предотвращения race condition при регистрации
  // Используем ref, чтобы значение было доступно синхронно в useEffect
  const isRegisteringRef = useRef(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  // Если пользователь уже авторизован и не в процессе регистрации, редиректим на dashboard
  // Проверка isRegisteringRef.current предотвращает race condition:
  // без неё useEffect может сработать раньше navigate('/profile') в onSubmit
  useEffect(() => {
    if (!authLoading && user && !isRegisteringRef.current) {
      navigate('/cabinet', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const onSubmit = async (data: RegisterInput) => {
    // Устанавливаем флаг в начале, чтобы useEffect не перехватил навигацию
    isRegisteringRef.current = true;

    try {
      const result = await handleApiError(
        () => signUp(data.email, data.password),
        'Ошибка при регистрации'
      );

      const { data: signUpData, error } = result;

      // Если пользователь создан, даже если есть ошибка (например, email confirmation)
      if (signUpData?.user) {
        logger.log('User created successfully');

        // Проверяем, нужно ли подтверждение email
        // Если session === null, значит email confirmation включен
        if (!signUpData.session) {
          logger.log('Email confirmation required, redirecting to verify-email');
          toast.success('Проверьте почту! Мы отправили код подтверждения.');
          navigate('/verify-email', { state: { email: data.email } });
          return;
        }

        // Сессия есть, значит email уже подтвержден (или confirmation выключен)
        toast.success('Регистрация успешна! Заполните ваш профиль.');

        // Небольшая задержка чтобы гарантировать обновление состояния в AuthContext
        // Это дополнительная защита от race condition
        await new Promise(resolve => setTimeout(resolve, 100));

        navigate('/profile');
        return;
      }

      // Если ошибка и пользователь не создан
      if (error) {
        // Проверяем, не является ли ошибка связанной с email confirmation
        const isEmailError =
          error.message?.toLowerCase().includes('email') ||
          error.message?.toLowerCase().includes('confirmation');

        if (isEmailError) {
          // Пытаемся войти сразу - возможно пользователь уже существует
          try {
            const signInResult = await supabase.auth.signInWithPassword({
              email: data.email,
              password: data.password,
            });

            if (signInResult.data?.user) {
              // Ждём обновления состояния через onAuthStateChange
              await new Promise(resolve => setTimeout(resolve, 100));
              toast.success('Регистрация успешна! Заполните ваш профиль.');
              navigate('/profile');
              return;
            }
          } catch (signInError) {
            logger.error('Error signing in after registration:', signInError);
          }
        }

        // При ошибке сбрасываем флаг, чтобы useEffect мог работать нормально
        isRegisteringRef.current = false;
        toast.error(error.message || 'Ошибка при регистрации');
      } else {
        isRegisteringRef.current = false;
        toast.error('Не удалось создать пользователя');
      }
    } catch (err: unknown) {
      logger.error('Registration exception:', err);
      isRegisteringRef.current = false;
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
        <Card
          className="w-full rounded-[20px] border-2 p-8 shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
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
                Регистрация
              </SerifHeading>
              <p className="text-muted-foreground">
                Создайте аккаунт для начала работы
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <DesignSystemInput
                id="email"
                type="email"
                label="Email"
                {...register('email')}
                placeholder="your@email.com"
                error={errors.email?.message}
              />

              <div className="space-y-2">
                <DesignSystemInput
                  id="password"
                  type="password"
                  label="Пароль"
                  {...register('password')}
                  placeholder="••••••••"
                  error={errors.password?.message}
                />
                <p className="text-xs text-muted-foreground ml-4">
                  Минимум 6 символов
                </p>
              </div>

              <DesignSystemInput
                id="confirmPassword"
                type="password"
                label="Подтвердите пароль"
                {...register('confirmPassword')}
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
              />

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="h-14 w-full text-base font-medium"
              >
                {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
              </Button>
            </form>

            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">
                Уже есть аккаунт?{' '}
                <Link to="/login" className="text-foreground hover:underline transition-colors">
                  Войти
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

