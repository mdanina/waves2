import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCurrentProfile } from "@/contexts/ProfileContext";
import { getProfile } from "@/lib/profileStorage";
import type { Database } from "@/lib/supabase";
import illustrationImage from "@/assets/friendly-and-clean-vector-style-illustration-of-a- (1).png";

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function CheckupInterlude() {
  const navigate = useNavigate();
  const params = useParams<{ profileId?: string }>();
  const { currentProfileId } = useCurrentProfile();
  const profileId = params.profileId || currentProfileId;
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (profileId) {
        try {
          const loadedProfile = await getProfile(profileId);
          setProfile(loadedProfile);
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      }
    }
    loadProfile();
  }, [profileId]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="border-b border-border bg-muted/30 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Progress value={71} className="flex-1" />
            <span className="text-sm font-medium text-muted-foreground">22 / 31</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-20">
        <div className="space-y-12">
          <img
            src={illustrationImage}
            alt="Иллюстрация"
            className="mx-auto h-80 w-80 object-contain"
          />
          
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-foreground">
              Далее мы спросим, как эти эмоции и поведение <span className="font-bold">влияют на ребенка</span> и вашу семью.
            </h1>
            
            <p className="text-lg text-muted-foreground">
              {profile ? (
                <>Трудности {profile.first_name} могут повлиять на его развитие и функционирование, а также на качество жизни вашей семьи. Именно тогда важно получить помощь и поддержку.</>
              ) : (
                <>Трудности вашего ребенка могут повлиять на его развитие и функционирование, а также на качество жизни вашей семьи. Именно тогда важно получить помощь и поддержку.</>
              )}
            </p>
            
            <p className="text-sm text-muted-foreground">
              31 вопрос • 3 мин
            </p>
          </div>

          <Button
            size="lg"
            onClick={() => {
              if (profileId) {
                navigate(`/checkup-questions/${profileId}?start=22`);
              } else {
                navigate("/checkup-questions?start=22");
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
