import React, { useState } from 'react';
import {
  SplashScreen,
  LoginScreen,
  ForgotPasswordScreen,
  ProfileTypeSelectionScreen,
  SubProfileSelectionScreen,
  WelcomeFlowScreen,
  PermissionsExplanationScreen,
  HomeScreen,
  CheckInScreen,
  DeviceConnectionScreen,
  DeviceConnectedScreen,
  DeviceNotFoundScreen,
  DeviceInTransitScreen,
  WearingInstructionScreen,
  SignalCheckScreen,
  TrainingTipsScreen,
  TrainingSelectionScreen,
  TrainingPlaylistSelectionScreen,
  ActiveTrainingScreen,
  BreathingTrainingScreen,
  TrainingCompleteScreen,
  PostTrainingCheckoutScreen,
  ProgressScreen,
  SettingsScreen,
  PurchaseScreen,
  PlaylistScreen,
  ProfileScreen,
  TrainingDetailScreen,
  TutorialScreen,
  ProgramSelectionModal,
} from './screens';
import { BottomNavigation } from '../design-system/BottomNavigation';
import { PillButton } from '../design-system/PillButton';
import { Modal } from '../design-system/Modal';
import { Home, BarChart3, Music2, Settings, MessageCircle } from 'lucide-react';

type WavesScreen =
  | 'splash'
  | 'login'
  | 'forgot-password'
  | 'profile-type-selection'
  | 'sub-profile-selection'
  | 'welcome-1'
  | 'welcome-2'
  | 'welcome-3'
  | 'permissions'
  | 'home'
  | 'check-in'
  | 'device-connection'
  | 'device-connected'
  | 'device-not-found'
  | 'device-in-transit'
  | 'purchase'
  | 'wearing-instruction'
  | 'signal-check'
  | 'training-playlist-selection'
  | 'training-tips'
  | 'training-selection'
  | 'active-training'
  | 'breathing-training'
  | 'training-complete'
  | 'post-training-checkout'
  | 'progress'
  | 'training'
  | 'settings'
  | 'profile'
  | 'training-detail'
  | 'tutorial'
  | 'support';

interface SubProfile {
  id: string;
  name: string;
  age?: number;
  avatar?: string;
  type?: 'child' | 'adult';
}

export function WavesAppFlow() {
  const [currentScreen, setCurrentScreen] = useState<WavesScreen>('splash');
  const [profileType, setProfileType] = useState<'waves' | 'waves-kids'>('waves-kids');
  const [selectedSubProfile, setSelectedSubProfile] = useState<SubProfile | null>(null);
  const [welcomeStep, setWelcomeStep] = useState<1 | 2 | 3>(1);
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const [selectedTrainingType, setSelectedTrainingType] = useState<string>('tbr');
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
  const [connectedDeviceBattery, setConnectedDeviceBattery] = useState<number | null>(null);
  const [lastTrainingSessionId, setLastTrainingSessionId] = useState<string | null>(null);
  const [deviceConnectionReturnToHome, setDeviceConnectionReturnToHome] = useState<boolean>(false);
  
  // Список доступных устройств (mock данные)
  const availableDevices = [
    { id: 'Flex4-12345', name: 'Flex4', batteryLevel: 85 },
    { id: 'Flex4-67890', name: 'Flex4', batteryLevel: 15 },
  ];

  // Mock плейлист пользователя с 50 треками для тестирования (в реальном приложении будет загружаться из API)
  const generateMockTracks = () => {
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
    const sources = ['spotify', 'youtube', 'apple-music'] as const;

    const tracks: Array<{
      id: string;
      title: string;
      type: 'audio' | 'video';
      source: 'youtube' | 'spotify' | 'apple-music';
      thumbnail?: string;
      duration: string;
      addedAt: Date;
      url: string;
    }> = [];
    
    // 25 аудио треков
    for (let i = 0; i < 25; i++) {
      tracks.push({
        id: `audio-${i + 1}`,
        title: audioTitles[i],
        type: 'audio' as const,
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
        type: 'video' as const,
        source: 'youtube' as const,
        thumbnail: `https://img.youtube.com/vi/example${i}/mqdefault.jpg`,
        duration: durations[(i + 5) % durations.length],
        addedAt: new Date(2024, 0, 15 - i - 25),
        url: `https://youtube.com/watch?v=example${i}`,
      });
    }

    return tracks;
  };

  const userPlaylist = {
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
  };
  
  // Список доступных программ тренировок
  const availablePrograms = [
    { id: 'tbr', name: 'Концентрация', eyesOpen: true, waves: 'Theta/Beta (4-7 / 15-20 Hz)', duration: 16 },
    { id: 'alpha', name: 'Спокойствие', eyesOpen: false, waves: 'Alpha (8-12 Hz)', duration: 16 },
    { id: 'smr', name: 'Фокус', eyesOpen: true, waves: 'Low-Beta (12-15 Hz)', duration: 16 },
  ];
  // Состояние устройства и подписки
  const [hasDevice, setHasDevice] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscriptionType, setSubscriptionType] = useState<'basic' | 'parent-child' | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<'none' | 'in-transit' | 'delivered'>('none');
  const [lastTrainingData, setLastTrainingData] = useState<{
    endReason: 'completed' | 'early' | 'technical';
    timeElapsed: number;
    duration: number;
    technicalIssue?: string;
  } | null>(null);
  
  // История тренировок
  const [trainingHistory, setTrainingHistory] = useState<Array<{
    id: string;
    date: string;
    type: string;
    duration: number; // в минутах
    timeElapsed: number; // в секундах
    timeInZone: number;
    endReason: 'completed' | 'early' | 'technical';
    technicalIssue?: string;
    points?: number;
    rating?: number; // оценка тренировки (1-5)
    mood?: string; // изменение настроения (better/same/worse)
    concentration?: number; // уровень концентрации после тренировки (1-5)
  }>>([]);
  const [selectedTrainingSession, setSelectedTrainingSession] = useState<{
    id: string;
    date: string;
    type: string;
    duration: number;
    timeElapsed: number;
    timeInZone: number;
    endReason: 'completed' | 'early' | 'technical';
    technicalIssue?: string;
    points?: number;
    rating?: number;
    mood?: string;
    concentration?: number;
  } | null>(null);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isProgramSelectionModalOpen, setIsProgramSelectionModalOpen] = useState(false);

  // Mock данные для субпрофилей
  const [allSubProfiles, setAllSubProfiles] = useState<SubProfile[]>([
    { id: '1', name: 'Миша', age: 9, type: 'child' },
    { id: '2', name: 'Анна', age: 38, type: 'adult' },
    { id: '3', name: 'Саша', age: 7, type: 'child' },
    { id: '4', name: 'Иван', age: 42, type: 'adult' },
  ]);

  // Фильтруем субпрофили по типу профиля
  const mockSubProfiles = allSubProfiles.filter((profile) => {
    if (profileType === 'waves-kids') {
      return profile.type === 'child' || (profile.age && profile.age < 18);
    } else {
      return profile.type === 'adult' || (profile.age && profile.age >= 18);
    }
  });

  // После сплэш-экрана показываем логин
  React.useEffect(() => {
    if (currentScreen === 'splash') {
      setTimeout(() => setCurrentScreen('login'), 2000);
    }
  }, [currentScreen]);

  const handleLogin = (email: string, password: string) => {
    // Для демо-режима принимаем любые данные для входа
    // После успешного логина → выбор типа профиля
    setCurrentScreen('profile-type-selection');
  };

  const handleProfileTypeSelect = (type: 'waves' | 'waves-kids') => {
    setProfileType(type);
    setCurrentScreen('sub-profile-selection');
  };

  const handleSubProfileSelect = (profileId: string) => {
    const profile = allSubProfiles.find((p) => p.id === profileId);
    if (profile) {
      setSelectedSubProfile(profile);
      if (isFirstLaunch) {
        setCurrentScreen('welcome-1');
      } else {
        setCurrentScreen('home');
      }
    }
  };

  const handleWelcomeNext = () => {
    if (welcomeStep < 3) {
      setWelcomeStep((prev) => (prev + 1) as 1 | 2 | 3);
      setCurrentScreen(`welcome-${welcomeStep + 1}` as WavesScreen);
    }
  };

  const handleWelcomeComplete = () => {
    setIsFirstLaunch(false);
    setCurrentScreen('permissions');
  };

  const handlePermissionsContinue = () => {
    setCurrentScreen('home');
  };

  const handlePermissionsBack = () => {
    setCurrentScreen('welcome-3');
  };

  const handleStartTraining = (type: string) => {
    setSelectedTrainingType(type);
    if (type === 'breathing') {
      // Дыхательные упражнения не требуют устройства
      setCurrentScreen('check-in');
    } else {
      // Для других тренировок сначала проверяем подключение устройства
      if (!connectedDevice) {
        setCurrentScreen('device-connection');
      } else {
        // Если устройство уже подключено, переходим сразу к выбору плейлиста
        setCurrentScreen('training-playlist-selection');
      }
    }
  };

  const handleCheckInComplete = () => {
    if (selectedTrainingType === 'breathing') {
      setCurrentScreen('breathing-training');
    } else {
      // После чекина переходим к старту тренировки
      setCurrentScreen('active-training');
    }
  };

  const handleDeviceConnected = (deviceId: string, batteryLevel?: number) => {
    setConnectedDevice(deviceId);
    if (batteryLevel !== undefined) {
      setConnectedDeviceBattery(batteryLevel);
    }
  };

  const handleDeviceContinue = () => {
    // После подключения устройства переходим к выбору плейлиста
    setCurrentScreen('training-playlist-selection');
  };

  const handlePlaylistSelectionComplete = (selectedTrackIds: string[]) => {
    // Сохраняем выбранные треки (можно использовать для воспроизведения во время тренировки)
    // После выбора плейлиста переходим к советам
    setCurrentScreen('training-tips');
  };

  const handleWearingReady = () => {
    setCurrentScreen('signal-check');
  };

  const handleSignalCheckComplete = () => {
    // После проверки сигнала переходим к подтверждению начала тренировки (экран "Текущая программа")
    setCurrentScreen('training-selection');
  };

  const handleTrainingTipsContinue = () => {
    // После советов переходим к инструктажу по надеванию устройства
    setCurrentScreen('wearing-instruction');
  };

  const handleTrainingStart = () => {
    // После подтверждения начала тренировки переходим к чекину
    setCurrentScreen('check-in');
  };

  const handleTrainingComplete = (
    endReason: 'completed' | 'early' | 'technical',
    timeElapsed: number,
    technicalIssue?: string
  ) => {
    // Сохраняем данные о тренировке с реальным временем
    const trainingData = {
      endReason,
      timeElapsed,
      duration: 16 * 60, // Планируемая длительность тренировки (16 минут в секундах)
      technicalIssue,
    };
    setLastTrainingData(trainingData);
    
    // Сохраняем в историю тренировок с правильной пометкой причины завершения
    const sessionId = Date.now().toString();
    const newSession = {
      id: sessionId,
      date: new Date().toLocaleDateString('ru-RU'),
      type: selectedTrainingType === 'tbr' ? 'Концентрация' : 
            selectedTrainingType === 'alpha' ? 'Спокойствие' : 
            selectedTrainingType === 'smr' ? 'Фокус' : 
            selectedTrainingType === 'breathing' ? 'Дыхание' : 'Тренировка',
      duration: Math.round(timeElapsed / 60), // в минутах для отображения
      timeElapsed, // в секундах для точности
      timeInZone: endReason === 'completed' ? 68 : 0, // только для завершенных тренировок
      endReason,
      technicalIssue,
      points: endReason === 'completed' ? Math.round(timeElapsed / 60) * 50 : undefined, // очки только за завершенные
    };
    setLastTrainingSessionId(sessionId);
    setTrainingHistory((prev) => [newSession, ...prev]);
    
    setCurrentScreen('training-complete');
  };

  const handleTrainingCompleteDone = () => {
    // После завершения тренировки → Post-training Check-out (M28b)
    setCurrentScreen('post-training-checkout');
  };

  const handlePostTrainingCheckoutComplete = (data?: { mood: string; concentration: number; rating: number }) => {
    // Обновляем последнюю тренировку данными из чек-аута
    if (data && lastTrainingSessionId) {
      setTrainingHistory((prev) => {
        const updated = prev.map((session) => {
          if (session.id === lastTrainingSessionId) {
            const updatedSession = {
              ...session,
              rating: data.rating,
              mood: data.mood,
              concentration: data.concentration,
            };
            // Также обновляем selectedTrainingSession, если она открыта
            if (selectedTrainingSession?.id === lastTrainingSessionId) {
              setSelectedTrainingSession(updatedSession);
            }
            return updatedSession;
          }
          return session;
        });
        return updated;
      });
    }
    // После check-out → главный экран
    // TODO: Здесь можно добавить проверку на первую тренировку и показать запрос push-уведомлений (M28d)
    setCurrentScreen('home');
  };

  const handleNavigation = (tab: string) => {
    switch (tab) {
      case 'home':
        setCurrentScreen('home');
        break;
      case 'progress':
        setCurrentScreen('progress');
        break;
      case 'training':
        setCurrentScreen('training');
        break;
      case 'settings':
        setCurrentScreen('settings');
        break;
      case 'support':
        setIsSupportModalOpen(true);
        break;
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen />;

      case 'login':
        return (
          <LoginScreen
            onLogin={handleLogin}
            onForgotPassword={() => setCurrentScreen('forgot-password')}
          />
        );

      case 'forgot-password':
        return (
          <ForgotPasswordScreen
            onBack={() => setCurrentScreen('login')}
            onSend={(email) => {
              console.log('Send password reset to:', email);
            }}
          />
        );

      case 'profile-type-selection':
        return <ProfileTypeSelectionScreen onSelect={handleProfileTypeSelect} />;

      case 'sub-profile-selection':
        return (
          <SubProfileSelectionScreen
            profiles={mockSubProfiles}
            profileType={profileType}
            onSelect={handleSubProfileSelect}
            onBack={() => setCurrentScreen('profile-type-selection')}
            onLogout={() => setCurrentScreen('login')}
            canAdd={true}
          />
        );

      case 'welcome-1':
      case 'welcome-2':
      case 'welcome-3':
        // Определяем имя родителя для приветствия
        let parentName: string | undefined;
        if (profileType === 'waves') {
          // Если это профиль взрослого, то selectedSubProfile - это и есть родитель
          parentName = selectedSubProfile?.name;
        } else {
          // Если это профиль ребенка, находим родителя из списка
          const parentProfile = allSubProfiles.find((p) => 
            (p.type === 'adult' || (p.age && p.age >= 18))
          );
          parentName = parentProfile?.name;
        }
        return (
          <WelcomeFlowScreen
            step={welcomeStep}
            childName={selectedSubProfile?.name}
            parentName={parentName}
            onNext={handleWelcomeNext}
            onComplete={handleWelcomeComplete}
            onStepChange={(newStep) => {
              setWelcomeStep(newStep);
              setCurrentScreen(`welcome-${newStep}` as WavesScreen);
            }}
          />
        );

      case 'permissions':
        return <PermissionsExplanationScreen onContinue={handlePermissionsContinue} onBack={handlePermissionsBack} />;

      case 'home':
        return (
          <HomeScreen
            childName={selectedSubProfile?.name}
            profileType={profileType}
            onProfileTypeChange={(type) => {
              setProfileType(type);
              setCurrentScreen('sub-profile-selection');
            }}
            onStartTraining={handleStartTraining}
            onTutorial={() => setCurrentScreen('tutorial')}
            streak={5}
          />
        );

      case 'check-in':
        return (
          <CheckInScreen
            childName={selectedSubProfile?.name}
            onContinue={handleCheckInComplete}
            onBack={() => setCurrentScreen('home')}
          />
        );

      case 'device-connection':
        return (
          <DeviceConnectionScreen
            onClose={() => {
              setConnectedDevice(null);
              setDeviceConnectionReturnToHome(false);
              setCurrentScreen('home');
            }}
            onSupport={() => setIsSupportModalOpen(true)}
            returnToHome={deviceConnectionReturnToHome}
            onConnected={(deviceId, batteryLevel) => {
              handleDeviceConnected(deviceId, batteryLevel);
              // Если пришли из настроек, возвращаемся на главную, иначе продолжаем flow тренировки
              if (deviceConnectionReturnToHome) {
                setDeviceConnectionReturnToHome(false);
                setCurrentScreen('home');
              } else {
                setCurrentScreen('training-playlist-selection');
              }
            }}
            onNoDevice={() => {
              // Проверяем статус устройства и подписки
              if (!hasDevice && !hasSubscription) {
                // Нет устройства и подписки - показываем экран покупки
                setCurrentScreen('purchase');
              } else if (deviceStatus === 'in-transit') {
                // Устройство в пути
                setCurrentScreen('device-in-transit');
              } else {
                // Устройство не куплено, но есть подписка (или другая ситуация)
                setCurrentScreen('purchase');
              }
            }}
          />
        );

      case 'device-connected':
        return (
          <DeviceConnectedScreen
            deviceId={connectedDevice || 'Flex4-12345'}
            batteryLevel={connectedDeviceBattery ?? undefined}
            onContinue={handleDeviceContinue}
            onClose={() => {
              setConnectedDevice(null);
              setCurrentScreen('home');
            }}
            onHome={() => {
              setConnectedDevice(null);
              setCurrentScreen('home');
            }}
            onBack={() => setCurrentScreen('device-connection')}
          />
        );

      case 'device-not-found':
        return (
          <DeviceNotFoundScreen
            onRetry={() => setCurrentScreen('device-connection')}
            onSupport={() => setIsSupportModalOpen(true)}
          />
        );

      case 'device-in-transit':
        return (
          <DeviceInTransitScreen
            onBreathingExercise={() => setCurrentScreen('breathing-training')}
            onVideo={() => window.open('https://www.youtube.com/watch?v=example', '_blank')}
            onBack={() => setCurrentScreen('home')}
          />
        );

      case 'purchase':
        return (
          <PurchaseScreen
            onPurchase={() => {
              // После покупки: активируем подписку и устройство
              setHasSubscription(true);
              setSubscriptionType('basic'); // Можно определить тип на основе выбранного пакета
              setDeviceStatus('in-transit'); // Устройство будет доставлено
              // Переходим на главный экран
              setCurrentScreen('home');
            }}
            onBack={() => setCurrentScreen('home')}
          />
        );

      case 'wearing-instruction':
        return (
          <WearingInstructionScreen
            onBack={() => setCurrentScreen('training-tips')}
            onReady={handleWearingReady}
          />
        );

      case 'signal-check':
        return (
          <SignalCheckScreen
            onBack={() => setCurrentScreen('wearing-instruction')}
            onAllGood={handleSignalCheckComplete}
          />
        );

      case 'training-playlist-selection':
        return (
          <TrainingPlaylistSelectionScreen
            playlist={userPlaylist}
            trainingDuration={availablePrograms.find(p => p.id === selectedTrainingType)?.duration || 16}
            onContinue={handlePlaylistSelectionComplete}
            onBack={() => {
              // Возвращаемся на экран подключения устройства
              setCurrentScreen('device-connection');
            }}
          />
        );

      case 'training-tips':
        return (
          <TrainingTipsScreen
            onBack={() => {
              // Возвращаемся на выбор плейлиста
              setCurrentScreen('training-playlist-selection');
            }}
            onContinue={handleTrainingTipsContinue}
          />
        );

      case 'training-selection':
        return (
          <TrainingSelectionScreen
            currentProgram={{
              id: selectedTrainingType,
              name: availablePrograms.find(p => p.id === selectedTrainingType)?.name || 'Концентрация',
              description: 'Тренировка внимания',
              waves: availablePrograms.find(p => p.id === selectedTrainingType)?.waves || 'Theta/Beta (4-7 / 15-20 Hz)',
              duration: 16,
              eyesOpen: availablePrograms.find(p => p.id === selectedTrainingType)?.eyesOpen ?? true,
              current: true,
            }}
            onStart={handleTrainingStart}
            onChangeProgram={() => {
              setIsProgramSelectionModalOpen(true);
            }}
            onBack={() => {
              // Возвращаемся на проверку сигнала
              setCurrentScreen('signal-check');
            }}
          />
        );

      case 'active-training':
        return (
          <ActiveTrainingScreen
            trainingType={selectedTrainingType}
            duration={16 * 60} // 16 минут в секундах
            onComplete={(endReason, timeElapsed, technicalIssue) => handleTrainingComplete(endReason, timeElapsed, technicalIssue)}
            onTechnicalIssue={() => {
              // Симуляция технической проблемы - можно вызвать при потере сигнала
              // В реальном приложении это будет вызываться автоматически при обнаружении проблемы
              const currentTime = Math.floor(Math.random() * 8 * 60); // Случайное время до 8 минут
              handleTrainingComplete('technical', currentTime, 'Потерян сигнал с устройства. Проверьте подключение электродов.');
            }}
          />
        );

      case 'breathing-training':
        return (
          <BreathingTrainingScreen
            pattern={{ inhale: 4, hold: 4, exhale: 4, hold2: 4 }}
            onComplete={(endReason, timeElapsed, technicalIssue) => handleTrainingComplete(endReason, timeElapsed, technicalIssue)}
          />
        );

      case 'training-complete':
        return (
          <TrainingCompleteScreen
            userName={selectedSubProfile?.name || 'Пользователь'}
            duration={lastTrainingData ? Math.round(lastTrainingData.timeElapsed / 60) : 16}
            timeElapsed={lastTrainingData?.timeElapsed || 0}
            timeInZone={68}
            streak={lastTrainingData?.endReason === 'completed' ? 5 : 0}
            endReason={lastTrainingData?.endReason || 'completed'}
            technicalIssue={lastTrainingData?.technicalIssue}
            trainingType={selectedTrainingType}
            onComplete={handleTrainingCompleteDone}
            onRetry={
              lastTrainingData?.endReason === 'technical'
                ? () => {
                    // Возвращаемся к чекину для повторного запуска тренировки
                    // (устройство уже подключено, настройки уже выбраны)
                    setCurrentScreen('check-in');
                  }
                : undefined
            }
          />
        );

      case 'post-training-checkout':
        return (
          <PostTrainingCheckoutScreen
            childName={selectedSubProfile?.name}
            onComplete={(data) => handlePostTrainingCheckoutComplete(data)}
            onSkip={() => handlePostTrainingCheckoutComplete()}
          />
        );

      case 'progress':
        return (
          <ProgressScreen
            userName={selectedSubProfile?.name}
            onBack={() => setCurrentScreen('home')}
            sessions={trainingHistory}
            onSessionClick={(sessionId) => {
              console.log('onSessionClick called with sessionId:', sessionId);
              console.log('trainingHistory:', trainingHistory);
              // Ищем в trainingHistory или используем mock данные
              let session = trainingHistory.find((s) => s.id === sessionId);
              
              // Если не найдено в trainingHistory, создаем из mock данных
              if (!session) {
                const defaultSessions = [
                  { id: '1', date: '05.01.2026', type: 'Концентрация', duration: 16, timeElapsed: 960, timeInZone: 68, endReason: 'completed' as const, points: 850, rating: 5, mood: 'better' as const, concentration: 4 },
                  { id: '2', date: '04.01.2026', type: 'Спокойствие', duration: 16, timeElapsed: 960, timeInZone: 72, endReason: 'completed' as const, points: 920, rating: 4, mood: 'same' as const, concentration: 5 },
                  { id: '3', date: '03.01.2026', type: 'Фокус', duration: 16, timeElapsed: 960, timeInZone: 65, endReason: 'completed' as const, points: 780 },
                  { id: '4', date: '02.01.2026', type: 'Концентрация', duration: 16, timeElapsed: 960, timeInZone: 70, endReason: 'completed' as const, points: 880 },
                  { id: '5', date: '01.01.2026', type: 'Дыхание', duration: 10, timeElapsed: 600, timeInZone: 0, endReason: 'completed' as const },
                ];
                session = defaultSessions.find((s) => s.id === sessionId);
              }
              
              if (session) {
                console.log('Session found:', session);
                setSelectedTrainingSession(session);
                setCurrentScreen('training-detail');
              } else {
                console.warn('Session not found for id:', sessionId);
              }
            }}
          />
        );

      case 'training':
        return (
          <PlaylistScreen onBack={() => setCurrentScreen('home')} />
        );

      case 'settings':
        return (
          <SettingsScreen
            currentProfile={selectedSubProfile}
            allProfiles={allSubProfiles}
            onProfileChange={(profileId) => {
              const profile = allSubProfiles.find((p) => p.id === profileId);
              if (profile) {
                setSelectedSubProfile(profile);
                // Автоматически определяем тип профиля на основе возраста/типа пользователя
                if (profile.type === 'child' || (profile.age && profile.age < 18)) {
                  setProfileType('waves-kids');
                } else {
                  setProfileType('waves');
                }
                // Остаемся на экране настроек после переключения
              }
            }}
            onProfileClick={() => setCurrentScreen('profile')}
            currentDevice={connectedDevice ? availableDevices.find(d => d.id === connectedDevice) || { id: connectedDevice, name: 'Flex4', batteryLevel: connectedDeviceBattery ?? undefined } : null}
            allDevices={availableDevices}
            onDeviceChange={(deviceId) => {
              const device = availableDevices.find(d => d.id === deviceId);
              if (device) {
                setConnectedDevice(device.id);
                setConnectedDeviceBattery(device.batteryLevel);
              }
            }}
            onAddDevice={() => {
              setDeviceConnectionReturnToHome(true);
              setCurrentScreen('device-connection');
            }}
            onLogout={() => setCurrentScreen('login')}
          />
        );

      case 'profile':
        return (
          <ProfileScreen
            profile={selectedSubProfile}
            hasSubscription={hasSubscription}
            subscriptionType={subscriptionType}
            onBack={() => setCurrentScreen('settings')}
            onSave={(updatedProfile) => {
              // Обновляем профиль в списке
              setAllSubProfiles((prev) =>
                prev.map((p) => (p.id === updatedProfile.id ? updatedProfile : p))
              );
              setSelectedSubProfile(updatedProfile);
              setCurrentScreen('settings');
            }}
            onUpgrade={() => setCurrentScreen('purchase')}
          />
        );

      case 'training-detail':
        return (
          <TrainingDetailScreen
            session={selectedTrainingSession}
            onBack={() => setCurrentScreen('progress')}
          />
        );

      case 'tutorial':
        return (
          <TutorialScreen
            onBack={() => setCurrentScreen('home')}
            onComplete={() => setCurrentScreen('home')}
          />
        );

      default:
        return <SplashScreen />;
    }
  };

  const showBottomNav =
    currentScreen === 'home' ||
    currentScreen === 'progress' ||
    currentScreen === 'training' ||
    currentScreen === 'settings' ||
    currentScreen === 'training-detail';

  return (
    <div className="min-h-screen bg-white relative">
      {renderScreen()}
      {showBottomNav && (
        <BottomNavigation
          items={[
            { icon: <Home className="w-5 h-5" />, label: 'Главная', value: 'home' },
            { icon: <BarChart3 className="w-5 h-5" />, label: 'Прогресс', value: 'progress' },
            { icon: <Music2 className="w-5 h-5" />, label: 'Плейлист', value: 'training' },
            { icon: <Settings className="w-5 h-5" />, label: 'Настройки', value: 'settings' },
            { icon: <MessageCircle className="w-5 h-5" />, label: 'Поддержка', value: 'support' },
          ]}
          defaultValue={currentScreen}
          onChange={handleNavigation}
        />
      )}

      {/* Модальное окно поддержки */}
      <Modal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        size="md"
        showCloseButton={false}
      >
        <div className="space-y-4">
          <p className="text-[#1a1a1a]/80 text-center">
            Открыть Telegram чат поддержки?
          </p>
          <div className="flex gap-3 pt-2">
            <PillButton
              onClick={() => {
                window.open('https://t.me/waves_support', '_blank');
                setIsSupportModalOpen(false);
              }}
              variant="gradientMesh"
              className="flex-1"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Открыть Telegram
            </PillButton>
            <PillButton
              onClick={() => setIsSupportModalOpen(false)}
              variant="secondary"
              className="flex-1"
            >
              Отмена
            </PillButton>
          </div>
        </div>
      </Modal>

      {/* Модальное окно выбора программы */}
      {isProgramSelectionModalOpen && (
        <ProgramSelectionModal
          programs={availablePrograms.map(p => ({
            id: p.id,
            name: p.name,
            eyesOpen: p.eyesOpen,
            waves: p.waves,
            current: p.id === selectedTrainingType,
          }))}
          currentProgramId={selectedTrainingType}
          onSelect={(programId) => {
            setSelectedTrainingType(programId);
            setIsProgramSelectionModalOpen(false);
          }}
          onClose={() => setIsProgramSelectionModalOpen(false)}
        />
      )}
    </div>
  );
}
