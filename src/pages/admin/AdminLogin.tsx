import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Clock } from 'lucide-react';
import { useRateLimit } from '@/hooks/useRateLimit';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAdminAuth();
  const navigate = useNavigate();
  const { isBlocked, attemptsRemaining, timeRemaining, recordFailedAttempt, resetAttempts } = useRateLimit('admin_login_rate_limit');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверяем блокировку перед попыткой входа
    if (isBlocked) {
      setError('Слишком много неудачных попыток. Попробуйте позже.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        // Записываем неудачную попытку
        recordFailedAttempt();
        setError(signInError.message || 'Ошибка входа. Проверьте email и пароль.');
      } else {
        // Сбрасываем счетчик при успешном входе
        resetAttempts();
        navigate('/admin', { replace: true });
      }
    } catch (err) {
      recordFailedAttempt();
      setError('Произошла ошибка при входе. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Вход в админ-панель</CardTitle>
          <CardDescription>
            Введите данные для входа в систему управления
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {error && !isBlocked && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || isBlocked}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || isBlocked}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || isBlocked}>
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

