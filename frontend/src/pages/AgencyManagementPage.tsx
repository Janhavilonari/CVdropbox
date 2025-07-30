import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Box, Typography, Paper, Button, TextField, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import api from '../api/axios';

const AgencyManagementPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [agencies, setAgencies] = useState<any[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAgencies = async () => {
    const res = await api.get('/api/auth/agencies');
    setAgencies(res.data);
  };

  useEffect(() => {
    fetchAgencies();
  }, []);

  const handleAddAgency = async () => {
    if (!email || !name) return;
    setLoading(true);
    await api.post('/api/auth/agencies', { email, name });
    setEmail('');
    setName('');
    setLoading(false);
    fetchAgencies();
  };

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const handleBulkUpload = async () => {
    if (!csvFile) return;
    const text = await csvFile.text();
    // Simple CSV parse: first line is header, then email,name per line
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const agenciesToUpload = lines.slice(1).map(line => {
      const [email, name] = line.split(',');
      return { email: email?.trim(), name: name?.trim() };
    }).filter(a => a.email && a.name);
    if (agenciesToUpload.length) {
      await api.post('/api/auth/agencies/bulk', { agencies: agenciesToUpload });
      fetchAgencies();
      setCsvFile(null);
    }
  };

  const handleDeactivate = async (agencyId: string) => {
    await api.patch(`/api/auth/agencies/${agencyId}/deactivate`);
    fetchAgencies();
  };

  const handleActivate = async (agencyId: string) => {
    await api.patch(`/api/auth/agencies/${agencyId}/activate`);
    fetchAgencies();
  };

  const handleDelete = async (agencyId: string) => {
    if (!window.confirm('Are you sure you want to delete this agency? This action cannot be undone.')) return;
    await api.delete(`/api/auth/agencies/${agencyId}`);
    fetchAgencies();
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flex: 1, ml: '220px', p: 4, bgcolor: '#f7f9fb', minHeight: '100vh' }}>
        <Typography variant="h4" fontWeight={700} mb={3} color="#1681c2">Agency Management</Typography>
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" mb={2}>Bulk Upload Agencies (CSV/Excel)</Typography>
          <input type="file" accept=".csv" onChange={handleCsvChange} />
          <Button variant="contained" sx={{ ml: 2 }} onClick={handleBulkUpload} disabled={!csvFile}>UPLOAD FILE</Button>
        </Paper>
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" mb={2}>Add New Agency</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField label="Email" value={email} onChange={e => setEmail(e.target.value)} fullWidth required />
            </Grid>
            <Grid item xs={12} md={5}>
              <TextField label="Agency Name" value={name} onChange={e => setName(e.target.value)} fullWidth required />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                onClick={handleAddAgency}
                disabled={loading || !email || !name}
                fullWidth
              >
                ADD AGENCY
              </Button>
            </Grid>
          </Grid>
        </Paper>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" mb={2}>Agency List</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Agency Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {agencies.map((agency: any) => (
                  <TableRow key={agency._id}>
                    <TableCell>{agency.email}</TableCell>
                    <TableCell>{agency.name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={agency.status === 'active' ? 'Active' : 'Inactive'} 
                        color={agency.status === 'active' ? 'success' : 'default'} 
                      />
                    </TableCell>
                    <TableCell>
                      {agency.status === 'active' ? (
                        <Button 
                          variant="outlined" 
                          color="error" 
                          onClick={() => handleDelete(agency._id)}
                        >
                          DELETE
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          color="success"
                          onClick={() => handleActivate(agency._id)}
                        >
                          ACTIVATE
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
};

export default AgencyManagementPage; 