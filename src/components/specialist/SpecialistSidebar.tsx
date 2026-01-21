import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  Settings,
  Video,
} from 'lucide-react';

const navigation = [
  {
    name: 'Обзор',
    href: '/specialist',
    icon: LayoutDashboard,
    end: true,
  },
  {
    name: 'Мои клиенты',
    href: '/specialist/clients',
    icon: Users,
  },
  {
    name: 'Календарь',
    href: '/specialist/calendar',
    icon: Calendar,
  },
  {
    name: 'Сессии',
    href: '/specialist/sessions',
    icon: Video,
  },
  {
    name: 'Сообщения',
    href: '/specialist/messages',
    icon: MessageSquare,
    badge: 0, // Количество непрочитанных
  },
];

const bottomNavigation = [
  {
    name: 'Настройки',
    href: '/specialist/settings',
    icon: Settings,
  },
];

export function SpecialistSidebar() {
  const location = useLocation();

  const isActive = (href: string, end?: boolean) => {
    if (end) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-white">
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.end}
            className={({ isActive: active }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active || isActive(item.href, item.end)
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1">{item.name}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}

      </nav>

      {/* Нижняя навигация */}
      <div className="border-t px-3 py-4">
        {bottomNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive: active }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
