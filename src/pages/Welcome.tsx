import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { StepIndicator } from "@/components/StepIndicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Welcome() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName && lastName) {
      navigate("/region");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <StepIndicator currentStep={1} totalSteps={3} label="ДОБРО ПОЖАЛОВАТЬ" />
        
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold text-foreground">
              Добро пожаловать в Balansity!
            </h1>
            <p className="text-lg text-muted-foreground">
              Сделайте первый шаг к здоровой семье.
            </p>
          </div>

          <form onSubmit={handleContinue} className="space-y-6">
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
                className="h-14 text-base"
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
                className="h-14 text-base"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="h-14 w-full text-base font-medium"
            >
              Продолжить
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
