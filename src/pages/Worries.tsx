import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useCurrentProfile } from "@/contexts/ProfileContext";
import { updateProfile, getProfile, getProfiles } from "@/lib/profileStorage";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

const childWorries = [
  "Фокус и внимание",
  "Грусть и плач",
  "Тревоги и беспокойства",
  "Питание",
  "Сон и режим",
  "Туалет",
  "Сенсорная чувствительность",
  "Гнев и агрессия",
  "Импульсивность",
  "Травма",
  "Горе и потеря",
  "Буллинг",
  "Самооценка",
  "Школа/детский сад",
  "Удары, укусы или пинки",
  "Гендерная или сексуальная идентичность",
  "Сотрудничество",
];

const personalWorries = [
  "Выгорание",
  "Тревожность",
  "Пониженное настроение",
  "Трудности с концентрацией внимания",
  "Общий стресс",
];

const familyWorries = [
  "Разделение/развод",
  "Семейный стресс",
  "Отношения с партнером",
  "Психическое здоровье партнера",
  "Воспитание",
  "Семейный конфликт",
];

export default function Worries() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ profileId?: string }>();
  const { currentProfileId, currentProfile, setCurrentProfile } = useCurrentProfile();
  const profileId = params.profileId || currentProfileId;
  
  // Определяем, откуда пришли - если из Cabinet, то возвращаемся туда
  const isFromDashboard = location.state?.from === 'cabinet' || !profileId;
  
  const [expandedSections, setExpandedSections] = useState({
    child: false,
    personal: false,
    family: false,
  });
  const [selectedWorries, setSelectedWorries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const initialWorriesRef = useRef<string[]>([]); // Сохраняем начальные теги для отслеживания изменений

  // Загружаем существующие worry tags при загрузке из всех профилей
  useEffect(() => {
    async function loadWorryTags() {
      try {
        const profiles = await getProfiles();
        const childProfile = profileId ? profiles.find(p => p.id === profileId) : null;
        const parentProfile = profiles.find(p => p.type === 'parent');
        const partnerProfile = profiles.find(p => p.type === 'partner');
        
        // Если нет конкретного profileId, берем первого ребенка (если есть)
        const firstChild = !childProfile ? profiles.find(p => p.type === 'child') : null;
        const targetChildProfile = childProfile || firstChild;
        
        // Собираем worry tags из всех профилей
        const allWorryTags: string[] = [];
        
        if (targetChildProfile?.worry_tags) {
          allWorryTags.push(...targetChildProfile.worry_tags);
        }
        if (parentProfile?.worry_tags) {
          // Добавляем только personal и family worry tags из профиля родителя
          const parentPersonalWorries = parentProfile.worry_tags.filter(w => personalWorries.includes(w));
          const parentFamilyWorries = parentProfile.worry_tags.filter(w => familyWorries.includes(w));
          allWorryTags.push(...parentPersonalWorries, ...parentFamilyWorries);
        }
        if (partnerProfile?.worry_tags) {
          allWorryTags.push(...partnerProfile.worry_tags);
        }
        
        // Убираем дубликаты
        const uniqueWorryTags = [...new Set(allWorryTags)];
        setSelectedWorries(uniqueWorryTags);
        initialWorriesRef.current = uniqueWorryTags; // Сохраняем начальные теги
      } catch (error) {
        logger.error('Error loading worry tags:', error);
      }
    }
    loadWorryTags();
  }, [profileId]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleWorry = (worry: string) => {
    setSelectedWorries((prev) =>
      prev.includes(worry) ? prev.filter((w) => w !== worry) : [...prev, worry]
    );
  };

  const backgroundStyle = {
    background: 'var(--bg-golden-hour)',
    backgroundAttachment: 'fixed'
  };

  return (
    <div className="min-h-screen bg-background" style={backgroundStyle}>
      <Header />
      
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold text-foreground">
              Расскажите нам о своих беспокойствах
            </h1>
          </div>

          <div className="space-y-4">
            {/* For Child Section */}
            <div className="rounded-lg border border-border bg-card">
              <button
                onClick={() => toggleSection("child")}
                className="flex w-full items-center justify-between p-6 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-medium text-foreground">Для Ребенка</span>
                  <Badge variant="secondary" className="rounded-full">
                    {selectedWorries.filter((w) => childWorries.includes(w)).length}
                  </Badge>
                </div>
                {expandedSections.child ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              
              {expandedSections.child && (
                <div className="border-t border-border p-6">
                  <div className="flex flex-wrap gap-2">
                    {childWorries.map((worry) => (
                      <Badge
                        key={worry}
                        variant={selectedWorries.includes(worry) ? "default" : "outline"}
                        className="cursor-pointer px-4 py-2 text-sm transition-colors font-light"
                        onClick={() => toggleWorry(worry)}
                      >
                        {worry}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* For You Section */}
            <div className="rounded-lg border border-border bg-card">
              <button
                onClick={() => toggleSection("personal")}
                className="flex w-full items-center justify-between p-6 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-medium text-foreground">Для Вас</span>
                  <Badge variant="secondary" className="rounded-full">
                    {selectedWorries.filter((w) => personalWorries.includes(w)).length}
                  </Badge>
                </div>
                {expandedSections.personal ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              
              {expandedSections.personal && (
                <div className="border-t border-border p-6">
                  <div className="flex flex-wrap gap-2">
                    {personalWorries.map((worry) => (
                      <Badge
                        key={worry}
                        variant={selectedWorries.includes(worry) ? "default" : "outline"}
                        className="cursor-pointer px-4 py-2 text-sm transition-colors font-light"
                        onClick={() => toggleWorry(worry)}
                      >
                        {worry}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* For Your Family Section */}
            <div className="rounded-lg border border-border bg-card">
              <button
                onClick={() => toggleSection("family")}
                className="flex w-full items-center justify-between p-6 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-medium text-foreground">Для Вашей Семьи</span>
                  <Badge variant="secondary" className="rounded-full">
                    {selectedWorries.filter((w) => familyWorries.includes(w)).length}
                  </Badge>
                </div>
                {expandedSections.family ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              
              {expandedSections.family && (
                <div className="border-t border-border p-6">
                  <div className="flex flex-wrap gap-2">
                    {familyWorries.map((worry) => (
                      <Badge
                        key={worry}
                        variant={selectedWorries.includes(worry) ? "default" : "outline"}
                        className="cursor-pointer px-4 py-2 text-sm transition-colors font-light"
                        onClick={() => toggleWorry(worry)}
                      >
                        {worry}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button
            size="lg"
            onClick={async () => {
              let targetProfileId = profileId;
              
              // Если profileId не передан, пытаемся найти первого ребенка
              if (!targetProfileId) {
                try {
                  const profiles = await getProfiles();
                  const firstChild = profiles.find(p => p.type === 'child');
                  if (firstChild) {
                    targetProfileId = firstChild.id;
                    setCurrentProfileId(firstChild.id);
                    setCurrentProfile(firstChild);
                  } else if (!isFromDashboard) {
                    // Если не из Dashboard и нет детей - показываем ошибку
                    toast.error('Не выбран профиль ребенка. Пожалуйста, сначала добавьте ребенка на странице "Члены семьи"');
                    navigate("/family-members");
                    return;
                  }
                  // Если из Dashboard и нет детей - просто продолжаем, сохраним только personal и family tags
                } catch (error) {
                  logger.error('Error loading profiles:', error);
                  if (!isFromDashboard) {
                    toast.error('Ошибка при загрузке профилей');
                    navigate("/family-members");
                    return;
                  }
                  // Если из Dashboard - продолжаем, даже если ошибка загрузки
                }
              }

              try {
                setLoading(true);
                
                // Проверяем, были ли изменения
                const initialWorries = initialWorriesRef.current;
                const hasChanges = JSON.stringify([...initialWorries].sort()) !== JSON.stringify([...selectedWorries].sort());
                
                // Разделяем worry tags по категориям
                const childWorryTags = selectedWorries.filter(w => childWorries.includes(w));
                const personalWorryTags = selectedWorries.filter(w => personalWorries.includes(w));
                const familyWorryTags = selectedWorries.filter(w => familyWorries.includes(w));
                
                logger.log('Saving worry tags:', {
                  childProfileId: targetProfileId,
                  childWorryTags,
                  personalWorryTags,
                  familyWorryTags,
                  isFromDashboard,
                  hasChanges,
                  initialCount: initialWorries.length,
                  newCount: selectedWorries.length,
                  added: selectedWorries.filter(w => !initialWorries.includes(w)),
                  removed: initialWorries.filter(w => !selectedWorries.includes(w))
                });
                
                // Сохраняем worry tags о ребенке в профиль ребенка (только если есть ребенок)
                if (targetProfileId) {
                  await updateProfile(targetProfileId, {
                    worryTags: childWorryTags,
                  });
                }

                // Загружаем профили один раз для всех операций
                const profiles = await getProfiles();
                const parentProfile = profiles.find(p => p.type === 'parent');
                const partnerProfile = profiles.find(p => p.type === 'partner');

                // Сохраняем worry tags о семье в профиль партнера (если есть) или родителя
                if (partnerProfile) {
                  // Если есть партнер, сохраняем family worry tags в его профиль
                  await updateProfile(partnerProfile.id, {
                    worryTags: familyWorryTags,
                  });
                }

                // Сохраняем worry tags о себе и о семье в профиль родителя
                // ВАЖНО: Делаем ОДНО обновление с правильным объединением всех категорий
                if (parentProfile) {
                  // Получаем существующие worry tags родителя
                  const existingParentWorries = parentProfile.worry_tags || [];
                  
                  // Разделяем существующие на категории
                  const existingPersonalWorries = existingParentWorries.filter(w => personalWorries.includes(w));
                  const existingFamilyWorries = existingParentWorries.filter(w => familyWorries.includes(w));
                  
                  // Объединяем: новые personal + новые family (или существующие family, если нет партнера)
                  // Если есть партнер, family worry tags уже сохранены в его профиль, поэтому не добавляем их в родителя
                  const finalFamilyWorries = partnerProfile ? existingFamilyWorries : familyWorryTags;
                  
                  // Финальный список: personal + family (если нет партнера)
                  const combinedParentWorries = [...new Set([
                    ...personalWorryTags,  // Новые personal worry tags
                    ...finalFamilyWorries  // Family worry tags (новые или существующие)
                  ])];
                  
                  logger.log('Saving parent worry tags:', {
                    personalWorryTags,
                    familyWorryTags,
                    hasPartner: !!partnerProfile,
                    finalFamilyWorries,
                    combinedParentWorries
                  });
                  
                  await updateProfile(parentProfile.id, {
                    worryTags: combinedParentWorries,
                  });
                }

                // Обновляем профиль в контексте, если он там есть и есть targetProfileId
                if (currentProfile && targetProfileId) {
                  try {
                    const updatedChildProfile = await getProfile(targetProfileId);
                    if (updatedChildProfile) {
                      setCurrentProfile(updatedChildProfile);
                    }
                  } catch (error) {
                    logger.error('Error updating profile in context:', error);
                  }
                }

                // Обновляем начальные теги после сохранения
                initialWorriesRef.current = selectedWorries;
                
                // Логируем факт изменения для аналитики
                if (hasChanges) {
                  logger.log('Worry tags updated', {
                    source: isFromDashboard ? 'dashboard_menu' : 'onboarding',
                    timestamp: new Date().toISOString(),
                    changes: {
                      added: selectedWorries.filter(w => !initialWorries.includes(w)),
                      removed: initialWorries.filter(w => !selectedWorries.includes(w))
                    }
                  });
                }
                
                toast.success('Беспокойства сохранены');
                
                // Всегда возвращаемся в Dashboard (при редактировании из меню или после первоначальной настройки)
                navigate("/cabinet");
              } catch (error) {
                logger.error('Error saving worry tags:', error);
                toast.error('Ошибка при сохранении беспокойств');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="h-14 w-full text-base font-medium"
          >
            {loading ? 'Сохранение...' : isFromDashboard ? 'Сохранить' : 'Далее'}
          </Button>
        </div>
      </div>
    </div>
  );
}
