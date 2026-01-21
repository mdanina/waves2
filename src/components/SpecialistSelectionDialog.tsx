/**
 * Диалог выбора специалиста при наличии нескольких назначенных
 */
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  type AssignedSpecialistOption,
  getAssignmentTypeLabel,
  getAssignmentTypeBadgeVariant,
} from '@/hooks/useAssignedSpecialists';
import { User, Check } from 'lucide-react';

interface SpecialistSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specialists: AssignedSpecialistOption[];
  onSelect: (specialistId: string) => void;
  title?: string;
  description?: string;
}

export function SpecialistSelectionDialog({
  open,
  onOpenChange,
  specialists,
  onSelect,
  title = 'Выберите специалиста',
  description = 'У вас несколько назначенных специалистов с данной специализацией. Выберите, к кому хотите записаться.',
}: SpecialistSelectionDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedId) {
      onSelect(selectedId);
      onOpenChange(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {specialists.map((specialist) => (
            <button
              key={specialist.specialist_id}
              onClick={() => setSelectedId(specialist.specialist_id)}
              className={cn(
                'w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left',
                selectedId === specialist.specialist_id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              )}
            >
              <Avatar className="h-12 w-12">
                {specialist.avatar_url ? (
                  <AvatarImage src={specialist.avatar_url} alt={specialist.display_name} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary">
                  {specialist.avatar_url ? (
                    <User className="h-6 w-6" />
                  ) : (
                    getInitials(specialist.display_name)
                  )}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {specialist.display_name}
                  </span>
                  {selectedId === specialist.specialist_id && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </div>
                <div className="mt-1">
                  <Badge variant={getAssignmentTypeBadgeVariant(specialist.assignment_type)}>
                    {getAssignmentTypeLabel(specialist.assignment_type)}
                  </Badge>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedId}>
            Выбрать
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
