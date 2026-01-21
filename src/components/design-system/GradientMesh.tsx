/**
 * GradientMesh Component - Web
 * Декоративный компонент с градиентами в стиле "Light Mesh Holographic Gradients"
 * Простой альтернатив к WebGL компоненту с чистым CSS/React анимациями
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

export type GradientMeshVariant =
  | 'iridescent'
  | 'peachLavender'
  | 'mintSky'
  | 'roseYellow'
  | 'coralBlue'
  | 'custom';

export interface GradientMeshProps {
  /** Размер компонента */
  size?: number;
  /** Вариант градиента */
  variant?: GradientMeshVariant;
  /** Кастомные цвета градиента */
  colors?: string[];
  /** Включить анимацию */
  animated?: boolean;
  /** Скорость анимации (1 = нормальная, 2 = быстрая, 0.5 = медленная) */
  animationSpeed?: number;
  /** Включить пульсацию */
  pulsing?: boolean;
  /** Включить вращение */
  rotating?: boolean;
  /** Дополнительные классы */
  className?: string;
  /** Прозрачность */
  opacity?: number;
}

const gradientVariants: Record<GradientMeshVariant, string[][]> = {
  iridescent: [
    ['#E8D5F2', '#D4C5F0', '#C9E4F5'],
    ['#C9E4F5', '#A8D4EB', '#FFD1DC'],
    ['#FFD1DC', '#FFC9DF', '#FFF4CC'],
    ['#FFF4CC', '#FFE5D9', '#E8D5F2'],
  ],
  peachLavender: [
    ['#FFE5D9', '#E8D5F2', '#D9C2E8'],
    ['#D9C2E8', '#FFE5D9', '#FFD7BA'],
  ],
  mintSky: [
    ['#D5F2E3', '#C2E8D4', '#C9E4F5'],
    ['#C9E4F5', '#B3D9F0', '#D5F2E3'],
  ],
  roseYellow: [
    ['#FFD1DC', '#FFC2D1', '#FFF4CC'],
    ['#FFF4CC', '#FFE5D9', '#FFD1DC'],
  ],
  coralBlue: [
    ['#FFCBB3', '#FFE5D9', '#C9E4F5'],
    ['#C9E4F5', '#B3D9F0', '#FFCBB3'],
  ],
  custom: [],
};

export const GradientMesh: React.FC<GradientMeshProps> = ({
  size = 200,
  variant = 'iridescent',
  colors: customColors,
  animated = true,
  animationSpeed = 1,
  pulsing = false,
  rotating = false,
  className = '',
  opacity = 0.7,
}) => {
  const [currentGradientIndex, setCurrentGradientIndex] = useState(0);
  const rotation = useMotionValue(0);

  const getGradientColors = (index?: number): string[] => {
    if (customColors && customColors.length >= 2) {
      return customColors;
    }

    if (variant === 'custom') {
      return customColors || ['#FFE5D9', '#E8D5F2'];
    }

    const variantGradients = gradientVariants[variant];
    if (!variantGradients || variantGradients.length === 0) {
      return ['#FFE5D9', '#E8D5F2'];
    }

    const gradientIndex = index !== undefined ? index : currentGradientIndex;
    return variantGradients[gradientIndex % variantGradients.length] || variantGradients[0];
  };

  // Анимация смены градиентов для iridescent
  useEffect(() => {
    if (!animated || variant !== 'iridescent') return;

    const interval = setInterval(() => {
      setCurrentGradientIndex((prev) => {
        const variantGradients = gradientVariants.iridescent;
        return (prev + 1) % variantGradients.length;
      });
    }, 3000 / animationSpeed);

    return () => clearInterval(interval);
  }, [animated, variant, animationSpeed]);

  // Анимация вращения
  useEffect(() => {
    if (!animated || !rotating) return;

    const animation = animate(rotation, 360, {
      duration: 10 / animationSpeed,
      repeat: Infinity,
      ease: 'linear',
    });

    return () => animation.stop();
  }, [animated, rotating, animationSpeed, rotation]);

  const gradientColors = getGradientColors();
  const rotationValue = useTransform(rotation, (value) => `${value}deg`);

  return (
    <motion.div
      className={`rounded-full relative overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        opacity,
      }}
      animate={
        pulsing && animated
          ? {
              scale: [1, 1.1, 1],
            }
          : {}
      }
      transition={
        pulsing && animated
          ? {
              duration: 2 / animationSpeed,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          : {}
      }
    >
      {/* Основной градиент */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `linear-gradient(135deg, ${gradientColors.join(', ')})`,
          rotate: rotating ? rotationValue : 0,
        }}
        animate={
          variant === 'iridescent' && animated
            ? {
                background: [
                  `linear-gradient(135deg, ${getGradientColors(0).join(', ')})`,
                  `linear-gradient(135deg, ${getGradientColors(1).join(', ')})`,
                  `linear-gradient(135deg, ${getGradientColors(2).join(', ')})`,
                  `linear-gradient(135deg, ${getGradientColors(3).join(', ')})`,
                  `linear-gradient(135deg, ${getGradientColors(0).join(', ')})`,
                ],
              }
            : {}
        }
        transition={
          variant === 'iridescent' && animated
            ? {
                duration: 3 / animationSpeed,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : {}
        }
      >
        {/* Внутренний градиент для эффекта глубины */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${gradientColors[1] || gradientColors[0]}40, transparent)`,
          }}
        />

        {/* Дополнительный слой для mesh эффекта */}
        {variant === 'iridescent' && (
          <div
            className="absolute inset-0 rounded-full opacity-30"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${gradientColors[2] || gradientColors[0]}80, transparent 70%)`,
            }}
          />
        )}
      </motion.div>

      {/* Внешнее свечение */}
      {opacity > 0.5 && (
        <div
          className="absolute -inset-[15%] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${gradientColors[0]}40, transparent 70%)`,
            filter: 'blur(20px)',
          }}
        />
      )}
    </motion.div>
  );
};

export default GradientMesh;
