import User from '../models/User.js';

// Require email verification
export const requireEmailVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email verification required. Please verify your email to access this feature.',
        verificationRequired: 'email'
      });
    }

    next();
  } catch (error) {
    console.error('Email verification check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking email verification status'
    });
  }
};

// Require phone verification
export const requirePhoneVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.phoneVerified) {
      return res.status(403).json({
        success: false,
        message: 'Phone verification required. Please verify your phone number to access this feature.',
        verificationRequired: 'phone'
      });
    }

    next();
  } catch (error) {
    console.error('Phone verification check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking phone verification status'
    });
  }
};

// Require business verification
export const requireBusinessVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Business verification required. Please complete business verification to access this feature.',
        verificationRequired: 'business'
      });
    }

    next();
  } catch (error) {
    console.error('Business verification check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking business verification status'
    });
  }
};

// Require any verification (email OR phone)
export const requireAnyVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.emailVerified && !user.phoneVerified) {
      return res.status(403).json({
        success: false,
        message: 'Account verification required. Please verify your email or phone number.',
        verificationRequired: 'any'
      });
    }

    next();
  } catch (error) {
    console.error('Verification check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking verification status'
    });
  }
};

// Require complete profile (onboarding completed)
export const requireCompleteProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.onboardingCompleted) {
      return res.status(403).json({
        success: false,
        message: 'Please complete your profile setup to access this feature.',
        onboardingRequired: true,
        onboardingStep: user.onboardingStep
      });
    }

    next();
  } catch (error) {
    console.error('Profile completion check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking profile completion status'
    });
  }
};

// Check if user is not in vacation mode
export const checkVacationMode = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.vacationMode?.enabled) {
      const now = new Date();
      if (now >= user.vacationMode.from && now <= user.vacationMode.to) {
        return res.status(403).json({
          success: false,
          message: 'You are currently in vacation mode. Disable it to perform this action.',
          vacationMode: true,
          vacationUntil: user.vacationMode.to
        });
      }
    }

    next();
  } catch (error) {
    console.error('Vacation mode check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking vacation mode status'
    });
  }
};

// Attach verification info to request
export const attachVerificationInfo = async (req, res, next) => {
  try {
    if (!req.userId) {
      return next();
    }

    const user = await User.findById(req.userId)
      .select('emailVerified phoneVerified isVerified onboardingCompleted');

    if (user) {
      req.verification = {
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        businessVerified: user.isVerified,
        onboardingCompleted: user.onboardingCompleted
      };
    }

    next();
  } catch (error) {
    console.error('Attach verification info error:', error);
    next(); // Don't block request on error
  }
};

export default {
  requireEmailVerification,
  requirePhoneVerification,
  requireBusinessVerification,
  requireAnyVerification,
  requireCompleteProfile,
  checkVacationMode,
  attachVerificationInfo
};
