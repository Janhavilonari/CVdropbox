import mongoose from 'mongoose';
import Notification from '../models/Notification';
import Job from '../models/Job';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/your-db-name';

async function markExpiredNotifications() {
  await mongoose.connect(MONGO_URI);
  const now = new Date();

  // 1. Get all jobIds referenced in notifications
  const notifications = await Notification.find({ type: 'new_job', jobId: { $exists: true } });
  const jobIds = notifications.map(n => n.jobId).filter(Boolean);

  // 2. Find jobs that are expired (deadline in the past)
  const jobs = await Job.find({ _id: { $in: jobIds } });
  const expiredJobIds = jobs.filter(j => j.deadline < now).map(j => j._id.toString());
  // Fix: map with optional chaining and filter out falsy values
  const allJobIds = jobIds.map(id => id?.toString()).filter((id): id is string => !!id);
  const existingJobIds = jobs.map(j => j._id.toString());
  // 3. Find jobIds that are missing (deleted jobs)
  const deletedJobIds = allJobIds.filter(id => !existingJobIds.includes(id));

  // 4. Combine expired and deleted jobIds
  const toExpire = [...new Set([...expiredJobIds, ...deletedJobIds])];

  // 5. Mark notifications as expired for these jobIds
  const result = await Notification.updateMany(
    { type: 'new_job', jobId: { $in: toExpire } },
    { $set: { expired: true } }
  );
  console.log(`Marked ${result.modifiedCount} notifications as expired.`);
  await mongoose.disconnect();
}

markExpiredNotifications().catch(err => {
  console.error('Error updating notifications:', err);
  process.exit(1);
}); 