import { Router } from 'express';
import { updateResumeStatus, getResumesByJobId } from '../controllers/resumeController';

const router = Router();

// PATCH /api/resumes/:id/status
router.patch('/:id/status', updateResumeStatus);

export default router; 