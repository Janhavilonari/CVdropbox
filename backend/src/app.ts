import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import jobRoutes from './routes/jobRoutes';
import resumeRoutes from './routes/resumeRoutes';
import path from 'path';

// Load env vars
dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://13.233.151.248:3000', // Or use '*' temporarily for dev
  credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.get('/test-log', (req, res) => {
  console.log('Test log route hit!');
  res.send('Logged!');
});

// Catch-all 404 handler (should be last)
app.use((req, res) => res.status(404).send('Not Found'));

export default app; 