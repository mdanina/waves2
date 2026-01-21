import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  CreditCard,
  Settings,
  MessageSquare,
  UserPlus,
  Headphones,
  Bell,
  ClipboardList,
} from 'lucide-react';

export const adminNavigation = [
  // Основные
  { name: 'Дэшборд', href: '/admin', icon: LayoutDashboard },
  { name: 'Назначения', href: '/admin/assignments', icon: UserPlus },
  { name: 'Заявки специалистов', href: '/admin/specialist-applications', icon: ClipboardList },
  { name: 'Поддержка', href: '/admin/support', icon: Headphones },
  { name: 'Сообщения', href: '/admin/messages', icon: MessageSquare },
  { name: 'Консультации', href: '/admin/appointments', icon: Calendar },
  { name: 'Блог', href: '/admin/blog', icon: FileText },
  // Управление
  { name: 'Пользователи', href: '/admin/users', icon: Users },
  { name: 'Оценки', href: '/admin/assessments', icon: FileText },
  { name: 'Платежи', href: '/admin/payments', icon: CreditCard },
  { name: 'Push-уведомления', href: '/admin/push', icon: Bell },
  { name: 'Контент', href: '/admin/content', icon: Settings },
];

interface AdminSidebarNavProps {
  onItemClick?: () => void;
}

export function AdminSidebarNav({ onItemClick }: AdminSidebarNavProps) {
  const location = useLocation();

  return (
    <nav className="p-4 space-y-1">
      {adminNavigation.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={onItemClick}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar() {
  return (
    <aside className="hidden md:block w-64 border-r border-border bg-background">
      <AdminSidebarNav />
    </aside>
  );
}








