// Страница подтверждения email после регистрации
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { AlertCircle, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const logo = "/logo.png";

// Время до повторной отправки (в секундах)
const RESEND_COOLDOWN = 60;

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();

  // Email из state навигации (передается из Register)
  const emailFromState = location.state?.email || '';

  const [otpValue, setOtpValue] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Проверяем, пришла ли сессия через magic link (redirect из email)
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Проверяем URL на наличие токенов от magic link
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        // Также проверяем query params для PKCE flow
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');

        if (accessToken && refreshToken) {
          // Magic link redirect - устанавливаем сессию
          logger.log('Magic link detected, setting session');
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!sessionError) {
            setIsSuccess(true);
            toast.success('Email подтвержден! Добро пожаловать!');
            // Очищаем URL от токенов
            window.history.replaceState({}, '', window.location.pathname);
            setTimeout(() => {
              navigate('/cabinet', { replace: true });
            }, 1500);
            return;
          }
        } else if (code) {
          // PKCE flow - обмениваем code на сессию
          logger.log('PKCE code detected, exchanging for session');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (!exchangeError && data.session) {
            setIsSuccess(true);
            toast.success('Email подтвержден! Добро пожаловать!');
            // Очищаем URL от кода
            window.history.replaceState({}, '', window.location.pathname);
            setTimeout(() => {
              navigate('/cabinet', { replace: true });
            }, 1500);
            return;
          }
        } else if (type === 'signup' || type === 'email') {
          // Другие типы confirmation
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setIsSuccess(true);
            toast.success('Email подтвержден! Добро пожаловать!');
            setTimeout(() => {
              navigate('/cabinet', { replace: true });
            }, 1500);
            return;
          }
        }

        // Проверяем текущую сессию (может быть уже авторизован)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          logger.log('Session found, redirecting to cabinet');
          navigate('/cabinet', { replace: true });
          return;
        }
      } catch (err) {
        logger.error('Error checking session:', err);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [navigate]);

  // Таймер для cooldown повторной отправки
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Проверяем, есть ли email (только после проверки сессии)
  useEffect(() => {
    if (!isCheckingSession && !emailFromState && !isSuccess) {
      // Если email не передан и нет сессии, перенаправляем на регистрацию
      toast.error('Email не найден. Пожалуйста, зарегистрируйтесь снова.');
      navigate('/register', { replace: true });
    }
  }, [emailFromState, navigate, isCheckingSession, isSuccess]);

  // Автоматическая отправка при вводе 6 цифр
  const handleOtpChange = useCallback((value: string) => {
    setOtpValue(value);
    setError(null);

    if (value.length === 6) {
      handleVerify(value);
    }
  }, []);

  const handleVerify = async (code: string) => {
    if (code.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      logger.log('Verifying email with OTP code');

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: emailFromState,
        token: code,
        type: 'signup',
      });

      if (verifyError) {
        logger.error('OTP verification error:', verifyError);

        // Обработка конкретных ошибок
        if (verifyError.message?.includes('expired')) {
          setError('Код истек. Запросите новый код.');
        } else if (verifyError.message?.includes('invalid')) {
          setError('Неверный код. Проверьте и попробуйте снова.');
        } else {
          setError(verifyError.message || 'Ошибка при подтверждении. Попробуйте снова.');
        }
        setOtpValue('');
        return;
      }

      if (data?.session) {
        logger.log('Email verified successfully, session established');
        setIsSuccess(true);
        toast.success('Email подтвержден! Добро пожаловать!');

        // Небольшая задержка для показа успешного состояния
        setTimeout(() => {
          navigate('/cabinet', { replace: true });
        }, 1500);
      } else {
        setError('Не удалось создать сессию. Попробуйте войти с паролем.');
      }
    } catch (err) {
      logger.error('Verification exception:', err);
      setError('Произошла ошибка. Попробуйте снова.');
      setOtpValue('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || !emailFromState) return;

    setIsResending(true);
    setError(null);

    try {
      logger.log('Resending verification email to:', emailFromState);

      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: emailFromState,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      if (resendError) {
        logger.error('Resend error:', resendError);
        toast.error(resendError.message || 'Не удалось отправить код');
        return;
      }

      toast.success('Новый код отправлен на вашу почту');
      setResendCooldown(RESEND_COOLDOWN);
      setOtpValue('');
    } catch (err) {
      logger.error('Resend exception:', err);
      toast.error('Ошибка при отправке кода');
    } finally {
      setIsResending(false);
    }
  };

  const handleSkipVerification = () => {
    // Позволяем пользователю перейти на страницу входа
    navigate('/login', { replace: true });
  };

  // Loading state при проверке сессии
  if (isCheckingSession) {
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
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-honey" />
                <p className="text-muted-foreground">Проверяем подтверждение...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Успешное состояние
  if (isSuccess) {
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
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Email подтвержден!</h1>
                <p className="text-muted-foreground">Перенаправляем вас...</p>
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
              <Link to="/">
                <img src={logo} alt="Waves" className="h-10 w-auto" />
              </Link>
            </div>

            <div className="w-16 h-16 rounded-full bg-honey/10 flex items-center justify-center mx-auto mb-6">
              <Mail className="h-8 w-8 text-honey" />
            </div>

            <h1 className="text-3xl font-bold text-foreground">Подтвердите email</h1>
            <p className="mt-2 text-muted-foreground">
              Мы отправили 6-значный код на
            </p>
            <p className="font-medium text-foreground">{emailFromState}</p>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <InputOTP
                maxLength={6}
                value={otpValue}
                onChange={handleOtpChange}
                disabled={isVerifying}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="h-12 w-12 text-lg" />
                  <InputOTPSlot index={1} className="h-12 w-12 text-lg" />
                  <InputOTPSlot index={2} className="h-12 w-12 text-lg" />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} className="h-12 w-12 text-lg" />
                  <InputOTPSlot index={4} className="h-12 w-12 text-lg" />
                  <InputOTPSlot index={5} className="h-12 w-12 text-lg" />
                </InputOTPGroup>
              </InputOTP>

              <p className="text-sm text-muted-foreground">
                Введите код из письма или просто перейдите по ссылке в письме -
                вы будете автоматически авторизованы
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={() => handleVerify(otpValue)}
              size="lg"
              disabled={isVerifying || otpValue.length !== 6}
              className="h-12 w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Проверка...
                </>
              ) : (
                'Подтвердить'
              )}
            </Button>

            <div className="text-center space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Не получили код?
                </p>
                <Button
                  variant="ghost"
                  onClick={handleResendCode}
                  disabled={isResending || resendCooldown > 0}
                  className="text-primary"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Отправка...
                    </>
                  ) : resendCooldown > 0 ? (
                    `Отправить повторно (${resendCooldown}с)`
                  ) : (
                    'Отправить код повторно'
                  )}
                </Button>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Хотите войти позже?
                </p>
                <Button
                  variant="outline"
                  onClick={handleSkipVerification}
                  className="w-full"
                >
                  Вернуться к входу
                </Button>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Проверьте папку &quot;Спам&quot;, если письмо не пришло
          </p>
        </div>
      </div>
    </div>
  );
}
