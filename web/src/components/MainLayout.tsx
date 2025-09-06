'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

// Страницы, на которых не нужен сайдбар
const NO_SIDEBAR_PAGES = [
  '/',
  '/login',
  '/register',
];

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Проверяем, нужен ли сайдбар на текущей странице
  const shouldShowSidebar = !NO_SIDEBAR_PAGES.includes(pathname);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if (!shouldShowSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={handleSidebarToggle}
      />
      <main className={`flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <div className="h-full overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}