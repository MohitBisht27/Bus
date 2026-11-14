import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/db';
import { Operator } from './models/Operator';
import { seedDatabase } from './seed';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await connectDB();

    // Auto-seed in production on first deployment if collections are empty
    try {
      const operatorCount = await Operator.countDocuments();
      if (operatorCount === 0) {
        console.log('[OmniBus Server] Database is empty. Triggering automatic initial seed...');
        await seedDatabase();
      } else {
        console.log(`[OmniBus Server] Database initialized with ${operatorCount} existing operators.`);
      }
    } catch (seedErr: any) {
      console.warn('[OmniBus Server] Auto-seed check warning:', seedErr.message);
    }

    app.listen(PORT, () => {
      console.log(`[OmniBus Server] Running on port ${PORT}`);
      console.log(`[OmniBus Server] API Docs at /api-docs`);
      console.log(`[OmniBus Server] Health check at /api/health`);
    });
  } catch (error) {
    console.error('[OmniBus Server] Fatal bootstrap error:', error);
    process.exit(1);
  }
}

bootstrap();
