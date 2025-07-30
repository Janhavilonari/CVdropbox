import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import AgencyManagementPage from './pages/AgencyManagementPage';
import Sidebar from './components/Sidebar';
import { getToken, removeToken } from './utils/token';
import { Box, Button, CircularProgress, Avatar, Menu, MenuItem, IconButton } from '@mui/material';
import JobDetailsPage from './pages/JobDetailsPage';
import api from './api/axios';
import NotificationPage from './pages/NotificationPage';
import ChangePasswordDialog from './components/ChangePasswordDialog';

const SIDEBAR_WIDTH = 220;

const PrivateLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleLogout = () => {
    removeToken();
    localStorage.removeItem('user');
    window.location.href = '/';
  };
  const handleChangePassword = () => {
    setShowChangePassword(true);
    handleMenuClose();
  };
  return (
    <Box display="flex">
      <Sidebar />
      <Box flex={1} ml={`${SIDEBAR_WIDTH}px`} minHeight="100vh" bgcolor="#f7f9fb">
        <Box display="flex" alignItems="center" p={2} justifyContent="flex-end">
          {user && (
            <Box display="flex" alignItems="center">
              <IconButton onClick={handleMenuOpen} sx={{ p: 0, mr: 1 }}>
                <Avatar sx={{ bgcolor: '#1681c2', color: '#fff', width: 32, height: 32, fontWeight: 700 }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                </Avatar>
              </IconButton>
              <span style={{ fontWeight: 700, color: '#1681c2', fontSize: 18, cursor: 'pointer' }} onClick={handleMenuOpen}>
                {user.name}
              </span>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <MenuItem onClick={handleChangePassword}>Change Password</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
              <ChangePasswordDialog open={showChangePassword} onClose={() => setShowChangePassword(false)} />
            </Box>
          )}
        </Box>
        {children}
      </Box>
    </Box>
  );
};

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const token = getToken();

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        setIsValid(false);
        console.log('No token found in PrivateRoute');
        return;
      }

      try {
        console.log('Validating token in PrivateRoute:', token);
        await api.get('/api/auth/validate-token');
        setIsValid(true);
        console.log('Token valid in PrivateRoute');
      } catch (error) {
        // Token is invalid, remove it
        removeToken();
        localStorage.removeItem('user');
        setIsValid(false);
        console.log('Token invalid in PrivateRoute:', error);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  if (isValidating) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return isValid ? children : <Navigate to="/" />;
};

const RootRoute: React.FC = () => {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const token = getToken();

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        setIsValid(false);
        console.log('No token found in RootRoute');
        return;
      }

      try {
        console.log('Validating token in RootRoute:', token);
        await api.get('/api/auth/validate-token');
        setIsValid(true);
        console.log('Token valid in RootRoute');
      } catch (error) {
        removeToken();
        localStorage.removeItem('user');
        setIsValid(false);
        console.log('Token invalid in RootRoute:', error);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  if (isValidating) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return isValid ? <Navigate to="/dashboard" /> : <LoginPage />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <PrivateLayout>
                <DashboardPage />
              </PrivateLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/upload-agency"
          element={
            <PrivateRoute>
              <PrivateLayout>
                <AgencyManagementPage />
              </PrivateLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/jobs/:jobId"
          element={
            <PrivateRoute>
              <JobDetailsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <PrivateRoute>
              <PrivateLayout>
                <NotificationPage />
              </PrivateLayout>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App; 