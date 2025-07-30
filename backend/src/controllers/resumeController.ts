import { Request, Response } from 'express';
import Resume from '../models/Resume';
import User from '../models/User';
import Job from '../models/Job';
import { sendEmail } from '../utils/mailer';
import Notification from '../models/Notification';
import mongoose from 'mongoose';

export const uploadResume = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, jobId, fileUrl } = req.body;
    const agencyEmail = (req as any).user.email;
    // Check for duplicate by phone/job
    const existing = await Resume.findOne({ phone, jobId });
    if (existing) {
      return res.status(409).json({ message: 'Duplicate resume for this job.' });
    }
    const resume = await Resume.create({
      name,
      email,
      phone,
      fileUrl,
      jobId,
      status: 'pending',
      uploadedBy: agencyEmail,
    });
    // Notify all admins
    const admins = await User.find({ role: 'admin' });
    const job = await Job.findById(jobId);
    const subject = 'New Resume Uploaded';
    const html = `<h2>New Resume Uploaded</h2><p><b>Candidate:</b> ${name}</p><p><b>Job:</b> ${job?.title || ''}</p>`;
    for (const admin of admins) {
      if (admin.email) {
        sendEmail(admin.email, subject, html).catch(() => {});
      }
    }
    res.status(201).json(resume);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateResumeStatus = async (req: Request, res: Response) => {
  console.log('[updateResumeStatus] Called with id:', req.params.id, 'status:', req.body.status);
  try {
    const { status } = req.body;
    const { id } = req.params;
    const resume = await Resume.findById(id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    // Prevent moving back to pending
    if (status === 'pending' && resume.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot move resume back to pending once it is shortlisted or rejected.' });
    }

    resume.status = status;
    await resume.save();

    // Also update the status in the Job's resumes array (manual update for robustness)
    console.log('Updating Job:', resume.jobId, 'ResumeId:', resume._id, 'Status:', status, typeof resume._id);
    const job = await Job.findById(resume.jobId);
    if (job) {
      console.log('Job resumes:', job.resumes.map(r => ({ id: r._id, type: typeof r._id })));
      const embeddedResume = job.resumes.find(r => r._id.toString() === resume._id.toString());
      if (embeddedResume) {
        console.log('Found embedded resume:', embeddedResume._id, 'Updating status...');
        embeddedResume.status = status;
        await job.save();
        console.log('Manually updated embedded resume status.');
      } else {
        console.log('Embedded resume not found in job. Resume._id:', resume._id);
      }
    } else {
      console.log('Job not found. JobId:', resume.jobId);
    }

    // Notify agency (in-app notification)
    const agencyUser = await User.findById(resume.uploadedBy);
    if (agencyUser && job) {
      // Extract file name from fileUrl
      let fileName = resume.fileUrl ? resume.fileUrl.split('/').pop() : '';
      let phone = resume.phone || '-';
      let statusMsg = status === 'shortlisted' ? 'shortlisted' : (status === 'rejected' ? 'rejected' : status);
      await Notification.create({
        recipient: agencyUser._id,
        message: `A resume you submitted (Phone: ${phone}${fileName ? ', File: ' + fileName : ''}) has been ${statusMsg} for job: ${job.title}.`,
        type: 'resume_status',
        read: false,
        // jobDeadline removed for resume status notifications
      });
      console.log('[Notification] Created for agency:', agencyUser.email, agencyUser._id);
      // Send email to agency (not candidate)
      if (agencyUser.email) {
        const subject = `Resume ${statusMsg.charAt(0).toUpperCase() + statusMsg.slice(1)} for Job: ${job.title}`;
        const html = `<h2>Resume Status Update</h2>
          <p>Your submitted resume has been <b>${statusMsg}</b> for the job: <b>${job.title}</b>.</p>
          <ul>
            <li><b>Phone:</b> ${phone}</li>
            <li><b>File:</b> ${fileName}</li>
          </ul>
          <p>Thankyou</p>`;
        sendEmail(agencyUser.email, subject, html).catch((err) => {
          console.error('[Email] Failed to send status update email to agency:', agencyUser.email, err);
        });
      }
    }
    // Remove email sending for status update
    res.json(resume);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getResumesByJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const resumes = await Resume.find({ jobId });
    res.json(resumes);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 

export const getResumesByJobId = async (req: Request, res: Response) => {
  try {
    const jobId = req.params.jobId;
    const job = await Job.findById(jobId).populate('resumes');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job.resumes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}; 