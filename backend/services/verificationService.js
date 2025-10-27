import crypto from 'crypto';
import User from '../models/User.js';
import emailService from './emailService.js';

// Generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate verification code (6 digits)
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send email verification
export const sendEmailVerification = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      throw new Error('Email already verified');
    }

    const token = generateVerificationToken();
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token in user (you might want to create a separate VerificationToken model)
    user.emailVerificationToken = token;
    user.emailVerificationExpiry = expiry;
    await user.save();

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await emailService.sendEmail({
      to: user.email,
      subject: 'Verify Your Email - WholeSale Connect',
      html: `
        <h2>Email Verification</h2>
        <p>Hi ${user.displayName},</p>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}" style="padding: 10px 20px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
        <p>Or copy this link: ${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      `
    });

    return { success: true, message: 'Verification email sent' };
  } catch (error) {
    console.error('Send email verification error:', error);
    throw error;
  }
};

// Verify email with token
export const verifyEmail = async (token) => {
  try {
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpiry: { $gt: new Date() }
    });

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();

    return { success: true, message: 'Email verified successfully' };
  } catch (error) {
    console.error('Verify email error:', error);
    throw error;
  }
};

// Send phone verification code
export const sendPhoneVerification = async (userId, phone) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const code = generateVerificationCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.phoneVerificationCode = code;
    user.phoneVerificationExpiry = expiry;
    user.phoneToVerify = phone;
    await user.save();

    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log(`SMS Verification Code for ${phone}: ${code}`);

    // For development, you can send via email
    if (process.env.NODE_ENV === 'development') {
      await emailService.sendEmail({
        to: user.email,
        subject: 'Phone Verification Code',
        html: `
          <h2>Phone Verification</h2>
          <p>Your verification code is: <strong>${code}</strong></p>
          <p>This code will expire in 10 minutes.</p>
        `
      });
    }

    return { success: true, message: 'Verification code sent' };
  } catch (error) {
    console.error('Send phone verification error:', error);
    throw error;
  }
};

// Verify phone with code
export const verifyPhone = async (userId, code) => {
  try {
    const user = await User.findOne({
      _id: userId,
      phoneVerificationCode: code,
      phoneVerificationExpiry: { $gt: new Date() }
    });

    if (!user) {
      throw new Error('Invalid or expired verification code');
    }

    user.phoneVerified = true;
    user.phone = user.phoneToVerify;
    user.phoneVerificationCode = undefined;
    user.phoneVerificationExpiry = undefined;
    user.phoneToVerify = undefined;
    await user.save();

    return { success: true, message: 'Phone verified successfully' };
  } catch (error) {
    console.error('Verify phone error:', error);
    throw error;
  }
};

// Submit document for verification
export const submitVerificationDocument = async (userId, documentData) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const document = {
      type: documentData.type, // 'gst', 'pan', 'business_license', etc.
      url: documentData.url,
      status: 'pending',
      submittedAt: new Date()
    };

    user.verificationDocuments.push(document);
    await user.save();

    // Notify admin for verification
    // TODO: Implement admin notification

    return { success: true, message: 'Document submitted for verification', document };
  } catch (error) {
    console.error('Submit verification document error:', error);
    throw error;
  }
};

// Approve/Reject document (admin only)
export const reviewVerificationDocument = async (userId, documentId, status, reviewNote) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const document = user.verificationDocuments.id(documentId);

    if (!document) {
      throw new Error('Document not found');
    }

    document.status = status; // 'approved' or 'rejected'
    document.reviewedAt = new Date();
    document.reviewNote = reviewNote;

    // If all required documents are approved, mark user as verified
    const requiredDocs = ['gst', 'pan', 'business_license'];
    const approvedDocs = user.verificationDocuments.filter(
      doc => doc.status === 'approved' && requiredDocs.includes(doc.type)
    );

    if (approvedDocs.length >= 2) { // At least 2 documents approved
      user.isVerified = true;
    }

    await user.save();

    // Send notification to user
    if (status === 'approved') {
      await emailService.sendEmail({
        to: user.email,
        subject: 'Document Verified - WholeSale Connect',
        html: `
          <h2>Document Verification Approved</h2>
          <p>Hi ${user.displayName},</p>
          <p>Your ${document.type} document has been verified and approved.</p>
          ${user.isVerified ? '<p><strong>Congratulations! Your business is now verified.</strong></p>' : ''}
        `
      });
    } else {
      await emailService.sendEmail({
        to: user.email,
        subject: 'Document Verification Issue - WholeSale Connect',
        html: `
          <h2>Document Verification Update</h2>
          <p>Hi ${user.displayName},</p>
          <p>We were unable to verify your ${document.type} document.</p>
          <p>Reason: ${reviewNote}</p>
          <p>Please resubmit the document with the correct information.</p>
        `
      });
    }

    return {
      success: true,
      message: `Document ${status}`,
      isVerified: user.isVerified
    };
  } catch (error) {
    console.error('Review verification document error:', error);
    throw error;
  }
};

// Get verification status
export const getVerificationStatus = async (userId) => {
  try {
    const user = await User.findById(userId)
      .select('emailVerified phoneVerified isVerified verificationDocuments');

    if (!user) {
      throw new Error('User not found');
    }

    const pendingDocs = user.verificationDocuments.filter(doc => doc.status === 'pending').length;
    const approvedDocs = user.verificationDocuments.filter(doc => doc.status === 'approved').length;
    const rejectedDocs = user.verificationDocuments.filter(doc => doc.status === 'rejected').length;

    return {
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      businessVerified: user.isVerified,
      documents: {
        total: user.verificationDocuments.length,
        pending: pendingDocs,
        approved: approvedDocs,
        rejected: rejectedDocs
      },
      verificationComplete: user.emailVerified && user.phoneVerified && user.isVerified
    };
  } catch (error) {
    console.error('Get verification status error:', error);
    throw error;
  }
};

export default {
  sendEmailVerification,
  verifyEmail,
  sendPhoneVerification,
  verifyPhone,
  submitVerificationDocument,
  reviewVerificationDocument,
  getVerificationStatus
};
