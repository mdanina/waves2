import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  required?: boolean;
  /** Минимальная дата (ISO формат или Date) */
  minDate?: Date | string;
  /** Максимальная дата (ISO формат или Date) */
  maxDate?: Date | string;
  /** Показывать выпадающие списки для выбора месяца и года */
  showYearNavigation?: boolean;
  /** Начальный год для выпадающего списка (по умолчанию: текущий год - 100) */
  fromYear?: number;
  /** Конечный год для выпадающего списка (по умолчанию: текущий год) */
  toYear?: number;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Выберите дату",
  disabled = false,
  className,
  id,
  required,
  minDate,
  maxDate,
  showYearNavigation = false,
  fromYear,
  toYear,
}: DatePickerProps) {
  const currentYear = new Date().getFullYear();
  const effectiveFromYear = fromYear ?? currentYear - 100;
  const effectiveToYear = toYear ?? currentYear;
  const [open, setOpen] = React.useState(false);

  // Контролируемое состояние для отображаемого месяца/года в календаре
  // Это предотвращает сброс года при навигации по месяцам
  const [displayedMonth, setDisplayedMonth] = React.useState<Date | undefined>(undefined);

  // Парсим значение из ISO формата (yyyy-MM-dd)
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    const parsed = parse(value, "yyyy-MM-dd", new Date());
    return isValid(parsed) ? parsed : undefined;
  }, [value]);

  // Конвертируем minDate/maxDate в Date
  const minDateObj = React.useMemo(() => {
    if (!minDate) return undefined;
    if (minDate instanceof Date) return minDate;
    const parsed = new Date(minDate);
    return isValid(parsed) ? parsed : undefined;
  }, [minDate]);

  const maxDateObj = React.useMemo(() => {
    if (!maxDate) return undefined;
    if (maxDate instanceof Date) return maxDate;
    const parsed = new Date(maxDate);
    return isValid(parsed) ? parsed : undefined;
  }, [maxDate]);

  // Форматируем для отображения в привычном русском формате
  const displayValue = React.useMemo(() => {
    if (!selectedDate) return "";
    return format(selectedDate, "dd.MM.yyyy", { locale: ru });
  }, [selectedDate]);

  // Инициализируем отображаемый месяц при открытии календаря
  const getInitialMonth = React.useCallback(() => {
    if (selectedDate) return selectedDate;
    // Если есть maxDate и она в прошлом, показываем тот месяц
    if (maxDateObj && maxDateObj < new Date()) return maxDateObj;
    return new Date();
  }, [selectedDate, maxDateObj]);

  // При открытии календаря устанавливаем начальный месяц
  React.useEffect(() => {
    if (open && displayedMonth === undefined) {
      setDisplayedMonth(getInitialMonth());
    }
  }, [open, displayedMonth, getInitialMonth]);

  const handleSelect = (date: Date | undefined) => {
    if (date && onChange) {
      // Возвращаем в ISO формате для совместимости с БД
      onChange(format(date, "yyyy-MM-dd"));
    }
    setOpen(false);
    // Сбрасываем отображаемый месяц для следующего открытия
    setDisplayedMonth(undefined);
  };

  // Обработчик изменения отображаемого месяца (через dropdown или стрелки)
  const handleMonthChange = (month: Date) => {
    setDisplayedMonth(month);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-12 w-full justify-start text-left font-normal text-base",
            !selectedDate && "text-muted-foreground",
            className
          )}
          aria-required={required}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          month={displayedMonth}
          onMonthChange={handleMonthChange}
          disabled={(date) => {
            if (minDateObj && date < minDateObj) return true;
            if (maxDateObj && date > maxDateObj) return true;
            return false;
          }}
          locale={ru}
          initialFocus
          {...(showYearNavigation && {
            captionLayout: "dropdown-buttons",
            fromYear: effectiveFromYear,
            toYear: effectiveToYear,
          })}
        />
      </PopoverContent>
    </Popover>
  );
}
