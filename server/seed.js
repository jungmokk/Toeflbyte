import prisma from './src/config/db.js';

async function seed() {
  try {
    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        credit_balance: 50
      }
    });
    console.log('Seed successful! Test User ID:', user.id);
  } catch (error) {
    console.error('Seed failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
