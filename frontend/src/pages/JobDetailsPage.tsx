import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, Grid, Chip, MenuItem, Select, InputLabel, FormControl, Snackbar, Alert, TextField } from '@mui/material';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
  useDndMonitor,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '../api/axios';
import { useDropzone } from 'react-dropzone';
import Sidebar from '../components/Sidebar';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Linkify from 'react-linkify';

interface Resume {
  _id: string;
  name: string;
  email: string;
  phone: string;
  fileUrl: string;
  status: 'pending' | 'shortlisted' | 'rejected';
  uploadedBy: string;
  createdAt: string;
  uploadedAt?: string;
  candidatePhone?: string;
  uploadedByName?: string;
}

interface Job {
  _id: string;
  title: string;
  description: string;
  deadline: string; // Added deadline property
  resumes: Resume[];
}

const columns = [
  { id: 'pending', label: 'Pending', color: '#1976d2' },
  { id: 'shortlisted', label: 'Shortlisted', color: '#2e7d32' },
  { id: 'rejected', label: 'Rejected', color: '#d32f2f' },
];

// Helper component for sortable resume cards
function SortableResumeCard({ resume, col, userRole }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: resume._id,
  });
  const backendUrl = process.env.REACT_APP_API_URL;
  const downloadUrl = resume.fileUrl && resume.fileUrl.startsWith("http")
    ? resume.fileUrl
    : backendUrl + resume.fileUrl;
  // Extract just the file name (after last dash or underscore)
  let fileName = resume.fileUrl ? resume.fileUrl.split('/').pop() || '' : 'No file';
  fileName = fileName.replace(/^([0-9]+[-_])+/g, '');
  // Format date as dd/mm/yyyy
  let uploadedDate = '-';
  if (resume.uploadedAt) {
    const d = new Date(resume.uploadedAt);
    uploadedDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }
  // Prefer agency name if available, fallback to uploadedBy
  const agencyName = resume.uploadedByName || resume.uploadedBy || '-';
  // Use candidatePhone for phone number
  const phone = resume.candidatePhone || resume.phone || '-';
  return (
    <Paper
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        marginBottom: 10,
        padding: 10,
        cursor: userRole === 'admin' ? 'grab' : 'default',
        minWidth: 240,
        maxWidth: 280,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
      {...attributes}
      {...listeners}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
        <Typography fontSize={12} color="#1976d2" fontWeight={600}>
          Uploaded: {uploadedDate}
        </Typography>
        <Chip label={resume.status} sx={{ bgcolor: col.color, color: '#fff', fontWeight: 600, borderRadius: 2, fontSize: 12 }} />
      </Box>
      <Typography fontWeight={600} fontSize={15} mb={0.5} sx={{ wordBreak: 'break-all' }}>
        {fileName}
      </Typography>
      <Typography fontSize={12} color="text.secondary" mb={0.5}>
        Phone: {phone}
      </Typography>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Typography fontSize={12} color="text.secondary">
          Uploaded By:
        </Typography>
        <Typography fontSize={12} color="#1976d2" fontWeight={600}>
          {agencyName}
        </Typography>
      </Box>
      <Box display="flex" alignItems="center" gap={1}>
        {resume.fileUrl && (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ textDecoration: 'none' }}
          >
            <Button
              variant="contained"
              size="small"
              sx={{
                bgcolor: '#1976d2',
                color: '#fff',
                fontWeight: 700,
                borderRadius: 2,
                minWidth: 0,
                px: 2,
                py: 0.5,
                fontSize: 12,
                boxShadow: 0,
                textTransform: 'none',
                '&:hover': { bgcolor: '#1681c2' },
              }}
              disableElevation
            >
              OPEN
            </Button>
          </a>
        )}
      </Box>
    </Paper>
  );
}

// Add DroppableColumn component with visual feedback and placeholder
function DroppableColumn({ id, children, isOver, dragging }: { id: string; children: React.ReactNode; isOver: boolean; dragging: boolean }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: 300,
        background: isOver ? 'rgba(22, 129, 194, 0.08)' : undefined,
        border: isOver ? '2px dashed #1681c2' : undefined,
        transition: 'background 0.2s, border 0.2s',
        position: 'relative',
      }}
    >
      {children}
      {/* Show a drop placeholder at the end if dragging over this column */}
      {isOver && dragging && (
        <div style={{
          minHeight: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1681c2',
          fontWeight: 600,
          fontSize: 14,
          border: '1.5px dashed #1681c2',
          borderRadius: 8,
          marginTop: 8,
          background: '#e3f2fd',
        }}>
          Drop here
        </div>
      )}
    </div>
  );
}

const JobDetailsPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [agency, setAgency] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumes, setResumes] = useState<{ [key: string]: Resume[] }>({ pending: [], shortlisted: [], rejected: [] });
  const [userRole, setUserRole] = useState<'admin' | 'agency' | null>(null);
  const [agencies, setAgencies] = useState<string[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [userId, setUserId] = useState<string>('');
  const [dragLoading, setDragLoading] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  // Track which column is being hovered for drop
  const [activeCol, setActiveCol] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Helper to check if job is expired
  const isJobExpired = !!job?.deadline && new Date(job.deadline) < new Date();

  // DndMonitor component to use useDndMonitor inside DndContext
  function DndMonitor({ setIsDragging, setActiveCol }: { setIsDragging: (v: boolean) => void, setActiveCol: (v: string | null) => void }) {
    useDndMonitor({
      onDragStart: () => setIsDragging(true),
      onDragEnd: () => {
        setIsDragging(false);
        setActiveCol(null);
      },
      onDragCancel: () => {
        setIsDragging(false);
        setActiveCol(null);
      },
      onDragOver: (event) => {
        if (event.over) setActiveCol(event.over.id as string);
        else setActiveCol(null);
      },
    });
    return null;
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': [] },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles[0]) {
        setResumeFile(acceptedFiles[0]);
      }
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    // Fetch user role and agency first
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userObj = JSON.parse(userStr);
      setUser(userObj);
      setUserRole(userObj.role);
      setUserId(userObj.id || userObj._id);
      if (userObj.role === 'agency') setAgency(userObj.email);
    }
  }, []);

  useEffect(() => {
    if (!jobId || !userId) return;
    
    // Fetch job details
    api.get(`/api/jobs/${jobId}`).then(res => {
      console.log('Job data received:', res.data);
      console.log('User ID:', userId);
      console.log('Resumes:', res.data.resumes);
      console.log('Resume statuses:', res.data.resumes?.map((r: any) => ({ id: r._id, status: r.status, uploadedBy: r.uploadedBy })));
      setJob(res.data);
      const grouped = { pending: [], shortlisted: [], rejected: [] } as { [key: string]: Resume[] };
      res.data.resumes.forEach((r: Resume) => {
        grouped[r.status] = grouped[r.status] || [];
        grouped[r.status].push(r);
      });
      setResumes(grouped);
    });
    
    // Fetch agencies (for dropdown)
    api.get('/api/auth/agencies').then(res => setAgencies(res.data));
  }, [jobId, userId]);

  const handleUpload = async () => {
    if (!resumeFile || !agency) return;
    const formData = new FormData();
    formData.append('file', resumeFile);
    formData.append('agency', agency);
    formData.append('jobId', jobId!);
    try {
      await api.post(`/api/jobs/${jobId}/resumes`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      window.location.reload();
    } catch (err: any) {
      if (err.response && err.response.status === 409) {
        setSnackbarMessage('This resume has already been received for this job.');
        setSnackbarOpen(true);
      } else if (err.response && err.response.data && err.response.data.message) {
        setSnackbarMessage(err.response.data.message);
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage('Failed to upload resume. Please try again.');
        setSnackbarOpen(true);
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    console.log('DragEnd event:', event);
    const { active, over } = event;
    if (!over || !active) return;
    // Find which column the item was dropped into
    const overCol = columns.find(col => col.id === over.id);
    if (!overCol) return;
    // Find the resume
    let foundResume: Resume | undefined;
    let fromCol: string | undefined;
    for (const col of columns) {
      foundResume = resumes[col.id].find(r => r._id === active.id);
      if (foundResume) {
        fromCol = col.id;
        break;
      }
    }
    if (!foundResume || !fromCol) return;
    // Restrict only moving back to pending from non-pending columns
    if (over.id === 'pending' && fromCol !== 'pending') {
      // Prevent moving back to pending
      return;
    }
    // Only update if moved to a different column
    if (fromCol !== over.id) {
      setDragLoading(true);
      try {
        const patchRes = await api.patch(`/api/resumes/${active.id}/status`, { status: over.id });
        console.log('PATCH response:', patchRes.data);
        // Refetch job data from backend
        const res = await api.get(`/api/jobs/${jobId}`);
        console.log('Refetched job data:', res.data);
        const grouped = { pending: [], shortlisted: [], rejected: [] } as { [key: string]: Resume[] };
        res.data.resumes.forEach((r: Resume) => {
          grouped[r.status] = grouped[r.status] || [];
          grouped[r.status].push(r);
        });
        console.log('Grouped resumes after refetch:', grouped);
        setJob(res.data);
        setResumes(grouped);
      } catch (err: any) {
        setSnackbarMessage(err.response?.data?.message || 'Failed to update resume status.');
        setSnackbarOpen(true);
      } finally {
        setDragLoading(false);
      }
    }
  };

  const handleDeleteJob = async () => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) return;
    await api.delete(`/api/jobs/${jobId}`);
    navigate('/dashboard');
  };

  if (!job) return <div>Loading...</div>;

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box
        sx={{
          flex: 1,
          minHeight: '100vh',
          bgcolor: '#f7f9fb',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 4,
          ml: 8,
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 900,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Button onClick={() => navigate(-1)} variant="outlined">
            BACK TO JOBS
          </Button>
          {userRole === 'admin' && (
            <Button color="error" variant="contained" onClick={handleDeleteJob}>
              DELETE JOB
            </Button>
          )}
        </Box>
        <Box sx={{ width: '100%', maxWidth: 900, mb: 3 }}>
          {/* 1. Description Card */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h5" fontWeight={700} mb={1}>{job?.title}</Typography>
            <Typography
              variant="body1"
              sx={{
                mb: 2,
                minHeight: 32,
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
                {job?.description}
              </Linkify>
            </Typography>
          </Paper>

          {/* 2. Upload Agency Card */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Select Agency</Typography>
            {userRole === 'agency' ? (
              <Typography variant="subtitle1" fontWeight={600}>Upload Agency: <span style={{color:'#1976d2'}}>{user?.name}</span></Typography>
            ) : (
              <FormControl fullWidth>
                <InputLabel id="agency-select-label">Select Agency</InputLabel>
              <Select
                  labelId="agency-select-label"
                value={agency}
                label="Select Agency"
                onChange={e => setAgency(e.target.value)}
              >
                {agencies.map((a: any) => (
                    <MenuItem key={a._id || a.email || a} value={a.email || a}>
                      {a.name ? `${a.name} (${a.email})` : a.email || a}
                    </MenuItem>
                ))}
              </Select>
            </FormControl>
            )}
          </Paper>

          {/* 3. Drag and Drop Upload Card */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Upload Resume</Typography>
            <Box {...getRootProps()} sx={{ border: '2px dashed #1681c2', borderRadius: 2, p: 4, textAlign: 'center', bgcolor: isDragActive ? '#e3f2fd' : '#fafbfc', cursor: 'pointer', mb: 1, opacity: userRole === 'agency' && isJobExpired ? 0.5 : 1, pointerEvents: userRole === 'agency' && isJobExpired ? 'none' : 'auto' }}>
              <input {...getInputProps()} disabled={userRole === 'agency' && isJobExpired} />
              <CloudUploadIcon sx={{ fontSize: 48, color: '#1681c2', mb: 1 }} />
              {resumeFile ? (
                <Typography>{resumeFile.name}</Typography>
              ) : (
                <Typography color="text.secondary">Drag and drop a resume here, or click to select</Typography>
              )}
            </Box>
            <Typography color="#1681c2" fontSize={13} mb={1}>Only PDF files are accepted</Typography>
            <Button variant="contained" sx={{ mb: 1 }} onClick={handleUpload} disabled={!resumeFile || !agency || (userRole === 'agency' && isJobExpired)}>Upload</Button>
            {userRole === 'agency' && isJobExpired && (
              <Typography color="error" fontSize={13} mt={1}>This job is expired. You cannot upload or move resumes.</Typography>
            )}
          </Paper>

          {/* 4. Uploaded Resumes Card */}
          <Paper sx={{ p: 3, mt: 2, mb: 2, boxShadow: 2, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Uploaded Resumes</Typography>
            {userRole === 'agency' ? (
              <Grid container spacing={2}>
                {(() => {
                  const filteredResumes = job?.resumes?.filter(r => r.uploadedBy === userId) || [];
                  if (filteredResumes.length === 0) {
                    return <Typography color="text.secondary" ml={2}>No resumes uploaded yet.</Typography>;
                  }
                  return filteredResumes.map(resume => {
                    // Format file name
                    let fileName = resume.fileUrl ? resume.fileUrl.split('/').pop() || '' : 'No file';
                    fileName = fileName.replace(/^([0-9]+[-_])+/g, '');
                    // Format date as dd/mm/yyyy
                    let uploadedDate = '-';
                    if (resume.uploadedAt) {
                      const d = new Date(resume.uploadedAt);
                      uploadedDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                    } else if (resume.createdAt) {
                      const d = new Date(resume.createdAt);
                      uploadedDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                    }
                    const agencyName = resume.uploadedByName || resume.uploadedBy || '-';
                    const phone = resume.candidatePhone || resume.phone || '-';
                    const backendUrl = process.env.REACT_APP_API_URL;
                    const downloadUrl = resume.fileUrl && resume.fileUrl.startsWith("http")
                      ? resume.fileUrl
                      : backendUrl + resume.fileUrl;
                    // Status chip
                    let statusLabel = '';
                    let statusColor = '#888';
                    if (resume.status === 'pending') { statusLabel = 'Pending'; statusColor = '#1976d2'; }
                    else if (resume.status === 'shortlisted') { statusLabel = 'Shortlisted'; statusColor = '#2e7d32'; }
                    else if (resume.status === 'rejected') { statusLabel = 'Rejected'; statusColor = '#d32f2f'; }
                    return (
                      <Grid item xs={12} md={6} lg={4} key={resume._id}>
                        <Paper sx={{ p: 2, mb: 2, borderLeft: '5px solid #1681c2', boxShadow: 2, borderRadius: 2 }}>
                          <Typography fontSize={12} color="#1976d2" fontWeight={600} mb={0.5}>
                            Uploaded: {uploadedDate}
                          </Typography>
                          <Typography fontWeight={600} fontSize={15} mb={0.5} sx={{ wordBreak: 'break-all' }}>
                            {fileName}
                          </Typography>
                          <Typography fontSize={12} color="text.secondary" mb={0.5}>
                            Phone: {phone}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Typography fontSize={12} color="text.secondary">
                              Uploaded By:
                            </Typography>
                            <Typography fontSize={12} color="#1976d2" fontWeight={600}>
                              {agencyName}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1} mt={1}>
                            <Chip label={statusLabel} sx={{ bgcolor: statusColor, color: '#fff', fontWeight: 600, borderRadius: 2, fontSize: 13, mr: 'auto' }} />
                            {resume.fileUrl && (
                              <a
                                href={downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ textDecoration: 'none' }}
                              >
                                <Button
                                  variant="contained"
                                  size="small"
                                  sx={{
                                    bgcolor: '#1976d2',
                                    color: '#fff',
                                    fontWeight: 700,
                                    borderRadius: 2,
                                    minWidth: 0,
                                    px: 2,
                                    py: 0.5,
                                    fontSize: 12,
                                    boxShadow: 0,
                                    textTransform: 'none',
                                    '&:hover': { bgcolor: '#1681c2' },
                                  }}
                                  disableElevation
                                >
                                  OPEN
                                </Button>
                              </a>
                            )}
                          </Box>
                        </Paper>
                      </Grid>
                    );
                  });
                })()}
              </Grid>
            ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={userRole === 'admin' || (userRole === 'agency' && !isJobExpired) ? handleDragEnd : undefined}
        >
         {/* DndMonitor must be inside DndContext */}
         <DndMonitor setIsDragging={setIsDragging} setActiveCol={setActiveCol} />
          <Grid container spacing={2}>
            {columns.map(col => (
              <Grid item xs={12} md={4} key={col.id}>
                <DroppableColumn id={col.id} isOver={activeCol === col.id} dragging={isDragging}>
                  <Paper sx={{ p: 2, minHeight: 300, borderRadius: 2, boxShadow: 1, background: 'transparent', boxSizing: 'border-box' }}>
                  <Typography variant="h6" sx={{ color: col.color, mb: 2 }}>{col.label}</Typography>
                  <SortableContext
                    id={col.id}
                    items={resumes[col.id].map(r => r._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {resumes[col.id].map((resume) => (
                      <SortableResumeCard
                        key={resume._id}
                        resume={resume}
                        col={col}
                        userRole={userRole}
                      />
                    ))}
                  </SortableContext>
                </Paper>
                      </DroppableColumn>
              </Grid>
            ))}
          </Grid>
        </DndContext>
            )}
          </Paper>
        </Box>
        <Snackbar open={snackbarOpen || dragLoading} autoHideDuration={dragLoading ? null : 6000} onClose={() => setSnackbarOpen(false)}>
          {dragLoading ? (
            <Alert severity="info" sx={{ width: '100%' }}>Updating resume status...</Alert>
          ) : (
          <Alert onClose={() => setSnackbarOpen(false)} severity="error" sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
          )}
        </Snackbar>
      </Box>
    </Box>
  );
};

export default JobDetailsPage; 