import { Outlet, Link, useLocation } from 'react-router-dom';
import { ClientSidebar, ClientSidebarNav } from './ClientSidebar';
import { useState } from 'react';
import { Menu, LogOut, Sparkles, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useProfiles } from '@/hooks/useProfiles';
import { ProfileAvatar } from '@/components/avatars/ProfileAvatar';
import { cn } from '@/lib/utils';
import bgImage from '@/assets/bg.png';
import momAvatar from '@/assets/mom.png';

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

export function ClientLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: profiles } = useProfiles();
  
  const parentProfile = profiles?.find(p => p.type === 'parent');

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setMobileMenuOpen(false);
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
    if (user?.email && typeof user.email === 'string') {
      const name = user.email.split('@')[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return 'Пользователь';
  };

  const logo = "/logo.png";

  return (
    <div
      className="relative"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Main Content */}
      <main
        className="md:ml-64 min-h-screen"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <Outlet />
      </main>

      {/* Desktop Sidebar */}
      <ClientSidebar />

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent 
          side="left" 
          className="glass-sidebar w-64 p-0 flex flex-col overflow-hidden"
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
            borderRight: '1px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          {/* Logo */}
          <div className="px-6 pt-10 pb-6 shrink-0">
            <Link 
              to="/cabinet" 
              className="flex items-center justify-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              <img src={logo} alt="Waves" className="h-12 w-auto" />
            </Link>
          </div>

          {/* Main Navigation - Scrollable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
            <ClientSidebarNav onItemClick={() => setMobileMenuOpen(false)} />
          </div>

          {/* Fixed Bottom Section */}
          <div className="shrink-0 flex flex-col">
            {/* User Profile Section */}
            <div className="p-4 space-y-4">
              <Link
                to="/cabinet/settings"
                onClick={() => setMobileMenuOpen(false)}
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
                <LogOut className="h-4 w-4 mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
