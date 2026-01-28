import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
// import logo from "@/assets/noroot (2).png";
const logo = "/logo.png"; // Новый логотип из public
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";
import "@/components/landing/Landing.css";

export const LandingHeader = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mainMenuItems = [
    { label: "Для кого", href: "/#problems" },
    { label: "Как работает", href: "/#solution" },
    { label: "Любой контент", href: "/#any-content" },
    { label: "Почему Waves", href: "/#why" },
    { label: "4 шага", href: "/#how-it-works" },
    { label: "Программы", href: "/#programs" },
    { label: "Отзывы", href: "/#testimonials" },
    { label: "Тарифы", href: "/#pricing" },
    { label: "FAQ", href: "/#faq" },
  ];

  return (
    <>
      {/* Burger Menu Button - Fixed on all screen sizes */}
      <div className="fixed top-4 right-4 z-[9999]">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="glass-elegant border-2">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Открыть меню</span>
            </Button>
          </SheetTrigger>
            <SheetContent 
              side="right" 
              className="glass-sidebar w-[300px] sm:w-[400px] p-0 flex flex-col overflow-hidden"
              hideOverlay={true}
              onInteractOutside={(e) => {
                e.preventDefault();
                setMobileMenuOpen(false);
              }}
              style={{
                background: 'linear-gradient(108deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.14) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.3)',
                zIndex: 9999,
                position: 'fixed',
                top: 0,
                bottom: 0,
                height: '100vh',
              } as React.CSSProperties}
            >
              {/* Main Navigation - Scrollable */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
              <nav className="flex flex-col space-y-1 p-4 pt-8">
                {mainMenuItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 -mx-2 text-sm font-medium text-foreground transition-all duration-200 hover:bg-white/10"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
              </div>

              {/* Fixed Bottom Section */}
              <div className="shrink-0 flex flex-col p-4 border-t border-white/10">
                {user ? (
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/cabinet");
                    }}
                  >
                    Кабинет
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="w-full mb-2"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate("/login");
                      }}
                    >
                      Войти
                    </Button>
                    <Button
                      className="w-full"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate("/service");
                      }}
                    >
                      Получить поддержку
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
    </>
  );
};

