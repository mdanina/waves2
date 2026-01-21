import React from "react";
import { 
  MessageCircle, 
  Pill, 
  Brain, 
  Activity, 
  Users, 
  MessageSquare 
} from "lucide-react";

interface ServiceIconProps {
  type: "therapy" | "psychiatry" | "neuropsychology" | "neurology" | "family" | "speech";
  className?: string;
}

/**
 * ServiceIcon - компонент иконки услуги согласно дизайн-системе
 * 
 * Дизайн-система:
 * - Иконка: черная (text-ink) на медовом фоне (bg-honey)
 * - Фон: медовый с эффектом свечения (shadow)
 * - Размер иконки: h-6 w-6 (единый размер согласно дизайн-системе)
 * - Размер контейнера: h-12 w-12 (единый размер согласно дизайн-системе)
 */
export const ServiceIcon: React.FC<ServiceIconProps> = ({ type, className = "" }) => {
  // Дефолтный стиль согласно дизайн-системе: черная иконка, размер h-6 w-6
  // Можно переопределить через className
  const defaultClassName = "text-ink h-6 w-6";
  const iconClassName = className || defaultClassName;

  switch (type) {
    case "therapy":
      return <MessageCircle className={iconClassName} />;
    case "psychiatry":
      return <Pill className={iconClassName} />;
    case "neuropsychology":
      return <Brain className={iconClassName} />;
    case "neurology":
      return <Activity className={iconClassName} />;
    case "family":
      return <Users className={iconClassName} />;
    case "speech":
      return <MessageSquare className={iconClassName} />;
    default:
      return null;
  }
};

/**
 * ServiceIconContainer - контейнер для иконки услуги согласно дизайн-системе
 * 
 * Стили дизайн-системы:
 * - Фон: bg-honey (медовый)
 * - Свечение: яркое двойное свечение для лучшей видимости
 * - Форма: rounded-full
 * - Размер: h-12 w-12 (единый размер согласно дизайн-системе)
 */
interface ServiceIconContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const ServiceIconContainer: React.FC<ServiceIconContainerProps> = ({ 
  children, 
  className = "" 
}) => {
  const defaultClassName = "flex items-center justify-center rounded-full bg-honey honey-glow h-12 w-12";
  const containerClassName = className 
    ? `${defaultClassName} ${className}` 
    : defaultClassName;

  return (
    <div className={containerClassName}>
      {children}
    </div>
  );
};

