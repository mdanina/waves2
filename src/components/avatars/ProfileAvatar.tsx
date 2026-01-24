import React from 'react';
import { cn } from '@/lib/utils';

interface ProfileAvatarProps {
  type: 'parent' | 'child';
  gender: 'male' | 'female';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = {
  sm: 'w-10 h-10',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
};

export function ProfileAvatar({ type, gender, className, size = 'md' }: ProfileAvatarProps) {
  const isParent = type === 'parent';
  const isMale = gender === 'male';

  // Цвета в стиле приложения
  const parentColors = {
    male: {
      bg: '#E0F0FF',
      hair: '#4A90E2',
      face: '#FFE5D4',
      shirt: '#A8D8EA',
    },
    female: {
      bg: '#FFE5F1',
      hair: '#E91E63',
      face: '#FFE5D4',
      shirt: '#FFB5C5',
    },
  };

  const childColors = {
    male: {
      bg: '#E3F2FD',
      hair: '#2196F3',
      face: '#FFF3E0',
      shirt: '#90CAF9',
    },
    female: {
      bg: '#FCE4EC',
      hair: '#F06292',
      face: '#FFF3E0',
      shirt: '#F8BBD0',
    },
  };

  const colors = isParent ? parentColors[gender] : childColors[gender];

  return (
    <div className={cn('rounded-full overflow-hidden flex items-center justify-center', sizes[size], className)}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Фон */}
        <circle cx="50" cy="50" r="50" fill={colors.bg} />
        
        {isParent ? (
          // Взрослый аватар
          <>
            {/* Волосы */}
            {isMale ? (
              // Мужские волосы - короткая стрижка
              <path
                d="M28 38 Q28 28 38 28 L62 28 Q72 28 72 38 L72 48 Q72 52 68 52 L62 52 Q58 52 55 50 Q52 52 48 52 L42 52 Q38 52 38 48 L38 38 Z"
                fill={colors.hair}
              />
            ) : (
              // Женские волосы - длинные
              <path
                d="M22 32 Q22 22 32 22 L38 22 Q42 22 50 25 Q58 22 62 22 L68 22 Q78 22 78 32 L78 42 Q78 52 73 58 Q68 64 62 64 L38 64 Q32 64 27 58 Q22 52 22 42 Z"
                fill={colors.hair}
              />
            )}
            
            {/* Лицо */}
            <ellipse cx="50" cy="56" rx="19" ry="21" fill={colors.face} />
            
            {/* Глаза */}
            <circle cx="44" cy="53" r="3" fill="#1a1a1a" />
            <circle cx="56" cy="53" r="3" fill="#1a1a1a" />
            {/* Блики в глазах */}
            <circle cx="45" cy="52" r="1" fill="#fff" />
            <circle cx="57" cy="52" r="1" fill="#fff" />
            
            {/* Нос */}
            <ellipse cx="50" cy="59" rx="2" ry="2.5" fill="#D4A574" opacity="0.6" />
            
            {/* Рот */}
            <path
              d="M44 64 Q50 67 56 64"
              stroke="#1a1a1a"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            
            {/* Одежда (воротник) */}
            <ellipse cx="50" cy="78" rx="22" ry="9" fill={colors.shirt} />
          </>
        ) : (
          // Детский аватар
          <>
            {/* Волосы */}
            {isMale ? (
              // Мальчик - короткие волосы
              <path
                d="M28 42 Q28 32 38 32 L62 32 Q72 32 72 42 L72 52 Q72 56 68 56 L62 56 Q58 56 55 54 Q52 56 48 56 L42 56 Q38 56 38 52 L38 42 Z"
                fill={colors.hair}
              />
            ) : (
              // Девочка - косички
              <>
                <path
                  d="M20 38 Q20 28 30 28 L35 28 Q40 28 50 31 Q60 28 65 28 L70 28 Q80 28 80 38 L80 48 Q80 52 75 54 Q70 56 65 56 L35 56 Q30 56 25 54 Q20 52 20 48 Z"
                  fill={colors.hair}
                />
                {/* Косички */}
                <ellipse cx="28" cy="62" rx="5" ry="9" fill={colors.hair} />
                <ellipse cx="72" cy="62" rx="5" ry="9" fill={colors.hair} />
              </>
            )}
            
            {/* Лицо */}
            <ellipse cx="50" cy="60" rx="21" ry="23" fill={colors.face} />
            
            {/* Глаза */}
            <circle cx="43" cy="57" r="3.5" fill="#1a1a1a" />
            <circle cx="57" cy="57" r="3.5" fill="#1a1a1a" />
            {/* Блики в глазах */}
            <circle cx="44.5" cy="56" r="1.2" fill="#fff" />
            <circle cx="58.5" cy="56" r="1.2" fill="#fff" />
            
            {/* Нос */}
            <ellipse cx="50" cy="64" rx="2.5" ry="3" fill="#D4A574" opacity="0.5" />
            
            {/* Рот */}
            <path
              d="M44 69 Q50 72 56 69"
              stroke="#1a1a1a"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            
            {/* Одежда */}
            <ellipse cx="50" cy="85" rx="24" ry="11" fill={colors.shirt} />
          </>
        )}
      </svg>
    </div>
  );
}
