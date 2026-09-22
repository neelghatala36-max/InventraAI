import { Router } from 'express';
import verifyAuth from '../../middlewares/verifyAuth';
import aiControllers from './ai.controllers';

const aiRoutes = Router();

aiRoutes.post('/copilot', verifyAuth, aiControllers.askCopilot);

export default aiRoutes;
