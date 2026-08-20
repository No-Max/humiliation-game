import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function ensureTour(
  title: string,
  data: {
    rules: string;
    defaultPoints: number;
  },
) {
  let tour = await prisma.tour.findFirst({ where: { title } });
  if (!tour) {
    tour = await prisma.tour.create({
      data: {
        title,
        rules: data.rules,
        defaultPoints: data.defaultPoints,
      },
    });
  } else {
    tour = await prisma.tour.update({
      where: { id: tour.id },
      data: { rules: data.rules, defaultPoints: data.defaultPoints },
    });
  }

  return tour;
}

async function ensureQuestionsForSeries(
  tourId: string,
  seriesId: string,
  questions: Array<{
    sortOrder: number;
    contentType: 'TEXT' | 'EMOJI' | 'LYRICS';
    prompt: string;
    correctAnswer: string;
    acceptableAnswers: string[];
    hints?: string[];
  }>,
) {
  const questionCount = await prisma.question.count({ where: { tourId, seriesId } });
  if (questionCount > 0) return;

  await prisma.question.createMany({
    data: questions.map((q) => ({
      ...q,
      tourId,
      seriesId,
      answerType: 'TEXT',
    })),
  });
}

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const editorPassword = await bcrypt.hash('editor123', 10);

  await prisma.adminUser.upsert({
    where: { email: 'admin@game.local' },
    update: {},
    create: {
      email: 'admin@game.local',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  await prisma.adminUser.upsert({
    where: { email: 'editor@game.local' },
    update: {},
    create: {
      email: 'editor@game.local',
      passwordHash: editorPassword,
      role: 'EDITOR',
    },
  });

  const memesQuestions = [
    {
      sortOrder: 0,
      contentType: 'TEXT' as const,
      prompt: 'Какой мем: "One does not simply..."?',
      correctAnswer: 'walk into mordor',
      acceptableAnswers: ['simply walk into mordor', 'one does not simply walk into mordor'],
      hints: ['Властелин колец', 'Boromir meme'],
    },
    {
      sortOrder: 1,
      contentType: 'EMOJI' as const,
      prompt: '🐸☕',
      correctAnswer: 'but thats none of my business',
      acceptableAnswers: ['kermit tea', "but that's none of my business"],
    },
  ];

  const musicQuestions = [
    {
      sortOrder: 0,
      contentType: 'LYRICS' as const,
      prompt: 'Is this the real life? Is this just fantasy?',
      correctAnswer: 'bohemian rhapsody',
      acceptableAnswers: ['queen bohemian rhapsody'],
    },
  ];

  const memesTour = await ensureTour('Мемы', {
    rules: 'Угадай мем по картинке',
    defaultPoints: 3,
  });

  const musicTour = await ensureTour('Музыка', {
    rules: 'Угадай песню',
    defaultPoints: 2,
  });

  const series = await prisma.series.upsert({
    where: { number: 1 },
    update: {},
    create: {
      title: 'Пилотный выпуск',
      number: 1,
      description: 'Первый выпуск для тестирования',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  for (const [index, tourId] of [memesTour.id, musicTour.id].entries()) {
    await prisma.seriesTour.upsert({
      where: {
        seriesId_tourId: {
          seriesId: series.id,
          tourId,
        },
      },
      update: { sortOrder: index },
      create: {
        seriesId: series.id,
        tourId,
        sortOrder: index,
      },
    });
  }

  await ensureQuestionsForSeries(memesTour.id, series.id, memesQuestions);
  await ensureQuestionsForSeries(musicTour.id, series.id, musicQuestions);

  await prisma.question.updateMany({
    where: { prompt: { contains: 'One does not simply' } },
    data: { hints: ['Властелин колец', 'Boromir meme'] },
  });

  console.log('Seed complete:', { seriesId: series.id });
  console.log('Admin: admin@game.local / admin123');
  console.log('Editor: editor@game.local / editor123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
