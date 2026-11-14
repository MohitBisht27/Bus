import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[OmniBus Server] Running on http://localhost:${PORT}`);
      console.log(`[OmniBus Server] API Docs available at http://localhost:${PORT}/api-docs`);
      console.log(`[OmniBus Server] Health check at http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('[OmniBus Server] Fatal bootstrap error:', error);
    process.exit(1);
  }
}

bootstrap();
