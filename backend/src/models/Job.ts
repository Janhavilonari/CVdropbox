import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IResume {
  _id: Types.ObjectId;
  fileUrl: string; // or file path, or buffer, depending on your storage
  uploadedBy: Types.ObjectId;
  uploadedByName?: string;
  uploadedByEmail?: string; // Add agency email
  status: 'pending' | 'shortlisted' | 'rejected';
  uploadedAt: Date;
  candidateName?: string;
  candidateEmail?: string;
  candidatePhone?: string;
}

export interface IJob extends Document {
  title: string;
  description: string;
  deadline: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  resumes: IResume[];
  status: 'open' | 'closed';
}

const ResumeSchema = new Schema<IResume>({
  fileUrl: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedByName: { type: String },
  uploadedByEmail: { type: String }, // Add agency email
  status: { type: String, enum: ['pending', 'shortlisted', 'rejected'], default: 'pending' },
  uploadedAt: { type: Date, default: Date.now },
  candidateName: { type: String },
  candidateEmail: { type: String },
  candidatePhone: { type: String },
});

const JobSchema = new Schema<IJob>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  deadline: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  createdAt: { type: Date, default: Date.now },
  resumes: { type: [ResumeSchema], default: [] },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
});

export default mongoose.model<IJob>('Job', JobSchema); 