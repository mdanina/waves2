import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PillButton } from '../../design-system/PillButton';
import { SerifHeading } from '../../design-system/SerifHeading';

interface Device {
  id: string;
  name: string;
  batteryLevel: number;
}

interface DeviceConnectionScreenProps {
  onClose: () => void;
  onSupport: () => void;
  onConnected: (deviceId: string, batteryLevel: number) => void;
  onNoDevice: () => void;
  returnToHome?: boolean; // Если true, после подключения возвращаемся на главную
}

// Mock данные устройств с уровнем заряда
const mockDevices: Device[] = [
  { id: 'Flex4-12345', name: 'Flex4', batteryLevel: 85 },
  { id: 'Flex4-67890', name: 'Flex4', batteryLevel: 15 },
];

export function DeviceConnectionScreen({
  onClose,
  onSupport,
  onConnected,
  onNoDevice,
  returnToHome = false,
}: DeviceConnectionScreenProps) {
  const [isSearching, setIsSearching] = useState(true);
  const [foundDevices, setFoundDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(null);

  useEffect(() => {
    // Симуляция поиска устройств
    const timer = setTimeout(() => {
      setIsSearching(false);
      setFoundDevices(mockDevices);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleDeviceSelect = async (device: Device) => {
    setConnectingDeviceId(device.id);
    // Симуляция подключения устройства
    setTimeout(() => {
      setConnectedDevice(device);
      setConnectingDeviceId(null);
      // НЕ вызываем onConnected здесь - только при нажатии "Продолжить"
    }, 1500);
  };

  const handleContinue = () => {
    if (connectedDevice) {
      // Передаем информацию о подключенном устройстве родителю для перехода на следующий экран
      onConnected(connectedDevice.id, connectedDevice.batteryLevel);
    }
  };

  return (
    <div 
      className="flex flex-col bg-white min-h-screen relative"
      style={{
        backgroundImage: 'url(/bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Кнопка закрытия */}
      <button 
        onClick={onClose} 
        className="absolute top-4 left-4 z-10 p-2 text-[#1a1a1a]/70 hover:text-[#1a1a1a] bg-white/80 backdrop-blur-sm rounded-full hover:bg-white/90 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 md:px-16 py-6 sm:py-8 md:py-12">
        {connectedDevice ? (
          <>
            <SerifHeading size="2xl" className="mb-2 text-center text-3xl sm:text-4xl md:text-5xl">Устройство подключено</SerifHeading>
            <p className="text-[#1a1a1a]/70 mb-8 text-center">
              {connectedDevice.batteryLevel < 20 
                ? 'Рекомендуется дозарядить устройство перед началом тренировки'
                : 'Устройство готово к использованию'
              }
            </p>
          </>
        ) : (
          <>
            <SerifHeading size="2xl" className="mb-2 text-center text-3xl sm:text-4xl md:text-5xl">Подключите устройство</SerifHeading>
            <p className="text-[#1a1a1a]/70 mb-8 text-center">
              Подключите блок питания к устройству
            </p>
          </>
        )}

        {/* Анимация поиска */}
        {isSearching && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#1a1a1a]/70 mb-6 sm:mb-8">
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            <span>Поиск устройств...</span>
          </div>
        )}

        {/* Список найденных устройств */}
        {!isSearching && foundDevices.length > 0 && (
          <div className="w-full max-w-sm space-y-3 mb-6">
            {foundDevices.map((device) => {
              const isConnected = connectedDevice?.id === device.id;
              const isConnecting = connectingDeviceId === device.id;
              
              return (
                <div key={device.id} className="w-full">
                  <button
                    onClick={() => !isConnected && !isConnecting && handleDeviceSelect(device)}
                    disabled={isConnected || isConnecting}
                    className={`w-full text-left transition-all ${
                      !isConnected && !isConnecting 
                        ? 'hover:scale-[1.02] opacity-70 hover:opacity-100' 
                        : 'cursor-not-allowed'
                    }`}
                  >
                    <div
                      className={`rounded-[20px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-all duration-300 ${
                        isConnected 
                          ? 'bg-white/40 backdrop-blur-md border-2 border-white/50' 
                          : 'bg-white/30 backdrop-blur-md border border-white/30'
                      } ${
                        !isConnected && !isConnecting 
                          ? 'hover:bg-white/40 hover:shadow-[0_6px_30px_rgba(0,0,0,0.15)] hover:scale-[1.02]' 
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                            <h3 className="text-sm sm:text-base font-semibold text-[#1a1a1a]">{device.id}</h3>
                            {isConnected && (
                              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#1a1a1a] flex-shrink-0" />
                            )}
                            {isConnecting && (
                              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4C5F0] animate-spin flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-[#1a1a1a]/70 mb-1.5 sm:mb-2">{device.name}</p>
                          
                          {/* Показываем заряд только если устройство подключено */}
                          {isConnected && (
                            <div className="mt-2 pt-2 border-t border-[#1a1a1a]/10">
                              <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                                <span className="text-[10px] sm:text-xs text-[#1a1a1a]/70">Заряд</span>
                                <span className={`text-[10px] sm:text-xs font-semibold ${
                                  device.batteryLevel < 20 ? 'text-orange-600' : 'text-[#1a1a1a]'
                                }`}>
                                  {device.batteryLevel}%
                                </span>
                              </div>
                              <div className="w-full bg-[#1a1a1a]/10 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    device.batteryLevel < 20 
                                      ? 'bg-orange-500' 
                                      : 'bg-[#a8d8ea]'
                                  }`}
                                  style={{ width: `${device.batteryLevel}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                        {!isConnected && !isConnecting && (
                          <span className="text-2xl">📡</span>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Уведомление о низком заряде */}
        {connectedDevice && connectedDevice.batteryLevel < 20 && (
          <div className="w-full max-w-sm mb-4 rounded-[20px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.1)] bg-white/40 backdrop-blur-md border border-white/50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[#1a1a1a] mb-1">
                  Низкий заряд устройства
                </p>
                <p className="text-xs text-[#1a1a1a]/80">
                  Рекомендуется дозарядить устройство перед началом тренировки.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Кнопка Продолжить после подключения */}
        {connectedDevice && (
          <div className="w-full max-w-sm">
            <PillButton 
              onClick={handleContinue} 
              variant="gradientMesh" 
              className="w-full"
            >
              Продолжить
            </PillButton>
          </div>
        )}

        {!isSearching && foundDevices.length === 0 && (
          <div className="text-center mb-4 sm:mb-6">
            <p className="text-xs sm:text-sm md:text-base text-[#1a1a1a]/70 mb-3 sm:mb-4">Устройства не найдены</p>
            <PillButton onClick={() => setIsSearching(true)} variant="secondary">
              Попробовать снова
            </PillButton>
          </div>
        )}

        {/* Кнопка "У меня нет устройства" - показываем только если устройство не подключено */}
        {!connectedDevice && (
          <button
            onClick={onNoDevice}
            className="text-xs sm:text-sm text-[#1a1a1a]/50 hover:text-[#1a1a1a]/70 underline"
          >
            У меня нет устройства
          </button>
        )}
      </div>
    </div>
  );
}

