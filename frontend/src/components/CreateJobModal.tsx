import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, CircularProgress } from '@mui/material';
import { useSnackbar } from 'notistack';
import api from '../api/axios';

interface CreateJobModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onJobCreated?: (jobId: string) => void;
}

const CreateJobModal: React.FC<CreateJobModalProps> = ({ open, onClose, onSuccess, onJobCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  if (user?.role !== 'admin') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted');
    setLoading(true);
    try {
      const res = await api.post('/api/jobs', { title, description, deadline });
      enqueueSnackbar('Job created successfully', { variant: 'success' });
      setTitle('');
      setDescription('');
      setDeadline('');
      if (onJobCreated) onJobCreated(res.data._id);
      onSuccess();
      onClose();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || 'Job creation failed', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', color: '#1681c2', fontWeight: 700 }}>Create New Job</DialogTitle>
      <DialogContent>
        <Box
          component="form"
          onSubmit={handleSubmit}
          display="flex"
          flexDirection="column"
          gap={2}
          mt={1}
        >
          <TextField label="Job Title" value={title} onChange={e => setTitle(e.target.value)} required fullWidth sx={{ fontWeight: 600 }} />
          <TextField label="Job Description" value={description} onChange={e => setDescription(e.target.value)} fullWidth multiline minRows={3} />
          <TextField
            label="Deadline"
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            required
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <Button
            type="submit"
            variant="contained"
            sx={{ bgcolor: '#ff6d00', color: '#fff', fontWeight: 700, borderRadius: 2, px: 4, py: 1.2, fontSize: 16, '&:hover': { bgcolor: '#ff8c1a' } }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'CREATE'}
          </Button>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="secondary" sx={{ borderRadius: 2, fontWeight: 700 }}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateJobModal; 