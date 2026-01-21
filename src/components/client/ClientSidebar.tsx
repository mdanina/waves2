import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Home,
  Calendar,
  History,
  MessageSquare,
  Settings,
  Tag,
  HelpCircle,
  LogOut,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { getUnreadCount } from '@/lib/supabase-messages';
import { useEffect, useState } from 'react';

const mainNavigation = [
  {
    name: 'Главная',
    href: '/cabinet',
    icon: Home,
    end: true,
  },
  {
    name: 'Консультации',
    href: '/appointments',
    icon: Calendar,
  },
  {
    name: 'История чекапов',
    href: '/checkup-history',
    icon: History,
  },
  {
    name: 'Сообщения',
    href: '/cabinet/messages',
    icon: MessageSquare,
  },
  {
    name: 'Темы для обращения',
    href: '/worries',
    icon: Tag,
  },
  {
    name: 'Настройки',
    href: '/cabinet/settings',
    icon: Settings,
  },
];

const debugNavigation = [
  {
    name: 'Debug: Онбординг',
    href: '/welcome',
    icon: Sparkles,
  },
  {
    name: 'Debug: Члены семьи',
    href: '/family-members',
    icon: Users,
  },
  {
    name: 'Debug: Добавить профиль',
    href: '/add-family-member',
    icon: UserPlus,
  },
];

interface ClientSidebarNavProps {
  onItemClick?: () => void;
}

export function ClientSidebarNav({ onItemClick }: ClientSidebarNavProps) {
  const location = useLocation();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      getUnreadCount().then(setUnreadMessages).catch(() => {});
    }
  }, [user?.id]);

  return (
    <>
      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {mainNavigation.map((item) => {
          const isActive =
            item.end
              ? location.pathname === item.href
              : location.pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onItemClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#E0F0FF] text-[#007BFF]'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5',
                  isActive ? 'text-[#007BFF]' : 'text-muted-foreground'
                )}
              />
              <span className="flex-1">{item.name}</span>
              {item.name === 'Сообщения' && unreadMessages > 0 && (
                <Badge variant="default" className="ml-auto">
                  {unreadMessages}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* DEBUG Section */}
      {import.meta.env.DEV && (
        <>
          <Separator className="mx-4" />
          <div className="px-4 py-2">
            <p className="text-xs text-muted-foreground mb-2">DEBUG</p>
            <nav className="space-y-1">
              {debugNavigation.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={onItemClick}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </>
  );
}

export function ClientSidebar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getUserInitials = () => {
    if (!user?.email || typeof user.email !== 'string') return '?';
    const emailStr = user.email;
    const parts = emailStr.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return emailStr.substring(0, 2).toUpperCase();
  };

  const getUserName = () => {
    // Можно расширить, получая имя из профиля
    if (user?.email && typeof user.email === 'string') {
      const name = user.email.split('@')[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return 'Пользователь';
  };

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-background">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">W</span>
          </div>
          <span className="font-bold text-lg text-foreground">WAVES</span>
        </div>
      </div>

      {/* Navigation */}
      <ClientSidebarNav />

      {/* User Profile Section */}
      <div className="border-t border-border p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-[#E0F0FF] text-[#007BFF]">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {getUserName()}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {typeof user?.email === 'string' ? user.email : ''}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Выйти
        </Button>
      </div>
    </aside>
  );
}
