import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { StepIndicator } from "@/components/StepIndicator";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { getCurrentUserData, upsertUserData, PhoneAlreadyExistsError } from "@/lib/userStorage";
import { getProfiles, createProfile, updateProfile } from "@/lib/profileStorage";
import { isValidPhoneNumber, formatPhoneInput, normalizePhone } from "@/lib/utils";
import { BirthDatePicker } from "@/components/ui/birth-date-picker";
import { setupPushNotifications, isPushSupported } from "@/lib/push-notifications";

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [sex, setSex] = useState("");
  const [seekingCare, setSeekingCare] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [notificationConsent, setNotificationConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  // Флаг для определения, прошел ли пользователь онбординг ранее
  const hasCompletedOnboardingRef = useRef(false);

  // Загружаем существующие данные пользователя и профиля родителя
  useEffect(() => {
    async function loadUserData() {
      if (!user) return;

      try {
        const userData = await getCurrentUserData();
        if (userData) {
          // Форматируем телефон при загрузке
          setPhone(userData.phone ? formatPhoneInput(userData.phone) : "");
          setMarketingConsent(userData.marketing_consent || false);
        }

        // Загружаем профиль родителя, если он существует
        const profiles = await getProfiles();
        const parentProfile = profiles.find(p => p.type === 'parent');
        if (parentProfile) {
          setFirstName(parentProfile.first_name || "");
          setLastName(parentProfile.last_name || "");
          setDateOfBirth(parentProfile.dob || "");
          setSex(parentProfile.gender || "");
          setSeekingCare(parentProfile.seeking_care || "");
        }

        // Проверяем, прошел ли пользователь онбординг полностью:
        // - Есть профиль родителя с заполненными данными
        // - Есть телефон
        // - Есть регион
        const hasParentProfile = parentProfile && parentProfile.first_name && parentProfile.last_name;
        const hasPhone = userData?.phone;
        const hasRegion = userData?.region;

        if (hasParentProfile && hasPhone && hasRegion) {
          hasCompletedOnboardingRef.current = true;

          // Если пользователь уже прошел онбординг и зашел сюда не из cabinet,
          // значит это ошибочный редирект - отправляем на cabinet
          if (location.state?.from !== 'cabinet') {
            navigate('/cabinet', { replace: true });
            return;
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadUserData();
  }, [user, location.state, navigate]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneInput(e.target.value);
    setPhone(formatted);
    // Сбрасываем ошибку при вводе
    if (phoneError) {
      setPhoneError("");
    }
  };

  // Обработчик согласия на уведомления - запрашивает разрешение на push
  const handleNotificationConsentChange = async (checked: boolean) => {
    setNotificationConsent(checked);

    if (checked && isPushSupported()) {
      const result = await setupPushNotifications();

      if (result === 'denied') {
        toast.error('Вы заблокировали уведомления в браузере. Разрешите их в настройках.');
        setNotificationConsent(false);
      } else if (result === 'granted') {
        toast.success('Уведомления включены!');
      }
      // Для ios-not-pwa и unsupported - молча принимаем согласие,
      // push настроится позже когда условия будут выполнены
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Валидация телефона
    if (!phone) {
      setPhoneError("Введите номер телефона");
      return;
    }
    if (!isValidPhoneNumber(phone)) {
      setPhoneError("Введите корректный номер телефона");
      return;
    }

    if (firstName && lastName && dateOfBirth && sex && seekingCare && phone) {
      try {
        setLoading(true);

        // Нормализуем телефон перед сохранением
        const normalizedPhone = normalizePhone(phone);

        // Сохраняем данные пользователя в таблицу users
        await upsertUserData({
          phone: normalizedPhone,
          marketing_consent: marketingConsent,
        });

        // Проверяем, есть ли уже профиль родителя
        const profiles = await getProfiles();
        const parentProfile = profiles.find(p => p.type === 'parent');

        if (parentProfile) {
          // Обновляем существующий профиль
          await updateProfile(parentProfile.id, {
            firstName,
            lastName,
            dateOfBirth,
            relationship: 'parent',
            sex: sex as 'male' | 'female' | 'other',
            seekingCare: seekingCare as 'yes' | 'no',
          });
          toast.success("Профиль успешно обновлен!");
        } else {
          // Создаем новый профиль родителя
          await createProfile({
            firstName,
            lastName,
            dateOfBirth,
            relationship: 'parent',
            sex: sex as 'male' | 'female' | 'other',
            seekingCare: seekingCare as 'yes' | 'no',
          });
          toast.success("Профиль успешно создан!");
        }

        // Определяем, откуда пришли: редактирование из меню или первичная настройка
        // Также проверяем, прошел ли пользователь онбординг ранее
        const isEditing = location.state?.from === 'cabinet' || hasCompletedOnboardingRef.current;

        if (isEditing) {
          // Редактирование из меню или пользователь уже прошел онбординг → возвращаемся в Dashboard
          navigate("/cabinet");
        } else {
          // Первичная настройка → продолжаем поток
          navigate("/region");
        }
      } catch (error) {
        console.error('Error saving profile:', error);
        if (error instanceof PhoneAlreadyExistsError) {
          toast.error(error.message);
        } else {
          toast.error('Ошибка при сохранении профиля');
        }
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <StepIndicator currentStep={1} totalSteps={3} label="ПРОФИЛЬ" />
        
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold text-foreground">
              Расскажите нам больше о себе
            </h1>
            <p className="text-muted-foreground">
              Данные используются только для облегчения лечения, в соответствии с нашей политикой
              конфиденциальности.
            </p>
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

            <div className="space-y-3">
              <Label>
                Пол <span className="text-destructive">*</span>
              </Label>
              <RadioGroup value={sex} onValueChange={setSex} className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 rounded-lg border border-input px-4 py-4">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male" className="flex-1 cursor-pointer font-normal">
                    Мужской
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border border-input px-4 py-4">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female" className="flex-1 cursor-pointer font-normal">
                    Женский
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>
                Вы ищете помощь для себя? <span className="text-destructive">*</span>
              </Label>
              <RadioGroup value={seekingCare} onValueChange={setSeekingCare} className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 rounded-lg border border-input px-4 py-4">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes" className="flex-1 cursor-pointer font-normal">
                    Да
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border border-input px-4 py-4">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no" className="flex-1 cursor-pointer font-normal">
                    Нет
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Номер телефона <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="+7 (999) 123-45-67"
                required
                className={`h-12 text-base ${phoneError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              />
              {phoneError && (
                <p className="text-sm text-destructive">{phoneError}</p>
              )}
            </div>

            <div className="space-y-4 rounded-lg border border-border p-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="notifications"
                  checked={notificationConsent}
                  onCheckedChange={(checked) => handleNotificationConsentChange(checked as boolean)}
                />
                <Label htmlFor="notifications" className="text-sm leading-relaxed">
                  Разрешить отправлять уведомления о консультациях на платформе
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="marketing"
                  checked={marketingConsent}
                  onCheckedChange={(checked) => setMarketingConsent(checked as boolean)}
                />
                <Label htmlFor="marketing" className="text-sm leading-relaxed">
                  Я согласен получать <strong>периодические маркетинговые</strong> письма о
                  программах, предложениях и обновлениях Balansity.
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="h-14 w-full text-base font-medium"
            >
              {loading ? 'Сохранение...' : 'Продолжить'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
