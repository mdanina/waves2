import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getProfiles } from "@/lib/profileStorage";
import type { Database } from "@/lib/supabase";
import parentFemaleAvatar from "@/assets/friendly-and-clean-face-of-an-adult-person--gender.png";
import parentMaleAvatar from "@/assets/friendly-and-clean-face-of-an-adult-person--gender (1).png";

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function ParentIntro() {
  const navigate = useNavigate();
  const [parentProfileId, setParentProfileId] = useState<string | null>(null);
  const [parentProfile, setParentProfile] = useState<Profile | null>(null);

  // Функция для выбора аватара на основе пола родителя
  const getAvatarImage = useCallback((profile: Profile | null) => {
    if (!profile) {
      return parentFemaleAvatar; // Fallback
    }
    return profile.gender === 'male' ? parentMaleAvatar : parentFemaleAvatar;
  }, []);

  useEffect(() => {
    async function loadParentProfile() {
      try {
        const profiles = await getProfiles();
        const parent = profiles.find(p => p.type === 'parent');
        if (parent) {
          setParentProfileId(parent.id);
          setParentProfile(parent);
        }
      } catch (error) {
        console.error('Error loading parent profile:', error);
      }
    }
    loadParentProfile();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="border-b border-border bg-muted/30 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Progress value={5} className="flex-1" />
            <span className="text-sm font-medium text-muted-foreground">1 / 6</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-20">
        <div className="space-y-12">
          <img
            src={getAvatarImage(parentProfile)}
            alt={parentProfile ? parentProfile.first_name : "Родитель"}
            className="mx-auto h-64 w-64 rounded-full object-cover"
          />
          
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-foreground">
              Теперь мы сосредоточимся на <span className="font-bold">вас.</span>
            </h1>
            
            <p className="text-lg text-muted-foreground">
              Понимание вашего ментального здоровья необходимо для поддержки ментального здоровья и благополучия всей вашей семьи.
            </p>
            
            <p className="text-sm text-muted-foreground">
              6 вопросов • 2 мин
            </p>
          </div>

          <Button
            size="lg"
            onClick={() => {
              if (parentProfileId) {
                navigate(`/parent-questions/${parentProfileId}`);
              } else {
                navigate("/parent-questions");
              }
            }}
            className="h-14 w-full text-base font-medium"
          >
            Далее
          </Button>
        </div>
      </div>
    </div>
  );
}
