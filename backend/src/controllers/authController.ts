import { Request, Response } from 'express';
import User from '../models/User';
import generateToken from '../utils/generateToken';
import bcrypt from 'bcryptjs';
import { sendEmail } from '../utils/mailer';
import Notification from '../models/Notification';
import crypto from 'crypto';

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    console.log('[Login] Attempt for:', email);
    // Allow admin login for any @appliedaiconsulting.com email
    if (email && email.endsWith('@appliedaiconsulting.com') && password === 'admin123') {
      // Return a fake user object for admin
      const fakeAdmin = {
        _id: 'admin-id',
        name: name || 'Admin',
        email,
        role: 'admin',
      };
      const token = generateToken(fakeAdmin._id);
      console.log('[Login] Fake admin login success:', email);
      return res.json({ token, user: { id: fakeAdmin._id, name: fakeAdmin.name, email: fakeAdmin.email, role: fakeAdmin.role } });
    }
    const user = await User.findOne({ email });
    console.log('[Login] User found:', !!user, user ? { status: user.status, isEmailVerified: user.isEmailVerified } : null);
    if (!user) {
      console.log('[Login] No user found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if email is verified for agency users
    if (user.role === 'agency' && !user.isEmailVerified) {
      console.log('[Login] Email not verified');
      return res.status(401).json({ message: 'Please verify your email address first' });
    }
    
    // Check if agency is active
    if (user.role === 'agency' && user.status !== 'active') {
      console.log('[Login] Agency not active');
      return res.status(401).json({ message: 'Agency is not active' });
    }

    const isMatch = await user.comparePassword(password);
    console.log('[Login] Password match:', isMatch);
    if (!isMatch) {
      console.log('[Login] Invalid password');
      return res.status(401).json({ message: 'Invalid password' });
    }
    const token = generateToken(user._id);
    console.log('[Login] Login success:', email);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('[Login] Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const signupAgency = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email is already registered' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: 'agency' });
    const token = generateToken(user._id);
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const bulkCreateAgencies = async (req: Request, res: Response) => {
  try {
    const { agencies } = req.body; // [{email, name}]
    if (!Array.isArray(agencies) || agencies.length === 0) {
      return res.status(400).json({ message: 'No agencies provided' });
    }
    const results = [];
    for (const agency of agencies) {
      if (!agency.email || !agency.name) continue;
      const existing = await User.findOne({ email: agency.email });
      if (existing) continue;
      // Generate a unique, permanent password for the agency
      const password = crypto.randomBytes(6).toString('hex').toUpperCase(); // Generate ONCE
      const user = await User.create({ name: agency.name, email: agency.email, password, role: 'agency', isEmailVerified: true, status: 'active' });
      results.push({ id: user._id, email: user.email, name: user.name });
      // Use the SAME password variable in the email
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff6d00;">Welcome to AAIC CV DropBox!</h2>
          <p>Hello ${agency.name},</p>
          <p>Your agency has been registered on AAIC CV DropBox.</p>
          <p><b>Email:</b> ${agency.email}</p>
          <p><b>First Password:</b> ${password}</p>
          <p>You can use this password to log in for the first time. You may change it later from your profile or use the forgot password option at any time.</p>
          <p>Best regards,<br>AAIC CV DropBox Team</p>
        </div>
      `;
      await sendEmail(agency.email, 'Welcome to AAIC CV DropBox', emailHtml);
    }
    res.status(201).json({ created: results.length, agencies: results });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deactivateAgency = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const agency = await User.findById(id);
    if (!agency) {
      return res.status(404).json({ message: 'Agency not found' });
    }
    agency.status = 'inactive';
    await agency.save();
    res.json({ message: 'Agency deactivated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createAgency = async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).json({ message: 'Email and name are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email is already registered' });
    }
    // Generate a unique, permanent password for the agency
    const password = crypto.randomBytes(6).toString('hex').toUpperCase(); // Generate ONCE
    const user = await User.create({ name, email, password, role: 'agency', isEmailVerified: true, status: 'active' });
    // Use the SAME password variable in the email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff6d00;">Welcome to AAIC CV DropBox!</h2>
        <p>Hello ${name},</p>
        <p>Your agency has been registered on AAIC CV DropBox.</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>First Password:</b> ${password}</p>
        <p>You can use this password to log in for the first time. You may change it later from your profile or use the forgot password option at any time.</p>
        <p>Best regards,<br>AAIC CV DropBox Team</p>
      </div>
    `;
    await sendEmail(email, 'Welcome to AAIC CV DropBox', emailHtml);
    res.status(201).json({ id: user._id, email: user.email, name: user.name });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const activateAgency = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const agency = await User.findById(id);
    if (!agency) {
      return res.status(404).json({ message: 'Agency not found' });
    }
    agency.status = 'active';
    await agency.save();
    res.json({ message: 'Agency activated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const initiateSignup = async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create temporary user with OTP
    const tempUser = await User.create({
      name,
      email,
      password: 'temp', // Will be updated after OTP verification
      role: 'agency',
      otp,
      otpExpiry,
      isEmailVerified: false
    });

    // Send OTP email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff6d00;">AAIC CV DropBox - Email Verification</h2>
        <p>Hello ${name},</p>
        <p>Thank you for signing up with AAIC CV DropBox. Please use the following OTP to verify your email address:</p>
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #ff6d00; font-size: 32px; margin: 0; letter-spacing: 8px;">${otp}</h1>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
        <p>Best regards,<br>AAIC CV DropBox Team</p>
      </div>
    `;

    await sendEmail(email, 'AAIC CV DropBox - Email Verification OTP', emailHtml);

    res.json({ 
      message: 'OTP sent successfully', 
      userId: tempUser._id 
    });
  } catch (err) {
    console.error('Signup initiation error:', err);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { userId, otp, password } = req.body;
    
    if (!userId || !otp || !password) {
      return res.status(400).json({ message: 'User ID, OTP, and password are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otpExpiry && new Date() > user.otpExpiry) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Update user with password and mark as verified
    user.password = password;
    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Generate token and return user data
    const token = generateToken(user._id);
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      },
      message: 'Email verified successfully'
    });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
};

export const resendOTP = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send new OTP email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff6d00;">AAIC CV DropBox - New Verification OTP</h2>
        <p>Hello ${user.name},</p>
        <p>Here's your new OTP to verify your email address:</p>
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #ff6d00; font-size: 32px; margin: 0; letter-spacing: 8px;">${otp}</h1>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>Best regards,<br>AAIC CV DropBox Team</p>
      </div>
    `;

    await sendEmail(user.email, 'AAIC CV DropBox - New Verification OTP', emailHtml);

    res.json({ message: 'New OTP sent successfully' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ message: 'Failed to resend OTP' });
  }
}; 

export const initiateForgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user found with this email' });
    }
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = undefined; // Remove time limit
    await user.save();
    // Send OTP email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff6d00;">AAIC CV DropBox - Password Reset OTP</h2>
        <p>Hello ${user.name},</p>
        <p>You requested to reset your password. Please use the following OTP to reset your password:</p>
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #ff6d00; font-size: 32px; margin: 0; letter-spacing: 8px;">${otp}</h1>
        </div>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>AAIC CV DropBox Team</p>
      </div>
    `;
    await sendEmail(email, 'AAIC CV DropBox - Password Reset OTP', emailHtml);
    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error('Forgot password initiation error:', err);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

export const verifyForgotPasswordOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    console.log('[ForgotPassword] Request for:', email);
    if (!email || !otp || !newPassword) {
      console.log('[ForgotPassword] Missing fields');
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }
    const user = await User.findOne({ email });
    if (!user || !user.otp) {
      console.log('[ForgotPassword] User not found or no OTP');
      return res.status(400).json({ message: 'Invalid request' });
    }
    if (user.otp !== otp) {
      console.log('[ForgotPassword] Invalid OTP');
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    // Removed OTP expiry check
    // Set new password and mark email as verified
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.isEmailVerified = true;
    console.log('[ForgotPassword] Setting new password and verifying email for:', email);
    await user.save();
    console.log('[ForgotPassword] Password reset and user saved for:', email);
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('[ForgotPassword] Error:', err);
    res.status(500).json({ message: 'Failed to reset password' });
  }
}; 

// Get notifications for logged-in agency
export const getNotifications = async (req: Request, res: Response) => {
  try {
    if (!(req as any).user || !(req as any).user._id) {
      console.error('getNotifications: No user found in request');
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const userId = (req as any).user._id;
    console.log('getNotifications: userId =', userId);
    const notifications = await Notification.find({ recipient: userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};
// Mark all notifications as read for logged-in agency
export const markNotificationsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    await Notification.updateMany({ recipient: userId, read: false }, { $set: { read: true } });
    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
}; 

export const deleteAgency = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const agency = await User.findById(id);
    if (!agency) {
      return res.status(404).json({ message: 'Agency not found' });
    }
    if (agency.role !== 'agency') {
      return res.status(400).json({ message: 'User is not an agency' });
    }
    await User.deleteOne({ _id: id });
    // Do NOT delete resumes; they remain in the database
    res.json({ message: 'Agency deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 

export const agencySignup = async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email is already registered.' });
    }
    // Generate random password
    const password = crypto.randomBytes(8).toString('hex');
    // Do NOT hash here; let the pre('save') hook handle it
    const user = await User.create({
      name,
      email,
      password, // plain text, will be hashed by pre('save')
      role: 'agency',
      isEmailVerified: true,
      status: 'active' // ensure active
    });

    // Send welcome email
    const subject = 'Welcome to the Portal';
    const html = `
      <h2>Welcome, ${name}!</h2>
      <p>Your agency account has been created.</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Password:</b> ${password}</p>
      <p>You can log in and change your password at any time.</p>
    `;
    await sendEmail(email, subject, html);

    res.status(201).json({ message: 'Registration successful! Please check your email for your password.' });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 

// Change password for logged-in agency
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id;
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}; 