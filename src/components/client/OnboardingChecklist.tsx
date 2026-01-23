import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SerifHeading } from '@/components/design-system/SerifHeading';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sparkles,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useOnboardingChecklist,
  ChecklistItem
} from '@/hooks/useOnboardingChecklist';

interface OnboardingChecklistProps {
  profilesCount?: number;
  className?: string;
}

export function OnboardingChecklist({
  profilesCount = 0,
  className
}: OnboardingChecklistProps) {
  const {
    items,
    progress,
    isCompleted,
    isDismissed,
    toggleItem,
    dismiss,
  } = useOnboardingChecklist({ profilesCount });

  const [isExpanded, setIsExpanded] = useState(true);
  const [isHiding, setIsHiding] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);

  // Анимация скрытия при завершении всех пунктов
  useEffect(() => {
    if (isCompleted && !isDismissed) {
      setShowCompletionMessage(true);
      const timer = setTimeout(() => {
        setIsHiding(true);
        setTimeout(() => {
          dismiss();
        }, 500);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isCompleted, isDismissed, dismiss]);

  // Не показываем если скрыт
  if (isDismissed) {
    return null;
  }

  // Находим первый незавершенный пункт
  const currentItemIndex = items.findIndex(item => !item.completed);
  const currentItem = currentItemIndex !== -1 ? items[currentItemIndex] : null;

  return (
    <div
      className={cn(
        'transition-all duration-500',
        isHiding && 'opacity-0 scale-95 -translate-y-4',
        className
      )}
    >
      <Card className="glass-elegant border-2 overflow-hidden">
        {/* Заголовок */}
        <div
          className="p-4 sm:p-6 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-honey/20 flex-shrink-0">
                <Sparkles className="h-5 w-5 text-honey" />
              </div>
              <div className="flex-1 min-w-0">
                <SerifHeading size="lg" className="truncate">
                  {showCompletionMessage ? 'Отлично! Все готово' : 'Начните работу с Waves'}
                </SerifHeading>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {showCompletionMessage
                    ? 'Вы выполнили все шаги для начала работы'
                    : `Выполнено ${progress.completed} из ${progress.total} шагов`
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Прогресс-бар */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-coral to-coral-light transition-all duration-500"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {progress.percentage}%
                </span>
              </div>

              {/* Кнопка закрытия */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  dismiss();
                }}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Кнопка сворачивания */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Мобильный прогресс-бар */}
          <div className="sm:hidden mt-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-coral to-coral-light transition-all duration-500"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {progress.percentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Список пунктов */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-300',
            isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-2">
            {items.map((item, index) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                index={index}
                isCurrent={currentItem?.id === item.id}
                onToggle={() => !item.autoCheck && toggleItem(item.id)}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

interface ChecklistItemRowProps {
  item: ChecklistItem;
  index: number;
  isCurrent: boolean;
  onToggle: () => void;
}

function ChecklistItemRow({ item, index, isCurrent, onToggle }: ChecklistItemRowProps) {
  const isClickable = !item.autoCheck;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-xl transition-all duration-200',
        isCurrent && !item.completed && 'bg-honey/10 border border-honey/30',
        item.completed && 'opacity-60',
        isClickable && !item.completed && 'cursor-pointer hover:bg-white/50'
      )}
      onClick={isClickable ? onToggle : undefined}
    >
      {/* Чекбокс */}
      <div className="flex-shrink-0 mt-0.5">
        {item.completed ? (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-success to-success/80 flex items-center justify-center shadow-sm">
            <CheckCircle2 className="h-4 w-4 text-white" />
          </div>
        ) : (
          <div className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
            isCurrent
              ? 'border-coral bg-coral/10'
              : 'border-muted-foreground/30 bg-white/50'
          )}>
            <span className="text-xs font-medium text-muted-foreground">
              {index + 1}
            </span>
          </div>
        )}
      </div>

      {/* Контент */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={cn(
              'font-medium transition-all',
              item.completed && 'line-through text-muted-foreground'
            )}>
              {item.title}
            </p>
            {item.description && !item.completed && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {item.description}
              </p>
            )}
          </div>

          {/* Бейджи и кнопки */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {item.autoCheck && !item.completed && (
              <Badge variant="secondary" className="text-xs font-light">
                Автоматически
              </Badge>
            )}
            {item.link && !item.completed && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-coral hover:text-coral hover:bg-coral/10"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(item.link, '_blank', 'noopener,noreferrer');
                }}
              >
                <span className="text-xs mr-1">{item.linkText || 'Открыть'}</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingChecklist;
