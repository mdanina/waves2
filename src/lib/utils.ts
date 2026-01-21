import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Форматирование времени сообщения в человекочитаемый вид
 */
export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else if (diffDays === 1) {
    return 'Вчера';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('ru-RU', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  }
}

/**
 * Получение инициалов из имени (1-2 буквы)
 */
export function getInitials(name: string): string {
  if (!name?.trim()) return '??';
  return name
    .split(' ')
    .filter(n => n.length > 0)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';
}

/**
 * Склонение существительных в русском языке
 * @param n - число
 * @param one - форма для 1, 21, 31... (участник)
 * @param few - форма для 2-4, 22-24... (участника)
 * @param many - форма для 0, 5-20, 25-30... (участников)
 */
export function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;

  // 11-19 всегда используют форму "many"
  if (mod100 >= 11 && mod100 <= 19) {
    return many;
  }
  // 1, 21, 31... используют форму "one"
  if (mod10 === 1) {
    return one;
  }
  // 2-4, 22-24... используют форму "few"
  if (mod10 >= 2 && mod10 <= 4) {
    return few;
  }
  // 0, 5-9, 10, 25-30... используют форму "many"
  return many;
}

/**
 * Debounce функция для оптимизации частых вызовов
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Валидация российского номера телефона
 * Принимает форматы: +7XXXXXXXXXX, 8XXXXXXXXXX, или с пробелами/скобками/дефисами
 * @returns true если номер валидный
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false;
  // Убираем все кроме цифр
  const digits = phone.replace(/\D/g, '');
  // Должно быть 11 цифр (с 7 или 8 в начале) или 10 цифр (без кода страны)
  if (digits.length === 11) {
    return digits.startsWith('7') || digits.startsWith('8');
  }
  if (digits.length === 10) {
    return digits.startsWith('9'); // Мобильные номера начинаются с 9
  }
  return false;
}

/**
 * Форматирование телефона при вводе
 * Преобразует ввод в формат: +7 (XXX) XXX-XX-XX
 */
export function formatPhoneInput(value: string): string {
  // Убираем все кроме цифр
  let digits = value.replace(/\D/g, '');

  // Если начинается с 8, заменяем на 7
  if (digits.startsWith('8')) {
    digits = '7' + digits.slice(1);
  }

  // Если не начинается с 7, добавляем
  if (digits.length > 0 && !digits.startsWith('7')) {
    digits = '7' + digits;
  }

  // Ограничиваем 11 цифрами
  digits = digits.slice(0, 11);

  // Форматируем
  if (digits.length === 0) return '';
  if (digits.length <= 1) return '+' + digits;
  if (digits.length <= 4) return `+${digits[0]} (${digits.slice(1)}`;
  if (digits.length <= 7) return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4)}`;
  if (digits.length <= 9) return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
}

/**
 * Нормализация телефона для сохранения в БД
 * Возвращает формат: +7XXXXXXXXXX
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) {
    return '+7' + digits.slice(1);
  }
  if (digits.length === 10) {
    return '+7' + digits;
  }
  if (digits.length === 11 && digits.startsWith('7')) {
    return '+' + digits;
  }
  return phone; // Вернуть как есть, если не удалось нормализовать
}
