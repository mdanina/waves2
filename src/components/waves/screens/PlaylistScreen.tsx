import React, { useState, useRef, useEffect } from 'react';
import { Plus, Music, Video, MoreVertical, Edit2, Trash2, ChevronDown, ChevronUp, FolderPlus, X } from 'lucide-react';
import { SerifHeading } from '../../design-system/SerifHeading';
import { WellnessCard } from '../../design-system/WellnessCard';
import { PillButton } from '../../design-system/PillButton';

export type MediaType = 'video' | 'audio';
export type MediaSource = 'youtube' | 'spotify' | 'apple-music' | 'vimeo' | 'other';

export interface PlaylistItem {
  id: string;
  title: string;
  type: MediaType;
  source: MediaSource;
  thumbnail?: string;
  duration?: string;
  addedAt: Date;
  url: string;
}

export interface PlaylistSection {
  id: string;
  name: string;
  items: PlaylistItem[];
}

export interface Playlist {
  id: string;
  name: string;
  sections: PlaylistSection[];
  createdAt: Date;
  updatedAt: Date;
}

interface PlaylistScreenProps {
  onBack?: () => void;
}

// Компонент для названия трека с адаптивным шрифтом
function PlaylistItemTitle({ title, className = '' }: { title: string; className?: string }) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    const textElement = textRef.current;
    if (!textElement) return;

    const updateFontSize = () => {
      // Измеряем ширину доступного пространства для текста
      const playlistItem = textElement.closest('.playlist-item-container') as HTMLElement;
      if (!playlistItem) return;
      
      // Измеряем реальную доступную ширину для текста (контейнер с flex-1)
      const textContainer = textElement.closest('.flex-1.min-w-0') as HTMLElement;
      const availableWidth = textContainer ? textContainer.offsetWidth : playlistItem.offsetWidth - 100;
      if (availableWidth <= 0) return;
      
      // Более агрессивная формула для узких экранов
      // На узких экранах (50-150px) размер от 8px до 10px
      // На средних (150-300px) размер от 10px до 14px
      // На широких (300px+) размер от 14px до 18px
      let calculatedSize: number;
      if (availableWidth < 150) {
        // Очень узкие экраны
        calculatedSize = Math.max(8, Math.min(10, availableWidth * 0.06));
      } else if (availableWidth < 300) {
        // Средние экраны
        calculatedSize = Math.max(10, Math.min(14, availableWidth * 0.045));
      } else {
        // Широкие экраны
        calculatedSize = Math.max(14, Math.min(18, availableWidth * 0.04));
      }
      
      // Дополнительно учитываем длину текста
      const textLength = title.length;
      if (textLength > 30) {
        calculatedSize = Math.max(8, calculatedSize * 0.85);
      } else if (textLength > 20) {
        calculatedSize = Math.max(8, calculatedSize * 0.9);
      }
      
      setFontSize(calculatedSize);
    };

    updateFontSize();

    const resizeObserver = new ResizeObserver(updateFontSize);
    
    // Наблюдаем за изменением размера родительского элемента
    const playlistItem = textElement.closest('.playlist-item-container');
    if (playlistItem) {
      resizeObserver.observe(playlistItem);
    }
    
    const textContainer = textElement.closest('.flex-1.min-w-0');
    if (textContainer) {
      resizeObserver.observe(textContainer);
    }

    window.addEventListener('resize', updateFontSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateFontSize);
    };
  }, [title]);

  return (
    <p 
      ref={textRef}
      className={`font-medium text-[#1a1a1a] break-words leading-tight ${className}`}
      style={{ 
        fontSize: `${fontSize}px`,
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        hyphens: 'auto'
      }}
    >
      {title}
    </p>
  );
}

// Функция для генерации моковых треков (та же, что используется в WavesAppFlow)
function generateMockTracks(): PlaylistItem[] {
  const audioTitles = [
    'Успокаивающая музыка для концентрации',
    'Бинауральные биты Alpha',
    'Тихая музыка для фокуса',
    'Медитативная музыка для релаксации',
    'Фоновая музыка для работы',
    'Классическая музыка для чтения',
    'Амбиент звуки природы',
    'Инструментальная музыка для размышлений',
    'Дзен-музыка для утренней медитации',
    'Лоу-фай хип-хоп для концентрации',
    'Электронная медитация',
    'Акустическая гитара для спокойствия',
    'Звуки океана с музыкой',
    'Флейта для глубокого дыхания',
    'Поющие чаши - тибетская медитация',
    'Белый шум для фокуса',
    'Дождь и гром с фортепиано',
    'Морские волны и скрипка',
    'Лесные звуки с медитативной музыкой',
    'Йога-музыка для практики',
    'Тета-волны для сна',
    'Дельта-волны для глубокой медитации',
    'Альфа-волны для творчества',
    'Гамма-волны для концентрации',
    'Изохронические тоны',
  ];

  const videoTitles = [
    'Медитация для детей - Лес',
    'Дыхательные упражнения - Анимация',
    'Йога для начинающих',
    'Медитация с гидом - 10 минут',
    'Анимация для концентрации',
    'Визуализация природы',
    'Практика осознанности',
    'Техника дыхания 4-7-8',
    'Утренняя зарядка и медитация',
    'Растяжка перед сном',
    'Йога-нидра для глубокого расслабления',
    'Тай-чи для начинающих',
    'Цигун - энергетическая практика',
    'Медитация любящей доброты',
    'Тело-сканирование для релаксации',
    'Визуализация успеха',
    'Практика благодарности',
    'Работа с тревогой',
    'Стресс-менеджмент техники',
    'Энергетический баланс',
    'Чакры и медитация',
    'Лунная медитация',
    'Солнечная практика',
    'Элементы природы',
    'Практика прощения',
  ];

  const durations = ['5:00', '7:30', '10:00', '10:20', '12:00', '12:45', '15:00', '15:30', '20:00', '25:00', '30:00'];
  const sources: MediaSource[] = ['spotify', 'youtube', 'apple-music'];

  const tracks: PlaylistItem[] = [];
  
  // 25 аудио треков
  for (let i = 0; i < 25; i++) {
    tracks.push({
      id: `audio-${i + 1}`,
      title: audioTitles[i],
      type: 'audio',
      source: sources[i % sources.length],
      duration: durations[i % durations.length],
      addedAt: new Date(2024, 0, 15 - i),
      url: `https://example.com/track/${i + 1}`,
    });
  }

  // 25 видео треков
  for (let i = 0; i < 25; i++) {
    tracks.push({
      id: `video-${i + 1}`,
      title: videoTitles[i],
      type: 'video',
      source: 'youtube',
      thumbnail: `https://img.youtube.com/vi/example${i}/mqdefault.jpg`,
      duration: durations[(i + 5) % durations.length],
      addedAt: new Date(2024, 0, 15 - i - 25),
      url: `https://youtube.com/watch?v=example${i}`,
    });
  }

  return tracks;
};

export function PlaylistScreen({ onBack }: PlaylistScreenProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([
    {
      id: 'default',
      name: 'Мой плейлист',
      sections: [
        {
          id: 'default-section',
          name: 'Все',
          items: generateMockTracks(),
        },
      ],
      createdAt: new Date(2024, 0, 1),
      updatedAt: new Date(2024, 0, 15),
    },
  ]);

  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(playlists[0]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['default-section']));
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingItemTitle, setEditingItemTitle] = useState<string>('');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState<string>('');
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [draggedItemSectionId, setDraggedItemSectionId] = useState<string | null>(null);
  const [itemOrderBySection, setItemOrderBySection] = useState<Map<string, string[]>>(new Map());

  // Сортировка: новый контент выше
  const sortItemsByDate = (items: PlaylistItem[]) => {
    return [...items].sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
  };

  const handleAddItem = () => {
    // TODO: Интеграция с мультимедийными приложениями для добавления контента
    alert('Функция добавления контента будет доступна после интеграции с мультимедийными приложениями');
  };

  const handleEditItem = (itemId: string, sectionId: string) => {
    if (selectedPlaylist) {
      const section = selectedPlaylist.sections.find((s) => s.id === sectionId);
      const item = section?.items.find((i) => i.id === itemId);
      if (item) {
        setEditingItem(itemId);
        setEditingItemTitle(item.title);
      }
    }
  };

  const handleSaveItemTitle = (itemId: string, sectionId: string) => {
    if (selectedPlaylist && editingItemTitle.trim()) {
      const updatedPlaylist = { ...selectedPlaylist };
      const section = updatedPlaylist.sections.find((s) => s.id === sectionId);
      if (section) {
        const item = section.items.find((i) => i.id === itemId);
        if (item) {
          item.title = editingItemTitle.trim();
          updatedPlaylist.updatedAt = new Date();
          setPlaylists((prev) =>
            prev.map((p) => (p.id === updatedPlaylist.id ? updatedPlaylist : p))
          );
          setSelectedPlaylist(updatedPlaylist);
        }
      }
    }
    setEditingItem(null);
    setEditingItemTitle('');
  };

  const handleCancelEditItem = () => {
    setEditingItem(null);
    setEditingItemTitle('');
  };

  const handleDeleteItem = (itemId: string, sectionId: string) => {
    if (selectedPlaylist) {
      const updatedPlaylist = { ...selectedPlaylist };
      const section = updatedPlaylist.sections.find((s) => s.id === sectionId);
      if (section) {
        section.items = section.items.filter((item) => item.id !== itemId);
        updatedPlaylist.updatedAt = new Date();
        setPlaylists((prev) =>
          prev.map((p) => (p.id === updatedPlaylist.id ? updatedPlaylist : p))
        );
        setSelectedPlaylist(updatedPlaylist);
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, itemId: string, sectionId: string) => {
    setDraggedItemId(itemId);
    setDraggedItemSectionId(sectionId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', itemId);
    e.dataTransfer.setData('application/section-id', sectionId);
    // Разрешаем перетаскивание даже если внутри есть интерактивные элементы
    e.stopPropagation();
  };


  const handleDrop = (e: React.DragEvent, targetItemId: string | null, targetSectionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItemId || !draggedItemSectionId || !selectedPlaylist) {
      setDraggedItemId(null);
      setDraggedItemSectionId(null);
      return;
    }

    const sourceSectionId = draggedItemSectionId;
    const sourceSection = selectedPlaylist.sections.find((s) => s.id === sourceSectionId);
    const targetSection = selectedPlaylist.sections.find((s) => s.id === targetSectionId);

    if (!sourceSection || !targetSection) {
      setDraggedItemId(null);
      setDraggedItemSectionId(null);
      return;
    }

    const draggedItem = sourceSection.items.find(item => item.id === draggedItemId);
    if (!draggedItem) {
      setDraggedItemId(null);
      setDraggedItemSectionId(null);
      return;
    }

    const updatedPlaylist = { ...selectedPlaylist };
    const updatedSourceSection = updatedPlaylist.sections.find((s) => s.id === sourceSectionId);
    const updatedTargetSection = updatedPlaylist.sections.find((s) => s.id === targetSectionId);

    if (!updatedSourceSection || !updatedTargetSection) {
      setDraggedItemId(null);
      setDraggedItemSectionId(null);
      return;
    }

    // Если перетаскиваем в другой раздел
    if (sourceSectionId !== targetSectionId) {
      // Удаляем элемент из исходного раздела
      updatedSourceSection.items = updatedSourceSection.items.filter(item => item.id !== draggedItemId);
      
      // Добавляем элемент в целевой раздел
      if (targetItemId) {
        // Вставляем перед целевым элементом
        const targetIndex = updatedTargetSection.items.findIndex(item => item.id === targetItemId);
        if (targetIndex !== -1) {
          updatedTargetSection.items.splice(targetIndex, 0, draggedItem);
        } else {
          updatedTargetSection.items.push(draggedItem);
        }
      } else {
        // Если нет целевого элемента, добавляем в конец
        updatedTargetSection.items.push(draggedItem);
      }

      // Обновляем порядок для обоих разделов
      const sourceOrder = itemOrderBySection.get(sourceSectionId) || updatedSourceSection.items.map(item => item.id);
      const newSourceOrder = sourceOrder.filter(id => id !== draggedItemId);
      
      const targetOrder = itemOrderBySection.get(targetSectionId) || updatedTargetSection.items.map(item => item.id);
      let newTargetOrder: string[];
      if (targetItemId) {
        const targetIndex = targetOrder.indexOf(targetItemId);
        newTargetOrder = [...targetOrder];
        newTargetOrder.splice(targetIndex, 0, draggedItemId);
      } else {
        newTargetOrder = [...targetOrder, draggedItemId];
      }

      setItemOrderBySection(prev => {
        const newMap = new Map(prev);
        newMap.set(sourceSectionId, newSourceOrder);
        newMap.set(targetSectionId, newTargetOrder);
        return newMap;
      });
    } else {
      // Перетаскивание внутри одного раздела
      if (targetItemId && draggedItemId !== targetItemId) {
        const currentOrder = itemOrderBySection.get(targetSectionId) || updatedTargetSection.items.map(item => item.id);
        const draggedIndex = currentOrder.indexOf(draggedItemId);
        const targetIndex = currentOrder.indexOf(targetItemId);

        if (draggedIndex !== -1 && targetIndex !== -1) {
          const newOrder = [...currentOrder];
          newOrder.splice(draggedIndex, 1);
          newOrder.splice(targetIndex, 0, draggedItemId);

          setItemOrderBySection(prev => {
            const newMap = new Map(prev);
            newMap.set(targetSectionId, newOrder);
            return newMap;
          });

          const orderedItems = newOrder
            .map(id => updatedTargetSection.items.find(item => item.id === id))
            .filter((item): item is PlaylistItem => item !== undefined);
          const existingIds = new Set(newOrder);
          const remainingItems = updatedTargetSection.items.filter(item => !existingIds.has(item.id));
          updatedTargetSection.items = [...orderedItems, ...remainingItems];
        }
      } else {
        setDraggedItemId(null);
        setDraggedItemSectionId(null);
        return;
      }
    }

    updatedPlaylist.updatedAt = new Date();
    setPlaylists((prev) =>
      prev.map((p) => (p.id === updatedPlaylist.id ? updatedPlaylist : p))
    );
    setSelectedPlaylist(updatedPlaylist);

    setDraggedItemId(null);
    setDraggedItemSectionId(null);
  };

  const handleSectionDrop = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItemId || !draggedItemSectionId) {
      return;
    }
    // Если раздел пустой или просто добавляем в конец
    handleDrop(e, null, sectionId);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDraggedItemSectionId(null);
  };

  const handleAddSection = () => {
    if (selectedPlaylist) {
      const newSection: PlaylistSection = {
        id: `section-${Date.now()}`,
        name: 'Новый раздел',
        items: [],
      };
      const updatedPlaylist = {
        ...selectedPlaylist,
        sections: [...selectedPlaylist.sections, newSection],
        updatedAt: new Date(),
      };
      setPlaylists((prev) =>
        prev.map((p) => (p.id === updatedPlaylist.id ? updatedPlaylist : p))
      );
      setSelectedPlaylist(updatedPlaylist);
      setExpandedSections((prev) => new Set([...prev, newSection.id]));
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleStartEditSection = (sectionId: string, currentName: string) => {
    setEditingSection(sectionId);
    setEditingSectionName(currentName);
  };

  const handleSaveSectionName = (sectionId: string) => {
    if (selectedPlaylist && editingSectionName.trim()) {
      const updatedPlaylist = { ...selectedPlaylist };
      const section = updatedPlaylist.sections.find((s) => s.id === sectionId);
      if (section) {
        section.name = editingSectionName.trim();
        updatedPlaylist.updatedAt = new Date();
        setPlaylists((prev) =>
          prev.map((p) => (p.id === updatedPlaylist.id ? updatedPlaylist : p))
        );
        setSelectedPlaylist(updatedPlaylist);
      }
    }
    setEditingSection(null);
    setEditingSectionName('');
  };

  const handleCancelEditSection = () => {
    setEditingSection(null);
    setEditingSectionName('');
  };

  const getSourceIcon = (source: MediaSource) => {
    switch (source) {
      case 'youtube':
        return '📺';
      case 'spotify':
        return '🎵';
      case 'apple-music':
        return '🍎';
      case 'vimeo':
        return '▶️';
      default:
        return '📱';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Сегодня';
    if (days === 1) return 'Вчера';
    if (days < 7) return `${days} дня назад`;
    if (days < 30) return `${Math.floor(days / 7)} недели назад`;
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <div 
      className="flex flex-col min-h-screen pb-20"
      style={{
        backgroundImage: 'url(/bg2.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="px-4 sm:px-6 md:px-12 lg:px-16 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-6">
          <SerifHeading size="2xl" className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">Плейлист</SerifHeading>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddItem}
              className="p-2 text-[#1a1a1a]/70 hover:text-[#1a1a1a] hover:bg-white/50 rounded-lg transition-colors"
              title="Добавить контент"
            >
              <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            {selectedPlaylist && (
              <button
                onClick={handleAddSection}
                className="p-2 text-[#1a1a1a]/70 hover:text-[#1a1a1a] hover:bg-white/50 rounded-lg transition-colors"
                title="Добавить раздел"
              >
                <FolderPlus className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Выбор плейлиста */}
        {playlists.length > 1 && (
          <div className="mb-6">
            <select
              value={selectedPlaylist?.id || ''}
              onChange={(e) => {
                const playlist = playlists.find((p) => p.id === e.target.value);
                setSelectedPlaylist(playlist || null);
              }}
              className="w-full px-4 py-2 bg-white/50 border border-[#1a1a1a]/10 rounded-lg"
            >
              {playlists.map((playlist) => (
                <option key={playlist.id} value={playlist.id}>
                  {playlist.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Список разделов и контента */}
        {selectedPlaylist && (
          <div className="space-y-4">
            {selectedPlaylist.sections.map((section) => {
              // Применяем пользовательский порядок, если он есть, иначе сортируем по дате
              const customOrder = itemOrderBySection.get(section.id);
              const itemsToRender = customOrder && customOrder.length === section.items.length
                ? customOrder
                  .map(id => section.items.find(item => item.id === id))
                  .filter((item): item is PlaylistItem => item !== undefined)
                : sortItemsByDate(section.items);
              const isExpanded = expandedSections.has(section.id);

              return (
                <WellnessCard 
                  key={section.id} 
                  className="p-3 sm:p-4"
                  onDragOver={(e) => {
                    if (!isExpanded) {
                      e.preventDefault();
                      e.stopPropagation();
                      e.dataTransfer.dropEffect = 'move';
                    }
                  }}
                  onDrop={(e) => {
                    if (!isExpanded) {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSectionDrop(e, section.id);
                    }
                  }}
                >
                  {/* Заголовок раздела */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 flex-1">
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="flex items-center"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-[#1a1a1a]/70" />
                        ) : (
                          <ChevronUp className="w-5 h-5 text-[#1a1a1a]/70" />
                        )}
                      </button>
                      {editingSection === section.id ? (
                        <input
                          type="text"
                          value={editingSectionName}
                          onChange={(e) => setEditingSectionName(e.target.value)}
                          onBlur={() => handleSaveSectionName(section.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveSectionName(section.id);
                            } else if (e.key === 'Escape') {
                              handleCancelEditSection();
                            }
                          }}
                          className="flex-1 font-semibold text-[#1a1a1a] bg-white/80 border border-[#1a1a1a]/20 rounded px-2 py-1 focus:outline-none focus:border-[#1a1a1a]/40"
                          autoFocus
                        />
                      ) : (
                        <h3
                          onDoubleClick={() => handleStartEditSection(section.id, section.name)}
                          className="font-semibold text-[#1a1a1a] cursor-text select-none"
                          title="Двойной клик для редактирования"
                        >
                          {section.name}
                        </h3>
                      )}
                      <span className="text-sm text-[#1a1a1a]/50">({section.items.length})</span>
                    </div>
                  </div>

                  {/* Список элементов */}
                  {isExpanded && (
                    <div 
                      className="space-y-3"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSectionDrop(e, section.id);
                      }}
                    >
                      {itemsToRender.length === 0 ? (
                        <div
                          className="text-xs sm:text-sm md:text-base text-[#1a1a1a]/50 text-center py-4"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.dataTransfer.dropEffect = 'move';
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSectionDrop(e, section.id);
                          }}
                        >
                          Раздел пуст. Добавьте контент из мультимедийных приложений.
                        </div>
                      ) : (
                        itemsToRender.map((item, index) => {
                          const isDragging = draggedItemId === item.id;
                          return (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.id, section.id)}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.dataTransfer.dropEffect = 'move';
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDrop(e, item.id, section.id);
                            }}
                            onDragEnd={handleDragEnd}
                            className={`playlist-item-container flex items-center gap-3 p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-colors group cursor-move ${
                              isDragging ? 'opacity-50' : ''
                            }`}
                          >
                            {/* Иконка типа */}
                            <div className="flex-shrink-0">
                              {item.type === 'video' ? (
                                <Video className="w-4 h-4 sm:w-5 sm:h-5 text-[#a8d8ea]" />
                              ) : (
                                <Music className="w-4 h-4 sm:w-5 sm:h-5 text-[#b8a0d6]" />
                              )}
                            </div>

                            {/* Превью (для видео) */}
                            {item.thumbnail && (
                              <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#a8d8ea]/30 to-[#b8a0d6]/30 rounded-lg overflow-hidden">
                                <img
                                  src={item.thumbnail}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}

                            {/* Информация */}
                            <div className="flex-1 min-w-0">
                              {editingItem === item.id ? (
                                <input
                                  type="text"
                                  value={editingItemTitle}
                                  onChange={(e) => setEditingItemTitle(e.target.value)}
                                  onBlur={() => handleSaveItemTitle(item.id, section.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveItemTitle(item.id, section.id);
                                    } else if (e.key === 'Escape') {
                                      handleCancelEditItem();
                                    }
                                  }}
                                  className="w-full font-medium text-[#1a1a1a] bg-white/80 border border-[#1a1a1a]/20 rounded px-2 py-1 focus:outline-none focus:border-[#1a1a1a]/40"
                                  autoFocus
                                />
                              ) : (
                                <PlaylistItemTitle title={item.title} />
                              )}
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs sm:text-xs md:text-sm text-[#1a1a1a]/50">
                                  {getSourceIcon(item.source)} {item.source}
                                </span>
                                {item.duration && (
                                  <>
                                    <span className="text-xs sm:text-xs md:text-sm text-[#1a1a1a]/30">•</span>
                                    <span className="text-xs sm:text-xs md:text-sm text-[#1a1a1a]/50">{item.duration}</span>
                                  </>
                                )}
                                <span className="text-xs sm:text-xs md:text-sm text-[#1a1a1a]/30">•</span>
                                <span className="text-xs sm:text-xs md:text-sm text-[#1a1a1a]/50">{formatDate(item.addedAt)}</span>
                              </div>
                            </div>

                            {/* Действия */}
                            <div className={`flex items-center gap-1 transition-opacity ${editingItem === item.id ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'}`}>
                              {editingItem !== item.id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditItem(item.id, section.id);
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  className="p-2 text-[#1a1a1a]/50 hover:text-[#1a1a1a] hover:bg-white/50 rounded transition-colors"
                                  title="Редактировать"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                              {editingItem === item.id && (
                                <>
                                  <button
                                    onClick={() => handleSaveItemTitle(item.id, section.id)}
                                    className="p-2 text-green-600 hover:bg-white/50 rounded transition-colors"
                                    title="Сохранить"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={handleCancelEditItem}
                                    className="p-2 text-red-600 hover:bg-white/50 rounded transition-colors"
                                    title="Отмена"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {editingItem !== item.id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteItem(item.id, section.id);
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  className="p-2 text-[#1a1a1a]/50 hover:text-red-600 hover:bg-white/50 rounded transition-colors"
                                  title="Удалить"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </WellnessCard>
              );
            })}
          </div>
        )}

        {/* Пустое состояние */}
        {!selectedPlaylist && (
          <WellnessCard gradient="lavender" className="p-8 text-center">
            <Music className="w-16 h-16 text-[#1a1a1a]/20 mx-auto mb-4" />
            <p className="text-sm sm:text-base md:text-lg text-[#1a1a1a]/70 mb-4">Создайте свой первый плейлист</p>
            <PillButton onClick={handleAddItem} variant="gradientMeshPeach">
              <Plus className="w-4 h-4 mr-2" />
              Добавить контент
            </PillButton>
          </WellnessCard>
        )}
      </div>
    </div>
  );
}

