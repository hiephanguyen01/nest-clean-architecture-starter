import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client.js';

export function createTestPrisma(): PrismaClient {
  const connectionString = process.env.TEST_DATABASE_URL;
  if (!connectionString) {
    throw new Error('TEST_DATABASE_URL is required for PostgreSQL-backed tests');
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export async function cleanDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.refreshSession.deleteMany();
  await prisma.user.deleteMany();
}
