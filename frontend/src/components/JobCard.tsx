import React from 'react';
import { Card, CardContent, Typography, Chip, Button, Stack, Box, CardActionArea } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Linkify from 'react-linkify';

export interface Resume {
  fileUrl: string;
  uploadedBy: string;
  status: 'pending' | 'shortlisted' | 'rejected';
  uploadedAt: string;
}

export interface Job {
  _id: string;
  title: string;
  description: string;
  resumes: Resume[];
  status?: string;
}

interface JobCardProps {
  job: Job;
  isAgency: boolean;
  isAdmin: boolean;
  onUpload: (job: Job) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, isAgency, isAdmin, onUpload }) => {
  const navigate = useNavigate();
  const resumeCount = job.resumes?.length || 0;

  // For agency: show status of the most recent resume (if any)
  let statusLabel = '';
  if (resumeCount > 0) {
    // Sort by uploadedAt (fallback to 0 if missing)
    const sortedResumes = [...job.resumes].sort((a, b) => {
      const aDate = new Date(a.uploadedAt || 0).getTime();
      const bDate = new Date(b.uploadedAt || 0).getTime();
      return bDate - aDate;
    });
    const latestResume = sortedResumes[0];
    if (latestResume.status === 'pending') statusLabel = 'Pending';
    else if (latestResume.status === 'shortlisted') statusLabel = 'Shortlisted';
    else if (latestResume.status === 'rejected') statusLabel = 'Rejected';
  }

  return (
    <Card
      sx={{
        borderRadius: '8px',
        boxShadow: 3,
        width: 340,
        height: 160,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        p: 0,
        position: 'relative',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', p: 2, pb: 0 }}>
        <Typography variant="h6" fontWeight={700} color="#000" sx={{ flex: 1, pr: 1, fontSize: 18, lineHeight: 1.2 }}>
            {job.title}
          </Typography>
        <Button
          variant="contained"
          size="small"
          sx={{
            bgcolor: '#1681c2',
            color: '#fff',
            fontWeight: 700,
            borderRadius: 2,
            minWidth: 0,
            px: 2,
            py: 0.5,
            fontSize: 13,
            boxShadow: 0,
            textTransform: 'none',
            '&:hover': { bgcolor: '#1976d2' },
          }}
          disableElevation
          onClick={e => {
            e.stopPropagation();
            navigate(`/jobs/${job._id}`);
          }}
        >
          open
        </Button>
      </Box>
      <Box sx={{ px: 2, pt: 1, flex: 1, display: 'flex', alignItems: 'flex-start', minHeight: '1.4em', maxHeight: '4.2em' }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            minHeight: 48,
            '& a': {
              color: '#1976d2 !important',
              textDecoration: 'underline !important',
              fontWeight: 600,
              wordBreak: 'break-all',
            },
          }}
        >
          <Linkify
            componentDecorator={(decoratedHref, decoratedText, key) => (
              <a
                href={decoratedHref}
                key={key}
                target="_blank"
                rel="noopener noreferrer"
              >
                {decoratedText}
              </a>
            )}
        >
          {job.description}
          </Linkify>
          </Typography>
      </Box>
      <Box sx={{ px: 2, pb: 2, pt: 0, display: 'flex', alignItems: 'center' }}>
        <Button
          variant="text"
          sx={{
            color: '#1681c2',
            fontWeight: 600,
            textTransform: 'none',
            fontSize: 15,
            p: 0,
            minWidth: 0,
            '&:hover': { textDecoration: 'underline', bgcolor: 'transparent' },
          }}
          onClick={e => {
            e.stopPropagation();
            // Placeholder: could open a modal or navigate to resumes list
          }}
        >
          {resumeCount} {resumeCount === 1 ? 'resume' : 'resumes'}
        </Button>
        {/* Status Button for Agency removed as per new requirement */}
      </Box>
    </Card>
  );
};

export default JobCard; 