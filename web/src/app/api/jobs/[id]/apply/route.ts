import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getTokenFromRequest, verifyToken, isApplicant } from '../../../../../lib/auth';
import { JobStatus, InterviewStatus } from '../../../../../generated/prisma';
import { ResumeJobMatcher, type ParsedResumeData, type JobData, type JobMatchResult } from '../../../../../lib/resume-job-matcher';

// POST /api/jobs/[id]/apply - Отклик на вакансию
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Проверяем авторизацию
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Недействительный токен' },
        { status: 401 }
      );
    }

    // Только соискатели могут откликаться на вакансии
    if (!isApplicant(payload.role)) {
      return NextResponse.json(
        { error: 'Откликаться на вакансии могут только соискатели' },
        { status: 403 }
      );
    }

    const { id } = await params;
    
    // Получаем данные запроса
    const body = await request.json().catch(() => ({}));
    const { resumeId, coverLetter } = body;

    // Проверяем обязательные поля
    if (!resumeId) {
      return NextResponse.json(
        { error: 'Необходимо выбрать резюме для отклика' },
        { status: 400 }
      );
    }

    // Проверяем существование и статус вакансии
    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Вакансия не найдена' },
        { status: 404 }
      );
    }

    if (job.status !== JobStatus.ACTIVE) {
      return NextResponse.json(
        { error: 'Вакансия неактивна' },
        { status: 400 }
      );
    }

    // Проверяем существование и принадлежность резюме
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: { applicant: true }
    });

    if (!resume) {
      return NextResponse.json(
        { error: 'Резюме не найдено' },
        { status: 404 }
      );
    }

    if (resume.applicantId !== payload.userId) {
      return NextResponse.json(
        { error: 'Вы можете использовать только свои резюме' },
        { status: 403 }
      );
    }

    // Проверяем, не подавал ли уже заявку этот пользователь
    const existingInterview = await prisma.interview.findFirst({
      where: {
        jobId: id,
        applicantId: payload.userId,
      },
    });

    if (existingInterview) {
      return NextResponse.json(
        { error: 'Вы уже откликнулись на эту вакансию' },
        { status: 400 }
      );
    }

    // Анализируем соответствие резюме вакансии
    console.log(`🔍 Анализируем соответствие резюме ${resumeId} вакансии ${id}`);
    
    let preInterviewScore = null;
    let matchingAnalysis = null;
    
    try {
      let matcher: ResumeJobMatcher | null = null;
      
      // Пытаемся создать matcher с Gemini API
      try {
        matcher = new ResumeJobMatcher();
        console.log('✅ ResumeJobMatcher инициализирован с Gemini API');
      } catch (error) {
        console.warn('⚠️ Gemini API недоступен, используем fallback анализ:', error);
      }
      
      if (resume.parsedData) {
        // Полный AI анализ
        const jobData: JobData = {
          id: job.id,
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          skills: job.skills,
          experience: job.experience || undefined,
          salary: job.salary || undefined
        };
        
        const matchResult = matcher 
          ? await matcher.analyzeMatch(resume.parsedData as ParsedResumeData, jobData)
          : calculateBasicMatch(resume.parsedData as ParsedResumeData, jobData);
        preInterviewScore = matchResult.overallScore;
        matchingAnalysis = {
          skillsMatch: matchResult.skillsMatch,
          experienceMatch: matchResult.experienceMatch,
          educationMatch: matchResult.educationMatch,
          confidence: matchResult.confidence,
          matchedSkills: matchResult.detailedAnalysis.matchedSkills,
          missingSkills: matchResult.detailedAnalysis.missingSkills,
          strengths: matchResult.detailedAnalysis.strengths,
          weaknesses: matchResult.detailedAnalysis.weaknesses,
          recommendation: matchResult.recommendation,
          reasoningNotes: matchResult.reasoningNotes
        };
        
        console.log(`✅ AI анализ завершен. Скор соответствия: ${preInterviewScore}%`);
      } else {
        // Быстрый анализ на основе базовых полей
        console.log(`⚡ Выполняем быстрый анализ соответствия`);
        
        const basicResumeData: ParsedResumeData = {
          personalInfo: { name: `${resume.applicant.firstName} ${resume.applicant.lastName}` },
          summary: resume.aiSummary || undefined,
          skills: {
            technical: resume.skills || [],
            soft: [],
            tools: [],
            frameworks: [],
            databases: []
          },
          workExperience: [],
          education: resume.education ? [{ degree: resume.education, institution: '' }] : [],
          totalExperienceYears: resume.experience || 0,
          projects: [],
          certifications: []
        };
        
        const jobData: JobData = {
          id: job.id,
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          skills: job.skills,
          experience: job.experience || undefined,
          salary: job.salary || undefined
        };
        
        const matchResult = matcher 
          ? await matcher.quickMatch(basicResumeData, jobData)
          : calculateBasicMatch(basicResumeData, jobData);
        preInterviewScore = matchResult.overallScore;
        matchingAnalysis = {
          skillsMatch: matchResult.skillsMatch,
          experienceMatch: matchResult.experienceMatch,
          educationMatch: matchResult.educationMatch,
          confidence: matchResult.confidence,
          matchedSkills: matchResult.detailedAnalysis.matchedSkills,
          missingSkills: matchResult.detailedAnalysis.missingSkills,
          strengths: matchResult.detailedAnalysis.strengths,
          weaknesses: matchResult.detailedAnalysis.weaknesses,
          recommendation: matchResult.recommendation,
          reasoningNotes: matchResult.reasoningNotes
        };
        
        console.log(`✅ Быстрый анализ завершен. Скор соответствия: ${preInterviewScore}%`);
      }
    } catch (error) {
      console.error('❌ Ошибка анализа соответствия:', error);
      // Продолжаем без анализа в случае ошибки
      preInterviewScore = 50; // Средний скор по умолчанию
      matchingAnalysis = {
        error: 'Не удалось проанализировать соответствие',
        message: 'Анализ будет выполнен позже'
      };
    }

    // Создаем интервью со статусом SCHEDULED
    const interview = await prisma.interview.create({
      data: {
        jobId: id,
        applicantId: payload.userId,
        resumeId: resumeId,
        preInterviewScore: preInterviewScore,
        matchingAnalysis: matchingAnalysis,
        status: InterviewStatus.SCHEDULED,
        scheduledAt: new Date(), // Для AI-интервью можем планировать сразу
        aiNotes: coverLetter || null, // Сохраняем сопроводительное письмо в заметках
      },
      include: {
        job: {
          select: {
            title: true,
            description: true,
          }
        },
        applicant: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        resume: {
          select: {
            fileName: true,
            aiSummary: true
          }
        }
      },
    });

    console.log(`✅ Интервью создано с ID: ${interview.id}. Скор соответствия: ${preInterviewScore}%`);

    return NextResponse.json({
      message: 'Отклик успешно отправлен! Вам будет назначено AI-собеседование.',
      interview: {
        id: interview.id,
        status: interview.status,
        scheduledAt: interview.scheduledAt,
        preInterviewScore: interview.preInterviewScore,
        matchingAnalysis: interview.matchingAnalysis,
        job: interview.job,
        resume: interview.resume
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Job application error:', error);
    return NextResponse.json(
      { error: 'Ошибка при отклике на вакансию' },
      { status: 500 }
    );
  }
}

// Fallback функция для базовой оценки соответствия без AI
function calculateBasicMatch(resume: ParsedResumeData, job: JobData): JobMatchResult {
  const allResumeSkills = [
    ...resume.skills.technical,
    ...resume.skills.tools,
    ...resume.skills.frameworks,
    ...resume.skills.databases
  ].map(skill => skill.toLowerCase().trim());
  
  const jobSkills = job.skills.map(skill => skill.toLowerCase().trim());
  
  // Подсчет совпадающих навыков
  const matchedSkills = jobSkills.filter(jobSkill => 
    allResumeSkills.some(resumeSkill => 
      resumeSkill.includes(jobSkill) || jobSkill.includes(resumeSkill)
    )
  );
  
  const missingSkills = jobSkills.filter(jobSkill => 
    !allResumeSkills.some(resumeSkill => 
      resumeSkill.includes(jobSkill) || jobSkill.includes(resumeSkill)
    )
  );
  
  // Простой расчет скора
  const skillsMatch = jobSkills.length > 0 ? (matchedSkills.length / jobSkills.length) * 100 : 50;
  const experienceMatch = resume.totalExperienceYears ? Math.min(resume.totalExperienceYears * 20, 100) : 50;
  const educationMatch = resume.education.length > 0 ? 80 : 60;
  
  const overallScore = Math.round(
    (skillsMatch * 0.5) + (experienceMatch * 0.3) + (educationMatch * 0.2)
  );
  
  let recommendation: JobMatchResult['recommendation'];
  if (overallScore >= 85) recommendation = 'STRONG_MATCH';
  else if (overallScore >= 70) recommendation = 'GOOD_MATCH';
  else if (overallScore >= 50) recommendation = 'WEAK_MATCH';
  else recommendation = 'NO_MATCH';
  
  return {
    overallScore,
    skillsMatch,
    experienceMatch,
    educationMatch,
    confidence: 60, // Низкая уверенность для базового алгоритма
    detailedAnalysis: {
      matchedSkills,
      missingSkills,
      strengths: matchedSkills.length > 0 ? [`Владеет ${matchedSkills.length} из ${jobSkills.length} требуемых навыков`] : [],
      weaknesses: missingSkills.length > 0 ? [`Отсутствуют навыки: ${missingSkills.join(', ')}`] : [],
      redFlags: [],
      recommendations: missingSkills.length > 0 ? [`Рекомендуется изучить: ${missingSkills.slice(0, 3).join(', ')}`] : []
    },
    recommendation,
    reasoningNotes: `Базовый анализ: ${matchedSkills.length}/${jobSkills.length} навыков совпадает (Gemini API недоступен)`
  };
}