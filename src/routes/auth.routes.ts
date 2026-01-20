import { Router, Request, Response } from 'express';
import { auth } from '../lib/auth';

const router = Router();

// Mount Better Auth routes
// Better Auth expects Web API Request, so we use type assertion
router.all('*', async (req: Request, res: Response) => {
  return auth.handler(req as any);
});

export default router;
