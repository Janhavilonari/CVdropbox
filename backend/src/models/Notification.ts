import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId; // Agency user id
  message: string;
  type: 'resume_status' | 'new_job';
  read: boolean;
  createdAt: Date;
  jobDeadline?: Date; // Add jobDeadline field
  jobId?: mongoose.Types.ObjectId; // Add jobId field
  expired: boolean;
}

const NotificationSchema = new Schema<INotification>({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['resume_status', 'new_job'], required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  jobDeadline: { type: Date }, // Add jobDeadline to schema
  jobId: { type: mongoose.Types.ObjectId, ref: 'Job' }, // Add jobId to schema
  expired: { type: Boolean, default: false },
});

export default mongoose.model<INotification>('Notification', NotificationSchema); 