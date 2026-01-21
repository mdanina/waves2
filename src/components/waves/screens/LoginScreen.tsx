import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '../../design-system/Input';
import { PillButton } from '../../design-system/PillButton';
import { SerifHeading } from '../../design-system/SerifHeading';
import { Logo } from '../../design-system/Logo';

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
      className="fixed inset-0 flex flex-col"
      style={{
        backgroundImage: 'url(/bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
        zIndex: 1,
      }}
    >
      {/* Контейнер для позиционирования формы - можно свободно перемещать */}
      <div className="flex-1 flex items-start justify-center px-4 sm:px-8 md:px-16" style={{ paddingTop: '77px' }}>
        {/* Независимый блок формы */}
        <div className="w-full max-w-sm">
          {/* Логотип */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-3 sm:mb-4">
              <Logo size="2xl" variant="default" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 rounded-2xl p-4 sm:p-6">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-0"
            />

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-0"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>

            <PillButton
              type="submit"
              variant="secondary"
              className="w-full shadow-lg text-[#1a1a1a]/70"
            >
              Войти
            </PillButton>
          </form>

          <p className="text-center text-sm sm:text-base text-white mt-2">
            Нет аккаунта?{' '}
            <a href="#" className="text-white hover:text-white/80 underline transition-colors">
              Зарегистрируйтесь на сайте
            </a>
          </p>

          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onForgotPassword();
            }}
            className="text-sm sm:text-base text-white hover:text-white/80 transition-colors text-center w-full mt-2 block underline"
          >
            Забыли пароль?
          </a>
        </div>
      </div>
    </div>
  );
}

