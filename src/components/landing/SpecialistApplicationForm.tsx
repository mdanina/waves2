import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';

// Получаем URL и ключ для логирования
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  specialistApplicationSchema,
  workFormatOptions,
  type SpecialistApplicationInput,
} from '@/lib/validation/schemas';
import { ChevronDown, ChevronUp, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface Specialization {
  code: string;
  name: string;
  description: string | null;
}

type FormStep = 'contact' | 'education' | 'experience' | 'additional';

const steps: { key: FormStep; label: string }[] = [
  { key: 'contact', label: 'Контактные данные' },
  { key: 'education', label: 'Образование' },
  { key: 'experience', label: 'Опыт работы' },
  { key: 'additional', label: 'Дополнительно' },
];

interface SpecialistApplicationFormProps {
  alwaysExpanded?: boolean;
}

export function SpecialistApplicationForm({ alwaysExpanded = false }: SpecialistApplicationFormProps) {
  const [isExpanded, setIsExpanded] = useState(alwaysExpanded);
  const [currentStep, setCurrentStep] = useState<FormStep>('contact');
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [isLoadingSpecializations, setIsLoadingSpecializations] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showCustomSpecialization, setShowCustomSpecialization] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SpecialistApplicationInput>({
    resolver: zodResolver(specialistApplicationSchema),
    defaultValues: {
      workFormats: [],
      otherExperience: false,
      workTypePrivate: false,
      workTypeCenter: false,
      workTypeClinic: false,
      workTypeOnline: false,
      worksOnline: false,
      worksOffline: false,
      providesHomeVisits: false,
      canConfirmEducation: false,
    },
  });

  const specializationCode = watch('specializationCode');

  // Отслеживаем выбор специализации
  useEffect(() => {
    if (specializationCode === 'other') {
      setShowCustomSpecialization(true);
    } else {
      setShowCustomSpecialization(false);
      setValue('customSpecialization', '');
      // Очищаем ошибки валидации для customSpecialization
      if (errors.customSpecialization) {
        trigger('customSpecialization');
      }
    }
  }, [specializationCode, setValue, errors.customSpecialization, trigger]);

  // Загружаем специализации при раскрытии формы или если форма всегда раскрыта
  useEffect(() => {
    if ((isExpanded || alwaysExpanded) && specializations.length === 0) {
      loadSpecializations();
    }
  }, [isExpanded, alwaysExpanded]);

  const loadSpecializations = async () => {
    setIsLoadingSpecializations(true);
    try {
      const { data, error } = await supabase
        .from('specializations')
        .select('code, name, description')
        .eq('is_active', true)
        .neq('code', 'coordinator') // Исключаем координаторов
        .order('name');

      if (error) throw error;
      setSpecializations(data || []);
    } catch (error) {
      console.error('Error loading specializations:', error);
      toast.error('Не удалось загрузить список специализаций');
    } finally {
      setIsLoadingSpecializations(false);
    }
  };

  const onSubmit = async (data: SpecialistApplicationInput) => {
    try {
      console.log('=== Form submission started ===');
      console.log('Form data:', JSON.stringify(data, null, 2));
      console.log('Specialization code:', data.specializationCode);
      console.log('Custom specialization:', data.customSpecialization);
      
      // Если выбрано "Другое", используем customSpecialization
      const finalSpecializationCode =
        data.specializationCode === 'other' && data.customSpecialization
          ? data.customSpecialization
          : data.specializationCode;

      console.log('Final specialization code:', finalSpecializationCode);

      // Преобразуем данные для базы данных (snake_case)
      // Добавляем только определенные поля, чтобы избежать проблем с undefined
      const applicationData: Record<string, any> = {
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        specialization_code: finalSpecializationCode,
        primary_method: data.primaryMethod,
        base_education_hours: data.baseEducationHours,
        certification_hours: data.certificationHours,
        experience_years: data.experienceYears,
        status: 'new',
      };

      // Опциональные поля - добавляем только если они определены и не пустые
      if (data.educationDescription && data.educationDescription.trim()) {
        applicationData.education_description = data.educationDescription;
      }
      if (data.canConfirmEducation !== undefined) {
        applicationData.can_confirm_education = data.canConfirmEducation;
      }
      if (data.workTypePrivate !== undefined) {
        applicationData.work_type_private = data.workTypePrivate;
        if (data.workTypePrivate && data.workTypePrivateYears !== undefined && data.workTypePrivateYears !== null) {
          applicationData.work_type_private_years = data.workTypePrivateYears;
        }
      }
      if (data.workTypeCenter !== undefined) {
        applicationData.work_type_center = data.workTypeCenter;
        if (data.workTypeCenter && data.workTypeCenterYears !== undefined && data.workTypeCenterYears !== null) {
          applicationData.work_type_center_years = data.workTypeCenterYears;
        }
      }
      if (data.workTypeClinic !== undefined) {
        applicationData.work_type_clinic = data.workTypeClinic;
        if (data.workTypeClinic && data.workTypeClinicYears !== undefined && data.workTypeClinicYears !== null) {
          applicationData.work_type_clinic_years = data.workTypeClinicYears;
        }
      }
      if (data.workTypeOnline !== undefined) {
        applicationData.work_type_online = data.workTypeOnline;
        if (data.workTypeOnline && data.workTypeOnlineYears !== undefined && data.workTypeOnlineYears !== null) {
          applicationData.work_type_online_years = data.workTypeOnlineYears;
        }
      }
      if (data.partnerships && data.partnerships.trim()) {
        applicationData.partnerships = data.partnerships;
      }
      if (data.workFormats && Array.isArray(data.workFormats) && data.workFormats.length > 0) {
        applicationData.work_formats = data.workFormats;
      }
      if (data.worksOnline !== undefined) {
        applicationData.works_online = data.worksOnline;
      }
      if (data.worksOffline !== undefined) {
        applicationData.works_offline = data.worksOffline;
        if (data.worksOffline) {
          if (data.offlineCity && data.offlineCity.trim()) {
            applicationData.offline_city = data.offlineCity;
          }
          if (data.offlineAddress && data.offlineAddress.trim()) {
            applicationData.offline_address = data.offlineAddress;
          }
          if (data.providesHomeVisits !== undefined) {
            applicationData.provides_home_visits = data.providesHomeVisits;
            if (data.providesHomeVisits && data.homeVisitCity && data.homeVisitCity.trim()) {
              applicationData.home_visit_city = data.homeVisitCity;
            }
          }
        }
      }
      if (data.worksOnline && data.hourlyRateOnline !== undefined && data.hourlyRateOnline !== null) {
        applicationData.hourly_rate_online = data.hourlyRateOnline;
      }
      if (data.worksOffline && data.hourlyRateOffline !== undefined && data.hourlyRateOffline !== null) {
        applicationData.hourly_rate_offline = data.hourlyRateOffline;
      }
      if (data.otherExperience !== undefined) {
        applicationData.other_experience = data.otherExperience;
        if (data.otherExperience && data.otherExperienceText && data.otherExperienceText.trim()) {
          applicationData.other_experience_text = data.otherExperienceText;
        }
      }
      if (data.socialLinks && data.socialLinks.trim()) {
        applicationData.social_links = data.socialLinks;
      }
      if (data.additionalInfo && data.additionalInfo.trim()) {
        applicationData.additional_info = data.additionalInfo;
      }

      console.log('Application data to send:', applicationData);
      console.log('Data keys count:', Object.keys(applicationData).length);
      
      // Проверяем текущую сессию и роль
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session ? 'authenticated' : 'anonymous');
      console.log('Supabase URL:', supabaseUrl);
      console.log('Using anon key:', supabaseAnonKey ? 'yes' : 'no');

      // Важно: НЕ используем .select() после insert, т.к. у анонимных пользователей
      // есть только право INSERT, но не SELECT. Вызов .select() требует права на чтение строки.
      const { error } = await supabase
        .from('specialist_applications')
        .insert(applicationData);

      if (error) {
        console.error('=== SUPABASE ERROR ===');
        console.error('Error object:', JSON.stringify(error, null, 2));
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        
        // Более подробное сообщение об ошибке
        let errorMessage = 'Не удалось отправить заявку. ';
        if (error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist')) {
          const missingColumn = error.message?.match(/column "([^"]+)"/)?.[1] || 'неизвестная колонка';
          errorMessage += `Колонка "${missingColumn}" отсутствует в базе данных. `;
          errorMessage += `Проверьте, что миграции 116 и 117 применены. `;
          errorMessage += `Ошибка: ${error.message}`;
        } else if (error.code === '23502') {
          errorMessage += `Обязательное поле не заполнено: ${error.message}`;
        } else if (error.code === '23505') {
          errorMessage += `Дублирующая запись: ${error.message}`;
        } else {
          errorMessage += `${error.message || 'Попробуйте позже.'}`;
        }
        
        toast.error(errorMessage);
        throw error;
      }

      console.log('=== SUCCESS ===');
      console.log('Application submitted successfully');

      setIsSubmitted(true);
      toast.success('Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.');
      reset();
    } catch (error: any) {
      console.error('Error submitting application:', error);
      const errorMessage = error?.message || error?.details || 'Не удалось отправить заявку. Попробуйте позже.';
      toast.error(`Ошибка: ${errorMessage}`);
    }
  };

  const validateAndNextStep = async () => {
    const fieldsToValidate: Record<FormStep, (keyof SpecialistApplicationInput)[]> = {
      contact: ['fullName', 'email', 'phone', 'specializationCode', 'primaryMethod'],
      education: ['baseEducationHours', 'certificationHours'],
      experience: ['experienceYears'],
      additional: [],
    };

    // Если выбрано "Другое", проверяем также customSpecialization
    if (currentStep === 'contact' && specializationCode === 'other') {
      fieldsToValidate.contact.push('customSpecialization');
    }

    const isValid = await trigger(fieldsToValidate[currentStep]);
    if (isValid) {
      const currentIndex = steps.findIndex((s) => s.key === currentStep);
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1].key);
      }
    }
  };

  const prevStep = () => {
    const currentIndex = steps.findIndex((s) => s.key === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key);
    }
  };

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  // Проверка требований по часам
  const baseEducationHours = watch('baseEducationHours');
  const certificationHours = watch('certificationHours');
  const meetsEducationRequirement = baseEducationHours >= 1100;
  const meetsCertificationRequirement = certificationHours >= 700;

  if (isSubmitted) {
    return (
      <div className="bg-honey-pale border border-honey-dark/20 rounded-lg p-6 text-center">
        <CheckCircle className="h-12 w-12 text-honey-dark mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-ink mb-2">Заявка отправлена!</h3>
        <p className="text-ink/70 mb-4">
          Спасибо за интерес к работе с нами! Мы проверим вашу заявку и свяжемся с вами в ближайшее
          время.
        </p>
        <Button variant="outline" onClick={() => setIsSubmitted(false)}>
          Отправить ещё одну заявку
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-honey-dark/20 rounded-lg overflow-hidden">
      {/* Заголовок - кликабельный для раскрытия/сворачивания (только если не alwaysExpanded) */}
      {!alwaysExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-honey-pale/50 transition-colors"
        >
          <div>
            <h3 className="text-lg font-semibold text-ink">Стать специалистом Waves</h3>
            <p className="text-sm text-ink/70 mt-1">
              Присоединяйтесь к команде профессионалов платформы
            </p>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-ink/50" />
          ) : (
            <ChevronDown className="h-5 w-5 text-ink/50" />
          )}
        </button>
      )}

      {/* Форма */}
      {(isExpanded || alwaysExpanded) && (
        <div className="px-6 pb-6 border-t border-honey-dark/10">
          {/* Индикатор шагов */}
          <div className="flex items-end justify-between py-2 sm:py-3 md:py-4 mb-4 overflow-x-auto px-4 sm:px-6 md:px-8">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-end flex-1 min-w-0">
                <div className="flex flex-col items-center w-full">
                  <span
                    className={`mb-1 sm:mb-1.5 md:mb-2 text-[10px] sm:text-xs md:text-sm text-center whitespace-nowrap transition-all ${
                      index <= currentStepIndex ? 'text-ink font-medium' : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>
                  <div
                    className={`flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full text-[10px] sm:text-xs md:text-sm font-medium transition-all ${
                      index <= currentStepIndex
                        ? 'bg-honey text-ink'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] sm:h-0.5 mb-2 sm:mb-2.5 md:mb-4 transition-all ${
                      index < currentStepIndex ? 'bg-honey' : 'bg-gray-200'
                    }`}
                    style={{
                      marginLeft: 'clamp(0.5rem, 2vw, 1rem)',
                      marginRight: 'clamp(0.5rem, 2vw, 1rem)',
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <form 
            onSubmit={handleSubmit(
              (data) => {
                console.log('=== handleSubmit callback called ===');
                onSubmit(data);
              },
              (errors) => {
                console.error('=== Form validation failed ===');
                console.error('Validation errors:', JSON.stringify(errors, null, 2));
                console.error('Errors object:', errors);
                
                // Показываем конкретные ошибки
                const errorMessages = Object.entries(errors)
                  .map(([field, error]: [string, any]) => {
                    const message = error?.message || 'Ошибка';
                    console.error(`Field ${field}:`, message);
                    return `${field}: ${message}`;
                  })
                  .join(', ');
                
                toast.error(`Ошибки валидации: ${errorMessages || 'Заполните все обязательные поля'}`);
              }
            )} 
            className="space-y-4"
          >
            {/* Шаг 1: Контактные данные */}
            {currentStep === 'contact' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">ФИО *</Label>
                    <Input
                      id="fullName"
                      {...register('fullName')}
                      placeholder="Иванов Иван Иванович"
                      className="h-11"
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive">{errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="email@example.com"
                      className="h-11"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Телефон *</Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      placeholder="+7 (999) 123-45-67"
                      className="h-11"
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specializationCode">Специализация *</Label>
                    <Controller
                      name="specializationCode"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="h-11">
                            <SelectValue
                              placeholder={
                                isLoadingSpecializations ? 'Загрузка...' : 'Выберите специализацию'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {specializations.map((spec) => (
                              <SelectItem key={spec.code} value={spec.code}>
                                {spec.name}
                              </SelectItem>
                            ))}
                            <SelectItem value="other">Другое</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.specializationCode && (
                      <p className="text-sm text-destructive">{errors.specializationCode.message}</p>
                    )}
                    {showCustomSpecialization && (
                      <div className="mt-2 space-y-2">
                        <Label htmlFor="customSpecialization">Укажите вашу специализацию *</Label>
                        <Input
                          id="customSpecialization"
                          {...register('customSpecialization')}
                          placeholder="Введите название вашей специализации"
                          className="h-11"
                        />
                        {errors.customSpecialization && (
                          <p className="text-sm text-destructive">
                            {errors.customSpecialization.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryMethod">Основной метод работы *</Label>
                  <Textarea
                    id="primaryMethod"
                    {...register('primaryMethod')}
                    placeholder="Укажите методологию, в которой вы работаете"
                    rows={4}
                    className="w-full min-h-[100px]"
                  />
                  {errors.primaryMethod && (
                    <p className="text-sm text-destructive">{errors.primaryMethod.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Шаг 2: Образование */}
            {currentStep === 'education' && (
              <div className="space-y-4">
                <div className="bg-honey-pale/50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-ink mb-2">Требования к образованию</h4>
                  <ul className="text-sm text-ink/70 space-y-1">
                    <li>
                      - Базовое профессиональное образование: минимум{' '}
                      <strong>1100 часов</strong>
                    </li>
                    <li>
                      - Количество часов дополнительного обучения и практики: минимум <strong>700 часов</strong>
                    </li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="baseEducationHours">
                      Часы базового образования *
                    </Label>
                    <Input
                      id="baseEducationHours"
                      type="number"
                      {...register('baseEducationHours', { valueAsNumber: true })}
                      placeholder="1100"
                      className="h-11"
                    />
                    {errors.baseEducationHours && (
                      <p className="text-sm text-destructive">
                        {errors.baseEducationHours.message}
                      </p>
                    )}
                    {baseEducationHours !== undefined && baseEducationHours > 0 && (
                      <div
                        className={`flex items-center gap-1 text-sm ${meetsEducationRequirement ? 'text-green-600' : 'text-amber-600'}`}
                      >
                        {meetsEducationRequirement ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        {meetsEducationRequirement
                          ? 'Соответствует требованиям'
                          : 'Минимум 1100 часов'}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Высшее образование или длительное ДПО по вашей специализации
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="certificationHours">
                      Часы дополнительного обучения и практики *
                    </Label>
                    <Input
                      id="certificationHours"
                      type="number"
                      {...register('certificationHours', { valueAsNumber: true })}
                      placeholder="700"
                      className="h-11"
                    />
                    {errors.certificationHours && (
                      <p className="text-sm text-destructive">
                        {errors.certificationHours.message}
                      </p>
                    )}
                    {certificationHours !== undefined && certificationHours > 0 && (
                      <div
                        className={`flex items-center gap-1 text-sm ${meetsCertificationRequirement ? 'text-green-600' : 'text-amber-600'}`}
                      >
                        {meetsCertificationRequirement ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        {meetsCertificationRequirement
                          ? 'Соответствует требованиям'
                          : 'Минимум 700 часов'}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Суммарно за все время (приблизительно)
                    </p>
                  </div>
                </div>

                {/* Описание образования */}
                <div className="space-y-2">
                  <Label htmlFor="educationDescription">
                    Подробное описание образования *
                  </Label>
                  <Textarea
                    id="educationDescription"
                    {...register('educationDescription')}
                    placeholder="Опишите, где вы учились: названия учебных заведений, специальности, годы обучения, полученные дипломы и сертификаты..."
                    rows={5}
                    className="w-full min-h-[120px]"
                  />
                  {errors.educationDescription && (
                    <p className="text-sm text-destructive">
                      {errors.educationDescription.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Укажите учебные заведения, специальности, годы обучения, полученные дипломы и сертификаты
                  </p>
                </div>

                {/* Чекбокс подтверждения документами */}
                <div className="space-y-2">
                  <Controller
                    name="canConfirmEducation"
                    control={control}
                    render={({ field }) => (
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                        <span className="text-sm">Готов подтвердить документами об обучении</span>
                      </label>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Шаг 3: Опыт работы */}
            {currentStep === 'experience' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experienceYears">Стаж работы (лет) *</Label>
                    <Input
                      id="experienceYears"
                      type="number"
                      {...register('experienceYears', { valueAsNumber: true })}
                      placeholder="3"
                      className="h-11"
                    />
                    {errors.experienceYears && (
                      <p className="text-sm text-destructive">{errors.experienceYears.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Минимум 3 года практики после сертификации
                    </p>
                  </div>

                </div>

                {/* Характер работы */}
                <div className="space-y-4">
                  <Label>Характер работы (укажите стаж по каждому направлению)</Label>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Controller
                        name="workTypePrivate"
                        control={control}
                        render={({ field }) => (
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                            <span className="text-sm">Частная практика</span>
                          </label>
                        )}
                      />
                      {watch('workTypePrivate') && (
                        <div className="ml-6">
                          <Label htmlFor="workTypePrivateYears" className="text-xs">
                            Стаж (лет)
                          </Label>
                          <Input
                            id="workTypePrivateYears"
                            type="number"
                            {...register('workTypePrivateYears', { valueAsNumber: true })}
                            placeholder="0"
                            className="h-11"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Controller
                        name="workTypeCenter"
                        control={control}
                        render={({ field }) => (
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                            <span className="text-sm">Работа в центре</span>
                          </label>
                        )}
                      />
                      {watch('workTypeCenter') && (
                        <div className="ml-6">
                          <Label htmlFor="workTypeCenterYears" className="text-xs">
                            Стаж (лет)
                          </Label>
                          <Input
                            id="workTypeCenterYears"
                            type="number"
                            {...register('workTypeCenterYears', { valueAsNumber: true })}
                            placeholder="0"
                            className="h-11"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Controller
                        name="workTypeClinic"
                        control={control}
                        render={({ field }) => (
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                            <span className="text-sm">Работа в клинике</span>
                          </label>
                        )}
                      />
                      {watch('workTypeClinic') && (
                        <div className="ml-6">
                          <Label htmlFor="workTypeClinicYears" className="text-xs">
                            Стаж (лет)
                          </Label>
                          <Input
                            id="workTypeClinicYears"
                            type="number"
                            {...register('workTypeClinicYears', { valueAsNumber: true })}
                            placeholder="0"
                            className="h-11"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Controller
                        name="workTypeOnline"
                        control={control}
                        render={({ field }) => (
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                            <span className="text-sm">Работа на онлайн платформе</span>
                          </label>
                        )}
                      />
                      {watch('workTypeOnline') && (
                        <div className="ml-6">
                          <Label htmlFor="workTypeOnlineYears" className="text-xs">
                            Стаж (лет)
                          </Label>
                          <Input
                            id="workTypeOnlineYears"
                            type="number"
                            {...register('workTypeOnlineYears', { valueAsNumber: true })}
                            placeholder="0"
                            className="h-11"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Формат работы */}
                <div className="space-y-4">
                  <Label>Формат работы</Label>
                  
                  <div className="space-y-3">
                    <Controller
                      name="worksOnline"
                      control={control}
                      render={({ field }) => (
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                          <span className="text-sm">Работаю онлайн</span>
                        </label>
                      )}
                    />
                    
                    <Controller
                      name="worksOffline"
                      control={control}
                      render={({ field }) => (
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                          <span className="text-sm">Работаю очно (оффлайн)</span>
                        </label>
                      )}
                    />
                    
                    {watch('worksOffline') && (
                      <div className="ml-6 space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="offlineCity">Город *</Label>
                          <Input
                            id="offlineCity"
                            {...register('offlineCity')}
                            placeholder="Москва"
                            className="h-11"
                          />
                          {errors.offlineCity && (
                            <p className="text-sm text-destructive">
                              {errors.offlineCity.message}
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="offlineAddress">Адрес</Label>
                          <Input
                            id="offlineAddress"
                            {...register('offlineAddress')}
                            placeholder="Улица, дом, офис"
                            className="h-11"
                          />
                          {errors.offlineAddress && (
                            <p className="text-sm text-destructive">
                              {errors.offlineAddress.message}
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Controller
                            name="providesHomeVisits"
                            control={control}
                            render={({ field }) => (
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <Checkbox
                                  checked={field.value || false}
                                  onCheckedChange={field.onChange}
                                />
                                <span className="text-sm">Выезжаю на дом</span>
                              </label>
                            )}
                          />
                          {watch('providesHomeVisits') && (
                            <div className="ml-6 mt-2">
                              <Label htmlFor="homeVisitCity" className="text-xs">
                                Город для выезда *
                              </Label>
                              <Input
                                id="homeVisitCity"
                                {...register('homeVisitCity')}
                                placeholder="Москва"
                                className="h-11"
                              />
                              {errors.homeVisitCity && (
                                <p className="text-sm text-destructive">
                                  {errors.homeVisitCity.message}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Стоимость работы */}
                <div className="space-y-4">
                  <Label>Средняя стоимость часа работы</Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {watch('worksOffline') && (
                      <div className="space-y-2">
                        <Label htmlFor="hourlyRateOffline">Очно (руб/час)</Label>
                        <Input
                          id="hourlyRateOffline"
                          type="number"
                          {...register('hourlyRateOffline', { valueAsNumber: true })}
                          placeholder="5000"
                          className="h-11"
                        />
                        {errors.hourlyRateOffline && (
                          <p className="text-sm text-destructive">
                            {errors.hourlyRateOffline.message}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {watch('worksOnline') && (
                      <div className="space-y-2">
                        <Label htmlFor="hourlyRateOnline">Онлайн (руб/час)</Label>
                        <Input
                          id="hourlyRateOnline"
                          type="number"
                          {...register('hourlyRateOnline', { valueAsNumber: true })}
                          placeholder="4000"
                          className="h-11"
                        />
                        {errors.hourlyRateOnline && (
                          <p className="text-sm text-destructive">
                            {errors.hourlyRateOnline.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Партнерские проекты */}
                <div className="space-y-2">
                  <Label htmlFor="partnerships">Партнерские проекты, сотрудничества</Label>
                  <Textarea
                    id="partnerships"
                    {...register('partnerships')}
                    placeholder="Опишите партнерские проекты и сотрудничества, в которых вы участвовали"
                    rows={4}
                    className="w-full min-h-[100px]"
                  />
                </div>
              </div>
            )}

            {/* Шаг 4: Дополнительно */}
            {currentStep === 'additional' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>Форматы работы</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Controller
                      name="workFormats"
                      control={control}
                      render={({ field }) => (
                        <>
                          {workFormatOptions.map((option) => (
                            <label
                              key={option.value}
                              className="flex items-center space-x-2 cursor-pointer"
                            >
                              <Checkbox
                                checked={field.value?.includes(option.value)}
                                onCheckedChange={(checked) => {
                                  const newValue = checked
                                    ? [...(field.value || []), option.value]
                                    : (field.value || []).filter((v) => v !== option.value);
                                  field.onChange(newValue);
                                }}
                              />
                              <span className="text-sm">{option.label}</span>
                            </label>
                          ))}
                        </>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Controller
                    name="otherExperience"
                    control={control}
                    render={({ field }) => (
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                        <span className="text-sm">Другое</span>
                      </label>
                    )}
                  />
                  {watch('otherExperience') && (
                    <div className="ml-6 mt-2">
                      <Label htmlFor="otherExperienceText" className="text-xs">
                        Укажите дополнительную информацию
                      </Label>
                      <Textarea
                        id="otherExperienceText"
                        {...register('otherExperienceText')}
                        placeholder="Опишите ваш опыт или дополнительную информацию"
                        rows={3}
                        className="w-full min-h-[80px]"
                      />
                      {errors.otherExperienceText && (
                        <p className="text-sm text-destructive">
                          {errors.otherExperienceText.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="socialLinks">Ссылки на соцсети / портфолио</Label>
                  <Textarea
                    id="socialLinks"
                    {...register('socialLinks')}
                    placeholder="Instagram, Telegram, личный сайт..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalInfo">Дополнительная информация</Label>
                  <Textarea
                    id="additionalInfo"
                    {...register('additionalInfo')}
                    placeholder="Расскажите о себе, своём опыте, особенностях работы..."
                    rows={3}
                  />
                </div>

                <div className="bg-honey-pale/50 p-4 rounded-lg text-sm text-ink/70">
                  <p>
                    Нажимая кнопку "Отправить заявку", вы соглашаетесь с{' '}
                    <a href="/privacy" className="text-honey-dark hover:underline">
                      политикой конфиденциальности
                    </a>{' '}
                    и даёте согласие на обработку персональных данных.
                  </p>
                </div>
              </div>
            )}

            {/* Навигация */}
            <div className="flex justify-between pt-4 border-t border-honey-dark/10">
              {currentStepIndex > 0 ? (
                <Button type="button" variant="outline" onClick={prevStep}>
                  Назад
                </Button>
              ) : (
                <div />
              )}

              {currentStepIndex < steps.length - 1 ? (
                <Button type="button" onClick={validateAndNextStep}>
                  Далее
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  onClick={(e) => {
                    console.log('Submit button clicked');
                    console.log('isSubmitting:', isSubmitting);
                    console.log('Current step:', currentStep);
                    console.log('Form errors:', errors);
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    'Отправить заявку'
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
