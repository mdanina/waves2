import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Input } from '../../design-system/Input';
import { PillButton } from '../../design-system/PillButton';
import { SerifHeading } from '../../design-system/SerifHeading';
import { WellnessCard } from '../../design-system/WellnessCard';

interface ForgotPasswordScreenProps {
  onBack: () => void;
  onSend: (email: string) => void;
}

export function ForgotPasswordScreen({ onBack, onSend }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend(email);
    setSent(true);
  };

  return (
    <div className="flex flex-col bg-white min-h-screen">
      <div className="flex-1 flex items-center justify-center px-16 py-12">
        <div className="w-full max-w-sm">
          <button
            onClick={onBack}
            className="mb-6 text-[#1a1a1a]/70 hover:text-[#1a1a1a] flex items-center"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Назад
          </button>

          {!sent ? (
            <>
              <SerifHeading size="2xl" className="mb-6">Восстановление пароля</SerifHeading>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <PillButton type="submit" variant="gradientMesh" className="w-full">
                  Отправить ссылку
                </PillButton>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#a8d8ea]/30 to-[#a8d8ea]/50 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <SerifHeading size="xl" className="mb-2 text-2xl sm:text-3xl md:text-4xl">Письмо отправлено</SerifHeading>
              <p className="text-[#1a1a1a]/70 mb-2">
                Письмо отправлено на <strong>{email}</strong>
              </p>
              <p className="text-sm text-[#1a1a1a]/50 mb-6">
                Не пришло? Проверьте спам или попробуйте снова
              </p>
              <PillButton onClick={onBack} variant="secondary" className="w-full">
                Вернуться к входу
              </PillButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

