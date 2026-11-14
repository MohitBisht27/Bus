import { beforeAll, afterAll, beforeEach } from 'vitest';
import { connectDB, disconnectDB } from '../src/config/db';
import { seedDatabase } from '../src/seed';

beforeAll(async () => {
  await connectDB();
  await seedDatabase();
});

afterAll(async () => {
  await disconnectDB();
});
