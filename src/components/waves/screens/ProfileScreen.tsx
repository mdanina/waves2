import React, { useState } from 'react';
import { ArrowLeft, User, Edit2, Save, X, Crown, TrendingUp } from 'lucide-react';
import { SerifHeading } from '../../design-system/SerifHeading';
import { WellnessCard } from '../../design-system/WellnessCard';
import { PillButton } from '../../design-system/PillButton';
import { Input } from '../../design-system/Input';

interface SubProfile {
  id: string;
  name: string;
  age?: number;
  avatar?: string;
  type?: 'child' | 'adult';
}

interface ProfileScreenProps {
  profile: SubProfile | null;
  hasSubscription?: boolean;
  subscriptionType?: 'basic' | 'parent-child' | null;
  onBack: () => void;
  onSave?: (profile: SubProfile) => void;
  onUpgrade?: () => void;
}

export function ProfileScreen({
  profile,
  hasSubscription = false,
  subscriptionType = null,
  onBack,
  onSave,
  onUpgrade,
}: ProfileScreenProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(profile?.name || '');
  const [editedAge, setEditedAge] = useState(profile?.age?.toString() || '');

  const handleSave = () => {
    if (profile && onSave) {
      onSave({
        ...profile,
        name: editedName,
        age: editedAge ? parseInt(editedAge, 10) : undefined,
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(profile?.name || '');
    setEditedAge(profile?.age?.toString() || '');
    setIsEditing(false);
  };

  if (!profile) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <div className="flex items-center px-4 py-4 border-b border-[#1a1a1a]/10 bg-white/80 backdrop-blur-sm">
          <button onClick={onBack} className="mr-4 text-[#1a1a1a]/70 hover:text-[#1a1a1a]">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <SerifHeading size="xl" className="text-2xl sm:text-3xl md:text-4xl">Профиль</SerifHeading>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 md:px-16">
          <p className="text-sm sm:text-base text-[#1a1a1a]/70">Профиль не выбран</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex items-center px-4 py-4 border-b border-[#1a1a1a]/10 bg-white/80 backdrop-blur-sm">
        <button onClick={onBack} className="mr-4 text-[#1a1a1a]/70 hover:text-[#1a1a1a]">
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <SerifHeading size="xl" className="text-2xl sm:text-3xl md:text-4xl">Профиль</SerifHeading>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="ml-auto p-2 text-[#1a1a1a]/70 hover:text-[#1a1a1a] hover:bg-white/50 rounded-lg transition-colors"
            title="Редактировать"
          >
            <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 px-4 sm:px-8 md:px-16 py-4 sm:py-6 md:py-8">
        {/* Информация о профиле */}
        <WellnessCard className="mb-4 sm:mb-6">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="text-xs sm:text-sm text-[#1a1a1a]/70 mb-1.5 sm:mb-2 block">Имя</label>
              {isEditing ? (
                <Input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Введите имя"
                  className="w-full"
                />
              ) : (
                <p className="text-sm sm:text-base text-[#1a1a1a] font-medium">{profile.name}</p>
              )}
            </div>

            <div>
              <label className="text-xs sm:text-sm text-[#1a1a1a]/70 mb-1.5 sm:mb-2 block">Возраст</label>
              {isEditing ? (
                <Input
                  type="number"
                  value={editedAge}
                  onChange={(e) => setEditedAge(e.target.value)}
                  placeholder="Введите возраст"
                  className="w-full"
                  min="1"
                  max="120"
                />
              ) : (
                <p className="text-sm sm:text-base text-[#1a1a1a] font-medium">
                  {profile.age ? `${profile.age} ${profile.age === 1 ? 'год' : profile.age < 5 ? 'года' : 'лет'}` : 'Не указан'}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs sm:text-sm text-[#1a1a1a]/70 mb-1.5 sm:mb-2 block">Тип профиля</label>
              <p className="text-sm sm:text-base text-[#1a1a1a] font-medium">
                {profile.type === 'child' ? 'Waves Kids' : 'Waves'}
              </p>
            </div>
          </div>
        </WellnessCard>

        {/* Информация о подписке */}
        <WellnessCard gradient={hasSubscription ? 'blue' : 'lavender'} className="mb-4 sm:mb-6">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Crown className={`w-5 h-5 sm:w-6 sm:h-6 ${hasSubscription ? 'text-[#a8d8ea]' : 'text-[#ffb5c5]'}`} />
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-[#1a1a1a] mb-0.5 sm:mb-1">Подписка</h3>
                {hasSubscription ? (
                  <p className="text-xs sm:text-sm text-[#1a1a1a]/70">
                    {subscriptionType === 'parent-child'
                      ? 'Родитель + Ребёнок'
                      : subscriptionType === 'basic'
                      ? 'Базовый'
                      : 'Активна'}
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm text-[#1a1a1a]/70">Не активна</p>
                )}
              </div>
            </div>
          </div>
          
          {hasSubscription ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-[#1a1a1a]/70">Статус</span>
                <span className="text-[#1a1a1a] font-medium">Активна</span>
              </div>
              {onUpgrade && subscriptionType === 'basic' && (
                <PillButton
                  onClick={() => onUpgrade()}
                  variant="gradientMesh"
                  className="w-full mt-2 sm:mt-3"
                >
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Повысить уровень
                </PillButton>
              )}
            </div>
          ) : (
            <div>
              <p className="text-xs sm:text-sm text-[#1a1a1a]/70 mb-2 sm:mb-3">
                Для доступа ко всем функциям приложения необходимо оформить подписку
              </p>
              {onUpgrade && (
                <PillButton
                  onClick={() => onUpgrade()}
                  variant="gradientMeshOrange"
                  className="w-full"
                >
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Выбрать пакет
                </PillButton>
              )}
            </div>
          )}
        </WellnessCard>

        {/* Кнопки редактирования */}
        {isEditing && (
          <div className="flex gap-2 sm:gap-3">
            <PillButton
              onClick={handleSave}
              variant="gradientMesh"
              className="flex-1"
            >
              <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              <span className="text-xs sm:text-sm">Сохранить</span>
            </PillButton>
            <PillButton
              onClick={handleCancel}
              variant="secondary"
              className="flex-1"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              <span className="text-xs sm:text-sm">Отмена</span>
            </PillButton>
          </div>
        )}
      </div>
    </div>
  );
}

