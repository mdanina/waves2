import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ 
  label, 
  error, 
  icon,
  className,
  placeholder,
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  ...props 
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(() => {
    // Инициализируем hasValue из value или defaultValue
    if (value !== undefined && value !== null) {
      return String(value).length > 0;
    }
    if (defaultValue !== undefined && defaultValue !== null) {
      return String(defaultValue).length > 0;
    }
    return false;
  });
  const internalRef = useRef<HTMLInputElement>(null);
  
  // Объединяем внешний ref (из react-hook-form) и внутренний ref
  const inputRef = useCallback((node: HTMLInputElement | null) => {
    internalRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
    // Проверяем значение после установки ref
    if (node) {
      // Используем небольшую задержку, чтобы убедиться, что значение установлено
      setTimeout(() => {
        setHasValue(node.value.length > 0);
      }, 0);
    } else {
      setHasValue(false);
    }
  }, [ref]);

  // Отслеживаем значение из react-hook-form и других источников
  useEffect(() => {
    // Используем requestAnimationFrame для проверки после рендера
    const checkValue = () => {
      const input = internalRef.current;
      if (input) {
        // Приоритет отдаем реальному значению input
        const currentValue = input.value;
        setHasValue(currentValue.length > 0);
      } else if (value !== undefined && value !== null && String(value).length > 0) {
        setHasValue(true);
      } else if (defaultValue !== undefined && defaultValue !== null && String(defaultValue).length > 0) {
        setHasValue(true);
      } else {
        setHasValue(false);
      }
    };
    
    // Проверяем сразу и после небольшой задержки
    checkValue();
    const timer = setTimeout(checkValue, 10);
    
    return () => clearTimeout(timer);
  }, [value, defaultValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(e.target.value.length > 0);
    onChange?.(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    // Проверяем значение после blur
    const input = internalRef.current;
    if (input) {
      setHasValue(input.value.length > 0);
    }
    onBlur?.(e);
  };

  // Скрываем placeholder когда есть label, чтобы избежать наложения
  const displayPlaceholder = label ? undefined : placeholder;
  
  // Удаляем placeholder из props, чтобы он не перезаписывал наш displayPlaceholder
  const { placeholder: _placeholder, ...inputProps } = props;

  return (
    <div className="w-full">
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
            {icon}
          </div>
        )}
        <input
          {...inputProps}
          ref={inputRef}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={label ? '' : (displayPlaceholder || undefined)}
          className={cn(
            'w-full px-4 rounded-2xl border-2 transition-all duration-200',
            'bg-white/80 backdrop-blur-sm',
            'focus:outline-none',
            isFocused ? 'border-coral-light' : 'border-muted',
            error && 'border-red-300',
            icon && 'pl-12',
            label && (isFocused || hasValue ? 'pt-6 pb-3' : 'py-3'),
            !label && 'py-3',
            className
          )}
          style={isFocused ? {
            boxShadow: '0 0 0 3px rgba(255, 178, 153, 0.2), 0 10px 25px -5px rgba(255, 178, 153, 0.5), 0 4px 6px -2px rgba(255, 178, 153, 0.3)'
          } : { boxShadow: 'none' }}
        />
        {label && (
          <label
            htmlFor={props.id}
            className={cn(
              'absolute left-4 transition-all duration-200 pointer-events-none z-10',
              icon && 'left-12',
              isFocused || hasValue
                ? 'top-1.5 text-xs text-muted-foreground'
                : 'top-1/2 -translate-y-1/2 text-base text-muted-foreground'
            )}
          >
            {label}
          </label>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-500 mt-1 ml-4">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';