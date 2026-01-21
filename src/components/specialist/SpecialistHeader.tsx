import { useState, useEffect } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useSpecialistAuth } from '@/contexts/SpecialistAuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LogOut,
  User,
  Settings,
  Bell,
  Calendar,
  UserPlus,
  MessageSquare,
  X,
  CheckCheck,
  Menu,
  LayoutDashboard,
  Users,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  subscribeToNotifications,
  formatNotificationTime,
  type SpecialistNotification,
} from '@/lib/supabase-notifications';

// Навигация для мобильного меню
const mobileNavItems = [
  { name: 'Обзор', href: '/specialist', icon: LayoutDashboard },
  { name: 'Клиенты', href: '/specialist/clients', icon: Users },
  { name: 'Календарь', href: '/specialist/calendar', icon: Calendar },
  { name: 'Сессии', href: '/specialist/sessions', icon: Video },
  { name: 'Сообщения', href: '/specialist/messages', icon: MessageSquare },
];

export function SpecialistHeader() {
  const { specialistUser, signOut } = useSpecialistAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState<SpecialistNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const specialistId = specialistUser?.specialist?.id;

  // Загрузка уведомлений
  useEffect(() => {
    if (!specialistId) return;

    const loadNotifications = async () => {
      try {
        setIsLoading(true);
        const [notifs, count] = await Promise.all([
          getNotifications(10),
          getUnreadCount(),
        ]);
        setNotifications(notifs);
        setUnreadCount(count);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();

    // Подписка на новые уведомления
    const unsubscribe = subscribeToNotifications(specialistId, (newNotification) => {
      setNotifications((prev) => [newNotification, ...prev.slice(0, 9)]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => unsubscribe();
  }, [specialistId]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/specialist/login');
  };

  const handleNotificationClick = async (notification: SpecialistNotification) => {
    // Помечаем как прочитанное
    if (!notification.is_read) {
      await markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    // Навигация в зависимости от типа
    switch (notification.type) {
      case 'new_appointment':
      case 'cancelled_appointment':
      case 'appointment_reminder':
        navigate('/specialist/calendar');
        break;
      case 'new_client':
        if (notification.client_user_id) {
          navigate(`/specialist/clients/${notification.client_user_id}`);
        } else {
          navigate('/specialist/clients');
        }
        break;
      case 'new_message':
        navigate('/specialist/messages');
        break;
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: SpecialistNotification['type']) => {
    switch (type) {
      case 'new_appointment':
        return <Calendar className="h-4 w-4 text-green-600" />;
      case 'cancelled_appointment':
        return <X className="h-4 w-4 text-red-600" />;
      case 'new_client':
        return <UserPlus className="h-4 w-4 text-blue-600" />;
      case 'appointment_reminder':
        return <Bell className="h-4 w-4 text-orange-600" />;
      case 'new_message':
        return <MessageSquare className="h-4 w-4 text-purple-600" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const displayName = specialistUser?.specialist?.display_name || specialistUser?.email || 'Специалист';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Проверка активной страницы для навигации
  const isNavActive = (href: string) => {
    if (href === '/specialist') {
      return location.pathname === '/specialist';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Мобильное меню */}
        <div className="flex items-center gap-2 md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Открыть меню</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b px-4 py-4">
                <SheetTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                    <span className="text-white font-bold text-sm">B</span>
                  </div>
                  <span>Waves</span>
                </SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-5rem)]">
                <nav className="flex flex-col gap-1 p-4">
                  {mobileNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isNavActive(item.href);
                    return (
                      <NavLink
                        key={item.href}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {item.name}
                      </NavLink>
                    );
                  })}
                </nav>
                <div className="border-t p-4">
                  <NavLink
                    to="/specialist/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isNavActive('/specialist/profile')
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <User className="h-5 w-5" />
                    Профиль
                  </NavLink>
                  <NavLink
                    to="/specialist/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isNavActive('/specialist/settings')
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Settings className="h-5 w-5" />
                    Настройки
                  </NavLink>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5" />
                    Выйти
                  </button>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

        {/* Лого */}
        <div className="flex items-center gap-4">
          <a href="/specialist" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-semibold text-lg hidden sm:inline">Waves</span>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full hidden sm:inline">
              Специалист
            </span>
          </a>
        </div>

        {/* Правая часть */}
        <div className="flex items-center gap-4">
          {/* Уведомления */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-2 py-1.5">
                <DropdownMenuLabel className="p-0">Уведомления</DropdownMenuLabel>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.preventDefault();
                      handleMarkAllRead();
                    }}
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Прочитать все
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />

              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  <div className="animate-pulse">Загрузка...</div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Нет уведомлений</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  {notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`flex items-start gap-3 p-3 cursor-pointer ${
                        !notification.is_read ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.is_read ? 'font-medium' : ''}`}>
                          {notification.title}
                        </p>
                        {notification.message && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatNotificationTime(notification.created_at)}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                      )}
                    </DropdownMenuItem>
                  ))}
                </ScrollArea>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Профиль */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={specialistUser?.specialist?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline-block text-sm font-medium">
                  {displayName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate('/specialist/profile')}>
                <User className="mr-2 h-4 w-4" />
                Профиль
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate('/specialist/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Настройки
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleSignOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
