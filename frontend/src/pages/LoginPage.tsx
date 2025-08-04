import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, CircularProgress, InputAdornment, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';
import api from '../api/axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { setToken } from '../utils/token';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ChangePasswordDialog from '../components/ChangePasswordDialog';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-fill form with data from signup if available
  useEffect(() => {
    const prefillData = location.state?.prefillData;
    if (prefillData) {
      setName(prefillData.name || '');
      setEmail(prefillData.email || '');
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login form submitted');
    setLoading(true);
    setError('');
    try {
      const isAdmin = email.endsWith('@appliedaiconsulting.com');
      const payload = isAdmin ? { name, email, password } : { email, password };
      const res = await api.post('/api/auth/login', payload);
      console.log('Login response:', res.data);
      setToken(res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      if (res.data.user.role === 'admin') {
        navigate('/dashboard');
      } else if (res.data.user.role === 'agency') {
        navigate('/dashboard');
      } else {
        setError('Unknown user role');
      }
    } catch (err: any) {
      console.log('Login error:', err, err.response);
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = () => {
    navigate('/signup');
  };

  const handleForgotClose = () => {
    setShowForgotPassword(false);
    setForgotStep(1);
    setForgotEmail('');
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotLoading(false);
    setForgotError('');
    setForgotSuccess('');
  };

  const handleSendForgotOtp = async () => {
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');
    try {
      await api.post('/api/auth/forgot-password/initiate', { email: forgotEmail });
      setForgotStep(2);
      setForgotSuccess('OTP sent to your email.');
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyForgotOtp = async () => {
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match');
      setForgotLoading(false);
      return;
    }
    try {
      await api.post('/api/auth/forgot-password/verify', {
        email: forgotEmail,
        otp: forgotOtp,
        newPassword: forgotNewPassword,
      });
      setForgotSuccess('Password reset successful! You can now log in.');
      setTimeout(() => {
        handleForgotClose();
      }, 2000);
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#f7f9fb">
      <Card sx={{ width: 500, minHeight: 520, borderRadius: 2, boxShadow: 4, p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <CardContent sx={{ p: 0 }}>
          <Box textAlign="center" mb={2}>
            <img src="/aaic-logo.jpg" alt="ppl logo" style={{ height: 72, marginBottom: 2, borderRadius: 12 }} />
            <Typography variant="h5" fontWeight={700} mb={1}>
              Welcome to AAIC CV DropBox
            </Typography>
            <Typography variant="body2" color="primary" mb={2}>
              Please sign in to your account
            </Typography>
          </Box>
          <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Email address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              fullWidth
              autoFocus
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword((show) => !show)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{ shrink: true }}
            />
            {error && (
              <>
                <Typography color="error" fontSize={14} sx={{ mb: 0.2 }}>{error}</Typography>
                <Button
                  variant="text"
                  size="small"
                  sx={{ textTransform: 'none', color: '#1976d2', fontWeight: 600, pl: 0, alignSelf: 'flex-start', mb: 0.5, minHeight: 0, minWidth: 0 }}
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot Password?
                </Button>
              </>
            )}
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: '#ff6d00', color: '#fff', fontWeight: 700, borderRadius: 2, px: 4, py: 1.2, fontSize: 16, mt: 1, '&:hover': { bgcolor: '#ff8c1a' } }}
              fullWidth
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'SIGN IN'}
            </Button>
            <Box textAlign="center" mt={2}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Don't have an account?
              </Typography>
              <Button
                variant="outlined"
                onClick={handleSignup}
                sx={{ 
                  borderColor: '#ff6d00', 
                  color: '#ff6d00', 
                  fontWeight: 600, 
                  borderRadius: 2, 
                  px: 3, 
                  py: 0.8, 
                  fontSize: 14, 
                  '&:hover': { 
                    borderColor: '#ff8c1a', 
                    bgcolor: 'rgba(255, 109, 0, 0.04)' 
                  } 
                }}
              >
                SIGN UP
              </Button>
            </Box>
          </Box>
          <Dialog open={showForgotPassword} onClose={handleForgotClose}>
            <DialogTitle>Forgot Password</DialogTitle>
            <DialogContent sx={{ minWidth: 350 }}>
              {forgotStep === 1 && (
                <>
                  <Typography mb={2}>Enter your registered email to receive an OTP.</Typography>
                  <TextField
                    label="Email Address"
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    fullWidth
                    required
                    sx={{ mb: 2 }}
                  />
                  {forgotError && <Typography color="error" fontSize={14}>{forgotError}</Typography>}
                  {forgotSuccess && <Typography color="success.main" fontSize={14}>{forgotSuccess}</Typography>}
                  <Button
                    variant="contained"
                    sx={{ bgcolor: '#ff6d00', color: '#fff', fontWeight: 700, borderRadius: 2, mt: 1, '&:hover': { bgcolor: '#ff8c1a' } }}
                    fullWidth
                    onClick={handleSendForgotOtp}
                    disabled={forgotLoading || !forgotEmail}
                  >
                    {forgotLoading ? <CircularProgress size={22} color="inherit" /> : 'Send OTP'}
                  </Button>
                </>
              )}
              {forgotStep === 2 && (
                <>
                  <Typography mb={2}>Enter the OTP sent to your email and set a new password.</Typography>
                  <TextField
                    label="OTP"
                    value={forgotOtp}
                    onChange={e => setForgotOtp(e.target.value)}
                    fullWidth
                    required
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="New Password"
                    type="password"
                    value={forgotNewPassword}
                    onChange={e => setForgotNewPassword(e.target.value)}
                    fullWidth
                    required
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Confirm Password"
                    type="password"
                    value={forgotConfirmPassword}
                    onChange={e => setForgotConfirmPassword(e.target.value)}
                    fullWidth
                    required
                    sx={{ mb: 2 }}
                  />
                  {forgotError && <Typography color="error" fontSize={14}>{forgotError}</Typography>}
                  {forgotSuccess && <Typography color="success.main" fontSize={14}>{forgotSuccess}</Typography>}
                  <Button
                    variant="contained"
                    sx={{ bgcolor: '#ff6d00', color: '#fff', fontWeight: 700, borderRadius: 2, mt: 1, '&:hover': { bgcolor: '#ff8c1a' } }}
                    fullWidth
                    onClick={handleVerifyForgotOtp}
                    disabled={forgotLoading || !forgotOtp || !forgotNewPassword || !forgotConfirmPassword}
                  >
                    {forgotLoading ? <CircularProgress size={22} color="inherit" /> : 'Reset Password'}
                  </Button>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleForgotClose}>Close</Button>
            </DialogActions>
          </Dialog>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage; 