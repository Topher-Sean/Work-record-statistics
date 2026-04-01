import { Router } from 'express';
import { workRecordController } from '../controllers/workRecord.controller';

const router = Router();

// AI 总结生成接口
router.post('/ai-summary', workRecordController.generateAISummary);

export default router;