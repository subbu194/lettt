import type {  Request, Response } from 'express';
import { Router } from 'express';
const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;
