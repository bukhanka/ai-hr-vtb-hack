'use client';

import Link from 'next/link';
import { BuildingIcon, ClockIcon, UserIcon } from './Icons';

interface JobCardProps {
  job: {
    id: string;
    title: string;
    description: string;
    skills: string[];
    salary?: string | null;
    experience?: string | null;
    status: string;
    createdAt: string;
    creatorName?: string;
    applicationsCount?: number;
  };
  showStatus?: boolean;
  showApplicationsCount?: boolean;
  variant?: 'default' | 'hr';
}

export function JobCard({ 
  job, 
  showStatus = false, 
  showApplicationsCount = false,
  variant = 'default'
}: JobCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-red-100 text-red-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Активна';
      case 'CLOSED':
        return 'Закрыта';
      case 'DRAFT':
        return 'Черновик';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const truncateDescription = (text: string, maxLength: number = 120) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const href = variant === 'hr' ? `/hr/jobs/${job.id}/applications` : `/jobs/${job.id}`;

  return (
    <Link href={href} className="block group">
      <div className="bg-vtb-surface border border-border rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:border-vtb-primary/30 group-hover:scale-[1.02]">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-vtb-text group-hover:text-vtb-primary transition-colors mb-2">
              {job.title}
            </h3>
            {showStatus && (
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                {getStatusLabel(job.status)}
              </span>
            )}
          </div>
          <div className="h-12 w-12 bg-gradient-to-br from-vtb-primary to-vtb-secondary rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
            <BuildingIcon className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Description */}
        <p className="text-vtb-text-secondary mb-4 leading-relaxed">
          {truncateDescription(job.description)}
        </p>

        {/* Skills */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {job.skills.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-vtb-accent/10 text-vtb-accent text-sm rounded-lg font-medium"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="px-3 py-1 bg-vtb-text-secondary/10 text-vtb-text-secondary text-sm rounded-lg">
                +{job.skills.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Job Details */}
        <div className="flex flex-wrap gap-4 text-sm text-vtb-text-secondary mb-4">
          {job.salary && (
            <div className="flex items-center gap-1">
              <span className="font-medium">💰</span>
              {job.salary}
            </div>
          )}
          {job.experience && (
            <div className="flex items-center gap-1">
              <ClockIcon className="w-4 h-4" />
              {job.experience}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-vtb-text-secondary">
            <ClockIcon className="w-4 h-4" />
            {formatDate(job.createdAt)}
            {job.creatorName && variant === 'default' && (
              <>
                <span>•</span>
                <span>{job.creatorName}</span>
              </>
            )}
          </div>
          
          {showApplicationsCount && (
            <div className="flex items-center gap-1 text-sm text-vtb-text-secondary">
              <UserIcon className="w-4 h-4" />
              <span>{job.applicationsCount || 0} откликов</span>
            </div>
          )}
        </div>

        {/* Action hint */}
        <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-vtb-primary font-medium">
              {variant === 'hr' ? 'Посмотреть заявки' : 'Подробнее'}
            </span>
            <svg className="w-5 h-5 text-vtb-primary transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}