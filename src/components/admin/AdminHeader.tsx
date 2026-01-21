import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Menu } from 'lucide-react';

interface AdminHeaderProps {
  onMenuClick?: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { adminUser, signOut } = useAdminAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Открыть меню</span>
            </Button>

            <h1 className="text-lg md:text-xl font-bold">Админ-панель</h1>
            {adminUser && (
              <span className="hidden sm:inline text-sm text-muted-foreground">
                {adminUser.email} ({adminUser.role})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Выйти</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}












