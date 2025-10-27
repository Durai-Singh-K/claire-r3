import express from 'express';
import { body, param } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
import { auth } from '../middleware/auth.js';
import subscriptionService from '../services/subscriptionService.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import {
  validateSubscriptionUpgrade,
  validatePayment,
  validateCancellation
} from '../validators/subscriptionValidator.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// @desc    Get all available subscription plans
// @route   GET /api/subscriptions/plans
// @access  Private
router.get('/plans', asyncHandler(async (req, res) => {
  const plans = subscriptionService.getPlans();

  res.json({
    success: true,
    plans
  });
}));

// @desc    Get current user's subscription
// @route   GET /api/subscriptions/current
// @access  Private
router.get('/current', asyncHandler(async (req, res) => {
  const subscription = await Subscription.getActiveSubscription(req.userId);
  const user = await User.findById(req.userId)
    .select('subscriptionTier subscriptionExpiry adCredits featuredUntil');

  res.json({
    success: true,
    subscription,
    userSubscription: {
      tier: user.subscriptionTier,
      expiry: user.subscriptionExpiry,
      adCredits: user.adCredits,
      featuredUntil: user.featuredUntil,
      isActive: user.hasActiveSubscription()
    }
  });
}));

// @desc    Get subscription history
// @route   GET /api/subscriptions/history
// @access  Private
router.get('/history', asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.getSubscriptionHistory(req.userId);

  res.json({
    success: true,
    subscriptions
  });
}));

// @desc    Create or upgrade subscription
// @route   POST /api/subscriptions/upgrade
// @access  Private
router.post('/upgrade', validateSubscriptionUpgrade, asyncHandler(async (req, res) => {
  const { tier, billingCycle, autoRenew } = req.body;

  // Check if user already has an active subscription
  const existingSubscription = await Subscription.getActiveSubscription(req.userId);

  if (existingSubscription && existingSubscription.tier === tier) {
    return res.status(400).json({
      success: false,
      message: 'You already have this subscription plan'
    });
  }

  const subscription = await subscriptionService.createSubscription(
    req.userId,
    tier,
    billingCycle
  );

  if (autoRenew !== undefined) {
    subscription.autoRenew = autoRenew;
    await subscription.save();
  }

  res.json({
    success: true,
    message: 'Subscription created. Please proceed with payment.',
    subscription
  });
}));

// @desc    Process subscription payment
// @route   POST /api/subscriptions/payment
// @access  Private
router.post('/payment', validatePayment, asyncHandler(async (req, res) => {
  const { subscriptionId, amount, paymentMethod, gatewayTransactionId } = req.body;

  const subscription = await Subscription.findById(subscriptionId);

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: 'Subscription not found'
    });
  }

  // Check ownership - fix authorization comparison
  const userIdString = subscription.user.toString();
  const reqUserIdString = req.userId ? req.userId.toString() : null;

  if (!req.userId || userIdString !== reqUserIdString) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  const paymentData = {
    amount,
    paymentMethod,
    gatewayTransactionId,
    status: 'success', // In production, verify with payment gateway
    currency: 'INR'
  };

  const result = await subscriptionService.processPayment(subscriptionId, paymentData);

  res.json({
    success: true,
    message: 'Payment processed successfully',
    subscription: result.subscription,
    user: result.user
  });
}));

// @desc    Cancel subscription
// @route   DELETE /api/subscriptions/:subscriptionId
// @access  Private
router.delete('/:subscriptionId', validateCancellation, asyncHandler(async (req, res) => {
  const { subscriptionId } = req.params;
  const { reason } = req.body;

  const subscription = await Subscription.findById(subscriptionId);

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: 'Subscription not found'
    });
  }

  // Check ownership - fix authorization comparison
  const userIdString = subscription.user.toString();
  const reqUserIdString = req.userId ? req.userId.toString() : null;

  if (!req.userId || userIdString !== reqUserIdString) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  const result = await subscriptionService.cancelSubscription(req.userId, reason);

  res.json(result);
}));

// @desc    Renew subscription
// @route   POST /api/subscriptions/:subscriptionId/renew
// @access  Private
router.post('/:subscriptionId/renew', [
  param('subscriptionId').isMongoId().withMessage('Invalid subscription ID')
], asyncHandler(async (req, res) => {
  const { subscriptionId } = req.params;

  const subscription = await Subscription.findById(subscriptionId);

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: 'Subscription not found'
    });
  }

  // Check ownership - fix authorization comparison
  const userIdString = subscription.user.toString();
  const reqUserIdString = req.userId ? req.userId.toString() : null;

  if (!req.userId || userIdString !== reqUserIdString) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  const billingCycleDays = {
    monthly: 30,
    quarterly: 90,
    yearly: 365
  };

  const duration = billingCycleDays[subscription.billingCycle] || 30;
  await subscription.renew(duration);

  res.json({
    success: true,
    message: 'Subscription renewed successfully',
    subscription
  });
}));

// @desc    Apply discount code
// @route   POST /api/subscriptions/apply-discount
// @access  Private
router.post('/apply-discount', [
  body('subscriptionId').isMongoId().withMessage('Invalid subscription ID'),
  body('discountCode').trim().notEmpty().withMessage('Discount code is required')
], asyncHandler(async (req, res) => {
  const { subscriptionId, discountCode } = req.body;

  const subscription = await Subscription.findById(subscriptionId);

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: 'Subscription not found'
    });
  }

  // Check ownership - fix authorization comparison
  const userIdString = subscription.user.toString();
  const reqUserIdString = req.userId ? req.userId.toString() : null;

  if (!req.userId || userIdString !== reqUserIdString) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  // TODO: Implement discount code validation
  // For now, apply a dummy 10% discount
  const discountPercentage = 10;
  const discountAmount = (subscription.amount * discountPercentage) / 100;

  subscription.discountApplied = {
    code: discountCode,
    percentage: discountPercentage,
    amount: discountAmount
  };
  subscription.amount -= discountAmount;

  await subscription.save();

  res.json({
    success: true,
    message: 'Discount applied successfully',
    subscription
  });
}));

// @desc    Get invoice for a payment
// @route   GET /api/subscriptions/invoice/:paymentId
// @access  Private
router.get('/invoice/:paymentId', asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  const subscription = await Subscription.findOne({
    user: req.userId,
    'paymentHistory._id': paymentId
  }).populate('user', 'displayName email businessName shopLocation');

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  const payment = subscription.paymentHistory.id(paymentId);

  res.json({
    success: true,
    invoice: {
      subscription: {
        tier: subscription.tier,
        billingCycle: subscription.billingCycle
      },
      payment,
      user: subscription.user
    }
  });
}));

export default router;
