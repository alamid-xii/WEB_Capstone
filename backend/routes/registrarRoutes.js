import express from 'express';
import { authenticateToken, requireRegistrar } from '../middleware/auth.js';
import {
  getRegistrarStats,
  getRegistrarEnrollments,
  verifyEnrollment,
  returnEnrollment,
  approveEnrollment,
  scheduleSSCExam,
  recordSSCResult,
  evaluateTOR,
} from '../controllers/registrarController.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRegistrar);

// Dashboard
router.get('/stats', getRegistrarStats);

// Enrollment list (submitted, pending_exam, verified, returned)
router.get('/enrollments', getRegistrarEnrollments);

// Verify enrollment (submitted → verified)
router.post('/enrollments/:id/verify', verifyEnrollment);

// Approve enrollment (submitted/verified → approved)
router.post('/enrollments/:id/approve', approveEnrollment);

// Return enrollment to student with remarks
router.post('/enrollments/:id/return', returnEnrollment);

// SSC exam scheduling & result recording
router.put('/enrollments/:id/ssc-schedule', scheduleSSCExam);
router.put('/enrollments/:id/ssc-result', recordSSCResult);

// TOR evaluation for college transferees
router.post('/enrollments/:id/evaluate-tor', evaluateTOR);

export default router;
