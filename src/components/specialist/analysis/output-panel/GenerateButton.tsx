/**
 * Кнопка для запуска генерации клинической заметки
 */

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateClinicalNote } from '@/lib/supabase-ai';
import { useToast } from '@/hooks/use-toast';
import type { GenerateRequest } from '@/types/ai.types';

interface GenerateButtonProps {
  appointmentId: string;
  templateId: string;
  transcript?: string;
  notes?: string;
  onSuccess: () => void;
  disabled?: boolean;
}

export function GenerateButton({
  appointmentId,
  templateId,
  transcript,
  notes,
  onSuccess,
  disabled = false,
}: GenerateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!templateId) {
      toast({
        title: 'Ошибка',
        description: 'Необходимо выбрать шаблон',
        variant: 'destructive',
      });
      return;
    }

    if (!transcript && !notes) {
      toast({
        title: 'Ошибка',
        description: 'Необходимо добавить транскрипт или заметки',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsGenerating(true);

      // Определяем тип источника
      let sourceType: 'transcript' | 'notes' | 'combined';
      if (transcript && notes) {
        sourceType = 'combined';
      } else if (transcript) {
        sourceType = 'transcript';
      } else {
        sourceType = 'notes';
      }

      const request: GenerateRequest = {
        appointment_id: appointmentId,
        template_id: templateId,
        source_type: sourceType,
        transcript: transcript || undefined,
        notes: notes || undefined,
      };

      const result = await generateClinicalNote(request);

      toast({
        title: 'Заметка создана',
        description: `Создано ${result.sections_count} секций. ${result.status === 'generating' ? 'Генерация выполняется в фоне.' : ''}`,
      });

      // Обновляем данные
      onSuccess();
    } catch (error) {
      console.error('Error generating clinical note:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';

      // Более детальные сообщения об ошибках
      let userMessage = 'Не удалось запустить генерацию';
      if (errorMessage.includes('Нет данных для анализа')) {
        userMessage = 'Нет данных для анализа. Добавьте транскрипт или заметки.';
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        userMessage = 'Проблема с подключением к серверу. Проверьте интернет-соединение.';
      } else if (errorMessage.includes('auth') || errorMessage.includes('token')) {
        userMessage = 'Ошибка авторизации. Попробуйте перезайти в систему.';
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
        userMessage = 'Превышен лимит запросов к AI. Попробуйте позже.';
      } else if (errorMessage) {
        userMessage = errorMessage;
      }

      toast({
        title: 'Ошибка генерации',
        description: userMessage,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGenerate}
      disabled={disabled || isGenerating}
      size="lg"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Запуск...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Сгенерировать заметку
        </>
      )}
    </Button>
  );
}
