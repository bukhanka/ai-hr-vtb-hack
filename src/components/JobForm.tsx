'use client';

import { useState } from 'react';
import { JobStatus } from '../generated/prisma';

interface JobFormData {
  title: string;
  description: string;
  requirements: string;
  skills: string[];
  experience?: string;
  salary?: string;
  status: JobStatus;
}

interface JobFormProps {
  initialData?: Partial<JobFormData>;
  onSubmit: (data: JobFormData) => Promise<void>;
  onCancel?: () => void;
  isEditing?: boolean;
  isLoading?: boolean;
}

export function JobForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isEditing = false, 
  isLoading = false 
}: JobFormProps) {
  const [formData, setFormData] = useState<JobFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    requirements: initialData?.requirements || '',
    skills: initialData?.skills || [],
    experience: initialData?.experience || '',
    salary: initialData?.salary || '',
    status: initialData?.status || JobStatus.DRAFT,
  });

  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Название вакансии обязательно';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Описание вакансии обязательно';
    }

    if (!formData.requirements.trim()) {
      newErrors.requirements = 'Требования обязательны';
    }

    if (formData.skills.length === 0) {
      newErrors.skills = 'Необходимо указать минимум один навык';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Очищаем ошибку для этого поля
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
      setSkillInput('');
      
      if (errors.skills) {
        setErrors(prev => ({ ...prev, skills: '' }));
      }
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSkillKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Название */}
      <div>
        <label htmlFor="title" className="block text-sm font-semibold text-vtb-text mb-2">
          Название вакансии
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          className={`w-full px-4 py-3 border rounded-xl bg-vtb-surface focus:outline-none focus:ring-2 transition-all duration-200 text-vtb-text ${
            errors.title 
              ? 'border-vtb-error focus:ring-vtb-error focus:border-vtb-error' 
              : 'border-border focus:ring-vtb-primary focus:border-vtb-primary'
          }`}
          placeholder="Например: Senior Frontend Developer"
        />
        {errors.title && <p className="mt-1 text-sm text-vtb-error">{errors.title}</p>}
      </div>

      {/* Описание */}
      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-vtb-text mb-2">
          Описание вакансии
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className={`w-full px-4 py-3 border rounded-xl bg-vtb-surface focus:outline-none focus:ring-2 transition-all duration-200 text-vtb-text resize-none ${
            errors.description 
              ? 'border-vtb-error focus:ring-vtb-error focus:border-vtb-error' 
              : 'border-border focus:ring-vtb-primary focus:border-vtb-primary'
          }`}
          placeholder="Опишите суть работы, задачи, команду..."
        />
        {errors.description && <p className="mt-1 text-sm text-vtb-error">{errors.description}</p>}
      </div>

      {/* Требования */}
      <div>
        <label htmlFor="requirements" className="block text-sm font-semibold text-vtb-text mb-2">
          Требования
        </label>
        <textarea
          id="requirements"
          name="requirements"
          value={formData.requirements}
          onChange={handleChange}
          rows={4}
          className={`w-full px-4 py-3 border rounded-xl bg-vtb-surface focus:outline-none focus:ring-2 transition-all duration-200 text-vtb-text resize-none ${
            errors.requirements 
              ? 'border-vtb-error focus:ring-vtb-error focus:border-vtb-error' 
              : 'border-border focus:ring-vtb-primary focus:border-vtb-primary'
          }`}
          placeholder="Опыт работы, необходимые навыки, образование..."
        />
        {errors.requirements && <p className="mt-1 text-sm text-vtb-error">{errors.requirements}</p>}
      </div>

      {/* Навыки */}
      <div>
        <label htmlFor="skillInput" className="block text-sm font-semibold text-vtb-text mb-2">
          Ключевые навыки
        </label>
        <div className="flex gap-2 mb-3">
          <input
            id="skillInput"
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyPress={handleSkillKeyPress}
            className="flex-1 px-4 py-2 border border-border rounded-lg bg-vtb-surface focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-vtb-primary transition-all duration-200 text-vtb-text"
            placeholder="Например: React, TypeScript, Node.js"
          />
          <button
            type="button"
            onClick={addSkill}
            disabled={!skillInput.trim()}
            className="px-4 py-2 bg-vtb-primary text-white rounded-lg hover:bg-vtb-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Добавить
          </button>
        </div>
        
        {/* Список навыков */}
        <div className="flex flex-wrap gap-2">
          {formData.skills.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-vtb-accent/10 text-vtb-accent text-sm rounded-lg"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="ml-1 text-vtb-accent hover:text-vtb-error transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        {errors.skills && <p className="mt-1 text-sm text-vtb-error">{errors.skills}</p>}
      </div>

      {/* Опыт и зарплата в двух колонках */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="experience" className="block text-sm font-semibold text-vtb-text mb-2">
            Опыт работы
          </label>
          <input
            id="experience"
            name="experience"
            type="text"
            value={formData.experience}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-border rounded-xl bg-vtb-surface focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-vtb-primary transition-all duration-200 text-vtb-text"
            placeholder="Например: от 3 лет"
          />
        </div>

        <div>
          <label htmlFor="salary" className="block text-sm font-semibold text-vtb-text mb-2">
            Зарплата
          </label>
          <input
            id="salary"
            name="salary"
            type="text"
            value={formData.salary}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-border rounded-xl bg-vtb-surface focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-vtb-primary transition-all duration-200 text-vtb-text"
            placeholder="Например: от 200 000 руб"
          />
        </div>
      </div>

      {/* Статус */}
      <div>
        <label htmlFor="status" className="block text-sm font-semibold text-vtb-text mb-2">
          Статус вакансии
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-border rounded-xl bg-vtb-surface focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-vtb-primary transition-all duration-200 text-vtb-text"
        >
          <option value={JobStatus.DRAFT}>Черновик</option>
          <option value={JobStatus.ACTIVE}>Активная</option>
          <option value={JobStatus.CLOSED}>Закрытая</option>
        </select>
      </div>

      {/* Кнопки */}
      <div className="flex gap-4 pt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-3 px-6 bg-gradient-to-r from-vtb-primary to-vtb-secondary text-white font-semibold rounded-xl hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vtb-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none"
        >
          {isLoading ? 'Сохранение...' : isEditing ? 'Сохранить изменения' : 'Создать вакансию'}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-border text-vtb-text rounded-xl hover:bg-muted transition-all duration-200"
          >
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}