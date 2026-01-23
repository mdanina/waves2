import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SerifHeading } from '@/components/design-system/SerifHeading';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ChevronRight,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useOnboardingChecklist,
  ChecklistItem
} from '@/hooks/useOnboardingChecklist';

// Типы для YouTube IFrame API
declare global {
  interface Window {
    YT: {
      Player: new (element: HTMLElement | string, config: {
        events: {
          onStateChange: (event: { data: number }) => void;
        };
      }) => {
        destroy: () => void;
      };
      PlayerState: {
        ENDED: number;
      };
    };
  }
}

interface OnboardingChecklistProps {
  profilesCount?: number;
  className?: string;
}

export function OnboardingChecklist({
  profilesCount = 0,
  className
}: OnboardingChecklistProps) {
  const navigate = useNavigate();
  const {
    items,
    progress,
    isCompleted,
    isDismissed,
    toggleItem,
    dismiss,
    restore,
    markCompleted,
  } = useOnboardingChecklist({ profilesCount });

  const [isExpanded, setIsExpanded] = useState(true);
  const [isHiding, setIsHiding] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);

  // Восстанавливаем чек-лист если он был закрыт до завершения всех шагов
  useEffect(() => {
    if (isDismissed && !isCompleted) {
      restore();
    }
  }, [isDismissed, isCompleted, restore]);

  // Показываем сообщение о завершении при завершении всех пунктов
  useEffect(() => {
    if (isCompleted && !isDismissed) {
      setShowCompletionMessage(true);
    }
  }, [isCompleted, isDismissed]);

  // Не показываем только если явно скрыт пользователем
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
      <Card className="bg-white overflow-hidden border-0">
        {/* Заголовок */}
        <div
          className="p-4 sm:p-6 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <SerifHeading size="xl" className="truncate">
                  {showCompletionMessage ? 'Отлично! Все готово' : 'С чего начать?'}
                </SerifHeading>
                {showCompletionMessage && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Вы выполнили все шаги для начала работы
                  </p>
                )}
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

              {/* Кнопка закрытия - показываем только после завершения всех шагов */}
              {isCompleted && (
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
              )}

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
                onNavigate={(path) => navigate(path)}
                onMarkCompleted={(itemId) => markCompleted(itemId, true)}
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
  onNavigate: (path: string) => void;
  onMarkCompleted: (itemId: string) => void;
}

function ChecklistItemRow({ item, index, isCurrent, onToggle, onNavigate, onMarkCompleted }: ChecklistItemRowProps) {
  const isClickable = !item.autoCheck;
  const isInternalLink = item.link?.startsWith('/');
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const videoRef = useRef<HTMLIFrameElement>(null);
  
  // Для пункта "Познакомиться с методом нейрофидбэка" открываем модальное окно вместо внешней ссылки
  const isVideoItem = item.id === 'learn_neurofeedback';
  
  // YouTube video ID - нужно будет заменить на реальный ID видео
  // Формат: https://www.youtube.com/embed/VIDEO_ID?enablejsapi=1&origin=window.location.origin
  const videoUrl = isVideoItem 
    ? 'https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1&origin=' + encodeURIComponent(window.location.origin)
    : null;

  useEffect(() => {
    if (!isVideoModalOpen || !isVideoItem) return;

    let player: any = null;
    let checkYT: NodeJS.Timeout | null = null;
    const videoWatchedToEnd = { value: false }; // Используем объект для сохранения значения в замыкании

    // Загружаем YouTube IFrame API если еще не загружена
    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        // Проверяем, не загружается ли уже API
        const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
        if (existingScript) {
          // API уже загружается, ждем
          const checkLoaded = setInterval(() => {
            if (window.YT && window.YT.Player) {
              clearInterval(checkLoaded);
              resolve();
            }
          }, 100);
          return;
        }

        // Сохраняем существующий обработчик, если есть
        const existingHandler = (window as any).onYouTubeIframeAPIReady;
        
        (window as any).onYouTubeIframeAPIReady = () => {
          if (existingHandler) {
            existingHandler();
          }
          resolve();
        };

        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.async = true;
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      });
    };

    // Инициализация плеера
    const initPlayer = async () => {
      try {
        await loadYouTubeAPI();

        // Ждем, пока iframe будет готов
        checkYT = setInterval(() => {
          if (videoRef.current && window.YT && window.YT.Player) {
            clearInterval(checkYT!);
            
            try {
              player = new window.YT.Player(videoRef.current, {
                events: {
                  onStateChange: (event: { data: number }) => {
                    // YouTube.PlayerState.ENDED = 0 означает, что видео завершено
                    // Проверяем, что видео действительно завершено, а не просто остановлено
                    if (event.data === 0 && !videoWatchedToEnd.value) {
                      // Дополнительная проверка: получаем текущее время и длительность видео
                      try {
                        const currentTime = player.getCurrentTime();
                        const duration = player.getDuration();
                        
                        // Видео считается просмотренным, если оно завершено (время близко к длительности)
                        // Допускаем небольшую погрешность в 1 секунду
                        if (duration > 0 && currentTime >= duration - 1) {
                          videoWatchedToEnd.value = true;
                          // Видео просмотрено до конца - отмечаем пункт как выполненный
                          onMarkCompleted(item.id);
                          // Закрываем модальное окно через небольшую задержку
                          setTimeout(() => {
                            setIsVideoModalOpen(false);
                          }, 1000);
                        }
                      } catch (error) {
                        // Если не удалось получить время, все равно считаем завершенным
                        // если событие ENDED было получено
                        videoWatchedToEnd.value = true;
                        onMarkCompleted(item.id);
                        setTimeout(() => {
                          setIsVideoModalOpen(false);
                        }, 1000);
                      }
                    }
                  },
                  onReady: () => {
                    // Плеер готов
                  },
                  onError: (error: any) => {
                    console.error('YouTube player error:', error);
                  },
                },
              });
            } catch (error) {
              console.error('Error initializing YouTube player:', error);
            }
          }
        }, 100);
      } catch (error) {
        console.error('Error loading YouTube API:', error);
      }
    };

    initPlayer();

    return () => {
      if (checkYT) {
        clearInterval(checkYT);
      }
      if (player && typeof player.destroy === 'function') {
        try {
          player.destroy();
        } catch (error) {
          console.error('Error destroying YouTube player:', error);
        }
      }
    };
  }, [isVideoModalOpen, isVideoItem, item.id, onMarkCompleted]);

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-xl transition-all duration-200',
        isCurrent && !item.completed && 'bg-white/50',
        item.completed && 'opacity-60',
        (isClickable || item.completed) && 'cursor-pointer hover:bg-white/50'
      )}
      onClick={isClickable ? onToggle : item.completed ? () => onToggle() : undefined}
    >
      {/* Чекбокс */}
      <div className="flex-shrink-0 mt-0.5">
        {item.completed ? (
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center shadow-sm"
            style={{
              background: 'linear-gradient(108deg, rgba(34, 197, 94, 0.25) 0%, rgba(34, 197, 94, 0.14) 100%)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
            }}
          >
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
        ) : (
          <div 
            className={cn(
              'w-6 h-6 rounded-full border flex items-center justify-center transition-colors',
              isCurrent && 'border-coral'
            )}
            style={{
              background: isCurrent 
                ? 'linear-gradient(108deg, rgba(255, 138, 91, 0.25) 0%, rgba(255, 138, 91, 0.14) 100%)'
                : 'linear-gradient(108deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.14) 100%)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: isCurrent 
                ? '1px solid rgba(255, 138, 91, 0.3)'
                : '1px solid rgba(0, 0, 0, 0.1)',
            }}
          >
            <span className="text-xs font-medium text-foreground">
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
              'transition-all',
              item.completed && 'line-through text-muted-foreground'
            )}>
              {item.title}
            </p>
          </div>

          {/* Бейджи и кнопки */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {item.autoCheck && !item.completed && (
              <Badge variant="secondary" className="text-xs font-light">
                Автоматически
              </Badge>
            )}
            {item.link && !item.completed && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-coral hover:text-coral hover:bg-coral/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isVideoItem) {
                      setIsVideoModalOpen(true);
                    } else if (isInternalLink) {
                      onNavigate(item.link!);
                    } else {
                      window.open(item.link, '_blank', 'noopener,noreferrer');
                    }
                  }}
                >
                  <span className="text-xs mr-1">{item.linkText || 'Открыть'}</span>
                  {isInternalLink ? (
                    <ChevronRight className="h-3 w-3" />
                  ) : (
                    <ExternalLink className="h-3 w-3" />
                  )}
                </Button>
                
                {/* Модальное окно с видео */}
                {isVideoItem && (
                  <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
                    <DialogContent className="max-w-4xl w-[90vw] p-0">
                      <DialogHeader className="px-6 pt-6">
                        <DialogTitle>{item.title}</DialogTitle>
                      </DialogHeader>
                      <div className="px-6 pb-6">
                        {videoUrl && (
                          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                            <iframe
                              ref={videoRef}
                              className="absolute top-0 left-0 w-full h-full rounded-lg"
                              src={videoUrl}
                              title={item.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingChecklist;
