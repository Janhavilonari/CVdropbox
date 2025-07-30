import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IResume extends Document {
  name: string;
  email: string;
  phone: string;
  fileUrl: string;
  jobId: Types.ObjectId;
  status: 'pending' | 'shortlisted' | 'rejected';
  uploadedBy: string; // agency ObjectId or email
  uploadedByName?: string; // agency name
  uploadedByEmail?: string; // agency email
  createdAt: Date;
}

const ResumeSchema = new Schema<IResume>({
  name: { type: String, required: false },
  email: { type: String, required: false },
  phone: { type: String, required: true },
  fileUrl: { type: String, required: true },
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  status: { type: String, enum: ['pending', 'shortlisted', 'rejected'], default: 'pending' },
  uploadedBy: { type: String, required: true },
  uploadedByName: { type: String, required: false },
  uploadedByEmail: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IResume>('Resume', ResumeSchema); 