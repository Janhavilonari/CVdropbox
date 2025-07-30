import { Router } from 'express';
import { loginUser, signupAgency, initiateSignup, verifyOTP, resendOTP } from '../controllers/authController';
import User from '../models/User';
import { bulkCreateAgencies } from '../controllers/authController';
import { deactivateAgency } from '../controllers/authController';
import { createAgency } from '../controllers/authController';
import { activateAgency } from '../controllers/authController';
import { initiateForgotPassword, verifyForgotPasswordOtp } from '../controllers/authController';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getNotifications, markNotificationsRead } from '../controllers/authController';
import { deleteAgency } from '../controllers/authController';
import { agencySignup } from '../controllers/authController';
import { changePassword } from '../controllers/authController';

const router = Router();

router.post('/login', loginUser);
router.post('/signup-agency', signupAgency);

// OTP-based signup routes
router.post('/initiate-signup', initiateSignup);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

// Forgot password routes
router.post('/forgot-password/initiate', initiateForgotPassword);
router.post('/forgot-password/verify', verifyForgotPasswordOtp);

// Token validation endpoint
router.get('/validate-token', authenticate, (req, res) => {
  res.json({ valid: true });
});

// Get all agencies
router.get('/agencies', async (req, res) => {
  try {
    const agencies = await User.find({ role: 'agency' }, { name: 1, email: 1, status: 1 });
    res.json(agencies);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch agencies' });
  }
});

router.get('/check', (req, res) => {
  res.status(200).json({ message: 'Backend is working!' });
});

router.post('/agencies/bulk', bulkCreateAgencies);

router.post('/agencies', createAgency);

router.patch('/agencies/:id/deactivate', deactivateAgency);

router.patch('/agencies/:id/activate', activateAgency);

router.delete('/agencies/:id', deleteAgency);

router.post('/agency-signup', agencySignup);

router.post('/change-password', authenticate, changePassword);

router.get('/notifications', authenticate, getNotifications);
router.post('/notifications/mark-read', authenticate, markNotificationsRead);

export default router; 