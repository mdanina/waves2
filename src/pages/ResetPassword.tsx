// Страница сброса пароля
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validation/schemas';
import { handleApiError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';
// import logo from "@/assets/noroot (2).png";
const logo = "/logo.png"; // Новый логотип из public

export default function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [searchParams] = useSearchParams();
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    let mounted = true;

    // Проверяем токен из URL hash или query параметров
    const validateToken = async () => {
      try {
        // Supabase возвращает токен в hash фрагменте
        // Формат: /reset-password#access_token=...&type=recovery&expires_in=...
        const hash = window.location.hash;
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        // Также проверяем query параметры (на случай, если токен там)
        const tokenFromQuery = searchParams.get('token');
        const typeFromQuery = searchParams.get('type');

        // Также проверяем token_hash для PKCE flow
        const tokenHash = hashParams.get('token_hash') || searchParams.get('token_hash');

        if (type === 'recovery' && accessToken) {
          // Устанавливаем сессию с токеном восстановления
          if (refreshToken) {
            // Есть оба токена - используем setSession
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (!mounted) return;

            if (sessionError) {
              logger.error('Error setting recovery session:', sessionError);
              setTokenError('Неверная или истекшая ссылка восстановления. Пожалуйста, запросите новую ссылку.');
              setIsValidatingToken(false);
              return;
            }

            // Успешно установили сессию
            setIsValidatingToken(false);
          } else {
            // Нет refresh_token - пробуем verifyOtp с token_hash
            logger.log('No refresh_token in URL, trying verifyOtp with access_token as token_hash');

            const { data, error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: accessToken,
              type: 'recovery',
            });

            if (!mounted) return;

            if (verifyError) {
              logger.error('Error verifying recovery token:', verifyError);
              setTokenError('Неверная или истекшая ссылка восстановления. Пожалуйста, запросите новую ссылку.');
              setIsValidatingToken(false);
              return;
            }

            if (data?.session) {
              logger.log('Recovery session established via verifyOtp');
              setIsValidatingToken(false);
            } else {
              setTokenError('Неверная или истекшая ссылка восстановления. Пожалуйста, запросите новую ссылку.');
              setIsValidatingToken(false);
            }
          }
        } else if (tokenHash && type === 'recovery') {
          // PKCE flow - используем token_hash напрямую
          logger.log('Using token_hash for PKCE recovery flow');

          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });

          if (!mounted) return;

          if (verifyError) {
            logger.error('Error verifying recovery token_hash:', verifyError);
            setTokenError('Неверная или истекшая ссылка восстановления. Пожалуйста, запросите новую ссылку.');
            setIsValidatingToken(false);
            return;
          }

          if (data?.session) {
            logger.log('Recovery session established via token_hash');
            setIsValidatingToken(false);
          } else {
            setTokenError('Неверная или истекшая ссылка восстановления. Пожалуйста, запросите новую ссылку.');
            setIsValidatingToken(false);
          }
        } else if (typeFromQuery === 'recovery' && tokenFromQuery) {
          // Токен в query параметрах - преобразуем в hash фрагмент для Supabase
          logger.log('Token found in query parameters, converting to hash fragment');
          
          // Supabase ожидает токен в hash фрагменте как access_token
          // Преобразуем query параметры в hash и перезагружаем страницу
          const newHash = `#access_token=${encodeURIComponent(tokenFromQuery)}&type=recovery`;
          
          // Обновляем URL: убираем query параметры, добавляем hash
          const newUrl = window.location.pathname + newHash;
          window.history.replaceState(null, '', newUrl);
          
          // Перезагружаем страницу для обработки hash фрагмента
          // Это позволит Supabase правильно обработать токен через событие PASSWORD_RECOVERY
          window.location.reload();
          return;
        } else {
          // Проверяем, может быть токен уже обработан через onAuthStateChange
          // Ждем немного, чтобы дать время событию сработать
          const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!mounted) return;
            
            if (session?.user) {
              // Сессия установлена, токен валиден
              setIsValidatingToken(false);
            } else {
              // Токен не найден
              setTokenError('Ссылка восстановления не найдена или некорректна. Пожалуйста, запросите новую ссылку.');
              setIsValidatingToken(false);
            }
          };

          // Даем время на обработку события PASSWORD_RECOVERY
          setTimeout(checkSession, 500);
        }
      } catch (err) {
        if (!mounted) return;
        logger.error('Error validating token:', err);
        setTokenError('Произошла ошибка при проверке ссылки. Пожалуйста, попробуйте снова.');
        setIsValidatingToken(false);
      }
    };

    validateToken();

    // Также слушаем событие PASSWORD_RECOVERY от Supabase
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      logger.log('Auth state change:', event);
      
      if (event === 'PASSWORD_RECOVERY') {
        logger.log('Password recovery event received, session:', session?.user?.email);
        if (session) {
          setIsValidatingToken(false);
          setTokenError(null);
        } else {
          // Если событие пришло, но сессии нет - токен может быть неверным
          setTimeout(() => {
            if (!mounted) return;
            const checkSession = async () => {
              const { data: { session: currentSession } } = await supabase.auth.getSession();
              if (!mounted) return;
              
              if (!currentSession?.user) {
                setTokenError('Неверная или истекшая ссылка восстановления. Пожалуйста, запросите новую ссылку.');
                setIsValidatingToken(false);
              } else {
                setIsValidatingToken(false);
                setTokenError(null);
              }
            };
            checkSession();
          }, 1000);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [searchParams]);

  const onSubmit = async (data: ResetPasswordInput) => {
    try {
      const { error } = await handleApiError(
        () => updatePassword(data.password),
        'Ошибка при обновлении пароля'
      );

      if (error) {
        toast.error(error.message || 'Ошибка при обновлении пароля');
        return;
      }

      toast.success('Пароль успешно изменен! Войдите с новым паролем.');
      
      // Выходим из сессии, чтобы пользователь вошел с новым паролем
      await supabase.auth.signOut();
      
      // Очищаем hash из URL
      window.history.replaceState(null, '', window.location.pathname);
      // Редиректим на страницу входа
      navigate('/login', { replace: true });
    } catch (err) {
      logger.error('Reset password exception:', err);
      // Ошибка уже обработана в handleApiError
    }
  };

  if (isValidatingToken) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-12">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Link to="/"><img src={logo} alt="Balansity" className="h-10 w-auto" /></Link>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="text-muted-foreground">Проверка ссылки...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-12">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Link to="/"><img src={logo} alt="Balansity" className="h-10 w-auto" /></Link>
              </div>
              <h1 className="text-3xl font-bold text-foreground">Ошибка</h1>
            </div>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{tokenError}</AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Button
                onClick={() => navigate('/forgot-password', { replace: true })}
                size="lg"
                className="w-full"
              >
                Запросить новую ссылку
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                <button
                  onClick={() => navigate('/login', { replace: true })}
                  className="text-primary hover:underline"
                >
                  Вернуться к входу
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Link to="/"><img src={logo} alt="Balansity" className="h-10 w-auto" /></Link>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Новый пароль</h1>
            <p className="mt-2 text-muted-foreground">
              Введите новый пароль для вашего аккаунта
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">Новый пароль</Label>
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
              {isSubmitting ? 'Сохранение...' : 'Сохранить пароль'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

