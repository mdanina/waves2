import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
// import logo from "@/assets/noroot (2).png";
const logo = "/logo.png"; // Новый логотип из public
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import "@/components/landing/Landing.css";

type LandingHeaderVariant = "default" | "blog";

interface LandingHeaderProps {
  variant?: LandingHeaderVariant;
}

export const LandingHeader = ({ variant = "default" }: LandingHeaderProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const familiesMenu = [
    { label: "Дети 0-2", href: "/#families" },
    { label: "Дети 3-7", href: "/#families" },
    { label: "Дети 8-12", href: "/#families" },
    { label: "Подростки", href: "/#families" },
    { label: "Родители", href: "/#families" },
    { label: "Планирование, ожидание и послеродовой период", href: "/#families" },
  ];

  const howCareWorksMenu = [
    { label: "Как это работает", href: "/#how-it-works" },
    { label: "Наши услуги", href: "/#services" },
    { label: "Что мы лечим", href: "/#conditions" },
    { label: "Наши результаты", href: "/#results" },
    { label: "Почему Balansity", href: "/#why" },
    { label: "Наша экспертиза", href: "/#about" },
  ];

  const blogMenuItem = { label: "Блог", href: "/blog" };

  const isBlog = variant === "blog";

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full backdrop-blur",
          isBlog
            ? "border-b border-[#20212b] bg-[#111118]/95"
            : "border-b border-[rgba(0,0,0,0.06)] bg-[#fffef7]/95 supports-[backdrop-filter]:bg-[#fffef7]/60",
        )}
      >
        <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <img src={logo} alt="Balansity" className="h-6 sm:h-7 md:h-8 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    "text-sm font-medium",
                    isBlog &&
                      "rounded-full bg-[#171821] px-4 py-2 text-xs font-semibold tracking-[0.06em] text-white hover:bg-[#232533]",
                  )}
                >
                  Для семей
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[320px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {familiesMenu.map((item) => (
                      <li key={item.label}>
                        <NavigationMenuLink asChild>
                          <a
                            href={item.href}
                            className={cn(
                              "block select-none space-y-1 rounded-full px-4 py-2 leading-none no-underline outline-none transition-colors text-xs font-medium",
                              isBlog
                                ? "bg-[#171821] text-white hover:bg-[#232533]"
                                : "hover:bg-honey-pale hover:text-ink focus:bg-honey-pale focus:text-ink",
                            )}
                          >
                            <div className="text-sm font-medium leading-none">{item.label}</div>
                          </a>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    "text-sm font-medium",
                    isBlog &&
                      "rounded-full bg-[#171821] px-4 py-2 text-xs font-semibold tracking-[0.06em] text-white hover:bg-[#232533]",
                  )}
                >
                  Как работает
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[320px] gap-3 p-4 md:w-[500px]">
                    {howCareWorksMenu.map((item) => (
                      <li key={item.href}>
                        <NavigationMenuLink asChild>
                          <a
                            href={item.href}
                            className={cn(
                              "block select-none space-y-1 rounded-full px-4 py-2 leading-none no-underline outline-none transition-colors text-xs font-medium",
                              isBlog
                                ? "bg-[#171821] text-white hover:bg-[#232533]"
                                : "hover:bg-honey-pale hover:text-ink focus:bg-honey-pale focus:text-ink",
                            )}
                          >
                            <div className="text-sm font-medium leading-none">{item.label}</div>
                          </a>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <a
                  href="/#testimonials"
                  className={cn(
                    "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                    isBlog
                      ? "rounded-full bg-[#171821] text-white hover:bg-[#232533]"
                      : "hover:bg-honey-pale hover:text-ink focus:bg-honey-pale focus:text-ink",
                  )}
                >
                  Отзывы
                </a>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <a
                  href="/#faq"
                  className={cn(
                    "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                    isBlog
                      ? "rounded-full bg-[#171821] text-white hover:bg-[#232533]"
                      : "hover:bg-honey-pale hover:text-ink focus:bg-honey-pale focus:text-ink",
                  )}
                >
                  FAQ
                </a>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <a
                  href="/#about"
                  className={cn(
                    "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                    isBlog
                      ? "rounded-full bg-[#171821] text-white hover:bg-[#232533]"
                      : "hover:bg-honey-pale hover:text-ink focus:bg-honey-pale focus:text-ink",
                  )}
                >
                  О нас
                </a>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link
                  to={blogMenuItem.href}
                  className={cn(
                    "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                    isBlog
                      ? "rounded-full bg-[#f5ff7a] text-[#15161a] hover:bg-[#f0f46a]"
                      : "bg-background hover:bg-honey-pale hover:text-ink focus:bg-honey-pale focus:text-ink",
                  )}
                >
                  {blogMenuItem.label}
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <Button variant="ghost" onClick={() => navigate("/cabinet")}>
                Кабинет
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/login")}>
                  Войти
                </Button>
                <Button onClick={() => navigate("/service")}>
                  Получить поддержку
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Открыть меню</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col space-y-4 mt-8">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Для семей</p>
                  <div className="flex flex-col space-y-2 ml-4">
                    {familiesMenu.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-sm text-foreground transition-colors hover:text-primary"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Как работает</p>
                  <div className="flex flex-col space-y-2 ml-4">
                    {howCareWorksMenu.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-sm text-foreground transition-colors hover:text-primary"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>
                <a
                  href="/#testimonials"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-foreground transition-colors hover:text-primary"
                >
                  Отзывы
                </a>
                <a
                  href="/#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-foreground transition-colors hover:text-primary"
                >
                  FAQ
                </a>
                <a
                  href="/#about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-foreground transition-colors hover:text-primary"
                >
                  О нас
                </a>
                <a
                  href={blogMenuItem.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-foreground transition-colors hover:text-primary"
                >
                  {blogMenuItem.label}
                </a>
                <div className="pt-4 border-t">
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
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
    </>
  );
};

