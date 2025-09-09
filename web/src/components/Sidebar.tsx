'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '../generated/prisma';
import { useAuth } from '../hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';
import { 
  BuildingIcon,
  TargetIcon,
  DocumentIcon,
  UserIcon,
  PlusIcon,
  BrainIcon,
  BarChartIcon,
  LogoutIcon,
  ChevronLeftIcon
} from '@/components/Icons';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const { user, loading, isHR, logout } = useAuth();
  const pathname = usePathname();

  if (loading || !user) {
    return null;
  }

  // Навигация для APPLICANT
  const applicantLinks = [
    {
      href: '/dashboard',
      label: 'Дашборд',
      icon: TargetIcon,
    },
    {
      href: '/jobs',
      label: 'Вакансии',
      icon: BuildingIcon,
    },
    {
      href: '/my-applications',
      label: 'Мои заявки',
      icon: DocumentIcon,
    },
    {
      href: '/profile/resume',
      label: 'Резюме',
      icon: UserIcon,
    },
  ];

  // Навигация для HR/ADMIN
  const hrLinks = [
    {
      href: '/dashboard',
      label: 'Дашборд',
      icon: TargetIcon,
    },
    {
      href: '/hr/jobs',
      label: 'Управление вакансиями',
      icon: BuildingIcon,
    },
    {
      href: '/hr/jobs/create',
      label: 'Создать вакансию',
      icon: PlusIcon,
    },
  ];

  // Дополнительные ссылки только для ADMIN
  const adminLinks = [
    {
      href: '/admin/assessment-frameworks',
      label: 'Фреймворки оценки',
      icon: BarChartIcon,
    },
    {
      href: '/admin/prompt-simulations',
      label: 'Симуляция промптов',
      icon: BrainIcon,
    },
  ];

  const getNavigationLinks = () => {
    // Используем типизированные проверки ролей
    if (isHR()) {
      // Если пользователь ADMIN, добавляем административные ссылки
      if (user.role === 'ADMIN') {
        return [...hrLinks, ...adminLinks];
      }
      return hrLinks;
    }
    return applicantLinks;
  };

  const navigationLinks = getNavigationLinks();

  return (
    <div className={`fixed left-0 top-0 h-full bg-vtb-surface border-r border-border z-40 transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-gradient-to-br from-vtb-primary to-vtb-secondary rounded-lg flex items-center justify-center">
              <BuildingIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-vtb-text">HR-Аватар ВТБ</h2>
              <p className="text-xs text-vtb-text-secondary">MORE.Tech</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className={`p-2 rounded-lg hover:bg-muted transition-colors ${
            collapsed ? 'mx-auto' : ''
          }`}
        >
          <ChevronLeftIcon className={`w-4 h-4 text-vtb-text-secondary transition-transform ${
            collapsed ? 'rotate-180' : ''
          }`} />
        </button>
      </div>

      {/* User Info */}
      {!collapsed && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-vtb-secondary to-vtb-accent rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-vtb-text truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-vtb-text-secondary capitalize">
                {user.role.toLowerCase()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navigationLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors group ${
                    isActive
                      ? 'bg-vtb-primary text-white'
                      : 'hover:bg-muted text-vtb-text-secondary hover:text-vtb-text'
                  } ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? link.label : undefined}
                >
                  <Icon className={`w-5 h-5 ${collapsed ? '' : 'mr-3'} ${
                    isActive ? 'text-white' : 'text-vtb-text-secondary group-hover:text-vtb-text'
                  }`} />
                  {!collapsed && (
                    <span className="font-medium">{link.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Theme Toggle & Logout */}
      <div className="p-4 border-t border-border space-y-2">
        {/* Theme Toggle */}
        <div className={`${collapsed ? 'flex justify-center' : ''}`}>
          {collapsed ? (
            <div className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ThemeToggle />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-vtb-text">Тема</span>
              <ThemeToggle />
            </div>
          )}
        </div>
        
        {/* Logout */}
        <button
          onClick={logout}
          className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors text-vtb-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 group ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Выйти' : undefined}
        >
          <LogoutIcon className={`w-5 h-5 ${collapsed ? '' : 'mr-3'}`} />
          {!collapsed && <span className="font-medium">Выйти</span>}
        </button>
      </div>
    </div>
  );
}