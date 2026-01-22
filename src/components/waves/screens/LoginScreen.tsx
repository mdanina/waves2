import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input as DesignSystemInput } from '../../design-system/Input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SerifHeading } from '../../design-system/SerifHeading';
import bgImage from '@/assets/bg.png';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => void;
  onForgotPassword: () => void;
}

export function LoginScreen({ onLogin, onForgotPassword }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
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
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Card className="rounded-[20px] border-2 bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
          <div className="space-y-8 mt-8">
            <div className="text-center">
              <SerifHeading size="2xl" className="mb-4">
                Войдите в свой аккаунт для продолжения
              </SerifHeading>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <DesignSystemInput
                id="email"
                type="email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <DesignSystemInput
                id="password"
                type={showPassword ? 'text' : 'password'}
                label="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 inline mr-1" /> : <Eye className="w-4 h-4 inline mr-1" />}
                  {showPassword ? 'Скрыть' : 'Показать'} пароль
                </button>
              </div>

              <Button
                type="submit"
                size="lg"
                className="h-14 w-full text-base font-medium"
              >
                Войти
              </Button>
            </form>

            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">
                Нет аккаунта?{' '}
                <a href="#" className="text-foreground hover:underline transition-colors">
                  Зарегистрируйтесь на сайте
                </a>
              </p>

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onForgotPassword();
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
              >
                Забыли пароль?
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

