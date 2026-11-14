"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const PORT = process.env.PORT || 5000;
async function bootstrap() {
    try {
        await (0, db_1.connectDB)();
        app_1.default.listen(PORT, () => {
            console.log(`[OmniBus Server] Running on http://localhost:${PORT}`);
            console.log(`[OmniBus Server] API Docs available at http://localhost:${PORT}/api-docs`);
            console.log(`[OmniBus Server] Health check at http://localhost:${PORT}/api/health`);
        });
    }
    catch (error) {
        console.error('[OmniBus Server] Fatal bootstrap error:', error);
        process.exit(1);
    }
}
bootstrap();
