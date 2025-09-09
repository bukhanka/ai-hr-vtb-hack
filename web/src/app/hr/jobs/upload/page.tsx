'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../hooks/useAuth';
import { ArrowLeftIcon, DocumentIcon, UploadIcon, CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '../../../../components/Icons';
import Link from 'next/link';

interface JobData {
  id: string;
  title: string;
  fileName: string;
  processingStatus: string;
  status: string;
  createdAt: string;
}

interface ParsedJobData {
  title: string;
  description: string;
  requirements: string;
  responsibilities: string[];
  skills: {
    required: string[];
    preferred: string[];
    technical: string[];
    soft: string[];
  };
  experience: {
    minYears?: number;
    maxYears?: number;
    level: string;
    areas: string[];
  };
  salary: {
    min?: number;
    max?: number;
    currency: string;
    additional?: string;
  };
  benefits: string[];
  workFormat: string;
  location?: string;
  company: {
    name?: string;
    industry?: string;
    size?: string;
    culture?: string;
  };
  employmentType: string;
}

export default function JobUploadPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploadedJob, setUploadedJob] = useState<JobData | null>(null);
  const [parsedData, setParsedData] = useState<ParsedJobData | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  // Поддерживаемые форматы файлов
  const supportedFormats = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/html',
    'text/markdown',
    'application/rtf'
  ];

  const maxFileSize = 20 * 1024 * 1024; // 20MB

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    setError('');
    
    // Проверяем размер файла
    if (selectedFile.size > maxFileSize) {
      setError(`Файл слишком большой. Максимальный размер: ${maxFileSize / 1024 / 1024}MB`);
      return;
    }

    // Проверяем тип файла
    if (!supportedFormats.includes(selectedFile.type)) {
      setError('Неподдерживаемый формат файла. Поддерживаются: PDF, DOCX, DOC, TXT, HTML, Markdown, RTF');
      return;
    }

    setFile(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Пожалуйста, выберите файл для загрузки');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/jobs/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при загрузке файла');
      }

      console.log('✅ Файл загружен:', data);
      setUploadedJob(data.job);
      setSuccess(true);

      // Если файл требует AI обработки, начинаем отслеживать статус
      if (data.job.processingStatus === 'PENDING' || data.job.processingStatus === 'PROCESSING') {
        setAnalyzing(true);
        pollProcessingStatus(data.job.id);
      }

    } catch (error) {
      console.error('❌ Ошибка загрузки:', error);
      setError(error instanceof Error ? error.message : 'Ошибка при загрузке файла');
    } finally {
      setUploading(false);
    }
  };

  const pollProcessingStatus = async (jobId: string) => {
    const maxAttempts = 30; // 30 попыток * 2 секунды = 1 минута максимум
    let attempts = 0;

    const poll = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        const response = await fetch(`/api/ai/analyze-job?jobId=${jobId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const statusData = await response.json();
          setProcessingStatus(statusData.processingStatus);

          if (statusData.processingStatus === 'COMPLETED') {
            console.log('✅ AI анализ завершен');
            setAnalyzing(false);
            
            // Получаем обновленные данные вакансии
            await fetchJobData(jobId);
            return;
          } else if (statusData.processingStatus === 'FAILED') {
            console.log('❌ AI анализ завершился с ошибкой');
            setAnalyzing(false);
            setError('Ошибка при анализе документа. Вы можете отредактировать вакансию вручную.');
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000); // Проверяем каждые 2 секунды
        } else {
          setAnalyzing(false);
          setError('Анализ занимает слишком много времени. Попробуйте позже или отредактируйте вакансию вручную.');
        }

      } catch (error) {
        console.error('Ошибка при проверке статуса:', error);
        setAnalyzing(false);
      }
    };

    poll();
  };

  const fetchJobData = async (jobId: string) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const jobData = await response.json();
        setUploadedJob(jobData.job);
        setParsedData(jobData.job.parsedJobData);
      }
    } catch (error) {
      console.error('Ошибка при получении данных вакансии:', error);
    }
  };

  const handleReset = () => {
    setFile(null);
    setError('');
    setSuccess(false);
    setUploadedJob(null);
    setParsedData(null);
    setProcessingStatus('');
    setAnalyzing(false);
  };

  const handleEditJob = () => {
    if (uploadedJob) {
      router.push(`/hr/jobs/${uploadedJob.id}/edit`);
    }
  };

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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vtb-primary mx-auto mb-4"></div>
          <p className="text-vtb-text-secondary">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'HR') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-vtb-text mb-4">Доступ запрещен</h1>
          <p className="text-vtb-text-secondary mb-6">Эта страница доступна только HR специалистам</p>
          <Link href="/" className="text-vtb-primary hover:underline">
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-vtb-surface border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/hr/jobs"
              className="flex items-center text-vtb-text-secondary hover:text-vtb-primary transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Назад к вакансиям
            </Link>
            <div className="h-6 w-px bg-border"></div>
            <h1 className="text-xl font-bold text-vtb-text">
              Загрузка документа вакансии
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-vtb-text-secondary">
              {user.firstName} {user.lastName}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-vtb-text-secondary hover:text-vtb-error transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {!success ? (
          <>
            {/* Upload Area */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-vtb-surface rounded-2xl p-8 shadow-lg border border-border">
                <div className="text-center mb-6">
                  <DocumentIcon className="w-16 h-16 text-vtb-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-vtb-text mb-2">
                    Загрузите документ вакансии
                  </h2>
                  <p className="text-vtb-text-secondary">
                    ИИ автоматически извлечет все данные и создаст структурированную вакансию
                  </p>
                </div>

                {/* Drag & Drop Area */}
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    dragOver 
                      ? 'border-vtb-primary bg-vtb-primary/5' 
                      : 'border-border hover:border-vtb-primary/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {file ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center space-x-3 text-vtb-primary">
                        <DocumentIcon className="w-8 h-8" />
                        <span className="font-medium">{file.name}</span>
                      </div>
                      <p className="text-sm text-vtb-text-secondary">
                        Размер: {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <div className="flex space-x-4 justify-center">
                        <button
                          onClick={handleUpload}
                          disabled={uploading}
                          className="px-6 py-2 bg-gradient-to-r from-vtb-primary to-vtb-secondary text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          {uploading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Загружается...</span>
                            </>
                          ) : (
                            <>
                              <UploadIcon className="w-4 h-4" />
                              <span>Загрузить и обработать</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setFile(null)}
                          className="px-4 py-2 text-vtb-text-secondary hover:text-vtb-text transition-colors"
                        >
                          Отменить
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <UploadIcon className="w-12 h-12 text-vtb-text-secondary mx-auto" />
                      <div>
                        <p className="text-lg font-medium text-vtb-text mb-2">
                          Перетащите файл сюда или
                        </p>
                        <label className="inline-block px-6 py-2 bg-vtb-primary text-white rounded-lg hover:bg-vtb-primary/90 transition-colors cursor-pointer">
                          Выберите файл
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.docx,.doc,.txt,.html,.md,.rtf"
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>
                      <div className="text-sm text-vtb-text-secondary">
                        <p>Поддерживаемые форматы: PDF, DOCX, DOC, TXT, HTML, Markdown, RTF</p>
                        <p>Максимальный размер: 20 MB</p>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-6 bg-vtb-error/10 border border-vtb-error/30 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <ExclamationTriangleIcon className="w-5 h-5 text-vtb-error" />
                      <p className="text-vtb-error font-medium">{error}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Success State */
          <div className="max-w-4xl mx-auto">
            <div className="bg-vtb-surface rounded-2xl p-8 shadow-lg border border-border">
              <div className="text-center mb-8">
                <CheckCircleIcon className="w-16 h-16 text-vtb-success mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-vtb-text mb-2">
                  Документ загружен успешно!
                </h2>
                {analyzing ? (
                  <div className="flex items-center justify-center space-x-3 text-vtb-primary">
                    <ClockIcon className="w-5 h-5 animate-spin" />
                    <span>ИИ анализирует документ...</span>
                  </div>
                ) : (
                  <p className="text-vtb-text-secondary">
                    Вакансия создана и готова к редактированию
                  </p>
                )}
              </div>

              {uploadedJob && (
                <div className="bg-background rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-vtb-text mb-4">
                    Информация о вакансии
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-vtb-text-secondary">Название:</span>
                      <p className="text-vtb-text font-medium">{uploadedJob.title}</p>
                    </div>
                    <div>
                      <span className="text-vtb-text-secondary">Файл:</span>
                      <p className="text-vtb-text font-medium">{uploadedJob.fileName}</p>
                    </div>
                    <div>
                      <span className="text-vtb-text-secondary">Статус обработки:</span>
                      <p className={`font-medium ${
                        uploadedJob.processingStatus === 'COMPLETED' ? 'text-vtb-success' :
                        uploadedJob.processingStatus === 'PROCESSING' ? 'text-vtb-warning' :
                        uploadedJob.processingStatus === 'FAILED' ? 'text-vtb-error' :
                        'text-vtb-text-secondary'
                      }`}>
                        {uploadedJob.processingStatus === 'COMPLETED' ? 'Обработан' :
                         uploadedJob.processingStatus === 'PROCESSING' ? 'Обрабатывается' :
                         uploadedJob.processingStatus === 'FAILED' ? 'Ошибка' :
                         uploadedJob.processingStatus === 'PENDING' ? 'В очереди' :
                         'Ручной ввод'}
                      </p>
                    </div>
                    <div>
                      <span className="text-vtb-text-secondary">Статус публикации:</span>
                      <p className="text-vtb-text font-medium">
                        {uploadedJob.status === 'DRAFT' ? 'Черновик' : uploadedJob.status}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {parsedData && (
                <div className="bg-background rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-vtb-text mb-4">
                    Извлеченные данные
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <span className="text-vtb-text-secondary block mb-1">Описание:</span>
                      <p className="text-vtb-text">{parsedData.description.substring(0, 200)}...</p>
                    </div>
                    
                    {parsedData.skills && (
                      <div>
                        <span className="text-vtb-text-secondary block mb-1">Навыки:</span>
                        <div className="flex flex-wrap gap-2">
                          {[...parsedData.skills.required, ...parsedData.skills.technical].slice(0, 10).map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-vtb-primary/10 text-vtb-primary text-xs rounded-md">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {parsedData.experience && (
                      <div>
                        <span className="text-vtb-text-secondary block mb-1">Опыт:</span>
                        <p className="text-vtb-text">
                          {parsedData.experience.level} уровень
                          {parsedData.experience.minYears && ` (от ${parsedData.experience.minYears} лет)`}
                        </p>
                      </div>
                    )}

                    {(parsedData.salary.min || parsedData.salary.max) && (
                      <div>
                        <span className="text-vtb-text-secondary block mb-1">Зарплата:</span>
                        <p className="text-vtb-text">
                          {parsedData.salary.min && `от ${parsedData.salary.min.toLocaleString('ru-RU')}`}
                          {parsedData.salary.max && ` до ${parsedData.salary.max.toLocaleString('ru-RU')}`}
                          {` ${parsedData.salary.currency}`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex space-x-4 justify-center">
                <button
                  onClick={handleEditJob}
                  disabled={analyzing}
                  className="px-6 py-3 bg-gradient-to-r from-vtb-primary to-vtb-secondary text-white rounded-xl hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {analyzing ? 'Ожидание завершения анализа...' : 'Редактировать вакансию'}
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 text-vtb-text-secondary border border-border rounded-xl hover:bg-background hover:border-vtb-primary transition-all duration-200"
                >
                  Загрузить другой документ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}