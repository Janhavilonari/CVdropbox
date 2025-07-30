import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Button, Stack } from '@mui/material';
import { useSnackbar } from 'notistack';
import api from '../api/axios';
import JobCard, { Job } from '../components/JobCard';
import CreateJobModal from '../components/CreateJobModal';
import ResumeUploadModal from '../components/ResumeUploadModal';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'agency';
}

const DashboardPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [createJobOpen, setCreateJobOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/api/jobs');
      const jobsWithResumes: Job[] = res.data.map((job: any) => ({
        _id: job._id,
        title: job.title,
        resumes: job.resumes || [],
      }));
      setJobs(jobsWithResumes);
    } catch (err: any) {
      enqueueSnackbar('Failed to load jobs', { variant: 'error' });
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCreateJobSuccess = () => {
    setCreateJobOpen(false);
    fetchJobs();
  };

  const handleUploadClick = (job: Job) => {
    setSelectedJob(job);
    setUploadOpen(true);
  };

  const handleUploadSuccess = () => {
    setUploadOpen(false);
    fetchJobs();
  };

  return (
    <Box p={{ xs: 2, md: 4 }} bgcolor="#f7f9fb" minHeight="100vh">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700} color="#000">
          Job Positions
        </Typography>
        {user?.role === 'admin' && (
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            sx={{ bgcolor: '#ff6d00', color: '#fff', fontWeight: 700, borderRadius: 2, px: 3, py: 1.2, fontSize: 16, boxShadow: 2, '&:hover': { bgcolor: '#ff8c1a' } }}
            onClick={() => setCreateJobOpen(true)}
          >
            CREATE NEW JOB
          </Button>
          <Button
            variant="contained"
            sx={{ bgcolor: '#1681c2', color: '#fff', fontWeight: 700, borderRadius: 2, px: 3, py: 1.2, fontSize: 16, boxShadow: 2, '&:hover': { bgcolor: '#1a9be6' } }}
            onClick={() => window.location.href = '/upload-agency'}
          >
            UPLOAD AGENCY
          </Button>
        </Stack>
        )}
      </Stack>
      <Grid container spacing={3}>
        {jobs.map(job => {
          let filteredResumes = job.resumes;
          if (user?.role === 'agency' && user?.email && user?.id) {
            filteredResumes = job.resumes.filter(r =>
              (r.uploadedBy === user.id) ||
              // @ts-expect-error: uploadedByEmail may exist in some backend responses
              (r.uploadedByEmail === user.email) ||
              (r.uploadedBy === user.email) // fallback for legacy data
            );
          }
          return (
          <Grid item xs={12} md={4} key={job._id}>
            <JobCard
                job={{ ...job, resumes: filteredResumes }}
              isAgency={user?.role === 'agency'}
              isAdmin={user?.role === 'admin'}
              onUpload={() => {}}
            />
          </Grid>
          );
        })}
      </Grid>
      {/* Create Job Modal */}
      <CreateJobModal
        open={createJobOpen}
        onClose={() => setCreateJobOpen(false)}
        onSuccess={handleCreateJobSuccess}
        onJobCreated={(jobId) => navigate(`/jobs/${jobId}`)}
      />
      {/* Upload Resume Modal */}
      {selectedJob && (
        <ResumeUploadModal
          open={uploadOpen}
          jobId={selectedJob._id}
          onClose={() => setUploadOpen(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </Box>
  );
};

export default DashboardPage; 