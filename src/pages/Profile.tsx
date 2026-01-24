import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { StepIndicator } from "@/components/StepIndicator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import bgImage from '@/assets/bg.png';
import { Input as DesignSystemInput } from "@/components/design-system/Input";
import { RadioGroup as DesignSystemRadioGroup } from "@/components/design-system/Radio";
import { Checkbox as DesignSystemCheckbox } from "@/components/design-system/Checkbox";
import { SerifHeading } from "@/components/design-system/SerifHeading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
        
        // Загружаем данные из базы
        if (parentProfile) {
          setFirstName(parentProfile.first_name || "");
          setLastName(parentProfile.last_name || "");
        }
        
        if (parentProfile) {
          setDateOfBirth(parentProfile.dob || "");
          setSex(parentProfile.gender || "");
          setSeekingCare(parentProfile.seeking_care || "");
        }

        // Проверяем, прошел ли пользователь онбординг полностью:
        // - Есть профиль родителя с заполненными данными
        // - Есть телефон
        const hasParentProfile = parentProfile && parentProfile.first_name && parentProfile.last_name;
        const hasPhone = userData?.phone;

        if (hasParentProfile && hasPhone) {
          hasCompletedOnboardingRef.current = true;

          // Если пользователь уже прошел онбординг и зашел сюда не из cabinet/family-members,
          // значит это ошибочный редирект - отправляем на cabinet
          // Исключение: если это debug-доступ (из сайдбара), разрешаем редактирование
          const allowedFrom = ['cabinet', 'family-members'];
          if (!allowedFrom.includes(location.state?.from ?? '') && !location.state?.debug) {
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

        // Определяем, откуда пришли: cabinet, family-members или первичная настройка (онбординг)
        const from = location.state?.from;
        const isEditing = from === 'cabinet' || hasCompletedOnboardingRef.current;

        if (isEditing) {
          navigate("/cabinet");
        } else if (from === 'family-members') {
          // Если пришли из family-members и онбординг не завершен - продолжаем онбординг
          // Если онбординг завершен - возвращаемся на family-members
          if (hasCompletedOnboardingRef.current) {
            navigate("/family-members");
          } else {
            // Продолжаем онбординг
            navigate("/family-setup");
          }
        } else {
          // Первичная настройка (онбординг после заказа доставки) → настройка семьи
          navigate("/family-setup");
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
          <StepIndicator currentStep={1} totalSteps={3} label="ПРОФИЛЬ РОДИТЕЛЯ" />
          
          <div className="space-y-8 mt-8">
            <div className="text-center">
              <SerifHeading size="2xl" className="mb-4">
                Расскажите нам больше о себе
              </SerifHeading>
              <p className="text-muted-foreground">
                Данные используются для персонализации тренировок, в соответствии с нашей политикой
                конфиденциальности.
              </p>
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
                Планируете ли вы сами использовать платформу для собственных тренировок? <span className="text-destructive">*</span>
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

            <DesignSystemInput
              id="phone"
              type="tel"
              label="Номер телефона *"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="+7 (999) 123-45-67"
              required
              error={phoneError}
            />

            <div className="space-y-4 rounded-lg border border-border p-4">
              <DesignSystemCheckbox
                checked={notificationConsent}
                onChange={(checked) => handleNotificationConsentChange(checked)}
                label={
                  <span className="text-sm leading-relaxed">
                    Разрешить отправлять уведомления об обновлениях на платформе
                  </span>
                }
              />

              <DesignSystemCheckbox
                checked={marketingConsent}
                onChange={(checked) => setMarketingConsent(checked)}
                label={
                  <span className="text-sm leading-relaxed">
                    Я согласен получать <strong>периодические маркетинговые</strong> письма о
                    программах, предложениях и обновлениях Waves.
                  </span>
                }
              />
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
        </Card>
      </div>
    </div>
  );
}
