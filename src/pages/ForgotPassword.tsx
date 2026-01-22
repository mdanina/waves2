// Страница восстановления пароля
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input as DesignSystemInput } from '@/components/design-system/Input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SerifHeading } from '@/components/design-system/SerifHeading';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validation/schemas';
import { handleApiError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';
import bgImage from '@/assets/bg.png';
import { Logo } from '@/components/design-system/Logo';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [isSuccess, setIsSuccess] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      const { error } = await handleApiError(
        () => resetPassword(data.email),
        'Ошибка при отправке письма'
      );

      if (error) {
        toast.error(error.message || 'Ошибка при отправке письма');
        return;
      }

      // Всегда показываем успешное сообщение для безопасности
      // (чтобы не раскрывать, существует ли email в системе)
      setIsSuccess(true);
      toast.success('Письмо отправлено! Проверьте вашу почту.');
    } catch (err) {
      logger.error('Forgot password exception:', err);
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
                Восстановление пароля
              </SerifHeading>
              <p className="text-muted-foreground">
                Введите ваш email, и мы отправим вам ссылку для сброса пароля
              </p>
            </div>

            {isSuccess ? (
              <div className="space-y-6">
                <Alert variant="success">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Мы отправили вам письмо с инструкциями по восстановлению пароля.
                    Пожалуйста, проверьте вашу почту и следуйте инструкциям в письме.
                  </AlertDescription>
                </Alert>

                <div className="text-center">
                  <Link
                    to="/login"
                    className="text-sm text-foreground hover:underline transition-colors"
                  >
                    Вернуться к входу
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <DesignSystemInput
                    id="email"
                    type="email"
                    label="Email"
                    {...register('email')}
                    placeholder="your@email.com"
                    error={errors.email?.message}
                  />

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="h-14 w-full text-base font-medium"
                  >
                    {isSubmitting ? 'Отправка...' : 'Отправить письмо'}
                  </Button>
                </form>

                <div className="space-y-3 text-center">
                  <p className="text-sm text-muted-foreground">
                    Вспомнили пароль?{' '}
                    <Link to="/login" className="text-foreground hover:underline transition-colors">
                      Войти
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

