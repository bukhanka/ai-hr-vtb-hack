import { PrismaClient, UserRole, JobStatus } from '../src/generated/prisma';
import { hashPassword } from '../src/lib/auth';
import { seedAssessmentFrameworks } from './seeds/assessment-frameworks';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...');

  // Создаем администратора
  const adminPassword = await hashPassword('admin123456');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vtbhack.ru' },
    update: {},
    create: {
      email: 'admin@vtbhack.ru',
      password: adminPassword,
      firstName: 'Системный',
      lastName: 'Администратор',
      phone: '+7 (999) 000-01-01',
      role: UserRole.ADMIN,
    },
  });

  console.log('✅ Создан администратор:', admin.email);

  // Создаем HR специалистов
  const hrPassword = await hashPassword('hr123456');
  
  const hr1 = await prisma.user.upsert({
    where: { email: 'hr1@vtbhack.ru' },
    update: {},
    create: {
      email: 'hr1@vtbhack.ru',
      password: hrPassword,
      firstName: 'Анна',
      lastName: 'Рекрутерова',
      phone: '+7 (999) 000-02-01',
      role: UserRole.HR,
    },
  });

  const hr2 = await prisma.user.upsert({
    where: { email: 'hr2@vtbhack.ru' },
    update: {},
    create: {
      email: 'hr2@vtbhack.ru',
      password: hrPassword,
      firstName: 'Михаил',
      lastName: 'Кадровый',
      phone: '+7 (999) 000-02-02',
      role: UserRole.HR,
    },
  });

  console.log('✅ Созданы HR специалисты:', hr1.email, hr2.email);

  // Создаем соискателей
  const applicantPassword = await hashPassword('applicant123456');
  
  const applicants = [];
  
  const applicant1 = await prisma.user.upsert({
    where: { email: 'applicant1@example.com' },
    update: {},
    create: {
      email: 'applicant1@example.com',
      password: applicantPassword,
      firstName: 'Иван',
      lastName: 'Петров',
      phone: '+7 (999) 000-03-01',
      role: UserRole.APPLICANT,
    },
  });
  applicants.push(applicant1);

  const applicant2 = await prisma.user.upsert({
    where: { email: 'applicant2@example.com' },
    update: {},
    create: {
      email: 'applicant2@example.com',
      password: applicantPassword,
      firstName: 'Мария',
      lastName: 'Сидорова',
      phone: '+7 (999) 000-03-02',
      role: UserRole.APPLICANT,
    },
  });
  applicants.push(applicant2);

  const applicant3 = await prisma.user.upsert({
    where: { email: 'applicant3@example.com' },
    update: {},
    create: {
      email: 'applicant3@example.com',
      password: applicantPassword,
      firstName: 'Александр',
      lastName: 'Программистов',
      phone: '+7 (999) 000-03-03',
      role: UserRole.APPLICANT,
    },
  });
  applicants.push(applicant3);

  const applicant4 = await prisma.user.upsert({
    where: { email: 'applicant4@example.com' },
    update: {},
    create: {
      email: 'applicant4@example.com',
      password: applicantPassword,
      firstName: 'Елена',
      lastName: 'Дизайнерова',
      phone: '+7 (999) 000-03-04',
      role: UserRole.APPLICANT,
    },
  });
  applicants.push(applicant4);

  const applicant5 = await prisma.user.upsert({
    where: { email: 'applicant5@example.com' },
    update: {},
    create: {
      email: 'applicant5@example.com',
      password: applicantPassword,
      firstName: 'Дмитрий',
      lastName: 'Аналитиков',
      phone: '+7 (999) 000-03-05',
      role: UserRole.APPLICANT,
    },
  });
  applicants.push(applicant5);

  console.log('✅ Созданы соискатели:', applicants.map(a => a.email).join(', '));

  // Создаем тестовые вакансии
  const job1 = await prisma.job.create({
    data: {
      title: 'Senior Frontend Developer',
      description: 'Мы ищем опытного Frontend разработчика для работы над высоконагруженными веб-приложениями.',
      requirements: 'Опыт работы с React/Next.js от 3 лет, знание TypeScript, опыт работы с REST API',
      skills: ['React', 'Next.js', 'TypeScript', 'CSS', 'JavaScript', 'HTML'],
      experience: '3+ лет',
      salary: '150 000 - 250 000 руб.',
      status: JobStatus.ACTIVE,
      creatorId: hr1.id,
    },
  });

  const job2 = await prisma.job.create({
    data: {
      title: 'Backend Developer (Python)',
      description: 'Разработка и поддержка серверной части приложения на Python.',
      requirements: 'Опыт работы с Python/Django от 2 лет, знание SQL, опыт работы с API',
      skills: ['Python', 'Django', 'PostgreSQL', 'Redis', 'Docker'],
      experience: '2+ лет',
      salary: '120 000 - 200 000 руб.',
      status: JobStatus.ACTIVE,
      creatorId: hr2.id,
    },
  });

  const job3 = await prisma.job.create({
    data: {
      title: 'UX/UI Designer',
      description: 'Проектирование пользовательского интерфейса мобильных и веб-приложений.',
      requirements: 'Опыт работы с Figma, знание принципов UX/UI дизайна, портфолио',
      skills: ['Figma', 'Sketch', 'Adobe XD', 'Prototyping', 'User Research'],
      experience: '2+ лет',
      salary: '100 000 - 180 000 руб.',
      status: JobStatus.ACTIVE,
      creatorId: hr1.id,
    },
  });

  console.log('✅ Созданы тестовые вакансии:', job1.title, job2.title, job3.title);

  // Создаем резюме для соискателей
  await prisma.resume.create({
    data: {
      fileName: 'ivan_petrov_resume.pdf',
      filePath: '/uploads/resumes/ivan_petrov_resume.pdf',
      content: 'Опытный Frontend разработчик с 4 годами коммерческого опыта работы с React и Next.js.',
      skills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'CSS'],
      experience: 4,
      education: 'МГТУ им. Баумана, Информатика и вычислительная техника',
      applicantId: applicant1.id,
    },
  });

  await prisma.resume.create({
    data: {
      fileName: 'maria_sidorova_resume.pdf',
      filePath: '/uploads/resumes/maria_sidorova_resume.pdf',
      content: 'Backend разработчик с опытом работы на Python и Django.',
      skills: ['Python', 'Django', 'PostgreSQL', 'Docker'],
      experience: 3,
      education: 'СПбГУ, Прикладная математика и информатика',
      applicantId: applicant2.id,
    },
  });

  await prisma.resume.create({
    data: {
      fileName: 'alexander_programmer_resume.pdf',
      filePath: '/uploads/resumes/alexander_programmer_resume.pdf',
      content: 'Fullstack разработчик с опытом работы как с фронтендом, так и с бэкендом.',
      skills: ['React', 'Node.js', 'Python', 'PostgreSQL', 'Docker'],
      experience: 5,
      education: 'МГУ, Факультет ВМК',
      applicantId: applicant3.id,
    },
  });

  await prisma.resume.create({
    data: {
      fileName: 'elena_designer_resume.pdf',
      filePath: '/uploads/resumes/elena_designer_resume.pdf',
      content: 'UX/UI дизайнер с опытом создания интерфейсов для мобильных и веб-приложений.',
      skills: ['Figma', 'Sketch', 'Adobe Creative Suite', 'Prototyping'],
      experience: 3,
      education: 'МГХПА им. Строганова, Дизайн',
      applicantId: applicant4.id,
    },
  });

  await prisma.resume.create({
    data: {
      fileName: 'dmitry_analyst_resume.pdf',
      filePath: '/uploads/resumes/dmitry_analyst_resume.pdf',
      content: 'Аналитик данных с опытом работы с большими данными и машинным обучением.',
      skills: ['Python', 'SQL', 'Tableau', 'Machine Learning', 'Statistics'],
      experience: 2,
      education: 'НИУ ВШЭ, Прикладная математика',
      applicantId: applicant5.id,
    },
  });

  console.log('✅ Созданы резюме для соискателей');

  // Создаем Assessment Frameworks
  await seedAssessmentFrameworks(admin.id);

  // Привязываем вакансии к фреймворку Tech Interview
  const techFramework = await prisma.assessmentFramework.findFirst({
    where: { name: 'Tech Interview', isActive: true }
  });

  if (techFramework) {
    await prisma.job.updateMany({
      where: { id: { in: [job1.id, job2.id] } },
      data: { assessmentFrameworkId: techFramework.id }
    });
    console.log('✅ Привязаны технические вакансии к Tech Interview фреймворку');
  }

  console.log(`
🎉 База данных успешно заполнена!

Тестовые аккаунты:
┌─────────────────────────────────────────────────────────────┐
│ Роль        │ Email              │ Пароль       │ Имя        │
├─────────────────────────────────────────────────────────────┤
│ ADMIN       │ admin@vtbhack.ru   │ admin123456  │ Админ      │
│ HR          │ hr1@vtbhack.ru     │ hr123456     │ Анна       │
│ HR          │ hr2@vtbhack.ru     │ hr123456     │ Михаил     │
│ APPLICANT   │ applicant1@ex...   │ applicant... │ Иван       │
│ APPLICANT   │ applicant2@ex...   │ applicant... │ Мария      │
│ APPLICANT   │ applicant3@ex...   │ applicant... │ Александр  │
│ APPLICANT   │ applicant4@ex...   │ applicant... │ Елена      │
│ APPLICANT   │ applicant5@ex...   │ applicant... │ Дмитрий    │
└─────────────────────────────────────────────────────────────┘

Создано:
• ${applicants.length} соискателей
• 2 HR специалиста
• 1 администратор
• 3 активные вакансии
• 5 резюме
• 2 Assessment Frameworks (Tech Interview, Sales Interview)
  `);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });