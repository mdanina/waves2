/**
 * Модальное окно для оценки специалиста после консультации
 */
import { useState, useEffect } from 'react';
import { Star, Calendar, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  PendingRating,
  submitRating,
  skipRating,
  getSpecializationNames,
  formatAppointmentDate,
} from '@/lib/supabase-ratings';

interface RatingModalProps {
  pendingRating: PendingRating;
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function RatingModal({
  pendingRating,
  open,
  onClose,
  onSubmitted,
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [specializationNames, setSpecializationNames] = useState('');

  // Сбрасываем состояние при смене консультации
  useEffect(() => {
    setRating(0);
    setHoveredRating(0);
    setReviewText('');
    setSpecializationNames('');
  }, [pendingRating?.appointment_id]);

  // Загружаем названия специализаций
  useEffect(() => {
    if (pendingRating?.specialization_codes?.length > 0) {
      getSpecializationNames(pendingRating.specialization_codes).then(setSpecializationNames);
    }
  }, [pendingRating?.specialization_codes]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Пожалуйста, выберите оценку');
      return;
    }

    setIsSubmitting(true);
    const result = await submitRating({
      appointment_id: pendingRating.appointment_id,
      specialist_id: pendingRating.specialist_id,
      rating,
      review_text: reviewText.trim() || undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success('Спасибо за вашу оценку!');
      onSubmitted();
    } else {
      toast.error(result.error || 'Не удалось отправить оценку');
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    const result = await skipRating(pendingRating.appointment_id);
    setIsSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      toast.error(result.error || 'Не удалось пропустить оценку');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Как прошла консультация?
          </DialogTitle>
        </DialogHeader>

        {/* Информация о специалисте */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <Avatar className="h-14 w-14">
            <AvatarImage src={pendingRating.specialist_avatar || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {getInitials(pendingRating.specialist_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className="font-semibold text-foreground truncate">
                {pendingRating.specialist_name}
              </p>
            </div>
            {specializationNames && (
              <p className="text-sm text-muted-foreground truncate">
                {specializationNames}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                {formatAppointmentDate(pendingRating.scheduled_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Звёздочки */}
        <div className="flex flex-col items-center gap-2 py-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                aria-label={`Оценка ${star} из 5`}
              >
                <Star
                  className={`h-10 w-10 transition-colors ${
                    star <= displayRating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-none text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {displayRating > 0 && (
            <p className="text-sm text-muted-foreground">
              {displayRating === 1 && 'Очень плохо'}
              {displayRating === 2 && 'Плохо'}
              {displayRating === 3 && 'Нормально'}
              {displayRating === 4 && 'Хорошо'}
              {displayRating === 5 && 'Отлично'}
            </p>
          )}
        </div>

        {/* Комментарий */}
        <div>
          <Textarea
            placeholder="Поделитесь впечатлениями (необязательно)..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={3}
            maxLength={1000}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground text-right mt-1">
            {reviewText.length}/1000
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Пропустить
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? 'Отправка...' : 'Отправить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
