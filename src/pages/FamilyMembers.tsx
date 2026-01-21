import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { StepIndicator } from "@/components/StepIndicator";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { User, Plus, Pencil, Trash2 } from "lucide-react";
import familyIllustration from "@/assets/minimalistic-and-friendly-vector-style-illustratio — копия.png";
import parentFemaleAvatar from "@/assets/friendly-and-clean-face-of-an-adult-person--gender.png";
import parentMaleAvatar from "@/assets/friendly-and-clean-face-of-an-adult-person--gender (1).png";
import childFemaleAvatar from "@/assets/friendly-and-clean-face-of-a-white-girl-7-yo--soft.png";
import childMaleAvatar from "@/assets/friendly-and-clean-face-of-a-white-boy-7-yo--soft- (1).png";
import { getProfiles, deleteProfile, calculateAge } from "@/lib/profileStorage";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/lib/supabase";
type Profile = Database['public']['Tables']['profiles']['Row'];
import { toast } from "sonner";
import { logger } from "@/lib/logger";
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
  const getAvatarImage = useCallback((member: Profile) => {
    if (member.type === 'parent') {
      return member.gender === 'male' ? parentMaleAvatar : parentFemaleAvatar;
    } else if (member.type === 'child') {
      return member.gender === 'male' ? childMaleAvatar : childFemaleAvatar;
    }
    // Fallback на женский аватар для других типов
    return parentFemaleAvatar;
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <StepIndicator currentStep={3} totalSteps={3} label="ПРОФИЛЬ СЕМЬИ" />
        
        <div className="space-y-8">
          <div className="text-center">
            <img
              src={familyIllustration}
              alt="Семья"
              className="mx-auto mb-6 h-32 w-32 object-contain"
            />
            <h1 className="mb-4 text-4xl font-bold text-foreground">
              Члены семьи
            </h1>
            <p className="text-muted-foreground">
              Добавьте столько членов семьи, сколько хотите! Вы сможете добавлять и управлять
              членами семьи в вашем кабинете.
            </p>
          </div>

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
                    <img 
                      src={getAvatarImage(member)}
                      alt={`${member.first_name} ${member.last_name || ''}`}
                      className="h-14 w-14 rounded-full object-cover"
                    />
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
                        onClick={() => navigate(`/edit-family-member/${member.id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setDeleteId(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}

            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/add-family-member")}
              className="h-14 w-full text-base font-medium"
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
                  onClick={() => navigate("/cabinet")}
                  className="h-14 flex-1 text-base font-medium"
                >
                  Завершить
                </Button>
              </>
            )}
          </div>
        </div>
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
