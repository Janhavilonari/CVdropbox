import { Router } from 'express';
import Job from '../models/Job';
import multer from 'multer';
import path from 'path';
// @ts-ignore
import pdfParse from 'pdf-parse';
import fs from 'fs';
import User from '../models/User';
import mongoose from 'mongoose';
import Resume from '../models/Resume';
import { createJob } from '../controllers/jobController';

const router = Router();

// GET /api/jobs
router.get('/', async (req, res) => {
  try {
    // Return all jobs, regardless of deadline
    const jobs = await Job.find({});
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});

// POST /api/jobs
router.post('/', createJob);

// Multer setup for PDF uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  }
});

// POST /api/jobs/:jobId/resumes (with file upload)
router.post('/:jobId/resumes', upload.single('file'), async (req, res) => {
  console.log('BODY:', req.body);
  console.log('FILE:', req.file);
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const { agency, name, email } = req.body; // <-- extract name and email
    const fileUrl = `/uploads/${req.file.filename}`;

    // Extract phone number from PDF
    let candidatePhone = '';
    let pdfBuffer, pdfData, text;
    try {
      pdfBuffer = fs.readFileSync(req.file.path);
      pdfData = await pdfParse(pdfBuffer);
      text = pdfData.text;
    } catch (pdfErr) {
      console.error('PDF parsing error:', pdfErr);
      fs.unlinkSync(req.file.path);
      return res.status(500).json({ message: 'Failed to parse PDF', error: String(pdfErr) });
    }
    const phoneMatch = text.match(/(\+\d{1,3}[- ]?)?\d{10}/);
    candidatePhone = phoneMatch ? phoneMatch[0] : '';
    if (!candidatePhone) {
      fs.unlinkSync(req.file.path);
      console.error('No phone number found in PDF.');
      return res.status(400).json({ message: 'No phone number found in the uploaded PDF.' });
    }

    // Check for duplicate phone number in resumes for this job
    const duplicate = job.resumes.find(r => r.candidatePhone === candidatePhone);
    if (duplicate) {
      fs.unlinkSync(req.file.path);
      console.error('Duplicate resume: this phone number has already been submitted for this job.');
      return res.status(409).json({ message: 'Duplicate resume: this phone number has already been submitted for this job.' });
    }

    // Fetch agency _id and name
    let agencyId = null;
    let agencyName = '';
    let agencyEmail = '';
    let agencyUser = null;
    if (agency) {
      // Try to find by email first
      agencyUser = await User.findOne({ email: agency });
      // If not found by email, try by name (case-insensitive)
      if (!agencyUser) {
        agencyUser = await User.findOne({ name: { $regex: new RegExp('^' + agency + '$', 'i') }, role: 'agency' });
      }
      if (!agencyUser) {
        fs.unlinkSync(req.file.path);
        console.error('Agency not found for email or name:', agency);
        return res.status(400).json({ message: 'Agency not found for the provided email or name.' });
      }
      agencyId = agencyUser._id;
      agencyName = agencyUser.name;
      agencyEmail = agencyUser.email;
    } else {
      fs.unlinkSync(req.file.path);
      console.error('No agency provided in request.');
      return res.status(400).json({ message: 'No agency provided in request.' });
    }

    // Generate a new ObjectId for the resume
    const resumeId = new mongoose.Types.ObjectId();
    // Add to job's embedded resumes
    job.resumes.push({
      _id: resumeId,
      fileUrl,
      uploadedBy: agencyId, // Use ObjectId
      uploadedByName: agencyName,
      uploadedByEmail: agencyEmail, // Save agency email
      status: 'pending',
      uploadedAt: new Date(),
      candidatePhone,
    });
    // Also create a Resume document in the Resume collection
    console.log('Creating Resume with data:', { name, email, phone: candidatePhone, fileUrl, jobId: job._id, uploadedBy: agencyId.toString(), uploadedByName: agencyName, uploadedByEmail: agencyEmail });
    await Resume.create({
      _id: resumeId,
      name, // can be undefined
      email, // can be undefined
      phone: candidatePhone,
      fileUrl,
      jobId: job._id,
      status: 'pending',
      uploadedBy: agencyId, // Use ObjectId
      uploadedByName: agencyName,
      uploadedByEmail: agencyEmail, // Save agency email
      createdAt: new Date(),
    });
    await job.save();
    res.status(201).json(job);
  } catch (err) {
    if (err instanceof Error) {
      console.error('Resume upload error:', err.message, err.stack);
      res.status(500).json({ message: 'Failed to upload resume', error: err.message, stack: err.stack });
    } else {
      console.error('Resume upload error (non-Error):', err);
      res.status(500).json({ message: 'Failed to upload resume', error: String(err) });
    }
  }
});

// GET /api/jobs/:jobId/resumes
router.get('/:jobId/resumes', async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId).populate('resumes');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job.resumes);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch resumes' });
  }
});

// GET /api/jobs/:jobId
router.get('/:jobId', async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch job' });
  }
});

// DELETE /api/jobs/:jobId
router.delete('/:jobId', async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    // Mark related notifications as expired by jobId
    const Notification = require('../models/Notification').default;
    await Notification.updateMany(
      { type: 'new_job', jobId: job._id },
      { $set: { expired: true } }
    );
    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete job' });
  }
});

export default router; 