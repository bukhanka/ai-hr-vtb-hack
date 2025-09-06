'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '../../../components/ThemeToggle';
import { BuildingIcon, DocumentIcon, PlusIcon, EditIcon, TrashIcon, UploadIcon } from '../../../components/Icons';
import Link from 'next/link';

interface Resume {
  id: string;
  fileName: string;
  content?: string;
  skills: string[];
  experience?: number;
  education?: string;
  uploadedAt: string;
}

export default function ResumeProfilePage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingResume, setEditingResume] = useState<Resume | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    content: '',
    skills: [] as string[],
    skillInput: '',
    experience: '',
    education: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const router = useRouter();

  // Загрузка пользователя
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Не удалось получить данные пользователя');
        }

        const data = await response.json();
        if (data.user.role !== 'APPLICANT') {
          router.push('/dashboard');
          return;
        }
        setUser(data.user);
      } catch (error) {
        console.error('Ошибка загрузки пользователя:', error);
        localStorage.removeItem('auth-token');
        router.push('/login');
      }
    };

    fetchUser();
  }, [router]);

  // Загрузка резюме
  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth-token');
        
        const response = await fetch('/api/resume/my', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Ошибка при загрузке резюме');
        }

        const data = await response.json();
        setResumes(data.resumes);
      } catch (error) {
        console.error('Ошибка загрузки резюме:', error);
        setError('Не удалось загрузить резюме');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchResumes();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      localStorage.removeItem('auth-token');
      router.push('/');
    }
  };

  const handleAddSkill = () => {
    const skill = formData.skillInput.trim();
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill],
        skillInput: ''
      }));
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const resetForm = () => {
    setFormData({
      content: '',
      skills: [],
      skillInput: '',
      experience: '',
      education: '',
    });
    setSelectedFile(null);
    setShowCreateForm(false);
    setEditingResume(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUploading(true);
      const token = localStorage.getItem('auth-token');
      
      if (editingResume) {
        // Обновление существующего резюме
        const response = await fetch(`/api/resume/${editingResume.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: formData.content || null,
            skills: formData.skills,
            experience: formData.experience ? parseInt(formData.experience) : null,
            education: formData.education || null,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Ошибка при обновлении резюме');
        }

        const data = await response.json();
        setResumes(prev => prev.map(resume => 
          resume.id === editingResume.id ? data.resume : resume
        ));
      } else {
        // Создание нового резюме
        const formDataToSend = new FormData();
        
        if (selectedFile) {
          formDataToSend.append('file', selectedFile);
        }
        
        if (formData.content) {
          formDataToSend.append('content', formData.content);
        }
        
        formDataToSend.append('skills', formData.skills.join(','));
        
        if (formData.experience) {
          formDataToSend.append('experience', formData.experience);
        }
        
        if (formData.education) {
          formDataToSend.append('education', formData.education);
        }

        const response = await fetch('/api/resume/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataToSend,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Ошибка при загрузке резюме');
        }

        const data = await response.json();
        setResumes(prev => [data.resume, ...prev]);
      }

      resetForm();
    } catch (error) {
      console.error('Ошибка при сохранении резюме:', error);
      setError(error instanceof Error ? error.message : 'Не удалось сохранить резюме');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (resume: Resume) => {
    setEditingResume(resume);
    setFormData({
      content: resume.content || '',
      skills: resume.skills,
      skillInput: '',
      experience: resume.experience?.toString() || '',
      education: resume.education || '',
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (resumeId: string) => {
    if (!confirm('Вы уверены, что хотите удалить это резюме?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth-token');
      
      const response = await fetch(`/api/resume/${resumeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка при удалении резюме');
      }

      setResumes(prev => prev.filter(resume => resume.id !== resumeId));
    } catch (error) {
      console.error('Ошибка при удалении резюме:', error);
      setError(error instanceof Error ? error.message : 'Не удалось удалить резюме');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vtb-primary mx-auto mb-4"></div>
          <p className="text-vtb-text-secondary">Загрузка резюме...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-vtb-surface border-b border-border backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-br from-vtb-primary to-vtb-secondary rounded-lg flex items-center justify-center shadow-lg">
                <BuildingIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-vtb-text">
                  Мои резюме
                </h1>
                <p className="text-xs text-vtb-text-secondary">
                  {resumes.length} резюме
                </p>
              </div>
            </div>
            <nav className="flex items-center space-x-3">
              <ThemeToggle />
              {user && (
                <>
                  <span className="text-sm text-vtb-text-secondary">
                    {user.firstName} {user.lastName}
                  </span>
                  <Link
                    href="/jobs"
                    className="px-4 py-2 text-sm font-medium text-vtb-text-secondary hover:text-vtb-primary transition-colors"
                  >
                    Вакансии
                  </Link>
                  <Link
                    href="/my-applications"
                    className="px-4 py-2 text-sm font-medium text-vtb-text-secondary hover:text-vtb-primary transition-colors"
                  >
                    Мои заявки
                  </Link>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-4 py-2 text-sm font-medium text-vtb-text-secondary hover:text-vtb-primary transition-colors"
                  >
                    Профиль
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-2.5 bg-gradient-to-r from-vtb-primary to-vtb-secondary text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    Выйти
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="h-16 w-16 bg-gradient-to-br from-vtb-primary to-vtb-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <DocumentIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-vtb-text mb-4">
            Управление резюме
          </h1>
          <p className="text-vtb-text-secondary max-w-2xl mx-auto">
            Загрузите свои резюме, чтобы HR могли лучше оценить ваши навыки и опыт
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-vtb-error/10 border border-vtb-error/30 rounded-xl p-6 mb-8">
            <p className="text-vtb-error font-medium">{error}</p>
            <button
              onClick={() => setError('')}
              className="mt-2 text-sm text-vtb-error hover:text-vtb-error/80 transition-colors"
            >
              Закрыть
            </button>
          </div>
        )}

        {/* Add Resume Button */}
        {!showCreateForm && (
          <div className="text-center mb-8">
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-vtb-primary to-vtb-secondary text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <PlusIcon className="w-5 h-5" />
              Добавить резюме
            </button>
          </div>
        )}

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="bg-vtb-surface rounded-2xl p-8 shadow-lg border border-border mb-8">
            <h3 className="text-2xl font-bold text-vtb-text mb-6">
              {editingResume ? 'Редактировать резюме' : 'Добавить резюме'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload (only for new resumes) */}
              {!editingResume && (
                <div>
                  <label className="block text-sm font-medium text-vtb-text mb-2">
                    Загрузить файл резюме
                  </label>
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-vtb-primary/50 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center gap-3"
                    >
                      <UploadIcon className="w-12 h-12 text-vtb-text-secondary" />
                      <div>
                        <p className="text-lg font-medium text-vtb-text">
                          Выберите файл резюме
                        </p>
                        <p className="text-sm text-vtb-text-secondary">
                          Поддерживаются PDF, DOC, DOCX, TXT (максимум 5MB)
                        </p>
                      </div>
                    </label>
                    {selectedFile && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 font-medium">{selectedFile.name}</p>
                        <p className="text-green-600 text-sm">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="text-center my-4">
                    <span className="px-3 py-1 bg-vtb-surface-secondary text-vtb-text-secondary rounded-full text-sm">
                      или
                    </span>
                  </div>
                </div>
              )}

              {/* Manual Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-vtb-text mb-2">
                  Содержание резюме {!editingResume && '(если не загружаете файл)'}
                </label>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={8}
                  className="w-full px-4 py-3 border border-border rounded-xl bg-white text-vtb-text placeholder:text-vtb-text-secondary focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-vtb-primary resize-vertical"
                  placeholder="Введите основную информацию о себе, опыте работы, навыках..."
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-vtb-text mb-2">
                  Навыки и компетенции
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={formData.skillInput}
                    onChange={(e) => setFormData(prev => ({ ...prev, skillInput: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    className="flex-1 px-4 py-2 border border-border rounded-lg bg-white text-vtb-text placeholder:text-vtb-text-secondary focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-vtb-primary"
                    placeholder="Добавить навык"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-4 py-2 bg-vtb-primary text-white rounded-lg hover:bg-vtb-primary/90 transition-colors"
                  >
                    Добавить
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-vtb-primary/10 text-vtb-primary rounded-full text-sm flex items-center gap-2"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-vtb-primary hover:text-red-500 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Experience and Education */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-vtb-text mb-2">
                    Опыт работы (лет)
                  </label>
                  <input
                    type="number"
                    id="experience"
                    min="0"
                    max="50"
                    value={formData.experience}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-xl bg-white text-vtb-text placeholder:text-vtb-text-secondary focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-vtb-primary"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label htmlFor="education" className="block text-sm font-medium text-vtb-text mb-2">
                    Образование
                  </label>
                  <input
                    type="text"
                    id="education"
                    value={formData.education}
                    onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-xl bg-white text-vtb-text placeholder:text-vtb-text-secondary focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-vtb-primary"
                    placeholder="Высшее, МГТУ им. Баумана"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={uploading || (!formData.content.trim() && !selectedFile && formData.skills.length === 0)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-vtb-primary to-vtb-secondary text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading 
                    ? 'Сохранение...' 
                    : editingResume 
                    ? 'Сохранить изменения' 
                    : 'Добавить резюме'
                  }
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-vtb-surface-secondary border border-border text-vtb-text rounded-xl hover:bg-muted transition-colors"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Resumes List */}
        {resumes.length === 0 && !showCreateForm ? (
          <div className="text-center py-12">
            <div className="h-20 w-20 bg-vtb-surface rounded-2xl flex items-center justify-center mx-auto mb-6 border border-border">
              <DocumentIcon className="w-10 h-10 text-vtb-text-secondary" />
            </div>
            <h3 className="text-xl font-semibold text-vtb-text mb-2">
              У вас пока нет резюме
            </h3>
            <p className="text-vtb-text-secondary mb-4">
              Добавьте первое резюме, чтобы HR могли оценить ваш профиль
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {resumes.map((resume) => (
              <div key={resume.id} className="bg-vtb-surface rounded-2xl p-6 shadow-lg border border-border">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="h-12 w-12 bg-vtb-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <DocumentIcon className="w-6 h-6 text-vtb-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-vtb-text mb-1">
                          {resume.fileName}
                        </h3>
                        <p className="text-sm text-vtb-text-secondary">
                          Загружено: {formatDate(resume.uploadedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Skills */}
                    {resume.skills.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-vtb-text mb-2">Навыки:</h4>
                        <div className="flex flex-wrap gap-2">
                          {resume.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-vtb-primary/10 text-vtb-primary text-xs rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience and Education */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {resume.experience !== undefined && resume.experience !== null && (
                        <div>
                          <span className="font-medium text-vtb-text">Опыт: </span>
                          <span className="text-vtb-text-secondary">
                            {resume.experience} {resume.experience === 1 ? 'год' : resume.experience < 5 ? 'года' : 'лет'}
                          </span>
                        </div>
                      )}
                      {resume.education && (
                        <div>
                          <span className="font-medium text-vtb-text">Образование: </span>
                          <span className="text-vtb-text-secondary">{resume.education}</span>
                        </div>
                      )}
                    </div>

                    {/* Content Preview */}
                    {resume.content && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-vtb-text mb-2">Содержание:</h4>
                        <p className="text-sm text-vtb-text-secondary line-clamp-3">
                          {resume.content}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(resume)}
                      className="p-2 bg-vtb-primary/10 text-vtb-primary rounded-lg hover:bg-vtb-primary/20 transition-colors"
                      title="Редактировать"
                    >
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(resume.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="Удалить"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}