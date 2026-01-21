import * as React from "react";
import { format, parse, isValid, getDaysInMonth } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BirthDatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  required?: boolean;
  /** Минимальный год (по умолчанию: текущий год - 100) */
  fromYear?: number;
  /** Максимальный год (по умолчанию: текущий год) */
  toYear?: number;
}

const MONTHS = [
  { value: "01", label: "Январь" },
  { value: "02", label: "Февраль" },
  { value: "03", label: "Март" },
  { value: "04", label: "Апрель" },
  { value: "05", label: "Май" },
  { value: "06", label: "Июнь" },
  { value: "07", label: "Июль" },
  { value: "08", label: "Август" },
  { value: "09", label: "Сентябрь" },
  { value: "10", label: "Октябрь" },
  { value: "11", label: "Ноябрь" },
  { value: "12", label: "Декабрь" },
];

export function BirthDatePicker({
  value,
  onChange,
  disabled = false,
  className,
  id,
  required,
  fromYear,
  toYear,
}: BirthDatePickerProps) {
  const currentYear = new Date().getFullYear();
  const effectiveFromYear = fromYear ?? currentYear - 100;
  const effectiveToYear = toYear ?? currentYear;

  // Парсим значение из ISO формата (yyyy-MM-dd)
  const parsedDate = React.useMemo(() => {
    if (!value) return null;
    const parsed = parse(value, "yyyy-MM-dd", new Date());
    return isValid(parsed) ? parsed : null;
  }, [value]);

  // Локальное состояние для частичного выбора
  const [selectedDay, setSelectedDay] = React.useState<string | undefined>(
    parsedDate ? String(parsedDate.getDate()).padStart(2, "0") : undefined
  );
  const [selectedMonth, setSelectedMonth] = React.useState<string | undefined>(
    parsedDate ? String(parsedDate.getMonth() + 1).padStart(2, "0") : undefined
  );
  const [selectedYear, setSelectedYear] = React.useState<string | undefined>(
    parsedDate ? String(parsedDate.getFullYear()) : undefined
  );

  // Синхронизируем с внешним value
  React.useEffect(() => {
    if (parsedDate) {
      setSelectedDay(String(parsedDate.getDate()).padStart(2, "0"));
      setSelectedMonth(String(parsedDate.getMonth() + 1).padStart(2, "0"));
      setSelectedYear(String(parsedDate.getFullYear()));
    } else if (!value) {
      setSelectedDay(undefined);
      setSelectedMonth(undefined);
      setSelectedYear(undefined);
    }
  }, [value, parsedDate]);

  // Генерируем список годов (от нового к старому)
  const years = React.useMemo(() => {
    const result = [];
    for (let y = effectiveToYear; y >= effectiveFromYear; y--) {
      result.push(String(y));
    }
    return result;
  }, [effectiveFromYear, effectiveToYear]);

  // Генерируем список дней в зависимости от месяца и года
  const days = React.useMemo(() => {
    let daysInMonth = 31;
    if (selectedMonth && selectedYear) {
      const year = parseInt(selectedYear, 10);
      const month = parseInt(selectedMonth, 10) - 1;
      daysInMonth = getDaysInMonth(new Date(year, month));
    } else if (selectedMonth) {
      // Если год не выбран, используем невисокосный год для февраля
      const month = parseInt(selectedMonth, 10) - 1;
      daysInMonth = getDaysInMonth(new Date(2023, month));
    }

    const result = [];
    for (let d = 1; d <= daysInMonth; d++) {
      result.push(String(d).padStart(2, "0"));
    }
    return result;
  }, [selectedMonth, selectedYear]);

  // Корректируем день если он больше чем дней в месяце
  React.useEffect(() => {
    if (selectedDay && parseInt(selectedDay, 10) > days.length) {
      setSelectedDay(String(days.length).padStart(2, "0"));
    }
  }, [days, selectedDay]);

  // Обновляем значение когда все три части выбраны
  const updateValue = React.useCallback(
    (day: string | undefined, month: string | undefined, year: string | undefined) => {
      if (day && month && year && onChange) {
        const dateStr = `${year}-${month}-${day}`;
        const parsed = parse(dateStr, "yyyy-MM-dd", new Date());
        if (isValid(parsed)) {
          onChange(dateStr);
        }
      }
    },
    [onChange]
  );

  const handleDayChange = (day: string) => {
    setSelectedDay(day);
    updateValue(day, selectedMonth, selectedYear);
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    updateValue(selectedDay, month, selectedYear);
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    updateValue(selectedDay, selectedMonth, year);
  };

  return (
    <div id={id} className={cn("flex gap-2", className)} aria-required={required}>
      {/* День */}
      <Select
        value={selectedDay}
        onValueChange={handleDayChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[80px] h-12">
          <SelectValue placeholder="День" />
        </SelectTrigger>
        <SelectContent className="max-h-[200px]">
          {days.map((day) => (
            <SelectItem key={day} value={day}>
              {day}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Месяц */}
      <Select
        value={selectedMonth}
        onValueChange={handleMonthChange}
        disabled={disabled}
      >
        <SelectTrigger className="flex-1 h-12">
          <SelectValue placeholder="Месяц" />
        </SelectTrigger>
        <SelectContent className="max-h-[200px]">
          {MONTHS.map((month) => (
            <SelectItem key={month.value} value={month.value}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Год */}
      <Select
        value={selectedYear}
        onValueChange={handleYearChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[100px] h-12">
          <SelectValue placeholder="Год" />
        </SelectTrigger>
        <SelectContent className="max-h-[200px]">
          {years.map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
