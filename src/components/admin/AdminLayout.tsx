import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { AdminHeader } from './AdminHeader';
import { AdminSidebar, AdminSidebarNav } from './AdminSidebar';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader
        onMenuClick={() => setMobileMenuOpen(true)}
      />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Меню</SheetTitle>
          </SheetHeader>
          <AdminSidebarNav onItemClick={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}












