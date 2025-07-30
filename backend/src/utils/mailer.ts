import nodemailer from 'nodemailer';
import { emailConfig } from '../config/email';

// Create transporter with email configuration
let transporter: nodemailer.Transporter | null = null;

try {
  transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: {
      user: emailConfig.user,
      pass: emailConfig.pass,
    },
  });
} catch (error) {
  console.warn('Email configuration error. OTP emails will be logged to console instead.');
  transporter = null;
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (!transporter) {
    // Fallback for development - log email to console
    console.log('\n=== EMAIL WOULD BE SENT ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Content:', html);
    console.log('=== END EMAIL ===\n');
    return;
  }

  try {
    await transporter.sendMail({
      from: emailConfig.from,
      to,
      subject,
      html,
    });
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    // Fallback to console logging
    console.log('\n=== EMAIL WOULD BE SENT ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Content:', html);
    console.log('=== END EMAIL ===\n');
  }
} 