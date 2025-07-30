import { Request, Response } from 'express';
import Job from '../models/Job';
import User from '../models/User';
import Notification from '../models/Notification';
import { sendEmail } from '../utils/mailer';

export const createJob = async (req: Request, res: Response) => {
  try {
    const { title, description, deadline } = req.body;
    const job = await Job.create({ title, description, deadline, createdBy: null });
    const agencies = await User.find({ role: 'agency' });
    console.log('[Job Creation] Agencies found:', agencies.map(a => ({ email: a.email, id: a._id })));
    for (const agency of agencies) {
      try {
        await Notification.create({
          recipient: agency._id,
          message: `A new job has been posted: ${title}`,
          type: 'new_job',
          read: false,
          jobDeadline: deadline, // Add deadline to notification
          jobId: job._id, // Add jobId to notification
        });
        console.log('[Notification] Created for agency:', agency.email, agency._id);
        // Send email notification to agency
        if (agency.email) {
          const subject = `New Job Posted: ${title}`;
          // Convert URLs in job description to clickable blue links for email
          const jobDescriptionHtml = description.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" style="color:#1976d2;text-decoration:underline;" target="_blank">$1</a>'
          );
          const html = `<h2>A new job has been posted</h2>
            <p><b>Title:</b> ${title}</p>
            <p><b>Description:</b><br>${jobDescriptionHtml}</p>
            <p><b>Applicable till:</b> ${new Date(deadline).toLocaleString()}</p>`;
          sendEmail(agency.email, subject, html).catch((err) => {
            console.error('[Email] Failed to send new job email to agency:', agency.email, err);
          });
        }
      } catch (notifErr) {
        console.error('[Notification] Error creating notification for:', agency.email, notifErr);
      }
    }
    res.status(201).json(job);
  } catch (err) {
    console.error('[Job Creation] Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
