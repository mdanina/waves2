// Страница регистрации
import { useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { registerSchema, type RegisterInput } from '@/lib/validation/schemas';
import { handleApiError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';
// import logo from "@/assets/noroot (2).png";
const logo = "/logo.png"; // Новый логотип из public

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Link to="/">
                <img src={logo} alt="Balansity" className="h-10 w-auto" />
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Регистрация</h1>
            <p className="mt-2 text-muted-foreground">
              Создайте аккаунт для начала работы
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="your@email.com"
                className="h-12"
                aria-invalid={errors.email ? 'true' : 'false'}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="h-12"
                aria-invalid={errors.password ? 'true' : 'false'}
              />
              {errors.password && (
                <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Минимум 6 символов
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                placeholder="••••••••"
                className="h-12"
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="h-12 w-full"
            >
              {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Войти
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

