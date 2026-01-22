import { Outlet } from 'react-router-dom';
import { ClientSidebar, ClientSidebarNav } from './ClientSidebar';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { LogOut } from 'lucide-react';
import bgImage from '@/assets/bg.png';

export function ClientLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
      <main className="md:ml-64 min-h-screen bg-transparent">
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
          className="w-[280px] max-w-[85vw] p-0 flex flex-col overflow-hidden"
          style={{ width: '280px', maxWidth: '85vw' }}
        >
          <SheetHeader className="p-4 border-b shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center shrink-0">
                <span className="text-primary-foreground font-bold text-sm">W</span>
              </div>
              <SheetTitle className="text-base truncate">WAVES</SheetTitle>
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
            <ClientSidebarNav onItemClick={() => setMobileMenuOpen(false)} />
          </div>
          <div className="border-t border-border p-4 space-y-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="bg-[#E0F0FF] text-[#007BFF]">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 overflow-hidden">
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
              <LogOut className="h-4 w-4 mr-2 shrink-0" />
              <span className="truncate">Выйти</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
