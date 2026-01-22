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
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden">
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
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 min-w-0',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              style={isActive ? {
                background: 'rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 178, 153, 0.5)',
                boxShadow: '0 0 0 3px rgba(255, 178, 153, 0.25), 0 2px 12px rgba(255, 178, 153, 0.2)',
              } : undefined}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.backdropFilter = 'blur(8px)';
                  e.currentTarget.style.webkitBackdropFilter = 'blur(8px)';
                  e.currentTarget.style.border = '1px solid rgba(255, 178, 153, 0.4)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 178, 153, 0.15), 0 2px 8px rgba(255, 178, 153, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '';
                  e.currentTarget.style.backdropFilter = '';
                  e.currentTarget.style.webkitBackdropFilter = '';
                  e.currentTarget.style.border = '';
                  e.currentTarget.style.boxShadow = '';
                }
              }}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 shrink-0',
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                )}
              />
              <span className="flex-1 truncate min-w-0">{item.name}</span>
              {item.name === 'Сообщения' && unreadMessages > 0 && (
                <Badge variant="default" className="ml-auto shrink-0">
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
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 min-w-0',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                        e.currentTarget.style.backdropFilter = 'blur(8px)';
                        e.currentTarget.style.webkitBackdropFilter = 'blur(8px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = '';
                        e.currentTarget.style.backdropFilter = '';
                        e.currentTarget.style.webkitBackdropFilter = '';
                      }
                    }}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate min-w-0">{item.name}</span>
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

  const logo = "/logo.png"; // Логотип из public

  return (
    <aside 
      className="glass-sidebar hidden md:flex flex-col w-64"
    >
      {/* Logo */}
      <div className="p-6">
        <Link to="/cabinet" className="flex items-center justify-center">
          <img src={logo} alt="Waves" className="h-12 w-auto" />
        </Link>
      </div>

      {/* Navigation */}
      <ClientSidebarNav />

      {/* User Profile Section */}
      <div className="p-4 space-y-4">
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
