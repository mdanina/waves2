import React, { useState } from 'react';
import { Package, Check, ArrowLeft, ExternalLink } from 'lucide-react';
import { PillButton } from '../../design-system/PillButton';
import { SerifHeading } from '../../design-system/SerifHeading';
import { WellnessCard } from '../../design-system/WellnessCard';
import { Modal } from '../../design-system/Modal';

interface PurchaseScreenProps {
  onPurchase: () => void;
  onBack?: () => void;
}

export function PurchaseScreen({ onPurchase, onBack }: PurchaseScreenProps) {
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const availablePackages = [
    {
      id: 'basic',
      name: 'Базовый',
      price: '80 000 ₽',
      pricePerMonth: '3 333 ₽/мес',
      includes: [
        'Flex4 устройство',
        'Программа без ограничений',
        'Все типы тренировок (Концентрация, Спокойствие, Фокус)',
        'Персональный прогресс и аналитика',
        'Поддержка 24/7',
        'Гарантия на устройство',
      ],
      recommended: false,
    },
    {
      id: 'parent-child',
      name: 'Родитель + Ребёнок',
      price: '120 000 ₽',
      pricePerMonth: '5 000 ₽/мес',
      includes: [
        'Flex4 устройство',
        'Программы для обоих (взрослые + дети)',
        'Профили для родителя и ребёнка',
        'Все типы тренировок (Концентрация, Спокойствие, Фокус)',
        'Персональный прогресс для каждого',
        'Поддержка 24/7',
        'Гарантия на устройство',
        'Приоритетная поддержка',
      ],
      recommended: true,
    },
  ];

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: 'url(/bg2.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {onBack && (
        <div className="flex items-center px-4 py-4">
          <button onClick={onBack} className="mr-4 text-[#1a1a1a]/70 hover:text-[#1a1a1a]">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <SerifHeading size="xl" className="text-2xl sm:text-3xl md:text-4xl text-[#1a1a1a]">Выберите пакет</SerifHeading>
        </div>
      )}

      <div className="flex-1 px-4 sm:px-8 md:px-16 py-4 sm:py-6 md:py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <SerifHeading size="2xl" className="mb-2 text-3xl sm:text-4xl md:text-5xl">
              Начните тренировки с Flex4
            </SerifHeading>
            <p className="text-gray-600 mb-1">
              Научно доказанный метод улучшения концентрации
            </p>
            <p className="text-sm text-gray-500">
              Выберите пакет и начните путь к лучшему вниманию уже сегодня
            </p>
          </div>

          <div className="space-y-5 sm:space-y-6 mb-8">
            {availablePackages.map((pkg) => (
              <div key={pkg.id} className="relative">
                {pkg.recommended && (
                  <div className="absolute -top-3 left-6 z-10 bg-[#ff8a65] text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Рекомендуется
                  </div>
                )}
                <WellnessCard gradient={pkg.recommended ? 'lavender' : undefined} hover className="p-7 sm:p-8">
                  <div className="mb-5 sm:mb-6">
                    <h3 className="text-xl font-semibold text-[#1a1a1a] mb-1">{pkg.name}</h3>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-semibold text-[#1a1a1a]">{pkg.price}</span>
                      {pkg.pricePerMonth && (
                        <span className="text-sm text-[#1a1a1a]/60">или {pkg.pricePerMonth}</span>
                      )}
                    </div>
                    {pkg.pricePerMonth && (
                      <p className="text-xs text-[#1a1a1a]/50">Рассрочка на 24 месяца без переплаты</p>
                    )}
                  </div>
                  <ul className="space-y-3 mb-5 sm:mb-6">
                    {pkg.includes.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-[#ff8a65] flex-shrink-0 mt-0.5" />
                        <span className="text-[#1a1a1a]/80 text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <PillButton
                    onClick={() => setIsPurchaseModalOpen(true)}
                    variant={pkg.recommended ? 'gradientMeshOrange' : 'secondary'}
                    className="w-full"
                  >
                    Выбрать пакет
                  </PillButton>
                </WellnessCard>
              </div>
            ))}
          </div>

          <div className="text-center text-sm text-gray-500 space-y-1">
            <p className="font-medium text-gray-700">💳 Безопасная оплата через CloudPayments</p>
            <p>✅ Рассрочка без переплаты • 🔒 Гарантия возврата средств</p>
          </div>
        </div>
      </div>

      {/* Модальное окно для оплаты подписки */}
      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        title="Оформить подписку"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-[#1a1a1a]/80">
            Управление подпиской и оплата происходят в личном кабинете на сайте.
          </p>
          <p className="text-sm text-[#1a1a1a]/60">
            Перейдите на сайт, чтобы выбрать пакет и оформить подписку.
          </p>
          <div className="flex gap-3 pt-2">
            <PillButton
              onClick={() => {
                window.open('https://waves.ru/account', '_blank');
                setIsPurchaseModalOpen(false);
              }}
              variant="gradientMesh"
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Перейти на сайт
            </PillButton>
            <PillButton
              onClick={() => setIsPurchaseModalOpen(false)}
              variant="secondary"
              className="flex-1"
            >
              Отмена
            </PillButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}

