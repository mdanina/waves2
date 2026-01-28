import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Uicon } from '@/components/icons/Uicon';
import {
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles } from '@/hooks/useProfiles';
import { ProfileAvatar } from '@/components/avatars/ProfileAvatar';
import { Button } from '@/components/ui/button';
import momAvatar from '@/assets/mom.png';
// import { Badge } from '@/components/ui/badge'; // Temporarily disabled
// import { getUnreadCount } from '@/lib/supabase-messages'; // Temporarily disabled

const mainNavigation = [
  {
    name: 'Главная',
    href: '/cabinet',
    iconName: 'home',
    end: true,
  },
  {
    name: 'Мои лицензии',
    href: '/cabinet/licenses',
    iconName: 'credit-card',
  },
  {
    name: 'Мое нейроустройство',
    href: '/cabinet/device',
    iconName: 'smartphone',
  },
  {
    name: 'Цели тренировок',
    href: '/cabinet/goals',
    iconName: 'target',
  },
  {
    name: 'Прогресс',
    href: '/checkup-history',
    iconName: 'trending-up',
  },
  {
    name: 'Написать в поддержку',
    href: 'https://t.me/waves_support_bot',
    iconName: 'help-circle',
    external: true,
  },
];

const debugNavigation = [
  {
    name: 'Debug: Профиль родителя',
    href: '/profile',
    icon: Sparkles,
  },
  {
    name: 'Debug: Настройка семьи',
    href: '/family-setup',
    icon: Users,
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

  return (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden sidebar-scrollbar">
      {mainNavigation.map((item) => {
        const isActive = item.external
          ? false
          : item.end
            ? location.pathname === item.href
            : location.pathname.startsWith(item.href);
        
        const linkContent = (
          <>
            {'iconName' in item ? (
              <Uicon name={item.iconName} style="rr" className="h-4 w-4 shrink-0" />
            ) : (
              <item.icon className="h-4 w-4 shrink-0" />
            )}
            <span className="flex-1 truncate min-w-0">{item.name}</span>
          </>
        );

        const linkClassName = cn(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-sans font-medium transition-all duration-200 min-w-0',
          isActive
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        );

        const linkStyle = isActive ? {
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        } : undefined;

        const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
          if (!isActive) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.backdropFilter = 'blur(8px)';
            e.currentTarget.style.webkitBackdropFilter = 'blur(8px)';
          }
        };

        const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
          if (!isActive) {
            e.currentTarget.style.background = '';
            e.currentTarget.style.backdropFilter = '';
            e.currentTarget.style.webkitBackdropFilter = '';
          }
        };

        if (item.external) {
          return (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClassName}
              style={{ ...linkStyle, cursor: 'pointer' }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(item.href, '_blank', 'noopener,noreferrer');
              }}
            >
              {linkContent}
            </a>
          );
        }
        
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={onItemClick}
            className={linkClassName}
            style={linkStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {linkContent}
          </Link>
        );
      })}
    </nav>
  );
}

export function ClientSidebar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profiles } = useProfiles();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Получаем профиль родителя для аватара
  const parentProfile = profiles?.find(p => p.type === 'parent');

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
    // Используем имя из профиля, если есть
    if (parentProfile?.first_name) {
      return parentProfile.first_name;
    }
    // Fallback на email
    if (user?.email && typeof user.email === 'string') {
      const name = user.email.split('@')[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return 'Пользователь';
  };

  const logo = "/logo.png"; // Логотип из public

  const location = useLocation();

  return (
    <aside
      className="glass-sidebar hidden md:flex flex-col w-64 fixed left-0 top-0 h-screen"
    >
      {/* Logo */}
      <div className="px-6 pt-10 pb-6 shrink-0">
        <Link to="/cabinet" className="flex items-center justify-center">
          <img src={logo} alt="Waves" className="h-12 w-auto" />
        </Link>
      </div>

      {/* Main Navigation - Scrollable */}
      <ClientSidebarNav />

      {/* Fixed Bottom Section */}
      <div className="shrink-0 flex flex-col">

        {/* User Profile Section */}
        <div className="p-4 space-y-4">
          <Link
            to="/cabinet/settings"
            className="flex items-center gap-3 rounded-lg p-2 -m-2 transition-all duration-200 hover:bg-white/10 cursor-pointer"
          >
            {parentProfile ? (
              <ProfileAvatar
                type="parent"
                gender={(parentProfile.gender || 'female') as 'male' | 'female'}
                size="sm"
              />
            ) : (
              <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center">
                <img 
                  src={momAvatar} 
                  alt="Мама" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {getUserName()}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {typeof user?.email === 'string' ? user.email : ''}
              </p>
            </div>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={handleSignOut}
          >
            <Uicon name="log-out" style="rr" className="h-4 w-4 mr-2" />
            Выйти
          </Button>
        </div>
      </div>
    </aside>
  );
}
