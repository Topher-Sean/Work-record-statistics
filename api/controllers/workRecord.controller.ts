import type { Request, Response } from 'express';
import { aiService } from '../services/ai.service';

export const workRecordController = {
  async generateAISummary(req: Request, res: Response) {
    try {
      const { workData, userRole, prompt } = req.body;
      
      if (!workData || !userRole) {
        return res.status(400).json({ error: '缺少必要的参数' });
      }

      const summary = await aiService.generateSummary(workData, userRole, prompt);
      
      res.json({ data: { summary } });
    } catch (error) {
      console.error('generateAISummary error:', error);
      const details = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: '生成总结失败，请稍后重试', details });
    }
  }
};
