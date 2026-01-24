import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SerifHeading } from "@/components/design-system/SerifHeading";
import bgImage from '@/assets/bg.png';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getProfile, updateProfile } from "@/lib/profileStorage";
import { useAuth } from "@/contexts/AuthContext";
import { BirthDatePicker } from "@/components/ui/birth-date-picker";

export default function EditFamilyMember() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
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

  useEffect(() => {
    async function loadMember() {
      if (id) {
        try {
          const member = await getProfile(id);
          if (member) {
            // Если это профиль родителя, перенаправляем на правильную форму редактирования
            if (member.type === 'parent') {
              navigate('/profile', {
                state: { from: location.state?.from || 'cabinet' },
                replace: true,
              });
              return;
            }
            setFirstName(member.first_name);
            setLastName(member.last_name || "");
            setDateOfBirth(member.dob || "");
            setRelationship(member.type);
            setSex(member.gender || "");
            setHandedness(member.handedness || "");
            setReferral(member.referral || "");
            setSeekingCare(member.seeking_care || "");
          } else {
            toast.error("Член семьи не найден");
            // Если пришли из кабинета - возвращаемся туда, иначе продолжаем онбординг
            if (location.state?.from === 'cabinet') {
              navigate("/cabinet");
            } else {
              navigate("/family-members");
            }
          }
        } catch (error) {
          console.error('Error loading profile:', error);
          toast.error('Ошибка при загрузке данных');
          // Если пришли из кабинета - возвращаемся туда, иначе продолжаем онбординг
          if (location.state?.from === 'cabinet') {
            navigate("/cabinet");
          } else {
            navigate("/family-members");
          }
        }
      }
    }
    loadMember();
  }, [id, navigate, location.state?.from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName && lastName && dateOfBirth && relationship && sex && seekingCare && id) {
      try {
        await updateProfile(id, {
          firstName,
          lastName,
          dateOfBirth,
          relationship: relationship as 'parent' | 'child' | 'partner' | 'sibling' | 'caregiver' | 'other',
          sex: sex as 'male' | 'female' | 'other',
          handedness: handedness ? (handedness as 'left' | 'right' | 'ambidextrous') : undefined,
          referral,
          seekingCare: seekingCare as 'yes' | 'no',
        });
        await queryClient.invalidateQueries({ queryKey: ['profiles', user?.id] });
        toast.success("Данные члена семьи обновлены!");
        
        // Если пришли из кабинета - возвращаемся туда, иначе продолжаем онбординг
        if (location.state?.from === 'cabinet') {
          navigate("/cabinet");
        } else {
          navigate("/family-members");
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        toast.error('Ошибка при обновлении данных');
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
                Редактировать данные члена семьи
              </SerifHeading>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                Имя <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">
                Фамилия <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">
                Дата рождения <span className="text-destructive">*</span>
              </Label>
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
              <Label htmlFor="relationship">
                Кем для вас приходится? <span className="text-destructive">*</span>
              </Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger id="relationship" className="h-12 text-base">
                  <SelectValue placeholder="Выберите" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="child">Ребенок</SelectItem>
                  <SelectItem value="partner">Партнер</SelectItem>
                  <SelectItem value="other">Другое</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>
                Пол <span className="text-destructive">*</span>
              </Label>
              <RadioGroup value={sex} onValueChange={setSex} className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 rounded-lg border border-input px-4 py-4">
                  <RadioGroupItem value="male" id="male-edit" />
                  <Label htmlFor="male-edit" className="flex-1 cursor-pointer font-normal">
                    Мужской
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border border-input px-4 py-4">
                  <RadioGroupItem value="female" id="female-edit" />
                  <Label htmlFor="female-edit" className="flex-1 cursor-pointer font-normal">
                    Женский
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>
                Левша или правша?
              </Label>
              <RadioGroup value={handedness} onValueChange={setHandedness} className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 rounded-lg border border-input px-4 py-4">
                  <RadioGroupItem value="right" id="handedness-right" />
                  <Label htmlFor="handedness-right" className="flex-1 cursor-pointer font-normal">
                    Правша
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border border-input px-4 py-4">
                  <RadioGroupItem value="left" id="handedness-left" />
                  <Label htmlFor="handedness-left" className="flex-1 cursor-pointer font-normal">
                    Левша
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border border-input px-4 py-4">
                  <RadioGroupItem value="ambidextrous" id="handedness-ambidextrous" />
                  <Label htmlFor="handedness-ambidextrous" className="flex-1 cursor-pointer font-normal">
                    Амбидекстр
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referral">
                Пришел по направлению от организации?
              </Label>
              <Select value={referral} onValueChange={setReferral}>
                <SelectTrigger id="referral" className="h-12 text-base">
                  <SelectValue placeholder="Нет направления" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">Нет направления</SelectItem>
                  <SelectItem value="insurance">Страховая компания</SelectItem>
                  <SelectItem value="doctor">Врач</SelectItem>
                  <SelectItem value="school">Школа</SelectItem>
                  <SelectItem value="other">Другое</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>
                Этот член семьи будет проходить нейротренинг? <span className="text-destructive">*</span>
              </Label>
              <RadioGroup value={seekingCare} onValueChange={setSeekingCare} className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 rounded-lg border border-input px-4 py-4">
                  <RadioGroupItem value="yes" id="seeking-yes-edit" />
                  <Label htmlFor="seeking-yes-edit" className="flex-1 cursor-pointer font-normal">
                    Да
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border border-input px-4 py-4">
                  <RadioGroupItem value="no" id="seeking-no-edit" />
                  <Label htmlFor="seeking-no-edit" className="flex-1 cursor-pointer font-normal">
                    Нет
                  </Label>
                </div>
              </RadioGroup>
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
              Отмена
            </Button>
              <Button
                type="submit"
                size="lg"
                className="h-14 flex-1 text-base font-medium"
              >
                Сохранить
              </Button>
            </div>
          </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
