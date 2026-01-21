import React, { useState, useMemo } from 'react';
import { ArrowLeft, Music, Check, Clock, Search, Video, X } from 'lucide-react';
import { PillButton } from '../../design-system/PillButton';
import { SerifHeading } from '../../design-system/SerifHeading';
import { WellnessCard } from '../../design-system/WellnessCard';
import type { PlaylistItem, PlaylistSection, Playlist } from './PlaylistScreen';

interface TrainingPlaylistSelectionScreenProps {
  playlist: Playlist;
  trainingDuration: number; // длительность тренировки в минутах
  onContinue: (selectedTrackIds: string[]) => void;
  onBack: () => void;
}

// Функция для конвертации строки формата MM:SS в секунды
const parseDuration = (durationString: string): number => {
  const parts = durationString.split(':');
  if (parts.length !== 2) return 0;
  const mins = parseInt(parts[0], 10) || 0;
  const secs = parseInt(parts[1], 10) || 0;
  return mins * 60 + secs;
};

// Функция для конвертации секунд в формат MM:SS
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Функция для конвертации минут в секунды
const minutesToSeconds = (minutes: number): number => minutes * 60;

export function TrainingPlaylistSelectionScreen({
  playlist,
  trainingDuration,
  onContinue,
  onBack,
}: TrainingPlaylistSelectionScreenProps) {
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [contentTypeFilter, setContentTypeFilter] = useState<'all' | 'audio' | 'video'>('all');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(playlist.sections.map(s => s.id)));
  const [draggedTrackId, setDraggedTrackId] = useState<string | null>(null);
  const [visibleTracksCount, setVisibleTracksCount] = useState<number>(10);
  const [trackOrderBySection, setTrackOrderBySection] = useState<Map<string, string[]>>(() => {
    const orderMap = new Map<string, string[]>();
    playlist.sections.forEach(section => {
      orderMap.set(section.id, section.items.map(item => item.id));
    });
    return orderMap;
  });

  // Получаем все треки из всех разделов
  const allTracks = useMemo(() => {
    const tracks: Array<PlaylistItem & { sectionId: string }> = [];
    playlist.sections.forEach(section => {
      section.items.forEach(item => {
        tracks.push({ ...item, sectionId: section.id });
      });
    });
    return tracks;
  }, [playlist]);

  // Фильтруем треки по поисковому запросу и типу контента
  const filteredTracks = useMemo(() => {
    let tracks = allTracks;

    // Фильтр по типу контента
    if (contentTypeFilter !== 'all') {
      tracks = tracks.filter(track => track.type === contentTypeFilter);
    }

    // Фильтр по поисковому запросу
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      tracks = tracks.filter(track => 
        track.title.toLowerCase().includes(query)
      );
    }

    return tracks;
  }, [allTracks, contentTypeFilter, searchQuery]);

  // Группируем отфильтрованные треки по разделам с учетом порядка
  const filteredSections = useMemo(() => {
    const sectionMap = new Map<string, PlaylistSection>();
    const trackMap = new Map<string, PlaylistItem & { sectionId: string }>();
    
    // Создаем карту треков для быстрого доступа
    filteredTracks.forEach(track => {
      trackMap.set(track.id, track);
    });
    
    // Инициализируем разделы
    playlist.sections.forEach(section => {
      sectionMap.set(section.id, { ...section, items: [] });
    });

    // Добавляем отфильтрованные треки в соответствующие разделы в правильном порядке
    playlist.sections.forEach(section => {
      const sectionItems = sectionMap.get(section.id);
      if (sectionItems) {
        const order = trackOrderBySection.get(section.id) || [];
        // Используем порядок из state, но фильтруем только те, что проходят фильтры
        order.forEach(trackId => {
          const track = trackMap.get(trackId);
          if (track && track.sectionId === section.id) {
            sectionItems.items.push(track);
          }
        });
      }
    });

    // Возвращаем только разделы с элементами
    return Array.from(sectionMap.values()).filter(section => section.items.length > 0);
  }, [playlist.sections, filteredTracks, trackOrderBySection]);

  // Вычисляем общую длительность выбранных треков
  const totalSelectedDuration = useMemo(() => {
    return allTracks
      .filter(track => selectedTrackIds.has(track.id))
      .reduce((sum, track) => {
        const duration = track.duration ? parseDuration(track.duration) : 0;
        return sum + duration;
      }, 0);
  }, [allTracks, selectedTrackIds]);

  const requiredDuration = minutesToSeconds(trainingDuration);
  const isDurationSufficient = totalSelectedDuration >= requiredDuration;
  const remainingDuration = Math.max(0, requiredDuration - totalSelectedDuration);

  const toggleTrack = (trackId: string) => {
    setSelectedTrackIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleContinue = () => {
    if (isDurationSufficient) {
      onContinue(Array.from(selectedTrackIds));
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleDragStart = (e: React.DragEvent, trackId: string) => {
    setDraggedTrackId(trackId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', trackId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetTrackId: string, sectionId: string) => {
    e.preventDefault();
    if (!draggedTrackId || draggedTrackId === targetTrackId) {
      setDraggedTrackId(null);
      return;
    }

    const currentOrder = trackOrderBySection.get(sectionId) || [];
    const draggedIndex = currentOrder.indexOf(draggedTrackId);
    const targetIndex = currentOrder.indexOf(targetTrackId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedTrackId(null);
      return;
    }

    const newOrder = [...currentOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedTrackId);

    setTrackOrderBySection(prev => {
      const newMap = new Map(prev);
      newMap.set(sectionId, newOrder);
      return newMap;
    });

    setDraggedTrackId(null);
  };

  const handleDragEnd = () => {
    setDraggedTrackId(null);
  };

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
      {/* Шапка */}
      <div className="flex items-center px-4 py-4">
        <button onClick={onBack} className="mr-4 text-[#1a1a1a]/70 hover:text-[#1a1a1a]">
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <SerifHeading size="xl" className="text-2xl sm:text-3xl md:text-4xl">Выберите треки</SerifHeading>
      </div>

      <div className="flex-1 px-4 sm:px-6 md:px-12 lg:px-16 py-4 sm:py-6 md:py-8 pb-16 [@media(min-width:431px)]:pb-24 flex flex-col overflow-hidden">
        {/* Информация о длительности тренировки */}
        <div className="rounded-[20px] p-4 sm:p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.1)] bg-white/40 backdrop-blur-md border-2 border-white/50 mb-4 sm:mb-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#1a1a1a]/70" />
              <div>
                <p className="text-xs sm:text-sm text-[#1a1a1a]/70">Длительность тренировки</p>
                <p className="text-base sm:text-lg font-semibold text-[#1a1a1a]">{trainingDuration} мин</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs sm:text-sm text-[#1a1a1a]/70">Выбрано</p>
              <p className="text-base sm:text-lg font-semibold text-[#1a1a1a]">
                {formatDuration(totalSelectedDuration)}
              </p>
            </div>
          </div>

          {/* Прогресс-бар */}
          <div className="w-full bg-[#1a1a1a]/10 rounded-full h-3 mb-2">
            <div
              className={`h-3 rounded-full transition-all ${
                isDurationSufficient 
                  ? 'bg-gradient-to-r from-[#ff8a65] to-[#ff6f4a]' 
                  : 'bg-[#a8d8ea]'
              }`}
              style={{ width: `${Math.min(100, (totalSelectedDuration / requiredDuration) * 100)}%` }}
            ></div>
          </div>

          {/* Сообщение о недостающей длительности */}
          {!isDurationSufficient && (
            <p className="text-xs sm:text-xs md:text-sm text-[#1a1a1a]/60 mt-1.5 sm:mt-2">
              Выберите еще треки на {formatDuration(remainingDuration)}
            </p>
          )}
          {isDurationSufficient && (
            <p className="text-xs sm:text-xs md:text-sm text-[#ff8a65] mt-1.5 sm:mt-2 font-medium">
              ✓ Достаточно треков для тренировки
            </p>
          )}
        </div>

        {/* Поиск и фильтры */}
        <div className="mb-6 space-y-4 flex-shrink-0">
          {/* Поиск */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#1a1a1a]/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию..."
              className="w-full pl-12 pr-10 py-3 bg-white border border-[#1a1a1a]/20 rounded-lg focus:outline-none focus:border-[#a8d8ea] focus:ring-2 focus:ring-[#a8d8ea]/20 text-[#1a1a1a]"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#1a1a1a]/40 hover:text-[#1a1a1a]/70"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Фильтр по типу контента */}
          <div className="flex gap-2">
            <button
              onClick={() => setContentTypeFilter('all')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                contentTypeFilter === 'all'
                  ? 'bg-[#a8d8ea] text-white'
                  : 'bg-white border border-[#1a1a1a]/20 text-[#1a1a1a]/70 hover:bg-[#1a1a1a]/5'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setContentTypeFilter('audio')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 ${
                contentTypeFilter === 'audio'
                  ? 'bg-[#a8d8ea] text-white'
                  : 'bg-white border border-[#1a1a1a]/20 text-[#1a1a1a]/70 hover:bg-[#1a1a1a]/5'
              }`}
            >
              <Music className="w-3 h-3 sm:w-4 sm:h-4" />
              Аудио
            </button>
            <button
              onClick={() => setContentTypeFilter('video')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 ${
                contentTypeFilter === 'video'
                  ? 'bg-[#a8d8ea] text-white'
                  : 'bg-white border border-[#1a1a1a]/20 text-[#1a1a1a]/70 hover:bg-[#1a1a1a]/5'
              }`}
            >
              <Video className="w-3 h-3 sm:w-4 sm:h-4" />
              Видео
            </button>
          </div>
        </div>

        {/* Список треков по разделам */}
        <div className="flex-1 flex flex-col min-h-0 mb-6">
          <div className="flex-1 overflow-y-auto min-h-0">
            {filteredSections.length === 0 ? (
              <WellnessCard gradient="lavender" className="p-8 text-center">
                <p className="text-[#1a1a1a]/70">
                  {searchQuery 
                    ? 'Ничего не найдено по запросу' 
                    : 'Нет доступных треков'}
                </p>
              </WellnessCard>
            ) : (
              <div className="space-y-4 pr-2">
              {filteredSections.map((section) => {
                const isExpanded = expandedSections.has(section.id);
                const sectionSelectedCount = section.items.filter(item => selectedTrackIds.has(item.id)).length;
                const isSectionFullySelected = section.items.length > 0 && sectionSelectedCount === section.items.length;

                return (
                  <div key={section.id} className="rounded-[20px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.1)] bg-white/30 backdrop-blur-md border border-white/30">
                    {/* Заголовок раздела */}
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between mb-4 hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSectionFullySelected
                            ? 'bg-[#a8d8ea] border-[#a8d8ea]'
                            : sectionSelectedCount > 0
                            ? 'bg-[#a8d8ea]/50 border-[#a8d8ea]'
                            : 'bg-white border-[#1a1a1a]/20'
                        }`}>
                          {isSectionFullySelected && <Check className="w-3 h-3 text-white" />}
                          {!isSectionFullySelected && sectionSelectedCount > 0 && (
                            <span className="text-xs text-[#a8d8ea] font-bold">{sectionSelectedCount}</span>
                          )}
                        </div>
                        <h3 className="text-sm sm:text-base font-semibold text-[#1a1a1a] text-left">
                          {section.name}
                        </h3>
                        <span className="text-xs sm:text-sm text-[#1a1a1a]/50">({section.items.length})</span>
                      </div>
                      <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        <svg className="w-5 h-5 text-[#1a1a1a]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Список треков в разделе */}
                    {isExpanded && (
                      <div className="space-y-3">
                        {section.items.slice(0, visibleTracksCount).map((track) => {
                          const isSelected = selectedTrackIds.has(track.id);
                          const isDragging = draggedTrackId === track.id;
                          return (
                            <div
                              key={track.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, track.id)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, track.id, section.id)}
                              onDragEnd={handleDragEnd}
                              className={`transition-all ${
                                isDragging ? 'opacity-50' : ''
                              }`}
                            >
                              <button
                                onClick={() => toggleTrack(track.id)}
                                className="w-full text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                              >
                                <WellnessCard
                                  gradient={isSelected ? "blue" : undefined}
                                  className="p-3 sm:p-4"
                                  hover={!isSelected && !isDragging}
                                >
                                <div className="flex items-center gap-4">
                                  {/* Чекбокс */}
                                  <div className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                    isSelected
                                      ? 'bg-[#a8d8ea] border-[#a8d8ea]'
                                      : 'bg-white border-[#1a1a1a]/20'
                                  }`}>
                                    {isSelected && <Check className="w-4 h-4 text-white" />}
                                  </div>

                                  {/* Иконка типа контента */}
                                  <div className="flex-shrink-0">
                                    {track.type === 'video' ? (
                                      <Video className="w-5 h-5 text-[#1a1a1a]/50" />
                                    ) : (
                                      <Music className="w-5 h-5 text-[#1a1a1a]/50" />
                                    )}
                                  </div>

                                  {/* Информация о треке */}
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm sm:text-base font-medium break-words leading-tight ${
                                      isSelected ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]/90'
                                    }`}>
                                      {track.title}
                                    </p>
                                  </div>

                                  {/* Длительность */}
                                  {track.duration && (
                                    <div className="flex-shrink-0 text-right">
                                      <p className={`text-sm font-medium ${
                                        isSelected ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]/70'
                                      }`}>
                                        {track.duration}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </WellnessCard>
                              </button>
                            </div>
                          );
                        })}
                        {(section.items.length > visibleTracksCount || visibleTracksCount > 10) && (
                          <div className="flex items-center justify-center gap-4 mt-2 py-2">
                            {section.items.length > visibleTracksCount && (
                              <button
                                onClick={() => setVisibleTracksCount(prev => Math.min(prev + 10, section.items.length))}
                                className="text-xs sm:text-sm text-[#1a1a1a]/70 hover:text-[#1a1a1a] transition-colors font-medium py-2"
                              >
                                Показать 10 ({section.items.length - visibleTracksCount})
                              </button>
                            )}
                            {visibleTracksCount > 10 && (
                              <>
                                {section.items.length > visibleTracksCount && (
                                  <div className="w-px h-4 bg-[#1a1a1a]/20" />
                                )}
                                <button
                                  onClick={() => setVisibleTracksCount(10)}
                                  className="text-xs sm:text-sm text-[#1a1a1a]/50 hover:text-[#1a1a1a] transition-colors py-2"
                                >
                                  Скрыть
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            )}
          </div>
        </div>

        {/* Кнопка Продолжить */}
        <div className="flex-shrink-0">
          <PillButton 
            onClick={handleContinue} 
            variant="gradientMesh" 
            className="w-full mb-3"
            disabled={!isDurationSufficient}
          >
            Продолжить
          </PillButton>

          {/* Кнопка Назад */}
          <button
            onClick={onBack}
            className="w-full text-center text-[#1a1a1a]/70 hover:text-[#1a1a1a] py-3 text-xs sm:text-sm transition-colors"
          >
            Назад
          </button>
        </div>
      </div>
    </div>
  );
}
