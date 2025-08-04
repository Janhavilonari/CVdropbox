import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim() || !email.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/api/auth/agency-signup', { name, email });
      setSuccess(response.data.message);
      
      // Store values before clearing for prefill
      const userData = { name, email };
      setName('');
      setEmail('');
      
      // Redirect to login page after 2 seconds with user data
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            prefillData: userData
          } 
        });
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f7f9fb">
      <Card sx={{ minWidth: 350, maxWidth: 400, p: 2, borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" fontWeight={700} textAlign="center" mb={2} color="#1681c2">
            Agency Registration
          </Typography>
          <form onSubmit={handleSignup}>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Agency Name *"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Email Address *"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                fullWidth
              />
              <Button
                variant="contained"
                type="submit"
                disabled={loading}
                sx={{
                  bgcolor: '#ff6d00',
                  color: '#fff',
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 4,
                  py: 1.2,
                  fontSize: 16,
                  '&:hover': { bgcolor: '#ff8c1a' }
                }}
                fullWidth
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
              </Button>
              {success && <Alert severity="success">{success}</Alert>}
              {error && <Alert severity="error">{error}</Alert>}
              <Typography variant="body2" color="text.secondary" textAlign="center" mt={2}>
                Already have an account?{' '}
                <span
                  style={{ color: '#1681c2', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => navigate('/login')}
                >
                  Login
                </span>
              </Typography>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SignupPage; 