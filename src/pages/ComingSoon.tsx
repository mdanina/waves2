import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ComingSoon() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName && lastName && email) {
      toast.success("Вы успешно добавлены в список ожидания!");
      navigate("/success");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="space-y-8 text-center">
          <div>
            <h1 className="mb-4 text-4xl font-bold text-foreground">
              Скоро появится в вашем регионе
            </h1>
            <p className="text-lg text-muted-foreground">
              Присоединяйтесь к нашему списку ожидания для получения обновлений и бесплатных ресурсов.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-left">
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

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-14 text-base"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="h-14 w-full text-base font-medium"
            >
              Присоединиться к списку ожидания
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Нажимая "Присоединиться к списку ожидания", вы соглашаетесь получать маркетинговые и/или
              транзакционные письма от Balansity. Ознакомьтесь с нашими{" "}
              <a href="#" className="underline">
                Условиями использования
              </a>{" "}
              и{" "}
              <a href="#" className="underline">
                Политикой конфиденциальности
              </a>
              .
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
