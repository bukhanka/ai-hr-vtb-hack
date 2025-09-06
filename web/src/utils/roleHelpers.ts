import { UserRole } from '../generated/prisma';
import { SparklesIcon, TargetIcon, UserIcon } from '../components/Icons';

export const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case UserRole.ADMIN:
      return 'Администратор';
    case UserRole.HR:
      return 'HR-специалист';
    case UserRole.APPLICANT:
      return 'Соискатель';
    default:
      return role;
  }
};

export const getRoleColor = (role: UserRole): string => {
  switch (role) {
    case UserRole.ADMIN:
      return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
    case UserRole.HR:
      return 'bg-gradient-to-r from-vtb-primary to-vtb-secondary text-white';
    case UserRole.APPLICANT:
      return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
    default:
      return 'bg-vtb-surface text-vtb-text border border-border';
  }
};

export const getRoleIcon = (role: UserRole) => {
  switch (role) {
    case UserRole.ADMIN:
      return SparklesIcon;
    case UserRole.HR:
      return TargetIcon;
    case UserRole.APPLICANT:
      return UserIcon;
    default:
      return UserIcon;
  }
};

export const getRoleNavigationItems = (role: UserRole) => {
  const baseItems = [
    {
      href: '/dashboard',
      label: 'Дашборд',
      icon: TargetIcon,
    }
  ];

  switch (role) {
    case UserRole.ADMIN:
    case UserRole.HR:
      return [
        ...baseItems,
        {
          href: '/hr/jobs',
          label: 'Управление вакансиями',
          icon: SparklesIcon,
        },
        {
          href: '/hr/jobs/create',
          label: 'Создать вакансию',
          icon: UserIcon,
        },
      ];
    
    case UserRole.APPLICANT:
    default:
      return [
        ...baseItems,
        {
          href: '/jobs',
          label: 'Вакансии',
          icon: SparklesIcon,
        },
        {
          href: '/my-applications',
          label: 'Мои заявки',
          icon: UserIcon,
        },
        {
          href: '/profile/resume',
          label: 'Резюме',
          icon: UserIcon,
        },
      ];
  }
};