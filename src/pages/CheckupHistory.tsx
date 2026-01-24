import { useState, useMemo, useEffect } from "react";
import { SerifHeading } from "@/components/design-system/SerifHeading";
import { WellnessCard } from "@/components/design-system/WellnessCard";
import { MoodChart } from "@/components/design-system/MoodChart";
import { Uicon } from "@/components/icons/Uicon";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useProfiles } from "@/hooks/useProfiles";
import type { Database } from "@/lib/supabase";

type Profile = Database['public']['Tables']['profiles']['Row'];

interface TrainingSession {
  id: string;
  profileId: string;
  profileName: string;
  date: string;
  dateISO: string; // для фильтрации
  type: string;
  duration: number; // в минутах
  timeElapsed: number; // в секундах
  timeInZone: number;
  endReason: 'completed' | 'early' | 'technical';
  technicalIssue?: string;
  points?: number;
  rating?: number; // оценка тренировки (1-5)
  mood?: 'better' | 'same' | 'worse'; // изменение настроения
  concentration?: number; // уровень концентрации после тренировки (1-5)
  avgHeartRate?: number;
  maxHeartRate?: number;
  zones?: {
    alpha: number;
    beta: number;
    theta: number;
    gamma: number;
  };
  notes?: string;
}

interface ParticipantStats {
  profileId: string;
  profileName: string;
  totalSessions: number;
  totalMinutes: number;
  avgTimeInZone: number;
  completedSessions: number;
  earlySessions: number;
  technicalSessions: number;
  lastSessionDate?: string;
  sessionsByType: Record<string, number>;
}

interface FrequencyReport {
  profileId: string;
  profileName: string;
  recommendedFrequency: number; // тренировок в неделю
  completedThisWeek: number;
  completedThisMonth: number;
  missedThisWeek: number;
  missedThisMonth: number;
  complianceRate: number; // процент соответствия рекомендациям
  streak: number; // дней подряд
}

export default function CheckupHistory() {
  const [activeTab, setActiveTab] = useState("history");
  const [selectedProfile, setSelectedProfile] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [dateSearch, setDateSearch] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  
  // Загружаем реальные профили пользователя
  const { data: profiles } = useProfiles();

  // Моковые данные тренировок для нескольких пользователей
  const mockSessions: TrainingSession[] = [
    { id: '1', profileId: '1', profileName: 'Мария Данина', date: '05.01.2026', dateISO: '2026-01-05', type: 'Концентрация', duration: 16, timeElapsed: 960, timeInZone: 68, endReason: 'completed', points: 850, rating: 5, mood: 'better', concentration: 5, avgHeartRate: 72, maxHeartRate: 85, zones: { alpha: 25, beta: 30, theta: 35, gamma: 10 } },
    { id: '2', profileId: '1', profileName: 'Мария Данина', date: '04.01.2026', dateISO: '2026-01-04', type: 'Спокойствие', duration: 16, timeElapsed: 960, timeInZone: 72, endReason: 'completed', points: 920, rating: 4, mood: 'same', concentration: 4, avgHeartRate: 68, maxHeartRate: 78, zones: { alpha: 40, beta: 20, theta: 30, gamma: 10 } },
    { id: '3', profileId: '2', profileName: 'Жопа Жопа', date: '03.01.2026', dateISO: '2026-01-03', type: 'Фокус', duration: 16, timeElapsed: 960, timeInZone: 65, endReason: 'completed', points: 780, rating: 4, mood: 'better', concentration: 4, avgHeartRate: 75, maxHeartRate: 88, zones: { alpha: 20, beta: 35, theta: 30, gamma: 15 } },
    { id: '4', profileId: '1', profileName: 'Мария Данина', date: '02.01.2026', dateISO: '2026-01-02', type: 'Концентрация', duration: 16, timeElapsed: 960, timeInZone: 70, endReason: 'completed', points: 880, rating: 5, mood: 'better', concentration: 5, avgHeartRate: 70, maxHeartRate: 82, zones: { alpha: 22, beta: 32, theta: 33, gamma: 13 } },
    { id: '5', profileId: '2', profileName: 'Жопа Жопа', date: '01.01.2026', dateISO: '2026-01-01', type: 'Дыхание', duration: 10, timeElapsed: 600, timeInZone: 0, endReason: 'completed', rating: 3, mood: 'same', concentration: 3, avgHeartRate: 65, maxHeartRate: 72 },
    { id: '6', profileId: '1', profileName: 'Мария Данина', date: '31.12.2025', dateISO: '2025-12-31', type: 'Концентрация', duration: 16, timeElapsed: 960, timeInZone: 75, endReason: 'completed', points: 950, rating: 5, mood: 'better', concentration: 5, avgHeartRate: 71, maxHeartRate: 84 },
    { id: '7', profileId: '1', profileName: 'Мария Данина', date: '30.12.2025', dateISO: '2025-12-30', type: 'Спокойствие', duration: 16, timeElapsed: 960, timeInZone: 68, endReason: 'completed', points: 870, rating: 4, mood: 'same', concentration: 4 },
    { id: '8', profileId: '2', profileName: 'Жопа Жопа', date: '29.12.2025', dateISO: '2025-12-29', type: 'Фокус', duration: 16, timeElapsed: 960, timeInZone: 60, endReason: 'early', points: 720, rating: 3, mood: 'worse', concentration: 3 },
  ];

  // Уникальные профили и типы тренировок
  const uniqueProfiles = useMemo(() => {
    const profiles = Array.from(new Set(mockSessions.map(s => ({ id: s.profileId, name: s.profileName }))));
    return profiles.map(p => p.name);
  }, []);

  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(mockSessions.map(s => s.type)));
  }, []);

  // Фильтрация тренировок
  const filteredSessions = useMemo(() => {
    return mockSessions.filter(session => {
      const matchesProfile = selectedProfile === "all" || session.profileName === selectedProfile;
      const matchesType = selectedType === "all" || session.type === selectedType;
      const matchesDate = !dateSearch || session.date.includes(dateSearch) || session.dateISO.includes(dateSearch);
      return matchesProfile && matchesType && matchesDate;
    });
  }, [selectedProfile, selectedType, dateSearch]);

  // Статистика по участникам (только для тех, у кого есть тренировки)
  // Группируем по profileName, чтобы избежать дубликатов
  const participantStats = useMemo(() => {
    const statsMap = new Map<string, ParticipantStats>();
    
    // Собираем статистику только для тех профилей, у которых есть тренировки
    mockSessions.forEach(session => {
      // Используем profileName как ключ для группировки
      const key = session.profileName;
      
      if (!statsMap.has(key)) {
        statsMap.set(key, {
          profileId: session.profileId,
          profileName: session.profileName,
          totalSessions: 0,
          totalMinutes: 0,
          avgTimeInZone: 0,
          completedSessions: 0,
          earlySessions: 0,
          technicalSessions: 0,
          sessionsByType: {},
        });
      }
      
      const stats = statsMap.get(key)!;
      stats.totalSessions++;
      stats.totalMinutes += session.duration;
      // Пересчитываем средний процент в зоне
      const totalTimeInZone = stats.avgTimeInZone * (stats.totalSessions - 1) + session.timeInZone;
      stats.avgTimeInZone = totalTimeInZone / stats.totalSessions;
      
      if (session.endReason === 'completed') stats.completedSessions++;
      else if (session.endReason === 'early') stats.earlySessions++;
      else if (session.endReason === 'technical') stats.technicalSessions++;
      
      stats.sessionsByType[session.type] = (stats.sessionsByType[session.type] || 0) + 1;
      
      if (!stats.lastSessionDate || session.dateISO > stats.lastSessionDate) {
        stats.lastSessionDate = session.dateISO;
      }
    });
    
    // Возвращаем только уникальных участников (по имени)
    return Array.from(statsMap.values());
  }, []);

  // Отчет о частоте тренировок (только для тех, у кого есть тренировки)
  const frequencyReports = useMemo(() => {
    const RECOMMENDED_FREQUENCY = 4; // тренировок в неделю
    
    return participantStats.map(participant => {
      const participantSessions = mockSessions.filter(s => s.profileId === participant.profileId);
      
      // Сегодняшняя дата для расчета недели/месяца
      const today = new Date('2026-01-23'); // Моковая дата
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);
      
      const thisWeekSessions = participantSessions.filter(s => {
        const sessionDate = new Date(s.dateISO);
        return sessionDate >= weekAgo;
      });
      
      const thisMonthSessions = participantSessions.filter(s => {
        const sessionDate = new Date(s.dateISO);
        return sessionDate >= monthAgo;
      });
      
      const completedThisWeek = thisWeekSessions.filter(s => s.endReason === 'completed').length;
      const completedThisMonth = thisMonthSessions.filter(s => s.endReason === 'completed').length;
      
      // Расчет пропущенных тренировок (упрощенный: если меньше рекомендуемой частоты)
      const expectedThisWeek = RECOMMENDED_FREQUENCY;
      const missedThisWeek = Math.max(0, expectedThisWeek - completedThisWeek);
      const expectedThisMonth = RECOMMENDED_FREQUENCY * 4;
      const missedThisMonth = Math.max(0, expectedThisMonth - completedThisMonth);
      
      // Процент соответствия - используем среднее за месяц, если за неделю нет данных
      let complianceRate = 0;
      if (completedThisWeek > 0) {
        complianceRate = Math.round((completedThisWeek / expectedThisWeek) * 100);
      } else if (completedThisMonth > 0) {
        // Если нет данных за неделю, считаем по месяцу
        complianceRate = Math.round((completedThisMonth / expectedThisMonth) * 100);
      } else {
        // Если вообще нет данных, показываем 0
        complianceRate = 0;
      }
      
      // Streak (упрощенный расчет)
      const sortedSessions = participantSessions
        .filter(s => s.endReason === 'completed')
        .sort((a, b) => b.dateISO.localeCompare(a.dateISO));
      
      let streak = 0;
      if (sortedSessions.length > 0) {
        let currentDate = new Date(today);
        for (const session of sortedSessions) {
          const sessionDate = new Date(session.dateISO);
          const daysDiff = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff === streak) {
            streak++;
            currentDate = sessionDate;
          } else if (daysDiff > streak) {
            break;
          }
        }
      }
      
      return {
        profileId: participant.profileId,
        profileName: participant.profileName,
        recommendedFrequency: RECOMMENDED_FREQUENCY,
        completedThisWeek,
        completedThisMonth,
        missedThisWeek,
        missedThisMonth,
        complianceRate,
        streak,
      } as FrequencyReport;
    });
  }, [participantStats]);

  const handleSessionClick = (session: TrainingSession) => {
    setSelectedSession(session);
  };

  // Генерируем данные для графика динамики (как в мобильном приложении)
  const chartData = useMemo<Array<{ time: string; value: number }>>(() => {
    if (!selectedSession) return [];
    
    const data: Array<{ time: string; value: number }> = [];
    const intervals = Math.floor(selectedSession.duration / 2); // Точка каждые 2 минуты
    const seed = parseInt(selectedSession.id) || 0;
    
    for (let i = 0; i <= intervals; i++) {
      const time = i * 2;
      const pseudoRandom = ((seed + time) * 9301 + 49297) % 233280 / 233280;
      const value = Math.min(10, Math.max(0, 
        3 + (time / selectedSession.duration) * 5 + Math.sin(time / 3) * 1.5 + (pseudoRandom - 0.5) * 1
      ));
      data.push({
        time: `${time} мин`,
        value: Math.round(value * 10) / 10,
      });
    }
    return data;
  }, [selectedSession]);

  const totalSessions = filteredSessions.length;
  const totalMinutes = filteredSessions.reduce((sum, s) => sum + s.duration, 0);

  // Если профилей нет - показываем уведомление
  if (!profiles || profiles.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="glass-elegant p-8 text-center" style={{ background: 'rgba(255, 255, 255, 0.25)' }}>
          <div className="space-y-4">
            <SerifHeading size="xl" className="mb-2">
              Пока нет данных о тренировках
            </SerifHeading>
            <p className="text-muted-foreground">
              Раздел будет доступен после подключения тренировок в мобильном приложении.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Если профили есть, но тренировок нет - показываем уведомление
  if (mockSessions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="glass-elegant p-8 text-center" style={{ background: 'rgba(255, 255, 255, 0.25)' }}>
          <div className="space-y-4">
            <SerifHeading size="xl" className="mb-2">
              Пока нет данных о тренировках
            </SerifHeading>
            <p className="text-muted-foreground">
              Раздел будет доступен после подключения тренировок в мобильном приложении.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-8">
      {/* Заголовок */}
      <div className="mb-6">
        <SerifHeading size="2xl">Прогресс</SerifHeading>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <WellnessCard gradient="lavender" className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Uicon name="calendar" style="rr" className="h-5 w-5 text-muted-foreground" />
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">Тренировок</p>
          </div>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1a1a1a]">{totalSessions}</p>
        </WellnessCard>
        <WellnessCard gradient="pink" className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Uicon name="trending-up" style="rr" className="h-5 w-5 text-muted-foreground" />
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">Минут</p>
          </div>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1a1a1a]">{totalMinutes}</p>
        </WellnessCard>
      </div>

      {/* Табы */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="glass-elegant grid w-full grid-cols-2 mb-6">
          <TabsTrigger 
            value="history"
            className="flex items-center gap-2 data-[state=active]:bg-white/20 data-[state=active]:backdrop-blur-[8px]"
          >
            История
          </TabsTrigger>
          <TabsTrigger 
            value="participants"
            className="flex items-center gap-2 data-[state=active]:bg-white/20 data-[state=active]:backdrop-blur-[8px]"
          >
            Участники
          </TabsTrigger>
        </TabsList>

        {/* Вкладка: История */}
        <TabsContent value="history" className="space-y-6">
          {/* Фильтры */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select value={selectedProfile} onValueChange={setSelectedProfile}>
              <SelectTrigger>
                <SelectValue placeholder="Все участники" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все участники</SelectItem>
                {uniqueProfiles.map(profile => (
                  <SelectItem key={profile} value={profile}>{profile}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Все типы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                {uniqueTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="text"
              placeholder="Поиск по дате (ДД.ММ.ГГГГ)"
              value={dateSearch}
              onChange={(e) => setDateSearch(e.target.value)}
            />
          </div>

          {/* История тренировок */}
          {filteredSessions.length === 0 ? (
            <WellnessCard className="p-8 sm:p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#1a1a1a]/10 to-[#1a1a1a]/5 rounded-full flex items-center justify-center">
                <Uicon name="trending-up" style="rr" className="h-12 w-12 text-[#1a1a1a]/40" />
              </div>
              <SerifHeading size="xl" className="mb-4 text-2xl sm:text-3xl">
                Нет тренировок
              </SerifHeading>
              <p className="text-[#1a1a1a]/70 mb-6 max-w-md mx-auto">
                Попробуйте изменить фильтры или завершите несколько тренировок
              </p>
            </WellnessCard>
          ) : (
            <div className="space-y-3">
                {filteredSessions.map((session) => (
                  <WellnessCard
                    key={session.id}
                    className="p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                    onClick={() => handleSessionClick(session)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSessionClick(session);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm sm:text-base md:text-lg font-semibold text-[#1a1a1a]">{session.date}</p>
                        <p className="text-xs sm:text-sm md:text-base text-[#1a1a1a]/70">{session.type}</p>
                        <p className="text-xs sm:text-sm text-[#1a1a1a]/60 mt-1">{session.profileName}</p>
                      </div>
                      {session.points && (
                        <div className="text-right">
                          <p className="text-xs sm:text-sm md:text-base text-[#1a1a1a]/70">Очки</p>
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-[#1a1a1a]">{session.points}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs sm:text-sm md:text-base text-[#1a1a1a]/70 mb-2">
                      <span>{session.duration} мин</span>
                      {session.timeInZone > 0 && (
                        <>
                          <span>•</span>
                          <span>{session.timeInZone}% в зоне</span>
                        </>
                      )}
                      {session.endReason === 'early' && session.type !== 'Дыхание' && (
                        <>
                          <span>•</span>
                          <span className="text-xs sm:text-sm md:text-base text-orange-600">Досрочно завершено</span>
                        </>
                      )}
                      {session.endReason === 'technical' && (
                        <>
                          <span>•</span>
                          <span className="text-xs sm:text-sm md:text-base text-red-600">Прервано</span>
                        </>
                      )}
                    </div>
                    {session.timeInZone > 0 && (
                      <div className="w-full bg-[#1a1a1a]/10 rounded-full h-2">
                        <div
                          className="bg-[#a8d8ea] h-2 rounded-full"
                          style={{ width: `${session.timeInZone}%` }}
                        ></div>
                      </div>
                    )}
                  </WellnessCard>
                ))}
            </div>
          )}
        </TabsContent>

        {/* Вкладка: Участники */}
        <TabsContent value="participants" className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {participantStats.map((participant) => {
              const report = frequencyReports.find(r => r.profileId === participant.profileId);
              return (
                <div key={participant.profileId} className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-4 sm:p-6">
                  {/* Заголовок */}
                  <div className="mb-4">
                    <h3 className="text-lg sm:text-xl font-semibold text-[#1a1a1a] mb-2">{participant.profileName}</h3>
                  </div>

                  {/* Основная статистика */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
                    <div>
                      <p className="text-xs sm:text-sm text-[#1a1a1a]/70 mb-1">Тренировок</p>
                      <p className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">{participant.totalSessions}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-[#1a1a1a]/70 mb-1">Минут</p>
                      <p className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">{participant.totalMinutes}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-[#1a1a1a]/70 mb-1">% в зоне</p>
                      <p className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">{Math.round(participant.avgTimeInZone)}%</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-[#1a1a1a]/70 mb-1">Завершено</p>
                      <p className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">{participant.completedSessions}</p>
                    </div>
                  </div>

                  {/* Отчет о частоте - компактный вид */}
                  {report && (
                    <div className="border-t border-[#1a1a1a]/10 pt-4 space-y-3">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs sm:text-sm font-medium text-[#1a1a1a]">Частота тренировок</p>
                        <p className={`text-xs sm:text-sm font-semibold ${
                          report.complianceRate >= 80 ? 'text-green-600' :
                          report.complianceRate >= 50 ? 'text-[#F3B83A]' :
                          report.complianceRate > 0 ? 'text-coral' : 'text-[#1a1a1a]/50'
                        }`}>
                          {report.complianceRate > 0 ? `${report.complianceRate}% соответствие` : 'Нет данных'}
                        </p>
                      </div>
                      {/* Уведомление о низком соответствии */}
                      {report.complianceRate > 0 && report.complianceRate < 50 && (
                        <div className="p-2 sm:p-3 bg-coral/10 border border-coral/20 rounded-lg">
                          <p className="text-xs sm:text-sm text-[#1a1a1a]/70">
                            Рекомендуется увеличить частоту тренировок до {report.recommendedFrequency} раз в неделю
                          </p>
                        </div>
                      )}
                      {report.complianceRate >= 50 && report.complianceRate < 80 && (
                        <div className="p-2 sm:p-3 bg-[#F3B83A]/10 border border-[#F3B83A]/20 rounded-lg">
                          <p className="text-xs sm:text-sm text-[#1a1a1a]/70">
                            Хороший прогресс! Старайтесь тренироваться {report.recommendedFrequency} раза в неделю
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
                        <div>
                          <p className="text-[#1a1a1a]/70 mb-0.5">Рекомендуется</p>
                          <p className="font-semibold text-[#1a1a1a]">{report.recommendedFrequency}/нед</p>
                        </div>
                        <div>
                          <p className="text-[#1a1a1a]/70 mb-0.5">Выполнено (нед)</p>
                          <p className="font-semibold text-[#1a1a1a]">{report.completedThisWeek}</p>
                        </div>
                        <div>
                          <p className="text-[#1a1a1a]/70 mb-0.5">Выполнено (мес)</p>
                          <p className="font-semibold text-[#1a1a1a]">{report.completedThisMonth}</p>
                        </div>
                        <div>
                          <p className="text-[#1a1a1a]/70 mb-0.5">Серия</p>
                          <p className="font-semibold text-[#1a1a1a]">{report.streak} {report.streak === 1 ? 'день' : report.streak < 5 ? 'дня' : 'дней'}</p>
                        </div>
                      </div>
                      {/* Прогресс-бар соответствия */}
                      {report.complianceRate > 0 && (
                        <div className="mt-3">
                          <div className="w-full bg-[#1a1a1a]/10 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-2.5 rounded-full transition-all ${
                                report.complianceRate >= 80 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                                report.complianceRate >= 50 ? 'bg-gradient-to-r from-[#F3B83A] to-[#FFD54F]' :
                                'bg-gradient-to-r from-coral to-coral-light'
                              }`}
                              style={{ width: `${Math.min(report.complianceRate, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Типы тренировок */}
                  <div className="border-t border-[#1a1a1a]/10 pt-4 mt-4">
                    <p className="text-xs sm:text-sm text-[#1a1a1a]/70 mb-2">Тренировки по типам:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(participant.sessionsByType).map(([type, count]) => (
                        <span key={type} className="text-xs sm:text-sm px-2 py-1 bg-[#1a1a1a]/5 rounded-full text-[#1a1a1a]">
                          {type}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Модальное окно с детальной информацией о тренировке */}
      <Dialog open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col p-0 m-4 sm:m-0">
          <div className="p-4 sm:p-6 pb-3 sm:pb-4 flex-shrink-0">
            <DialogHeader>
              <SerifHeading size="xl" className="text-xl sm:text-2xl md:text-3xl">Детали тренировки</SerifHeading>
            </DialogHeader>
          </div>
          <ScrollArea className="h-[calc(95vh-100px)] sm:h-[calc(90vh-120px)] px-4 sm:px-6 pb-4 sm:pb-6">
            {selectedSession && (
              <div className="space-y-4 sm:space-y-6">
                {/* Основная информация */}
                <WellnessCard>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <p className="text-xs sm:text-sm text-[#1a1a1a]/70 mb-1">Участник</p>
                      <p className="text-sm sm:text-base font-semibold text-[#1a1a1a]">{selectedSession.profileName}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      <div>
                        <p className="text-xs sm:text-sm text-[#1a1a1a]/70 mb-0.5 sm:mb-1">Дата</p>
                        <p className="text-sm sm:text-base font-semibold text-[#1a1a1a]">{selectedSession.date}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-[#1a1a1a]/70 mb-0.5 sm:mb-1">Тип тренировки</p>
                        <p className="text-sm sm:text-base font-semibold text-[#1a1a1a]">{selectedSession.type}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-[#1a1a1a]/70 mb-0.5 sm:mb-1">Длительность</p>
                        <p className="text-sm sm:text-base font-semibold text-[#1a1a1a]">{selectedSession.duration} мин</p>
                      </div>
                    </div>
                    {selectedSession.endReason === 'early' && selectedSession.type !== 'Дыхание' && (
                      <div className="p-2 sm:p-3 bg-orange-50 rounded-lg">
                        <p className="text-xs sm:text-sm text-orange-800">Тренировка завершена досрочно</p>
                      </div>
                    )}
                    {selectedSession.endReason === 'technical' && (
                      <div className="p-2 sm:p-3 bg-red-50 rounded-lg">
                        <p className="text-xs sm:text-sm text-red-800">
                          {selectedSession.technicalIssue || 'Тренировка прервана из-за технических проблем'}
                        </p>
                      </div>
                    )}
                  </div>
                </WellnessCard>

                {/* Оценка и изменения состояния */}
                {(selectedSession.rating || selectedSession.mood || selectedSession.concentration) && (
                  <WellnessCard>
                    <h3 className="text-base sm:text-lg font-semibold text-[#1a1a1a] mb-3 sm:mb-4">Оценка тренировки</h3>
                    <div className="space-y-3 sm:space-y-4">
                      {selectedSession.rating && (
                        <div>
                          <p className="text-xs sm:text-sm text-[#1a1a1a]/70 mb-1.5 sm:mb-2">Оценка тренировки</p>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5 sm:gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`text-xl sm:text-2xl ${
                                    star <= selectedSession.rating!
                                      ? 'text-[#F3B83A]'
                                      : 'text-[#1a1a1a]/20'
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="text-xs sm:text-sm text-[#1a1a1a]/70">
                              {selectedSession.rating} из 5
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {selectedSession.mood && (
                        <div>
                          <p className="text-xs sm:text-sm text-[#1a1a1a]/70 mb-1.5 sm:mb-2">Изменение настроения</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xl sm:text-2xl">
                              {selectedSession.mood === 'better' ? '😊' : selectedSession.mood === 'same' ? '😐' : '😟'}
                            </span>
                            <span className="text-sm sm:text-base text-[#1a1a1a] font-medium">
                              {selectedSession.mood === 'better' ? 'Лучше' : selectedSession.mood === 'same' ? 'Так же' : 'Хуже'}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {selectedSession.concentration && (
                        <div>
                          <p className="text-xs sm:text-sm text-[#1a1a1a]/70 mb-1.5 sm:mb-2">Уровень концентрации после тренировки</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xl sm:text-2xl">
                              {selectedSession.concentration === 1 ? '😵' :
                               selectedSession.concentration === 2 ? '😐' :
                               selectedSession.concentration === 3 ? '🙂' :
                               selectedSession.concentration === 4 ? '😊' : '🤓'}
                            </span>
                            <span className="text-sm sm:text-base text-[#1a1a1a] font-medium">
                              {selectedSession.concentration === 1 ? 'Рассеян' :
                               selectedSession.concentration === 2 ? 'Немного' :
                               selectedSession.concentration === 3 ? 'Нормально' :
                               selectedSession.concentration === 4 ? 'Хорошо' : 'Отлично'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </WellnessCard>
                )}

                {/* График динамики - показываем для всех тренировок, кроме технических проблем */}
                {selectedSession.endReason !== 'technical' && chartData.length > 0 && (
                  <WellnessCard>
                    <h3 className="text-base sm:text-lg font-semibold text-[#1a1a1a] mb-3 sm:mb-4">Динамика в течение сессии</h3>
                    <MoodChart
                      data={chartData.map(d => ({ day: d.time, mood: d.value }))}
                      color="#a8d8ea"
                    />
                    <div className="mt-3 sm:mt-4 flex items-center justify-between text-xs sm:text-sm text-[#1a1a1a]/70">
                      <span>Время</span>
                      <span>Уровень концентрации</span>
                    </div>
                  </WellnessCard>
                )}

                {/* Прогресс-бар времени в зоне */}
                {selectedSession.timeInZone > 0 && (
                  <WellnessCard>
                    <h3 className="text-base sm:text-lg font-semibold text-[#1a1a1a] mb-3 sm:mb-4">Время в зоне</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-[#1a1a1a]/70">Процент времени выше порога</span>
                        <span className="font-semibold text-[#1a1a1a]">{selectedSession.timeInZone}%</span>
                      </div>
                      <div className="w-full bg-[#1a1a1a]/10 rounded-full h-3 sm:h-4">
                        <div
                          className="bg-gradient-to-r from-[#a8d8ea] to-[#6ab9e7] h-3 sm:h-4 rounded-full transition-all"
                          style={{ width: `${selectedSession.timeInZone}%` }}
                        ></div>
                      </div>
                      {selectedSession.points && (
                        <p className="text-xs sm:text-sm text-[#1a1a1a]/60 mt-1.5 sm:mt-2">
                          Абсолютное время над порогом: {Math.round((selectedSession.duration * 60 * selectedSession.timeInZone) / 100)} сек
                        </p>
                      )}
                      {selectedSession.points && (
                        <div className="pt-2 border-t border-[#1a1a1a]/10">
                          <p className="text-xs sm:text-sm text-[#1a1a1a]/70 mb-1">Очки</p>
                          <p className="text-lg sm:text-xl font-bold text-[#1a1a1a]">{selectedSession.points}</p>
                        </div>
                      )}
                    </div>
                  </WellnessCard>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
