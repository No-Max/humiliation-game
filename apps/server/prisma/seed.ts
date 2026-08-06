import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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

  const series = await prisma.series.upsert({
    where: { number: 1 },
    update: {},
    create: {
      title: 'Пилотный выпуск',
      number: 1,
      description: 'Первый выпуск для тестирования',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      tours: {
        create: [
          {
            title: 'Мемы',
            rules: 'Угадай мем по картинке',
            defaultPoints: 3,
            sortOrder: 0,
            questions: {
              create: [
                {
                  sortOrder: 0,
                  contentType: 'TEXT',
                  prompt: 'Какой мем: "One does not simply..."?',
                  answerType: 'TEXT',
                  correctAnswer: 'walk into mordor',
                  acceptableAnswers: ['simply walk into mordor', 'one does not simply walk into mordor'],
                  hint: 'Властелин колец',
                  explanation: 'Boromir meme',
                },
                {
                  sortOrder: 1,
                  contentType: 'EMOJI',
                  prompt: '🐸☕',
                  answerType: 'TEXT',
                  correctAnswer: 'but thats none of my business',
                  acceptableAnswers: ['kermit tea', "but that's none of my business"],
                },
              ],
            },
          },
          {
            title: 'Музыка',
            rules: 'Угадай песню',
            defaultPoints: 2,
            sortOrder: 1,
            questions: {
              create: [
                {
                  sortOrder: 0,
                  contentType: 'LYRICS',
                  prompt: 'Is this the real life? Is this just fantasy?',
                  answerType: 'TEXT',
                  correctAnswer: 'bohemian rhapsody',
                  acceptableAnswers: ['queen bohemian rhapsody'],
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('Seed complete:', { seriesId: series.id });
  console.log('Admin: admin@game.local / admin123');
  console.log('Editor: editor@game.local / editor123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
