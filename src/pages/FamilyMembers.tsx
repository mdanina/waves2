import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { StepIndicator } from "@/components/StepIndicator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CreditCard } from "lucide-react";
import bgImage from '@/assets/bg.png';
import { Avatar } from "@/components/ui/avatar";
import { SerifHeading } from "@/components/design-system/SerifHeading";
import { User, Plus, Pencil, Trash2 } from "lucide-react";
import familyIllustration from "@/assets/family.png";
import { ProfileAvatar } from "@/components/avatars/ProfileAvatar";
import { getProfiles, deleteProfile, calculateAge } from "@/lib/profileStorage";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/lib/supabase";
type Profile = Database['public']['Tables']['profiles']['Row'];
import { toast } from "sonner";
import { logger } from "@/lib/logger";

// Проверка наличия лицензии
function useHasLicense() {
  const [hasLicense, setHasLicense] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('waves_licenses');
      const licenses = stored ? JSON.parse(stored) : [];
      setHasLicense(licenses.length > 0);
    } catch {
      setHasLicense(false);
    }
  }, []);

  return hasLicense;
}
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function FamilyMembers() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [members, setMembers] = useState<Profile[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const hasLicense = useHasLicense();

  // Проверяем, пришёл ли пользователь из cabinet (не onboarding)
  const isFromCabinet = location.state?.from === 'cabinet';

  useEffect(() => {
    let cancelled = false;
    
    async function loadMembers() {
      try {
        if (!cancelled) {
          setLoading(true);
        }
        const profiles = await getProfiles();
        if (cancelled) return;
        
        logger.log('Loaded profiles:', profiles);
        logger.log('Profiles with types:', profiles.map(p => ({ name: p.first_name, type: p.type })));
        setMembers(profiles);
      } catch (error) {
        if (!cancelled) {
          logger.error('Error loading family members:', error);
          toast.error('Ошибка при загрузке членов семьи');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadMembers();
    
    return () => {
      cancelled = true;
    };
  }, [location.pathname]); // Перезагружаем при изменении маршрута

  // Функция для выбора аватара на основе типа профиля и пола
  const getAvatarProps = useCallback((member: Profile) => {
    return {
      type: (member.type || 'parent') as 'parent' | 'child',
      gender: (member.gender || 'female') as 'male' | 'female',
    };
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteProfile(id);
      await queryClient.invalidateQueries({ queryKey: ['profiles', user?.id] });
      setMembers(prev => prev.filter(m => m.id !== id));
      setDeleteId(null);
      toast.success("Член семьи удален");
    } catch (error) {
      logger.error('Error deleting profile:', error);
      toast.error('Ошибка при удалении члена семьи');
    }
  };

  const parentProfile = useMemo(() => members.find(p => p.type === 'parent'), [members]);
  const parentWantsToTrain = parentProfile?.seeking_care === 'yes';
  const children = useMemo(() => members.filter(m => m.type === 'child'), [members]);
  const children6Plus = useMemo(
    () => children.filter(c => (c.dob ? calculateAge(c.dob) : 0) >= 6),
    [children]
  );
  const isOnboarding = location.state?.from !== 'cabinet';
  const canComplete = useMemo(() => {
    if (!isOnboarding) return true;
    if (parentWantsToTrain) return true;
    return children6Plus.length >= 1;
  }, [isOnboarding, parentWantsToTrain, children6Plus.length]);

  const handleComplete = () => {
    if (!canComplete) return;
    navigate("/cabinet");
  };

  // Заглушка для пользователей без лицензии (только из cabinet)
  if (isFromCabinet && hasLicense === false) {
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
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
              <SerifHeading size="xl" className="mb-4">
                Управление участниками
              </SerifHeading>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Раздел станет доступен после приобретения лицензии.
                Здесь вы сможете добавить членов семьи, которые будут использовать платформу.
              </p>
              <Button
                onClick={() => navigate('/cabinet/licenses')}
                className="bg-gradient-to-r from-coral to-coral-light hover:opacity-90"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Приобрести лицензию
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

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
          {/* StepIndicator только для onboarding */}
          {!isFromCabinet && <StepIndicator currentStep={3} totalSteps={3} label="ПРОФИЛЬ СЕМЬИ" />}
          
          <div className="space-y-8 mt-8">
          <div className="text-center">
            <img
              src={familyIllustration}
              alt="Семья"
              className="mx-auto mb-6 h-32 w-32 object-contain"
            />
            <SerifHeading size="2xl" className="mb-4">
              Члены семьи
            </SerifHeading>
            <p className="text-muted-foreground">
              Добавьте только тех членов семьи, которых вы планируете подключить к тренировкам на платформе.
            </p>
          </div>

          {isOnboarding && !canComplete && (
            <Alert variant="warning" className="shadow-[0_0_20px_rgba(255,178,153,0.5)]">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Нужно выбрать хотя бы одного участника старше 6 лет, чтобы получить доступ к тренировкам.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Загрузка...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Пока нет членов семьи</p>
              </div>
            ) : (
              members.map((member) => {
                const age = member.dob ? calculateAge(member.dob) : null;
                
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md"
                  >
                    <ProfileAvatar {...getAvatarProps(member)} size="md" />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {member.first_name} {member.last_name || ''}
                      </p>
                      {age !== null && (
                        <p className="text-sm text-muted-foreground">{age} лет</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          console.log('Edit clicked for member:', {
                            id: member.id,
                            name: `${member.first_name} ${member.last_name}`,
                            type: member.type,
                            isParent: member.type === 'parent'
                          });
                          if (member.type === 'parent') {
                            navigate('/profile', {
                              state: {
                                from:
                                  location.state?.from === 'cabinet' ? 'cabinet' : 'family-members',
                              },
                            });
                          } else {
                            navigate(`/edit-family-member/${member.id}`, {
                              state: location.state ? { from: location.state.from } : undefined,
                            });
                          }
                        }}
                        className="hover:border-coral hover:text-coral transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {member.type !== 'parent' && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setDeleteId(member.id)}
                          className="hover:border-destructive hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                // Если список пустой и нет профиля родителя - запускаем онбординг с профиля
                if (members.length === 0 || !parentProfile) {
                  navigate("/profile", { state: { from: 'family-members' } });
                } else {
                  // Если профили уже есть - просто добавляем нового члена семьи
                  navigate("/add-family-member", { state: { from: isFromCabinet ? 'cabinet' : undefined } });
                }
              }}
              className="h-14 w-full text-base font-medium hover:border-coral hover:text-coral transition-colors"
            >
              <Plus className="mr-2 h-5 w-5" />
              Добавить члена семьи
            </Button>
          </div>

          <div className="flex gap-4">
            {/* Определяем, откуда пришли: из меню или первичная настройка */}
            {location.state?.from === 'cabinet' ? (
              // Редактирование из меню → только кнопка возврата в cabinet
              <Button
                type="button"
                size="lg"
                onClick={() => navigate("/cabinet")}
                className="h-14 w-full text-base font-medium"
              >
                Вернуться в кабинет
              </Button>
            ) : (
              // Первичная настройка → кнопки Назад и Далее
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/family-setup")}
                  className="h-14 flex-1 text-base font-medium"
                >
                  Назад
                </Button>
                <Button
                  type="button"
                  size="lg"
                  onClick={handleComplete}
                  disabled={!canComplete}
                  className="h-14 flex-1 text-base font-medium"
                >
                  Завершить
                </Button>
              </>
            )}
          </div>
          </div>
        </Card>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить члена семьи?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Данные члена семьи будут удалены навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
