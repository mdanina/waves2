import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import bgImage from '@/assets/bg.png';
import { Input as DesignSystemInput } from "@/components/design-system/Input";
import { RadioGroup as DesignSystemRadioGroup } from "@/components/design-system/Radio";
import { SerifHeading } from "@/components/design-system/SerifHeading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createProfile } from "@/lib/profileStorage";
import { BirthDatePicker } from "@/components/ui/birth-date-picker";

export default function AddFamilyMember() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [relationship, setRelationship] = useState("");
  const [sex, setSex] = useState("");
  const [handedness, setHandedness] = useState("");
  const [referral, setReferral] = useState("");
  const [seekingCare, setSeekingCare] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Защита от двойной отправки
    if (isSubmitting) {
      return;
    }
    
    if (firstName && lastName && dateOfBirth && relationship && sex && seekingCare) {
      try {
        setIsSubmitting(true);
        await createProfile({
          firstName,
          lastName,
          dateOfBirth,
          relationship: relationship as 'parent' | 'child' | 'partner' | 'sibling' | 'caregiver' | 'other',
          sex: sex as 'male' | 'female' | 'other',
          handedness: handedness ? (handedness as 'left' | 'right' | 'ambidextrous') : undefined,
          referral,
          seekingCare: seekingCare as 'yes' | 'no',
        });
        
        // Инвалидируем кеш профилей, чтобы Dashboard обновился
        await queryClient.invalidateQueries({ queryKey: ['profiles', user?.id] });
        
        toast.success("Член семьи успешно добавлен!");
        
        // Если пришли из кабинета - возвращаемся туда, иначе продолжаем онбординг
        if (location.state?.from === 'cabinet') {
          navigate("/cabinet");
        } else {
          navigate("/family-members");
        }
      } catch (error) {
        console.error('Error creating profile:', error);
        toast.error('Ошибка при добавлении члена семьи');
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Card className="rounded-[20px] border-2 bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
          <div className="space-y-8">
            <div className="text-center">
              <SerifHeading size="2xl" className="mb-4">
                Расскажите нам больше о члене семьи
              </SerifHeading>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
            <DesignSystemInput
              id="firstName"
              type="text"
              label="Имя *"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />

            <DesignSystemInput
              id="lastName"
              type="text"
              label="Фамилия *"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />

            <div className="space-y-2">
              <label htmlFor="dateOfBirth" className="text-sm font-medium text-foreground">
                Дата рождения <span className="text-destructive">*</span>
              </label>
              <BirthDatePicker
                id="dateOfBirth"
                value={dateOfBirth}
                onChange={setDateOfBirth}
                required
                fromYear={new Date().getFullYear() - 100}
                toYear={new Date().getFullYear()}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="relationship" className="text-sm font-medium text-foreground">
                Кем для вас приходится? <span className="text-destructive">*</span>
              </label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger 
                  id="relationship" 
                  className="h-14 text-base rounded-2xl border-2 border-muted bg-white/80 backdrop-blur-sm transition-all duration-200 focus:border-coral-light focus:outline-none focus:ring-0 data-[state=open]:border-coral-light"
                >
                  <SelectValue placeholder="Выберите" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="child">Ребенок</SelectItem>
                  <SelectItem value="partner">Партнер</SelectItem>
                  <SelectItem value="other">Другое</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Пол <span className="text-destructive">*</span>
              </label>
              <DesignSystemRadioGroup
                name="sex"
                value={sex}
                onChange={setSex}
                options={[
                  { value: 'male', label: 'Мужской' },
                  { value: 'female', label: 'Женский' }
                ]}
                className="grid grid-cols-2 gap-4"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Левша или правша?
              </label>
              <DesignSystemRadioGroup
                name="handedness"
                value={handedness}
                onChange={setHandedness}
                options={[
                  { value: 'right', label: 'Правша' },
                  { value: 'left', label: 'Левша' },
                  { value: 'ambidextrous', label: 'Амбидекстр' }
                ]}
                className="grid grid-cols-3 gap-4"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="referral" className="text-sm font-medium text-foreground">
                Пришел по направлению от организации?
              </label>
              <Select value={referral} onValueChange={setReferral}>
                <SelectTrigger 
                  id="referral" 
                  className="h-14 text-base rounded-2xl border-2 border-muted bg-white/80 backdrop-blur-sm transition-all duration-200 focus:border-coral-light focus:outline-none focus:ring-0 data-[state=open]:border-coral-light"
                >
                  <SelectValue placeholder="Нет направления" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="no">Нет направления</SelectItem>
                  <SelectItem value="insurance">Страховая компания</SelectItem>
                  <SelectItem value="doctor">Врач</SelectItem>
                  <SelectItem value="school">Школа</SelectItem>
                  <SelectItem value="other">Другое</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Этот член семьи будет проходить нейротренинг? <span className="text-destructive">*</span>
              </label>
              <DesignSystemRadioGroup
                name="seekingCare"
                value={seekingCare}
                onChange={setSeekingCare}
                options={[
                  { value: 'yes', label: 'Да' },
                  { value: 'no', label: 'Нет' }
                ]}
                className="grid grid-cols-2 gap-4"
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => {
                  // Если пришли из кабинета - возвращаемся туда, иначе продолжаем онбординг
                  if (location.state?.from === 'cabinet') {
                    navigate("/cabinet");
                  } else {
                    navigate("/family-members");
                  }
                }}
                className="h-14 flex-1 text-base font-medium"
              >
                Назад
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="h-14 flex-1 text-base font-medium"
              >
                {isSubmitting ? 'Добавление...' : 'Добавить'}
              </Button>
            </div>
          </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
