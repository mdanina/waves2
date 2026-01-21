/**
 * API для работы с расписанием специалиста
 */

import { supabase } from './supabase';
import { logger } from './logger';

export interface SpecialistSchedule {
  id: string;
  specialist_id: string;
  work_start_time: string;
  work_end_time: string;
  work_days: string[];
  break_start_time: string | null;
  break_end_time: string | null;
  default_slot_duration: number;
  buffer_between_appointments: number;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateScheduleParams {
  workStartTime?: string;
  workEndTime?: string;
  workDays?: string[];
  breakStartTime?: string | null;
  breakEndTime?: string | null;
  defaultSlotDuration?: number;
  bufferBetweenAppointments?: number;
  timezone?: string;
}

/**
 * Получить расписание текущего специалиста
 */
export async function getMySchedule(): Promise<SpecialistSchedule | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  // Получаем specialist_id
  const { data: specialist } = await supabase
    .from('specialists')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!specialist) {
    throw new Error('Специалист не найден');
  }

  const { data, error } = await supabase
    .from('specialist_schedules')
    .select('*')
    .eq('specialist_id', specialist.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Запись не найдена - вернём null
      return null;
    }
    logger.error('Error fetching schedule:', error);
    throw new Error(`Failed to fetch schedule: ${error.message}`);
  }

  return data as SpecialistSchedule;
}

/**
 * Создать или обновить расписание специалиста
 */
export async function saveSchedule(params: UpdateScheduleParams): Promise<SpecialistSchedule> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  // Получаем specialist_id
  const { data: specialist } = await supabase
    .from('specialists')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!specialist) {
    throw new Error('Специалист не найден');
  }

  // Подготавливаем данные для upsert
  const scheduleData: Record<string, any> = {
    specialist_id: specialist.id,
  };

  if (params.workStartTime !== undefined) {
    scheduleData.work_start_time = params.workStartTime;
  }
  if (params.workEndTime !== undefined) {
    scheduleData.work_end_time = params.workEndTime;
  }
  if (params.workDays !== undefined) {
    scheduleData.work_days = params.workDays;
  }
  if (params.breakStartTime !== undefined) {
    scheduleData.break_start_time = params.breakStartTime;
  }
  if (params.breakEndTime !== undefined) {
    scheduleData.break_end_time = params.breakEndTime;
  }
  if (params.defaultSlotDuration !== undefined) {
    scheduleData.default_slot_duration = params.defaultSlotDuration;
  }
  if (params.bufferBetweenAppointments !== undefined) {
    scheduleData.buffer_between_appointments = params.bufferBetweenAppointments;
  }
  if (params.timezone !== undefined) {
    scheduleData.timezone = params.timezone;
  }

  // Upsert - вставка или обновление
  const { data, error } = await supabase
    .from('specialist_schedules')
    .upsert(scheduleData, {
      onConflict: 'specialist_id',
    })
    .select()
    .single();

  if (error) {
    logger.error('Error saving schedule:', error);
    throw new Error(`Failed to save schedule: ${error.message}`);
  }

  return data as SpecialistSchedule;
}

/**
 * Получить расписание специалиста по ID (для клиентов)
 */
export async function getSpecialistSchedule(specialistId: string): Promise<SpecialistSchedule | null> {
  const { data, error } = await supabase
    .from('specialist_schedules')
    .select('*')
    .eq('specialist_id', specialistId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    logger.error('Error fetching specialist schedule:', error);
    throw new Error(`Failed to fetch schedule: ${error.message}`);
  }

  return data as SpecialistSchedule;
}

/**
 * Проверить, является ли время рабочим для специалиста
 */
export function isWorkingTime(
  schedule: SpecialistSchedule,
  date: Date
): boolean {
  // Получаем день недели
  const dayMap: Record<number, string> = {
    0: 'sun',
    1: 'mon',
    2: 'tue',
    3: 'wed',
    4: 'thu',
    5: 'fri',
    6: 'sat',
  };

  const dayOfWeek = dayMap[date.getDay()];

  // Проверяем рабочий ли день
  if (!schedule.work_days.includes(dayOfWeek)) {
    return false;
  }

  // Получаем время
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // Парсим рабочие часы
  const [startHours, startMinutes] = schedule.work_start_time.split(':').map(Number);
  const [endHours, endMinutes] = schedule.work_end_time.split(':').map(Number);

  const workStartInMinutes = startHours * 60 + startMinutes;
  const workEndInMinutes = endHours * 60 + endMinutes;

  // Проверяем время
  if (timeInMinutes < workStartInMinutes || timeInMinutes >= workEndInMinutes) {
    return false;
  }

  // Проверяем перерыв если есть
  if (schedule.break_start_time && schedule.break_end_time) {
    const [breakStartHours, breakStartMinutes] = schedule.break_start_time.split(':').map(Number);
    const [breakEndHours, breakEndMinutes] = schedule.break_end_time.split(':').map(Number);

    const breakStartInMinutes = breakStartHours * 60 + breakStartMinutes;
    const breakEndInMinutes = breakEndHours * 60 + breakEndMinutes;

    if (timeInMinutes >= breakStartInMinutes && timeInMinutes < breakEndInMinutes) {
      return false;
    }
  }

  return true;
}

/**
 * Получить доступные слоты на день для специалиста
 */
export function getAvailableSlots(
  schedule: SpecialistSchedule,
  date: Date,
  existingAppointments: { scheduled_at: string; duration_minutes: number }[]
): string[] {
  const slots: string[] = [];

  // Проверяем рабочий ли день
  const dayMap: Record<number, string> = {
    0: 'sun',
    1: 'mon',
    2: 'tue',
    3: 'wed',
    4: 'thu',
    5: 'fri',
    6: 'sat',
  };

  const dayOfWeek = dayMap[date.getDay()];
  if (!schedule.work_days.includes(dayOfWeek)) {
    return slots;
  }

  // Парсим рабочие часы
  const [startHours, startMinutes] = schedule.work_start_time.split(':').map(Number);
  const [endHours, endMinutes] = schedule.work_end_time.split(':').map(Number);

  const workStartInMinutes = startHours * 60 + startMinutes;
  const workEndInMinutes = endHours * 60 + endMinutes;

  // Генерируем слоты
  const slotDuration = schedule.default_slot_duration;
  const buffer = schedule.buffer_between_appointments;

  // Парсим перерыв
  let breakStartInMinutes = -1;
  let breakEndInMinutes = -1;
  if (schedule.break_start_time && schedule.break_end_time) {
    const [bsH, bsM] = schedule.break_start_time.split(':').map(Number);
    const [beH, beM] = schedule.break_end_time.split(':').map(Number);
    breakStartInMinutes = bsH * 60 + bsM;
    breakEndInMinutes = beH * 60 + beM;
  }

  // Преобразуем существующие записи в интервалы
  const busyIntervals = existingAppointments.map(apt => {
    const aptDate = new Date(apt.scheduled_at);
    const aptStart = aptDate.getHours() * 60 + aptDate.getMinutes();
    const aptEnd = aptStart + apt.duration_minutes;
    return { start: aptStart, end: aptEnd };
  });

  for (let time = workStartInMinutes; time + slotDuration <= workEndInMinutes; time += slotDuration + buffer) {
    // Проверяем перерыв
    if (breakStartInMinutes !== -1) {
      if (time < breakEndInMinutes && time + slotDuration > breakStartInMinutes) {
        continue;
      }
    }

    // Проверяем занятость
    const slotStart = time;
    const slotEnd = time + slotDuration;

    const isBusy = busyIntervals.some(interval =>
      slotStart < interval.end && slotEnd > interval.start
    );

    if (!isBusy) {
      const hours = Math.floor(time / 60);
      const minutes = time % 60;
      slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    }
  }

  return slots;
}
