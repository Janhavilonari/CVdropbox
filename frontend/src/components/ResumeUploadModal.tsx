import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, CircularProgress } from '@mui/material';
import { useSnackbar } from 'notistack';
import api from '../api/axios';

interface ResumeUploadModalProps {
  open: boolean;
  jobId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({ open, jobId, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      enqueueSnackbar('Please upload a PDF file', { variant: 'warning' });
      return;
    }
    
    // Validate all required fields
    if (!name.trim() || !email.trim() || !phone.trim()) {
      enqueueSnackbar('Please fill in all required fields (Name, Email, Phone)', { variant: 'warning' });
      return;
    }
    
    setLoading(true);
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const agency = user?.email;
      
      console.log('Upload data:', { name, email, phone, jobId, agency, fileName: file.name });
      
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim());
      formData.append('phone', phone.trim());
      formData.append('file', file);
      formData.append('jobId', jobId);
      formData.append('agency', agency);
      
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
      
      await api.post(`/api/jobs/${jobId}/resumes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      enqueueSnackbar('Resume uploaded successfully', { variant: 'success' });
      onSuccess();
      onClose();
      setName(''); setEmail(''); setPhone(''); setFile(null);
    } catch (err: any) {
      console.error('Upload error:', err);
      console.error('Error response:', err.response?.data);
      if (err.response?.data?.message?.toLowerCase().includes('duplicate')) {
        enqueueSnackbar('Duplicate resume for this job.', { variant: 'error' });
      } else {
        enqueueSnackbar(err.response?.data?.message || 'Upload failed', { variant: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Upload Resume</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField label="Candidate Name" value={name} onChange={e => setName(e.target.value)} required fullWidth />
          <TextField label="Candidate Email" value={email} onChange={e => setEmail(e.target.value)} required fullWidth type="email" />
          <TextField label="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} required fullWidth type="tel" />
          <Button variant="outlined" component="label" sx={{ borderRadius: 8 }}>
            {file ? file.name : 'Upload PDF Resume'}
            <input type="file" accept="application/pdf" hidden onChange={handleFileChange} />
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary" sx={{ borderRadius: 8 }}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" sx={{ borderRadius: 8 }} disabled={loading}>
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResumeUploadModal; 