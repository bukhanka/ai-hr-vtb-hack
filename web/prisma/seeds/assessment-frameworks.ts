import { PrismaClient } from '../../src/generated/prisma';

const prisma = new PrismaClient();

export const techInterviewFramework = {
  name: "Tech Interview",
  version: "1.0",
  description: "Стандартная методология оценки технических специалистов",
  isActive: true,
  criteria: {
    technical: {
      weight: 50,
      description: "Технические навыки и знания",
      subcriteria: {
        coding_skills: {
          weight: 40,
          description: "Навыки программирования и алгоритмы"
        },
        system_design: {
          weight: 30,
          description: "Понимание архитектуры и системного дизайна"
        },
        problem_solving: {
          weight: 30,
          description: "Логическое мышление и решение задач"
        }
      }
    },
    communication: {
      weight: 25,
      description: "Коммуникативные навыки",
      subcriteria: {
        clarity: {
          weight: 50,
          description: "Ясность изложения мыслей"
        },
        technical_explanation: {
          weight: 50,
          description: "Способность объяснять технические концепции"
        }
      }
    },
    experience: {
      weight: 15,
      description: "Профессиональный опыт",
      subcriteria: {
        relevant_projects: {
          weight: 60,
          description: "Релевантные проекты и достижения"
        },
        years_experience: {
          weight: 40,
          description: "Количество лет опыта"
        }
      }
    },
    soft_skills: {
      weight: 10,
      description: "Личностные качества",
      subcriteria: {
        teamwork: {
          weight: 50,
          description: "Способность работать в команде"
        },
        learning_ability: {
          weight: 50,
          description: "Способность к обучению"
        }
      }
    }
  },
  weights: {
    technical: 50,
    communication: 25,
    experience: 15,
    soft_skills: 10
  },
  scoringMethod: "WEIGHTED_AVERAGE",
  analysisConfig: {
    video_fps: 2,
    analyze_emotions: true,
    detect_pauses: true,
    analyze_confidence: true,
    min_confidence_threshold: 70,
    custom_prompts: {
      main_analysis: `Analyze this technical interview video with focus on:
1. Technical competency demonstration
2. Problem-solving approach
3. Communication clarity
4. Confidence and body language
5. Response quality and depth`,
      red_flags_detection: `Look for these red flags:
- Inconsistent statements about experience
- Inability to explain claimed technologies
- Excessive nervousness or evasiveness
- Copy-paste answers without understanding
- Contradictions with resume claims`
    }
  },
  redFlagsConfig: {
    detect_inconsistencies: true,
    detect_evasiveness: true,
    detect_template_answers: true,
    confidence_threshold: 30,
    pause_threshold_seconds: 10
  }
};

export const salesInterviewFramework = {
  name: "Sales Interview",
  version: "1.0", 
  description: "Методология оценки sales специалистов",
  isActive: true,
  criteria: {
    sales_skills: {
      weight: 40,
      description: "Навыки продаж",
      subcriteria: {
        persuasion: { weight: 30, description: "Убедительность" },
        objection_handling: { weight: 30, description: "Работа с возражениями" },
        closing: { weight: 40, description: "Закрытие сделок" }
      }
    },
    communication: {
      weight: 35,
      description: "Коммуникативные навыки",
      subcriteria: {
        presentation: { weight: 50, description: "Навыки презентации" },
        listening: { weight: 50, description: "Активное слушание" }
      }
    },
    personality: {
      weight: 20,
      description: "Личностные качества",
      subcriteria: {
        charisma: { weight: 60, description: "Харизма и обаяние" },
        resilience: { weight: 40, description: "Стрессоустойчивость" }
      }
    },
    experience: {
      weight: 5,
      description: "Опыт продаж"
    }
  },
  weights: {
    sales_skills: 40,
    communication: 35,
    personality: 20,
    experience: 5
  },
  scoringMethod: "WEIGHTED_AVERAGE",
  analysisConfig: {
    video_fps: 1,
    analyze_emotions: true,
    detect_pauses: false,
    analyze_confidence: true,
    custom_prompts: {
      main_analysis: `Analyze this sales interview focusing on:
1. Sales techniques and approach
2. Communication and presentation skills  
3. Charisma and interpersonal connection
4. Handling of difficult questions
5. Overall sales potential`
    }
  },
  redFlagsConfig: {
    detect_inconsistencies: true,
    detect_evasiveness: false,
    confidence_threshold: 40
  }
};

export async function seedAssessmentFrameworks(adminUserId: string) {
  console.log('🌱 Seeding Assessment Frameworks...');

  const frameworks = [
    { ...techInterviewFramework, creatorId: adminUserId },
    { ...salesInterviewFramework, creatorId: adminUserId }
  ];

  for (const framework of frameworks) {
    const existing = await prisma.assessmentFramework.findFirst({
      where: { name: framework.name, version: framework.version }
    });

    if (!existing) {
      await prisma.assessmentFramework.create({
        data: framework
      });
      console.log(`✅ Created framework: ${framework.name} v${framework.version}`);
    } else {
      console.log(`⚠️  Framework already exists: ${framework.name} v${framework.version}`);
    }
  }

  console.log('✅ Assessment Frameworks seeded successfully!');
}