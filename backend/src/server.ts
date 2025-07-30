import mongoose from 'mongoose';
import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3003;
const MONGODB_URI = process.env.MONGODB_URI || '';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected');
    // Ensure default admin user exists
    const User = (await import('./models/User')).default;
    const adminEmail = 'janhavi@appliedaiconsulting.com';
    const adminPassword = 'admin123';
    const adminName = 'Admin';
    const adminRole = 'admin';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: adminRole,
      });
      console.log('Default admin user created.');
    } else {
      console.log('Default admin user already exists.');
    }
    // Remove or comment out the default agency user seeding to avoid email conflict
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }); 