// Страница восстановления пароля
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validation/schemas';
import { handleApiError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';
// import logo from "@/assets/noroot (2).png";
const logo = "/logo.png"; // Новый логотип из public

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Link to="/">
                <img src={logo} alt="Balansity" className="h-10 w-auto" />
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Восстановление пароля</h1>
            <p className="mt-2 text-muted-foreground">
              Введите ваш email, и мы отправим вам ссылку для сброса пароля
            </p>
          </div>

          {isSuccess ? (
            <div className="space-y-6">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Мы отправили вам письмо с инструкциями по восстановлению пароля.
                  Пожалуйста, проверьте вашу почту и следуйте инструкциям в письме.
                </AlertDescription>
              </Alert>

              <div className="text-center text-sm text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline">
                  Вернуться к входу
                </Link>
              </div>
            </div>
          ) : (
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

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="h-12 w-full"
              >
                {isSubmitting ? 'Отправка...' : 'Отправить письмо'}
              </Button>
            </form>
          )}

          {!isSuccess && (
            <div className="text-center text-sm text-muted-foreground">
              Вспомнили пароль?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Войти
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

