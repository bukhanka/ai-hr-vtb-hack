'use client';

import React from 'react';
import { ParsedResumeData, WorkExperience, Project, Certification, Education } from '../lib/ai-resume-parser';
import { DocumentIcon, UserIcon, BriefcaseIcon, AcademicCapIcon, CodeIcon, TrophyIcon, GlobeIcon, CheckIcon } from './Icons';

interface EnhancedResumeViewProps {
  resume: {
    id: string;
    fileName: string;
    parsedData?: ParsedResumeData;
    aiSummary?: string;
    matchScore?: number;
    processingStatus: string;
    analyzedAt?: string;
  };
}

export function EnhancedResumeView({ resume }: EnhancedResumeViewProps) {
  const parsedData = resume.parsedData;

  // Если нет AI данных, показываем статус обработки
  if (!parsedData || resume.processingStatus !== 'COMPLETED') {
    return <ProcessingStatus resume={resume} />;
  }

  return (
    <div className="space-y-8">
      {/* AI Summary */}
      {resume.aiSummary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">AI Резюме профиля</h3>
              <p className="text-blue-800 dark:text-blue-200 leading-relaxed">{resume.aiSummary}</p>
              {resume.matchScore && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-blue-700 dark:text-blue-300">Полнота профиля:</span>
                  <div className="flex-1 bg-blue-200 dark:bg-blue-700 rounded-full h-2 max-w-32">
                    <div 
                      className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${resume.matchScore}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">{resume.matchScore}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Personal Info */}
      {parsedData.personalInfo && Object.values(parsedData.personalInfo).some(v => v) && (
        <PersonalInfoSection personalInfo={parsedData.personalInfo} />
      )}

      {/* Skills */}
      {parsedData.skills && (
        <SkillsSection skills={parsedData.skills} />
      )}

      {/* Work Experience */}
      {parsedData.workExperience?.length > 0 && (
        <WorkExperienceSection workExperience={parsedData.workExperience} />
      )}

      {/* Education */}
      {parsedData.education?.length > 0 && (
        <EducationSection education={parsedData.education} />
      )}

      {/* Projects */}
      {parsedData.projects?.length > 0 && (
        <ProjectsSection projects={parsedData.projects} />
      )}

      {/* Certifications */}
      {parsedData.certifications?.length > 0 && (
        <CertificationsSection certifications={parsedData.certifications} />
      )}

      {/* AI Insights */}
      {(parsedData.keyStrengths?.length > 0 || parsedData.improvementAreas?.length > 0) && (
        <AIInsightsSection 
          keyStrengths={parsedData.keyStrengths} 
          improvementAreas={parsedData.improvementAreas}
          seniorityLevel={parsedData.seniorityLevel}
          totalExperience={parsedData.totalExperienceYears}
        />
      )}
    </div>
  );
}

// Компонент статуса обработки
function ProcessingStatus({ resume }: { resume: EnhancedResumeViewProps['resume'] }) {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          color: 'yellow',
          message: 'AI анализ ожидает обработки...',
          description: 'Ваше резюме добавлено в очередь на обработку'
        };
      case 'PROCESSING':
        return {
          color: 'blue',
          message: 'AI анализирует ваше резюме...',
          description: 'Извлекаем и структурируем информацию'
        };
      case 'FAILED':
        return {
          color: 'red',
          message: 'Ошибка при анализе резюме',
          description: 'Попробуйте загрузить резюме повторно или в другом формате'
        };
      default:
        return {
          color: 'gray',
          message: 'Статус неизвестен',
          description: ''
        };
    }
  };

  const statusInfo = getStatusInfo(resume.processingStatus);

  return (
    <div className={`bg-${statusInfo.color}-50 dark:bg-${statusInfo.color}-900/20 border border-${statusInfo.color}-200 dark:border-${statusInfo.color}-700 rounded-xl p-6`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 bg-${statusInfo.color}-100 dark:bg-${statusInfo.color}-800 rounded-lg`}>
          <DocumentIcon className={`w-5 h-5 text-${statusInfo.color}-600 dark:text-${statusInfo.color}-300`} />
        </div>
        <div>
          <h3 className={`text-lg font-semibold text-${statusInfo.color}-900 dark:text-${statusInfo.color}-100`}>
            {statusInfo.message}
          </h3>
          {statusInfo.description && (
            <p className={`text-${statusInfo.color}-700 dark:text-${statusInfo.color}-300 mt-1`}>
              {statusInfo.description}
            </p>
          )}
        </div>
        {resume.processingStatus === 'PROCESSING' && (
          <div className="ml-auto">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400"></div>
          </div>
        )}
      </div>
    </div>
  );
}

// Компонент личной информации
function PersonalInfoSection({ personalInfo }: { personalInfo: ParsedResumeData['personalInfo'] }) {
  const contactItems = [
    { label: 'Email', value: personalInfo.email, icon: '📧' },
    { label: 'Телефон', value: personalInfo.phone, icon: '📱' },
    { label: 'Местоположение', value: personalInfo.location, icon: '📍' },
    { label: 'LinkedIn', value: personalInfo.linkedin, icon: '💼' },
    { label: 'GitHub', value: personalInfo.github, icon: '🔗' },
    { label: 'Портфолио', value: personalInfo.portfolio, icon: '🌐' },
  ].filter(item => item.value);

  if (contactItems.length === 0 && !personalInfo.name) return null;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {personalInfo.name || 'Контактная информация'}
        </h3>
      </div>
      
      {contactItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {contactItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span className="text-lg">{item.icon}</span>
              <span className="text-gray-600 dark:text-gray-400">{item.label}:</span>
              <span className="text-gray-900 dark:text-white font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Компонент навыков
function SkillsSection({ skills }: { skills: ParsedResumeData['skills'] }) {
  const skillCategories = [
    { label: 'Технические навыки', skills: skills.technical, color: 'blue' },
    { label: 'Инструменты', skills: skills.tools, color: 'green' },
    { label: 'Фреймворки', skills: skills.frameworks, color: 'purple' },
    { label: 'Базы данных', skills: skills.databases, color: 'orange' },
    { label: 'Soft Skills', skills: skills.soft, color: 'pink' },
  ].filter(category => category.skills?.length > 0);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
          <CodeIcon className="w-5 h-5 text-green-600 dark:text-green-300" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Навыки и компетенции</h3>
      </div>

      <div className="space-y-6">
        {skillCategories.map((category, index) => (
          <div key={index}>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{category.label}</h4>
            <div className="flex flex-wrap gap-2">
              {category.skills.map((skill, skillIndex) => {
                const colorClasses = {
                  blue: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 border-blue-200 dark:border-blue-700',
                  green: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 border-green-200 dark:border-green-700',
                  purple: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 border-purple-200 dark:border-purple-700',
                  orange: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100 border-orange-200 dark:border-orange-700',
                  pink: 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-100 border-pink-200 dark:border-pink-700',
                };
                
                return (
                  <span
                    key={skillIndex}
                    className={`px-3 py-1 text-sm rounded-full border ${colorClasses[category.color as keyof typeof colorClasses] || colorClasses.blue}`}
                  >
                    {skill}
                  </span>
                );
              })}
            </div>
          </div>
        ))}

        {/* Languages */}
        {skills.languages?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Языки</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {skills.languages.map((lang, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{lang.language}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                    {lang.level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Компонент опыта работы
function WorkExperienceSection({ workExperience }: { workExperience: WorkExperience[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
          <BriefcaseIcon className="w-5 h-5 text-blue-600 dark:text-blue-300" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Опыт работы</h3>
      </div>

      <div className="space-y-6">
        {workExperience.map((exp, index) => (
          <div key={index} className="border-l-4 border-blue-500 dark:border-blue-400 pl-6 relative">
            <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
            
            <div className="mb-2">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{exp.position}</h4>
              <p className="text-blue-600 dark:text-blue-400 font-medium">{exp.company}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {exp.startDate} - {exp.endDate} ({exp.duration})
              </p>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mb-3">{exp.description}</p>

            {exp.achievements?.length > 0 && (
              <div className="mb-3">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Ключевые достижения:</h5>
                <ul className="space-y-1">
                  {exp.achievements.map((achievement, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <CheckIcon className="w-4 h-4 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      {achievement}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {exp.technologies?.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Технологии:</h5>
                <div className="flex flex-wrap gap-1">
                  {exp.technologies.map((tech, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs rounded border border-gray-300 dark:border-gray-600">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Компонент образования
function EducationSection({ education }: { education: Education[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
          <AcademicCapIcon className="w-5 h-5 text-purple-600 dark:text-purple-300" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Образование</h3>
      </div>

      <div className="space-y-4">
        {education.map((edu, index) => (
          <div key={index} className="border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">{edu.degree}</h4>
            <p className="text-purple-600 dark:text-purple-400 font-medium">{edu.institution}</p>
            <p className="text-gray-600 dark:text-gray-400">{edu.field}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span>{edu.startDate} - {edu.endDate}</span>
              {edu.grade && <span>Оценка: {edu.grade}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Компонент проектов
function ProjectsSection({ projects }: { projects: Project[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-lg">
          <CodeIcon className="w-5 h-5 text-orange-600 dark:text-orange-300" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Проекты</h3>
      </div>

      <div className="grid gap-4">
        {projects.map((project, index) => (
          <div key={index} className="border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">{project.name}</h4>
              {project.url && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  <GlobeIcon className="w-4 h-4" />
                </a>
              )}
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-3">{project.description}</p>
            
            <div className="flex items-center gap-4 mb-3 text-sm text-gray-600 dark:text-gray-400">
              <span>Роль: {project.role}</span>
              {project.duration && <span>Длительность: {project.duration}</span>}
            </div>

            {project.technologies?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {project.technologies.map((tech, i) => (
                  <span key={i} className="px-2 py-1 bg-orange-50 dark:bg-orange-900 text-orange-700 dark:text-orange-100 text-xs rounded border border-orange-200 dark:border-orange-600">
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Компонент сертификатов
function CertificationsSection({ certifications }: { certifications: Certification[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-yellow-100 dark:bg-yellow-800 rounded-lg">
          <TrophyIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-300" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Сертификаты</h3>
      </div>

      <div className="grid gap-3">
        {certifications.map((cert, index) => (
          <div key={index} className="flex items-start justify-between p-3 border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white">{cert.name}</h4>
              <p className="text-gray-600 dark:text-gray-400">{cert.issuer}</p>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                <span>Выдан: {cert.date}</span>
                {cert.expiryDate && <span>Действует до: {cert.expiryDate}</span>}
              </div>
            </div>
            {cert.url && (
              <a
                href={cert.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 ml-3"
              >
                <GlobeIcon className="w-4 h-4" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Компонент AI инсайтов
function AIInsightsSection({ 
  keyStrengths, 
  improvementAreas, 
  seniorityLevel, 
  totalExperience 
}: { 
  keyStrengths?: string[];
  improvementAreas?: string[];
  seniorityLevel?: string;
  totalExperience?: number;
}) {
  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg">
          <DocumentIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
        </div>
        <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">AI Анализ профиля</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Career Level */}
        {(seniorityLevel || totalExperience !== undefined) && (
          <div className="col-span-full">
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-indigo-100 dark:border-indigo-700">
              <div className="text-2xl">🎯</div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Уровень сеньорности</h4>
                <p className="text-indigo-700 dark:text-indigo-300 font-semibold">
                  {seniorityLevel} {totalExperience ? `(${totalExperience} ${totalExperience === 1 ? 'год' : totalExperience < 5 ? 'года' : 'лет'} опыта)` : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Strengths */}
        {keyStrengths && keyStrengths.length > 0 && (
          <div>
            <h4 className="font-medium text-indigo-900 dark:text-indigo-100 mb-3 flex items-center gap-2">
              <span className="text-lg">💪</span>
              Сильные стороны
            </h4>
            <ul className="space-y-2">
              {keyStrengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckIcon className="w-4 h-4 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvement Areas */}
        {improvementAreas && improvementAreas.length > 0 && (
          <div>
            <h4 className="font-medium text-indigo-900 dark:text-indigo-100 mb-3 flex items-center gap-2">
              <span className="text-lg">🎯</span>
              Области для развития
            </h4>
            <ul className="space-y-2">
              {improvementAreas.map((area, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="w-4 h-4 text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0">→</span>
                  <span className="text-gray-700 dark:text-gray-300">{area}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}