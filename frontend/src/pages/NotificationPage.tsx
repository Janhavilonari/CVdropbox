import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, List, ListItem, ListItemText, Chip, Stack } from '@mui/material';
import api from '../api/axios';

interface Notification {
  _id: string;
  message: string;
  type: 'resume_status' | 'new_job';
  read: boolean;
  createdAt: string;
  jobDeadline?: string; // Add optional deadline field
  expired?: boolean;
}

const NotificationPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/auth/notifications');
      setNotifications(res.data);
    } catch (err) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async () => {
    await api.post('/api/auth/notifications/mark-read');
    fetchNotifications();
  };

  return (
    <Box p={{ xs: 2, md: 4 }} bgcolor="#f7f9fb" minHeight="100vh">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700} color="#000">
          Notifications
        </Typography>
        <Button
          variant="contained"
          sx={{ bgcolor: '#1681c2', color: '#fff', fontWeight: 700, borderRadius: 2, px: 3, py: 1.2, fontSize: 16, boxShadow: 2, '&:hover': { bgcolor: '#1a9be6' } }}
          onClick={handleMarkRead}
          disabled={loading}
        >
          Mark all as read
        </Button>
      </Stack>
      <List>
        {notifications.length === 0 && (
          <Typography color="text.secondary">No notifications yet.</Typography>
        )}
        {notifications.map(n => (
          <ListItem key={n._id} sx={{ bgcolor: n.read ? '#f5f5f5' : '#e3f2fd', borderRadius: 2, mb: 2 }}>
            <ListItemText
              primary={n.message}
              secondary={
                <>
                  {new Date(n.createdAt).toLocaleString()}
                  {n.jobDeadline && (
                    <span style={{ marginLeft: 12, color: '#1976d2', fontWeight: 600 }}>
                      | Applicable till: {new Date(n.jobDeadline).toLocaleDateString()}
                    </span>
                  )}
                  {n.expired && (
                    <span style={{ marginLeft: 12, color: '#888', fontWeight: 600 }}>
                      | <span style={{ color: '#d32f2f' }}>Expired</span>
                    </span>
                  )}
                </>
              }
              primaryTypographyProps={{ fontWeight: n.read ? 400 : 700 }}
            />
            <Chip
              label={
                n.type === 'resume_status'
                  ? n.message.toLowerCase().includes('shortlisted')
                    ? 'Shortlisted'
                    : n.message.toLowerCase().includes('rejected')
                    ? 'Rejected'
                    : 'Resume Status'
                  : 'New Job'
              }
              sx={{
                ml: 2,
                bgcolor:
                  n.type === 'resume_status'
                    ? n.message.toLowerCase().includes('shortlisted')
                      ? '#2e7d32'
                      : n.message.toLowerCase().includes('rejected')
                      ? '#d32f2f'
                      : '#1976d2'
                    : '#43a047',
                color: '#fff',
                fontWeight: 700,
              }}
            />
            {n.expired && (
              <Chip label="Expired" color="default" sx={{ ml: 1, bgcolor: '#eee', color: '#d32f2f', fontWeight: 700 }} />
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default NotificationPage; 