import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getProfiles } from "@/lib/profileStorage";
import familyIllustration from "@/assets/friendly-vector-style-illustration-of-a-family-gro.png";

export default function FamilyIntro() {
  const navigate = useNavigate();
  const [parentProfileId, setParentProfileId] = useState<string | null>(null);

  useEffect(() => {
    async function loadParentProfile() {
      try {
        const profiles = await getProfiles();
        const parent = profiles.find(p => p.type === 'parent');
        if (parent) {
          setParentProfileId(parent.id);
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
            src={familyIllustration}
            alt="Семья"
            className="mx-auto h-64 w-64 object-contain"
          />
          
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-foreground">
              Давайте поговорим о вашей семье.
            </h1>
            
            <p className="text-lg text-muted-foreground">
              Семьи бывают разных форм и размеров. Если какие-то из этих вопросов к вам не относятся, пожалуйста, отметьте их как «не применимо».
            </p>
            
            <p className="text-sm text-muted-foreground">
              5 вопросов • 1 мин
            </p>
          </div>

          <Button
            size="lg"
            onClick={() => {
              if (parentProfileId) {
                navigate(`/family-questions/${parentProfileId}`);
              } else {
                navigate("/family-questions");
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
