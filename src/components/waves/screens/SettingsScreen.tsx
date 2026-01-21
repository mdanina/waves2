import React from 'react';
import { ChevronRight, User, Bell, Shield, LogOut, ChevronDown, Plus, ExternalLink, Radio, CheckCircle2 } from 'lucide-react';
import { Toggle } from '../../design-system/Toggle';
import { SerifHeading } from '../../design-system/SerifHeading';
import { WellnessCard } from '../../design-system/WellnessCard';
import { Modal } from '../../design-system/Modal';
import { PillButton } from '../../design-system/PillButton';

interface SubProfile {
  id: string;
  name: string;
  age?: number;
  avatar?: string;
  type?: 'child' | 'adult';
}

interface Device {
  id: string;
  name: string;
  batteryLevel?: number;
}

interface SettingsScreenProps {
  currentProfile: SubProfile | null;
  allProfiles: SubProfile[];
  onProfileChange: (profileId: string) => void;
  onProfileClick?: () => void;
  currentDevice?: Device | null;
  allDevices?: Device[];
  onDeviceChange?: (deviceId: string) => void;
  onAddDevice?: () => void;
  onLogout: () => void;
}

export function SettingsScreen({
  currentProfile,
  allProfiles,
  onProfileChange,
  onProfileClick,
  currentDevice,
  allDevices = [],
  onDeviceChange,
  onAddDevice,
  onLogout,
}: SettingsScreenProps) {
  const [notifications, setNotifications] = React.useState(true);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = React.useState(false);
  const [isDeviceDropdownOpen, setIsDeviceDropdownOpen] = React.useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = React.useState(false);
  const profileDropdownRef = React.useRef<HTMLDivElement>(null);
  const deviceDropdownRef = React.useRef<HTMLDivElement>(null);

  // Закрытие выпадающего списка профилей при клике вне его
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (deviceDropdownRef.current && !deviceDropdownRef.current.contains(event.target as Node)) {
        setIsDeviceDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen || isDeviceDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen, isDeviceDropdownOpen]);

  return (
    <div 
      className="min-h-screen pb-20"
      style={{
        backgroundImage: 'url(/bg2.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="px-4 sm:px-8 md:px-16 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <SerifHeading size="2xl" className="text-3xl sm:text-4xl md:text-5xl">Настройки</SerifHeading>
        </div>

        {/* Выбор пользователя */}
        <WellnessCard className="mb-4 sm:mb-6">
          <div className="mb-3">
            <p className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Сменить пользователя</p>
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="w-full flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 border border-[#1a1a1a]/10"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  <span className="text-sm sm:text-base text-gray-900">
                    {currentProfile?.name || 'Выберите пользователя'}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isProfileDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#1a1a1a]/10 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {allProfiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => {
                        onProfileChange(profile.id);
                        setIsProfileDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors ${
                        currentProfile?.id === profile.id ? 'bg-[#a8d8ea]/10' : ''
                      }`}
                    >
                      <User className={`w-4 h-4 sm:w-5 sm:h-5 ${currentProfile?.id === profile.id ? 'text-[#a8d8ea]' : 'text-gray-600'}`} />
                      <div className="flex-1 text-left">
                        <p className="text-sm sm:text-base text-gray-900 font-medium">{profile.name}</p>
                        {profile.age && (
                          <p className="text-xs sm:text-sm text-gray-500">{profile.age} лет</p>
                        )}
                      </div>
                      {currentProfile?.id === profile.id && (
                        <div className="w-2 h-2 bg-[#a8d8ea] rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Кнопка добавить пользователя */}
          <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 p-3 text-[#a8d8ea] hover:text-[#8bc9e0] hover:bg-[#a8d8ea]/10 rounded-lg transition-colors border border-[#a8d8ea]/20 mt-3"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base font-medium">Добавить пользователя</span>
          </button>
        </WellnessCard>

        {/* Выбор устройства */}
        <WellnessCard className="mb-6">
          <div className="mb-3">
            <p className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Выбрать устройство</p>
            <div className="relative" ref={deviceDropdownRef}>
              <button
                onClick={() => allDevices.length > 0 && setIsDeviceDropdownOpen(!isDeviceDropdownOpen)}
                disabled={allDevices.length === 0}
                className="w-full flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 border border-[#1a1a1a]/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  {currentDevice ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-[#a8d8ea]" />
                      <span className="text-sm sm:text-base text-gray-900">
                        {currentDevice.id}
                      </span>
                      {currentDevice.batteryLevel !== undefined && (
                        <span className="text-xs sm:text-sm text-gray-500">
                          ({currentDevice.batteryLevel}%)
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm sm:text-base text-gray-900">Выберите устройство</span>
                  )}
                </div>
                {allDevices.length > 0 && (
                  <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform ${isDeviceDropdownOpen ? 'rotate-180' : ''}`} />
                )}
              </button>
              
              {isDeviceDropdownOpen && allDevices.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#1a1a1a]/10 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {allDevices.map((device) => (
                    <button
                      key={device.id}
                      onClick={() => {
                        onDeviceChange?.(device.id);
                        setIsDeviceDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors ${
                        currentDevice?.id === device.id ? 'bg-[#a8d8ea]/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {currentDevice?.id === device.id ? (
                          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#a8d8ea]" />
                        ) : (
                          <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm sm:text-base text-gray-900 font-medium">{device.id}</p>
                        <p className="text-xs sm:text-sm text-gray-500">{device.name}</p>
                        {device.batteryLevel !== undefined && (
                          <p className="text-xs sm:text-sm text-gray-400">{device.batteryLevel}% заряда</p>
                        )}
                      </div>
                      {currentDevice?.id === device.id && (
                        <div className="w-2 h-2 bg-[#a8d8ea] rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Кнопка добавить устройство */}
          {onAddDevice && (
            <button
              onClick={onAddDevice}
              className="w-full flex items-center justify-center gap-2 p-3 text-[#a8d8ea] hover:text-[#8bc9e0] hover:bg-[#a8d8ea]/10 rounded-lg transition-colors border border-[#a8d8ea]/20 mt-3"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base font-medium">Добавить новое устройство</span>
            </button>
          )}
        </WellnessCard>

        {/* Модальное окно для добавления пользователя */}
        <Modal
          isOpen={isAddUserModalOpen}
          onClose={() => setIsAddUserModalOpen(false)}
          title="Добавить пользователя"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-xs sm:text-sm md:text-base text-[#1a1a1a]/80">
              Управление профилями и оплата происходят в личном кабинете на сайте.
            </p>
            <p className="text-xs sm:text-sm text-[#1a1a1a]/60">
              Перейдите на сайт, чтобы добавить нового пользователя или изменить подписку.
            </p>
            <div className="flex gap-3 pt-2">
              <PillButton
                onClick={() => {
                  window.open('https://waves.ru/account', '_blank');
                  setIsAddUserModalOpen(false);
                }}
                variant="gradientMesh"
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Перейти на сайт
              </PillButton>
              <PillButton
                onClick={() => setIsAddUserModalOpen(false)}
                variant="secondary"
                className="flex-1"
              >
                Отмена
              </PillButton>
            </div>
          </div>
        </Modal>

        {/* Профиль */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xs sm:text-sm font-semibold text-[#1a1a1a]/50 uppercase mb-2 sm:mb-3">Профиль</h2>
          <WellnessCard className="space-y-1">
            <button
              onClick={onProfileClick}
              className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#a8d8ea]" />
                <span className="text-sm sm:text-base text-[#1a1a1a]">Профиль</span>
              </div>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#1a1a1a]/40" />
            </button>
            <button className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center gap-2 sm:gap-3">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-[#ffb5c5]" />
                <span className="text-sm sm:text-base text-[#1a1a1a]">Безопасность</span>
              </div>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#1a1a1a]/40" />
            </button>
          </WellnessCard>
        </div>

        {/* Уведомления */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xs sm:text-sm font-semibold text-[#1a1a1a]/50 uppercase mb-2 sm:mb-3">Уведомления</h2>
          <WellnessCard className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                <span className="text-sm sm:text-base text-gray-900">Push-уведомления</span>
              </div>
              <Toggle checked={notifications} onChange={setNotifications} />
            </div>
          </WellnessCard>
        </div>

        {/* Выход */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 text-red-600 hover:bg-red-50 rounded-xl"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base font-medium">Выйти из аккаунта</span>
        </button>
      </div>
    </div>
  );
}

