import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { PillButton } from '../../design-system/PillButton';
import { SerifHeading } from '../../design-system/SerifHeading';
import { CardStack } from '../../design-system/CardStack';

interface TrainingTipsScreenProps {
  onBack: () => void;
  onContinue: () => void;
}

export function TrainingTipsScreen({ onBack, onContinue }: TrainingTipsScreenProps) {
  const tips = [
    {
      id: 1,
      title: 'Тихая обстановка',
      description: 'Выберите тихое и комфортное место для тренировки. Убедитесь, что вас никто не будет отвлекать. Закройте дверь, предупредите близких о том, что вам нужна тишина. Отключите уведомления на всех устройствах.',
      gradient: 'blue' as const,
      tag: 'Тишина',
    },
    {
      id: 2,
      title: 'Минимум движений',
      description: 'Во время тренировки старайтесь минимизировать движения головой и телом. Примите удобную позу заранее, чтобы не отвлекаться на дискомфорт. Помните: чем меньше движений, тем эффективнее тренировка.',
      gradient: 'lavender' as const,
      tag: 'Неподвижность',
    },
    {
      id: 3,
      title: 'Расслабление',
      description: 'Расслабьте лицо, шею и плечи. Старайтесь реже моргать, но не напрягайте глаза. Дышите спокойно и ровно. Представьте, что ваше тело становится тяжелым и расслабленным.',
      gradient: 'pink' as const,
      tag: 'Расслабься',
    },
    {
      id: 4,
      title: 'Режим "Не беспокоить"',
      description: 'Включите режим «Не беспокоить» на телефоне и других устройствах. Убедитесь, что все уведомления отключены. Эти 16 минут должны быть полностью вашими — без отвлечений и прерываний.',
      gradient: 'coral' as const,
      tag: 'Не беспокоить',
    },
    {
      id: 5,
      title: 'Подготовка заранее',
      description: 'Перед тренировкой обязательно сходите в туалет, поешьте легкую пищу (не переедайте), выпейте воды. Проветрите помещение. Убедитесь, что вам удобно и комфортно сидеть 16 минут.',
      gradient: 'blue' as const,
      tag: 'Подготовься',
    },
    {
      id: 6,
      title: 'Правильная поза',
      description: 'Сядьте удобно, но с прямой спиной. Ноги должны быть на полу, руки расслаблены. Не скрещивайте ноги и руки. Найдите позу, в которой вы сможете просидеть все 16 минут без дискомфорта.',
      gradient: 'lavender' as const,
      tag: 'Правильная поза',
    },
  ];

  return (
    <div 
      className="flex flex-col min-h-screen"
      style={{
        backgroundImage: 'url(/bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="flex items-center px-4 py-4">
        <button onClick={onBack} className="mr-4 text-[#1a1a1a]/70 hover:text-[#1a1a1a]">
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <SerifHeading size="xl" className="text-2xl sm:text-3xl md:text-4xl">Советы</SerifHeading>
      </div>

      <div className="flex-1 px-4 sm:px-8 md:px-16 py-4 sm:py-6 md:py-8 overflow-y-auto">
        <div className="mb-4 sm:mb-6">
          <p className="text-xs sm:text-sm text-[#1a1a1a] text-center mb-4 sm:mb-6">
            Прокрутите карточки, чтобы узнать все советы для эффективной тренировки
          </p>
          <div className="flex justify-center">
            <div style={{ transform: 'translateX(-3px)' }}>
              <CardStack items={tips} className="!w-[280px]" />
            </div>
          </div>
        </div>

        <PillButton onClick={onContinue} variant="gradientMesh" className="w-full mb-3">
          Понятно
        </PillButton>
        
        <button
          onClick={onBack}
          className="w-full text-center text-[#1a1a1a]/70 hover:text-[#1a1a1a] py-3 text-xs sm:text-sm transition-colors"
        >
          Назад
        </button>
      </div>
    </div>
  );
}

