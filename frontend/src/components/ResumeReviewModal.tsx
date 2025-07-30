import React, { useEffect, useState } from 'react';
import {Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress, Box, Typography, Paper, Chip
} from '@mui/material';
import { useSnackbar } from 'notistack';
import api from '../api/axios';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Resume {
  _id: string;
  name: string;
  email: string;
  phone: string;
  fileUrl?: string;
  status: 'pending' | 'shortlisted' | 'rejected';
  createdAt?: string;
  uploadedBy?: string;
}

interface ResumeReviewModalProps {
  open: boolean;
  jobId: string;
  onClose: () => void;
  onStatusChange: () => void;
}

const statusColors = {
  pending: '#1976d2',
  shortlisted: '#2e7d32',
  rejected: '#d32f2f',
};

const statusLabels = {
  pending: 'Pending',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
};

const ResumeReviewModal: React.FC<ResumeReviewModalProps> = ({ open, jobId, onClose, onStatusChange }) => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/jobs/${jobId}/resumes`);
      setResumes(res.data);
    } catch (err: any) {
      enqueueSnackbar('Failed to load resumes', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchResumes();
    // eslint-disable-next-line
  }, [open]);

  // Kanban columns
  const columns: Array<'pending' | 'shortlisted' | 'rejected'> = ['pending', 'shortlisted', 'rejected'];
  const columnResumes = {
    pending: resumes.filter(r => r.status === 'pending'),
    shortlisted: resumes.filter(r => r.status === 'shortlisted'),
    rejected: resumes.filter(r => r.status === 'rejected'),
  };

  // DnD-kit setup
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id as string;
    const overColumn = over.id as 'pending' | 'shortlisted' | 'rejected';
    const resume = resumes.find(r => r._id === activeId);
    // Prevent moving back to pending
    if (resume && overColumn === 'pending' && resume.status !== 'pending') {
      enqueueSnackbar('Cannot move resume back to pending once it is shortlisted or rejected.', { variant: 'warning' });
      return;
    }
    if (resume && resume.status !== overColumn) {
      setUpdatingId(activeId);
      try {
        await api.patch(`/api/resumes/${activeId}/status`, { status: overColumn });
        enqueueSnackbar('Status updated', { variant: 'success' });
        fetchResumes();
        onStatusChange();
      } catch (err: any) {
        enqueueSnackbar('Failed to update status', { variant: 'error' });
      } finally {
        setUpdatingId(null);
      }
    }
  };

  // Droppable Column
  const DroppableColumn: React.FC<{ id: string; children: React.ReactNode; }> = ({ id, children }) => {
    const { setNodeRef } = useDroppable({ id });
    return (
      <Box ref={setNodeRef} minWidth={220} flex={1}>
        {children}
      </Box>
    );
  };

  // Sortable Resume Card
  const SortableResumeCard: React.FC<{ resume: Resume; updatingId: string | null; statusLabels: any; statusColors: any; }> = ({ resume, updatingId, statusLabels, statusColors }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: resume._id });
    const backendUrl = process.env.REACT_APP_API_URL || "";
    const downloadUrl = resume.fileUrl && resume.fileUrl.startsWith("http")
      ? resume.fileUrl
      : (backendUrl && resume.fileUrl ? backendUrl + resume.fileUrl : "");
    return (
      <Box
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        sx={{
          mb: 2,
          p: 2,
          bgcolor: '#fff',
          borderRadius: 2,
          boxShadow: 1,
          border: updatingId === resume._id ? '2px solid #1976d2' : '1px solid #eee',
          opacity: updatingId === resume._id || isDragging ? 0.5 : 1,
          cursor: 'grab',
          transform: CSS.Transform.toString(transform),
          transition,
          minWidth: 320,
          maxWidth: 400,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Typography color="red" fontWeight={700}>Test123</Typography>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
          <Typography fontSize={13} color="#1976d2" fontWeight={600}>
            Uploaded: {resume.createdAt ? new Date(resume.createdAt).toLocaleDateString() : '-'}
          </Typography>
          <Chip
            label={statusLabels[resume.status]}
            sx={{ bgcolor: statusColors[resume.status], color: '#fff', fontWeight: 600, borderRadius: 2, fontSize: 13 }}
          />
        </Box>
        <Typography fontWeight={600} fontSize={15} mb={0.5} sx={{ wordBreak: 'break-all' }}>
          {resume.fileUrl ? resume.fileUrl.split('/').pop() : 'No file'}
        </Typography>
        <Typography fontSize={13} color="text.secondary" mb={0.5}
          >Phone: {resume.phone || '-'}</Typography>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Typography fontSize={13} color="text.secondary">
            Uploaded By:
          </Typography>
          <Typography fontSize={13} color="#1976d2" fontWeight={600}>
            {resume.uploadedBy || '-'}
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
                  fontSize: 13,
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
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Resumes for this Job</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : resumes.length === 0 ? (
          <Typography variant="body1" align="center" mt={2}>No resumes uploaded yet.</Typography>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Box display="flex" gap={2} justifyContent="center" alignItems="flex-start" mt={2}>
              {columns.map(col => (
                <DroppableColumn key={col} id={col}>
                  <Paper elevation={3} sx={{ p: 2, bgcolor: '#f7f9fb', minHeight: 350 }}>
                    <Typography variant="h6" fontWeight={700} mb={2} color={statusColors[col]}>
                      {statusLabels[col]}
                    </Typography>
                    <SortableContext items={columnResumes[col].map(r => r._id)} strategy={verticalListSortingStrategy}>
                      {columnResumes[col].map(resume => (
                        <SortableResumeCard
                          key={resume._id}
                          resume={resume}
                          updatingId={updatingId}
                          statusLabels={statusLabels}
                          statusColors={statusColors}
                        />
                      ))}
                    </SortableContext>
                  </Paper>
                </DroppableColumn>
              ))}
            </Box>
          </DndContext>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary" sx={{ borderRadius: 8 }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResumeReviewModal; 