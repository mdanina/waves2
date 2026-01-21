import React, { useRef, useEffect, useState } from 'react';
import { PillButton } from '../../design-system/PillButton';
import { SerifHeading } from '../../design-system/SerifHeading';

interface WelcomeFlowScreenProps {
  step: 1 | 2 | 3;
  childName?: string;
  parentName?: string;
  onNext: () => void;
  onComplete: () => void;
  onStepChange?: (step: 1 | 2 | 3) => void;
}

// Функция для склонения имени в дательный падеж (кому?)
function toDativeCase(name: string): string {
  if (!name) return name;
  
  const trimmed = name.trim();
  if (trimmed.length === 0) return name;
  
  // Имена на -а/-я -> -е (Миша -> Мише, Саша -> Саше, Маша -> Маше)
  if (trimmed.endsWith('а') || trimmed.endsWith('я')) {
    return trimmed.slice(0, -1) + 'е';
  }
  
  // Имена на -ь -> -ю (Игорь -> Игорю)
  if (trimmed.endsWith('ь')) {
    return trimmed.slice(0, -1) + 'ю';
  }
  
  // Имена на согласную -> добавляем -у (Иван -> Ивану, но это упрощенно)
  // Для большинства мужских имен на согласную
  if (!trimmed.endsWith('а') && !trimmed.endsWith('я') && !trimmed.endsWith('ь') && !trimmed.endsWith('й')) {
    return trimmed + 'у';
  }
  
  // Имена на -й -> -ю (Андрей -> Андрею)
  if (trimmed.endsWith('й')) {
    return trimmed.slice(0, -1) + 'ю';
  }
  
  // Если не подошло ни одно правило, возвращаем как есть
  return name;
}

// Функция для склонения имени в винительный падеж (кого?)
function toAccusativeCase(name: string): string {
  if (!name) return name;
  
  const trimmed = name.trim();
  if (trimmed.length === 0) return name;
  
  // Имена на -а -> -у (Анна -> Анну, Миша -> Мишу, Саша -> Сашу)
  if (trimmed.endsWith('а')) {
    return trimmed.slice(0, -1) + 'у';
  }
  
  // Имена на -я -> -ю (Мария -> Марию, Илья -> Илью)
  if (trimmed.endsWith('я')) {
    return trimmed.slice(0, -1) + 'ю';
  }
  
  // Имена на -ь -> -ь (остается без изменения для женских: Наталья -> Наталью, но это сложнее)
  // Для простоты: если заканчивается на мягкий знак, заменяем на -ь (но это не всегда правильно)
  // Лучше оставить как есть для имен на -ь
  
  // Имена на согласную остаются без изменения (Иван -> Ивана, но это родительный)
  // Для винительного мужского рода одушевленного: Иван -> Ивана
  // Но для упрощения оставим как есть для мужских имен на согласную
  
  // Имена на -й -> -я (Андрей -> Андрея)
  if (trimmed.endsWith('й')) {
    return trimmed.slice(0, -1) + 'я';
  }
  
  // Если не подошло ни одно правило, возвращаем как есть
  return name;
}

// Компонент для текста шага с адаптивным шрифтом
function StepText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    const textElement = textRef.current;
    if (!textElement) return;

    const updateFontSize = () => {
      // Измеряем ширину контейнера
      const container = textElement.closest('.w-full.max-w-md') as HTMLElement;
      if (!container) return;
      
      const availableWidth = container.offsetWidth - 64; // Учитываем отступы (pl-16 = 64px)
      if (availableWidth <= 0) return;
      
      // Адаптируем размер шрифта в зависимости от ширины
      // На узких экранах (100-200px) размер от 10px до 14px
      // На средних (200-350px) размер от 14px до 16px
      // На широких (350px+) размер от 16px до 18px
      let calculatedSize: number;
      if (availableWidth < 200) {
        calculatedSize = Math.max(10, Math.min(14, availableWidth * 0.06));
      } else if (availableWidth < 350) {
        calculatedSize = Math.max(14, Math.min(16, availableWidth * 0.045));
      } else {
        calculatedSize = Math.max(16, Math.min(18, availableWidth * 0.04));
      }
      
      setFontSize(calculatedSize);
    };

    updateFontSize();

    const resizeObserver = new ResizeObserver(updateFontSize);
    resizeObserver.observe(textElement);
    
    const container = textElement.closest('.w-full.max-w-md');
    if (container) {
      resizeObserver.observe(container);
    }

    window.addEventListener('resize', updateFontSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateFontSize);
    };
  }, []);

  return (
    <p 
      ref={textRef}
      className={`break-words leading-relaxed ${className || 'text-gray-700 pt-1'}`}
      style={{ fontSize: `${fontSize}px` }}
    >
      {children}
    </p>
  );
}

// Компонент для италического текста с адаптивным шрифтом
function ItalicText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [fontSize, setFontSize] = useState(14);

  useEffect(() => {
    const textElement = textRef.current;
    if (!textElement) return;

    const updateFontSize = () => {
      const container = textElement.closest('.w-full.max-w-md') as HTMLElement;
      if (!container) return;
      
      const availableWidth = container.offsetWidth - 64;
      if (availableWidth <= 0) return;
      
      let calculatedSize: number;
      if (availableWidth < 200) {
        calculatedSize = Math.max(9, Math.min(12, availableWidth * 0.055));
      } else if (availableWidth < 350) {
        calculatedSize = Math.max(12, Math.min(14, availableWidth * 0.04));
      } else {
        calculatedSize = Math.max(14, Math.min(16, availableWidth * 0.035));
      }
      
      setFontSize(calculatedSize);
    };

    updateFontSize();

    const resizeObserver = new ResizeObserver(updateFontSize);
    resizeObserver.observe(textElement);
    
    const container = textElement.closest('.w-full.max-w-md');
    if (container) {
      resizeObserver.observe(container);
    }

    window.addEventListener('resize', updateFontSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateFontSize);
    };
  }, []);

  return (
    <p 
      ref={textRef}
      className={`text-gray-500 italic break-words leading-relaxed ${className}`}
      style={{ fontSize: `${fontSize}px` }}
    >
      {children}
    </p>
  );
}

export function WelcomeFlowScreen({ step, childName = 'ребёнка', parentName, onNext, onComplete, onStepChange }: WelcomeFlowScreenProps) {
  const handleStepClick = (stepNumber: 1 | 2 | 3) => {
    if (stepNumber !== step) {
      if (onStepChange) {
        // Прямое переключение на любой шаг (вперед или назад)
        onStepChange(stepNumber);
      } else {
        // Fallback: используем onNext только для перехода вперед
        if (stepNumber > step) {
          if (step === 1 && stepNumber === 2) {
            onNext();
          } else if (step === 2 && stepNumber === 3) {
            onNext();
          } else if (step === 1 && stepNumber === 3) {
            onNext();
            setTimeout(() => onNext(), 100);
          }
        }
      }
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <div className="text-6xl mb-4">👋</div>
            <SerifHeading size="2xl" className="mb-3 text-3xl sm:text-4xl md:text-5xl">
              Привет, {parentName || 'родитель'}!
            </SerifHeading>
            <p className="text-gray-600 mb-1.5">
              Вы на пути к тому, чтобы помочь {childName ? toDativeCase(childName) : 'вашему ребёнку'}
            </p>
            <p className="text-gray-600">
              Waves — это научно доказанный метод тренировки внимания
            </p>
          </>
        );

      case 2:
        return (
          <>
            <SerifHeading size="2xl" className="mb-6">Как это работает:</SerifHeading>
            <div className="space-y-2.5 text-left mb-6 pl-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                  1
                </div>
                <p className="text-gray-700 pt-1">Наденьте Flex4 на {childName ? toAccusativeCase(childName) : 'ребёнка'}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                  2
                </div>
                <p className="text-gray-700 pt-1">Тренируйтесь 15-20 минут в день</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                  3
                </div>
                <p className="text-gray-700 pt-1">Мозг учится концентрироваться</p>
              </div>
            </div>
            <p className="text-gray-500 italic mb-6">
              Регулярность важнее интенсивности
            </p>
          </>
        );

      case 3:
        return (
          <>
            <SerifHeading size="2xl" className="mb-6 text-3xl sm:text-4xl md:text-5xl">Когда ждать результат:</SerifHeading>
            <div className="space-y-2.5 text-left mb-6 pl-5">
              <div className="flex items-start gap-2">
                <span className="text-xl">📅</span>
                <div>
                  <p className="font-semibold text-gray-900">Неделя 1-2:</p>
                  <p className="text-gray-600">{childName || 'Имя ребенка'} привыкает к тренировкам</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xl">📅</span>
                <div>
                  <p className="font-semibold text-gray-900">Неделя 3-4:</p>
                  <p className="text-gray-600">Первые улучшения в концентрации</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xl">📅</span>
                <div>
                  <p className="font-semibold text-gray-900">Неделя 5-8:</p>
                  <p className="text-gray-600">Устойчивый результат</p>
                </div>
              </div>
            </div>
            <p className="text-gray-500 mb-6">
              Ключ к успеху — тренировки 4-5 раз в неделю
            </p>
          </>
        );
    }
  };

  return (
    <div 
      className="flex items-center justify-center px-16 py-12 min-h-screen"
      style={{
        backgroundImage: 'url(/bg2.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="w-full max-w-md text-center">
        {renderStep()}
        
        {/* Интерактивный слайдер (точки пагинации) */}
        <div className="flex gap-2 justify-center mt-6 mb-6">
          <button
            onClick={() => handleStepClick(1)}
            className={`h-3 rounded-full transition-all ${
              step === 1 ? 'bg-[#b8a0d6] w-8' : 'bg-white/50 hover:bg-white/70 w-3'
            }`}
            aria-label="Шаг 1"
          />
          <button
            onClick={() => handleStepClick(2)}
            className={`h-3 rounded-full transition-all ${
              step === 2 ? 'bg-[#b8a0d6] w-8' : 'bg-white/50 hover:bg-white/70 w-3'
            }`}
            aria-label="Шаг 2"
          />
          <button
            onClick={() => handleStepClick(3)}
            className={`h-3 rounded-full transition-all ${
              step === 3 ? 'bg-[#b8a0d6] w-8' : 'bg-white/50 hover:bg-white/70 w-3'
            }`}
            aria-label="Шаг 3"
          />
        </div>

        {/* Кнопка "Начать" - показывается только на последнем шаге */}
        {step === 3 && (
          <div className="flex justify-center">
            <PillButton onClick={onComplete} variant="gradientMesh">
              Начать
            </PillButton>
          </div>
        )}
      </div>
    </div>
  );
}
