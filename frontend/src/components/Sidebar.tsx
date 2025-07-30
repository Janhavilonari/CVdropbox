import React from 'react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Typography, Divider, Button, Avatar } from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import GroupIcon from '@mui/icons-material/Group';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useLocation, useNavigate } from 'react-router-dom';
import { removeToken } from '../utils/token';
import Badge from '@mui/material/Badge';
import api from '../api/axios';
import { useEffect, useState } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ChangePasswordDialog from './ChangePasswordDialog';

const SIDEBAR_WIDTH = 220;
const BLUE = '#1681c2';
const ORANGE = '#ff6d00';

const navItems = [
  {
    label: 'Jobs',
    icon: <WorkIcon />,
    path: '/dashboard',
    color: ORANGE,
    adminOnly: false,
  },
  {
    label: 'Upload Agency',
    icon: <GroupIcon />,
    path: '/upload-agency',
    color: '#fff',
    adminOnly: true,
  },
  {
    label: 'Notification',
    icon: <NotificationsIcon />,
    path: '/notifications',
    color: '#1976d2',
    adminOnly: false,
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const openMenu = Boolean(anchorEl);

  useEffect(() => {
    // Fetch notifications and count unread
    api.get('/api/auth/notifications').then(res => {
      const count = Array.isArray(res.data) ? res.data.filter((n: any) => !n.read).length : 0;
      setUnreadCount(count);
    }).catch(() => setUnreadCount(0));
  }, []);

  const handleLogout = () => {
    removeToken();
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const handleNavClick = (item: any) => {
    if (item.label === 'Notification') {
      // Mark all as read when opening notifications
      api.post('/api/auth/notifications/mark-read').then(() => setUnreadCount(0));
    }
    navigate(item.path);
  };

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleChangePasswordClick = () => {
    setShowChangePassword(true);
    handleMenuClose();
  };
  const handleLogoutClick = () => {
    handleMenuClose();
    handleLogout();
  };

  return (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        bgcolor: BLUE,
        color: '#fff',
        minHeight: '100vh',
        borderTopRightRadius: 32,
        borderBottomRightRadius: 32,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 3,
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1200,
      }}
    >
      {/* Logo and App Name */}
      <Box sx={{ mb: 4, width: '100%', textAlign: 'center' }}>
        <img src="/aaic-logo.jpg" alt="logo" style={{ height: 72, marginBottom: 2, borderRadius: 12 }} />
        <Typography variant="h6" fontWeight={900} sx={{ letterSpacing: 1, color: '#fff', mt: 1 }}>
          AAIC CV DROPBOX
        </Typography>
      </Box>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: '80%', mb: 2 }} />
      {/* Navigation */}
      <List sx={{ width: '100%' }}>
        {navItems
          .filter(item => user?.role !== 'admin' || item.label !== 'Notification')
          .filter(item => user?.role === 'admin' || !item.adminOnly)
          .map((item) => {
          const selected = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.label}
              selected={selected}
              onClick={() => handleNavClick(item)}
              sx={{
                borderRadius: 2,
                mx: 2,
                mb: 1,
                color: selected ? ORANGE : '#fff',
                bgcolor: selected ? 'rgba(255,255,255,0.08)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
              }}
            >
              <ListItemIcon sx={{ color: selected ? ORANGE : '#fff', minWidth: 36 }}>
                {item.label === 'Notification' ? (
                  <Badge badgeContent={unreadCount} color="primary" invisible={unreadCount === 0} overlap="circular" sx={{ '& .MuiBadge-badge': { right: -2, top: 8, fontSize: 12, minWidth: 18, height: 18, borderRadius: '50%' } }}>
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: selected ? 700 : 500,
                  fontSize: 16,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
};

export default Sidebar; 