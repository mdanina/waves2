// Утилиты для работы с московским временем и временными зонами

const MOSCOW_TIMEZONE = 'Europe/Moscow';

/**
 * Список популярных временных зон для выбора
 */
export const TIMEZONES = [
  // Россия
  { value: 'Europe/Kaliningrad', label: 'UTC+2 — Калининград' },
  { value: 'Europe/Moscow', label: 'UTC+3 — Москва, Санкт-Петербург' },
  { value: 'Europe/Samara', label: 'UTC+4 — Самара, Саратов' },
  { value: 'Asia/Yekaterinburg', label: 'UTC+5 — Екатеринбург, Челябинск' },
  { value: 'Asia/Omsk', label: 'UTC+6 — Омск, Новосибирск' },
  { value: 'Asia/Krasnoyarsk', label: 'UTC+7 — Красноярск' },
  { value: 'Asia/Irkutsk', label: 'UTC+8 — Иркутск' },
  { value: 'Asia/Yakutsk', label: 'UTC+9 — Якутск' },
  { value: 'Asia/Vladivostok', label: 'UTC+10 — Владивосток' },
  { value: 'Asia/Magadan', label: 'UTC+11 — Магадан' },
  { value: 'Asia/Kamchatka', label: 'UTC+12 — Камчатка' },
  // СНГ
  { value: 'Europe/Minsk', label: 'UTC+3 — Минск' },
  { value: 'Asia/Almaty', label: 'UTC+6 — Алматы, Астана' },
  { value: 'Asia/Tashkent', label: 'UTC+5 — Ташкент' },
  // Другие популярные
  { value: 'Europe/London', label: 'UTC+0 — Лондон' },
  { value: 'Europe/Paris', label: 'UTC+1 — Париж, Берлин' },
  { value: 'Europe/Kiev', label: 'UTC+2 — Киев' },
  { value: 'America/New_York', label: 'UTC-5 — Нью-Йорк' },
  { value: 'America/Los_Angeles', label: 'UTC-8 — Лос-Анджелес' },
];

/**
 * Получить текущую временную зону пользователя
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Создать дату/время в московском часовом поясе
 * @param date - Дата (без времени)
 * @param hours - Часы (0-23) в московском времени
 * @param minutes - Минуты (0-59) в московском времени
 * @returns ISO строка для сохранения в БД
 */
export function createMoscowDateTime(
  date: Date,
  hours: number,
  minutes: number
): string {
  // Создаем строку даты в формате YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  // Создаем строку времени
  const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

  // Создаем дату, интерпретируя время как московское (MSK = UTC+3)
  // Используем формат ISO с явным указанием смещения
  // Москва сейчас всегда UTC+3 (без перехода на летнее время)
  const moscowDateStr = `${dateStr}T${timeStr}+03:00`;
  
  // Создаем Date объект, который автоматически конвертирует в UTC
  const moscowDate = new Date(moscowDateStr);
  
  return moscowDate.toISOString();
}

/**
 * Получить смещение временной зоны в минутах
 */
function getTimezoneOffset(timezone: string, date: Date): number {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);
}

/**
 * Форматировать время консультации для отображения
 * @param dateString - ISO строка времени из БД (в UTC, но представляет московское время)
 * @param timezone - Временная зона для отображения (по умолчанию - локальная зона пользователя)
 * @returns Отформатированная строка с временем и указанием зоны
 */
export function formatAppointmentTime(
  dateString: string,
  timezone?: string
): string {
  const date = new Date(dateString);
  const displayTimezone = timezone || getUserTimezone();
  
  // Форматируем время в указанной временной зоне
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    timeZone: displayTimezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
    timeZone: displayTimezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
    timeZone: displayTimezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedDate = dateFormatter.format(date);
  const formattedTime = timeFormatter.format(date);
  
  // Получаем аббревиатуру временной зоны
  const tzAbbr = getTimezoneAbbreviation(displayTimezone, date);
  
  return `${formattedDate} в ${formattedTime} (${tzAbbr})`;
}

/**
 * Форматировать только время (без даты)
 */
export function formatAppointmentTimeOnly(
  dateString: string,
  timezone?: string
): string {
  const date = new Date(dateString);
  const displayTimezone = timezone || getUserTimezone();
  
  const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
    timeZone: displayTimezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const formattedTime = timeFormatter.format(date);
  const tzAbbr = getTimezoneAbbreviation(displayTimezone, date);
  
  return `${formattedTime} (${tzAbbr})`;
}

/**
 * Получить аббревиатуру временной зоны
 */
function getTimezoneAbbreviation(timezone: string, date: Date): string {
  // Используем Intl для получения аббревиатуры
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'short',
  });
  
  const parts = formatter.formatToParts(date);
  const tzName = parts.find(part => part.type === 'timeZoneName')?.value || '';
  
  // Если не получили аббревиатуру, используем смещение
  if (!tzName || tzName.length > 5) {
    const offset = getTimezoneOffset(timezone, date);
    const hours = Math.floor(Math.abs(offset) / 60);
    const sign = offset >= 0 ? '+' : '-';
    return `UTC${sign}${hours}`;
  }
  
  return tzName;
}

/**
 * Получить текущее время в московском часовом поясе
 */
export function getMoscowNow(): Date {
  const now = new Date();
  // Используем Intl для получения времени в московском часовом поясе
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: MOSCOW_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1;
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
  const second = parseInt(parts.find(p => p.type === 'second')?.value || '0');
  
  // Создаем дату в локальном времени, которая соответствует московскому времени
  // Это нужно для правильного сравнения дат
  return new Date(year, month, day, hour, minute, second);
}

/**
 * Проверить, прошла ли дата в московском времени
 */
export function isDateInPast(date: Date): boolean {
  const moscowNow = getMoscowNow();
  return date < moscowNow;
}

/**
 * Конвертировать время из одной временной зоны в другую для отображения
 */
export function convertTimeForDisplay(
  dateString: string,
  fromTimezone: string,
  toTimezone: string
): Date {
  const date = new Date(dateString);
  
  // Получаем время в исходной зоне
  const fromFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: fromTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const fromParts = fromFormatter.formatToParts(date);
  const year = parseInt(fromParts.find(p => p.type === 'year')?.value || '0');
  const month = parseInt(fromParts.find(p => p.type === 'month')?.value || '0') - 1;
  const day = parseInt(fromParts.find(p => p.type === 'day')?.value || '0');
  const hour = parseInt(fromParts.find(p => p.type === 'hour')?.value || '0');
  const minute = parseInt(fromParts.find(p => p.type === 'minute')?.value || '0');
  
  // Создаем новую дату в целевой зоне
  const toFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: toTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  // Создаем временную метку, которая в целевой зоне будет показывать нужное время
  const tempDate = new Date(year, month, day, hour, minute);
  const offsetDiff = (getTimezoneOffset(toTimezone, tempDate) - getTimezoneOffset(fromTimezone, tempDate)) * 60 * 1000;
  
  return new Date(tempDate.getTime() - offsetDiff);
}

