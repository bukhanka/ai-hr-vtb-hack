import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken, isApplicant } from '../../../../../lib/auth';
import { prisma } from '../../../../../lib/prisma';
import { ResumeJobMatcher, type ParsedResumeData, type JobData, type JobMatchResult } from '../../../../../lib/resume-job-matcher';

// GET /api/jobs/[id]/resume-match - Анализ соответствия резюме пользователя данной вакансии
export async function GET(
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

    // Только соискатели могут анализировать соответствие
    if (!isApplicant(payload.role)) {
      return NextResponse.json(
        { error: 'Анализ соответствия доступен только соискателям' },
        { status: 403 }
      );
    }

    const { id: jobId } = await params;

    // Получаем данные вакансии
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        description: true,
        requirements: true,
        skills: true,
        experience: true,
        salary: true,
        status: true
      }
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Вакансия не найдена' },
        { status: 404 }
      );
    }

    if (job.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Вакансия неактивна' },
        { status: 400 }
      );
    }

    // Получаем все резюме пользователя
    const resumes = await prisma.resume.findMany({
      where: { 
        applicantId: payload.userId,
        processingStatus: 'COMPLETED' // Только обработанные резюме
      },
      orderBy: { uploadedAt: 'desc' }
    });

    if (resumes.length === 0) {
      return NextResponse.json({
        resumes: [],
        message: 'У вас нет обработанных резюме. Загрузите резюме в профиле.'
      });
    }

    // Анализируем каждое резюме
    let matcher: ResumeJobMatcher | null = null;
    
    // Пытаемся создать matcher с Gemini API
    try {
      matcher = new ResumeJobMatcher();
      console.log('✅ ResumeJobMatcher инициализирован с Gemini API');
    } catch (error) {
      console.warn('⚠️ Gemini API недоступен, используем fallback анализ:', error);
    }

    const resumesWithMatch = [];

    for (const resume of resumes) {
      try {
        let matchResult;
        
        // Подготавливаем данные резюме
        const resumeData: ParsedResumeData = resume.parsedData && typeof resume.parsedData === 'object' ? 
          resume.parsedData as unknown as ParsedResumeData : 
          {
            personalInfo: { name: 'Кандидат' },
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
        
        if (matcher && resume.parsedData && typeof resume.parsedData === 'object') {
          // Используем полный AI анализ если есть Gemini и parsedData
          matchResult = await matcher.analyzeMatch(resumeData, job as JobData);
        } else if (matcher) {
          // Используем быстрый анализ с Gemini
          matchResult = await matcher.quickMatch(resumeData, job as JobData);
        } else {
          // Fallback: базовый анализ без AI
          matchResult = calculateBasicMatch(resumeData, job as JobData);
        }

        resumesWithMatch.push({
          id: resume.id,
          fileName: resume.fileName,
          uploadedAt: resume.uploadedAt,
          aiSummary: resume.aiSummary,
          skills: resume.skills,
          experience: resume.experience,
          education: resume.education,
          matchScore: Math.round(matchResult.overallScore),
          matchDetails: {
            skillsMatch: Math.round(matchResult.skillsMatch),
            experienceMatch: Math.round(matchResult.experienceMatch),
            educationMatch: Math.round(matchResult.educationMatch),
            confidence: Math.round(matchResult.confidence)
          },
          matchedSkills: matchResult.detailedAnalysis.matchedSkills,
          missingSkills: matchResult.detailedAnalysis.missingSkills,
          strengths: matchResult.detailedAnalysis.strengths,
          weaknesses: matchResult.detailedAnalysis.weaknesses,
          recommendation: matchResult.recommendation,
          reasoningNotes: matchResult.reasoningNotes
        });

      } catch (error) {
        console.error(`Ошибка анализа резюме ${resume.id}:`, error);
        
        // Добавляем резюме с базовой информацией в случае ошибки
        resumesWithMatch.push({
          id: resume.id,
          fileName: resume.fileName,
          uploadedAt: resume.uploadedAt,
          aiSummary: resume.aiSummary,
          skills: resume.skills,
          experience: resume.experience,
          education: resume.education,
          matchScore: 50,
          matchDetails: {
            skillsMatch: 50,
            experienceMatch: 50,
            educationMatch: 50,
            confidence: 30
          },
          matchedSkills: [],
          missingSkills: job.skills,
          strengths: [],
          weaknesses: ['Ошибка анализа'],
          recommendation: 'WEAK_MATCH' as const,
          reasoningNotes: 'Не удалось проанализировать соответствие'
        });
      }
    }

    // Сортируем по убыванию скора соответствия
    resumesWithMatch.sort((a, b) => b.matchScore - a.matchScore);

    // Определяем лучшее резюме
    const bestResume = resumesWithMatch.length > 0 ? resumesWithMatch[0] : null;

    console.log(`✅ Анализ соответствия завершен для ${resumesWithMatch.length} резюме`);

    return NextResponse.json({
      job: {
        id: job.id,
        title: job.title,
        skills: job.skills
      },
      resumes: resumesWithMatch,
      bestResume,
      summary: {
        totalResumes: resumesWithMatch.length,
        averageScore: resumesWithMatch.length > 0 
          ? Math.round(resumesWithMatch.reduce((sum, r) => sum + r.matchScore, 0) / resumesWithMatch.length)
          : 0,
        strongMatches: resumesWithMatch.filter(r => r.recommendation === 'STRONG_MATCH').length,
        goodMatches: resumesWithMatch.filter(r => r.recommendation === 'GOOD_MATCH').length
      }
    });

  } catch (error) {
    console.error('Resume matching error:', error);
    return NextResponse.json(
      { error: 'Ошибка при анализе соответствия резюме' },
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