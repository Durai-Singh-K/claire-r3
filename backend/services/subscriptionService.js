import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import emailService from './emailService.js';

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: {
      maxProducts: 5,
      maxPhotosPerProduct: 3,
      analyticsAccess: false,
      featuredListings: 0,
      adCreditsPerMonth: 0,
      prioritySupport: false,
      customBranding: false,
      apiAccess: false
    }
  },
  basic: {
    name: 'Basic',
    price: { monthly: 499, quarterly: 1299, yearly: 4799 },
    features: {
      maxProducts: 50,
      maxPhotosPerProduct: 10,
      analyticsAccess: true,
      featuredListings: 1,
      adCreditsPerMonth: 100,
      prioritySupport: false,
      customBranding: false,
      apiAccess: false
    }
  },
  premium: {
    name: 'Premium',
    price: { monthly: 1499, quarterly: 3999, yearly: 14999 },
    features: {
      maxProducts: 200,
      maxPhotosPerProduct: 20,
      analyticsAccess: true,
      featuredListings: 5,
      adCreditsPerMonth: 500,
      prioritySupport: true,
      customBranding: true,
      apiAccess: true
    }
  },
  enterprise: {
    name: 'Enterprise',
    price: { monthly: 4999, quarterly: 13999, yearly: 49999 },
    features: {
      maxProducts: -1, // Unlimited
      maxPhotosPerProduct: 50,
      analyticsAccess: true,
      featuredListings: 20,
      adCreditsPerMonth: 2000,
      prioritySupport: true,
      customBranding: true,
      apiAccess: true,
      bulkImport: true,
      advancedReporting: true,
      dedicatedManager: true
    }
  }
};

// Get all plans
export const getPlans = () => {
  return SUBSCRIPTION_PLANS;
};

// Create or upgrade subscription
export const createSubscription = async (userId, tier, billingCycle = 'monthly') => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    if (!SUBSCRIPTION_PLANS[tier]) {
      throw new Error('Invalid subscription tier');
    }

    const plan = SUBSCRIPTION_PLANS[tier];
    let amount = 0;
    let durationDays = 0;

    if (tier !== 'free') {
      amount = plan.price[billingCycle];
      durationDays = billingCycle === 'monthly' ? 30 : billingCycle === 'quarterly' ? 90 : 365;
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const subscription = new Subscription({
      user: userId,
      tier,
      status: tier === 'free' ? 'active' : 'pending',
      startDate,
      endDate,
      amount,
      currency: 'INR',
      billingCycle,
      features: plan.features
    });

    await subscription.save();

    return subscription;
  } catch (error) {
    console.error('Create subscription error:', error);
    throw error;
  }
};

// Process subscription payment
export const processPayment = async (subscriptionId, paymentData) => {
  try {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) throw new Error('Subscription not found');

    const payment = {
      transactionId: paymentData.gatewayTransactionId,
      amount: paymentData.amount,
      currency: paymentData.currency || 'INR',
      paymentMethod: paymentData.paymentMethod,
      status: paymentData.status || 'success',
      paidAt: new Date(),
      invoiceUrl: paymentData.invoiceUrl,
      receiptUrl: paymentData.receiptUrl
    };

    await subscription.addPayment(payment);

    // Update user subscription details
    const user = await User.findById(subscription.user);
    user.subscriptionTier = subscription.tier;
    user.subscriptionExpiry = subscription.endDate;

    // Add ad credits based on plan
    const plan = SUBSCRIPTION_PLANS[subscription.tier];
    if (plan.features.adCreditsPerMonth) {
      user.adCredits += plan.features.adCreditsPerMonth;
    }

    await user.save();

    // Send confirmation email
    await emailService.sendEmail({
      to: user.email,
      subject: 'Subscription Activated - WholeSale Connect',
      html: `
        <h2>Subscription Activated!</h2>
        <p>Hi ${user.displayName},</p>
        <p>Your ${subscription.tier.toUpperCase()} subscription has been activated.</p>
        <p><strong>Subscription Details:</strong></p>
        <ul>
          <li>Plan: ${plan.name}</li>
          <li>Billing Cycle: ${subscription.billingCycle}</li>
          <li>Amount Paid: ₹${subscription.amount}</li>
          <li>Valid Until: ${subscription.endDate.toLocaleDateString()}</li>
        </ul>
        <p>Thank you for choosing WholeSale Connect!</p>
      `
    });

    return { success: true, subscription, user };
  } catch (error) {
    console.error('Process payment error:', error);
    throw error;
  }
};

// Cancel subscription
export const cancelSubscription = async (userId, reason) => {
  try {
    const subscription = await Subscription.getActiveSubscription(userId);
    if (!subscription) throw new Error('No active subscription found');

    await subscription.cancel(reason);

    const user = await User.findById(userId);
    user.subscriptionTier = 'free';
    user.subscriptionExpiry = null;
    await user.save();

    // Send cancellation email
    await emailService.sendEmail({
      to: user.email,
      subject: 'Subscription Cancelled - WholeSale Connect',
      html: `
        <h2>Subscription Cancelled</h2>
        <p>Hi ${user.displayName},</p>
        <p>Your subscription has been cancelled as requested.</p>
        <p>You will continue to have access to premium features until ${subscription.endDate.toLocaleDateString()}.</p>
        <p>We're sorry to see you go. If you have any feedback, please let us know.</p>
      `
    });

    return { success: true, message: 'Subscription cancelled' };
  } catch (error) {
    console.error('Cancel subscription error:', error);
    throw error;
  }
};

// Check and expire subscriptions (run as cron job)
export const checkExpiredSubscriptions = async () => {
  try {
    const expiredSubscriptions = await Subscription.find({
      status: 'active',
      endDate: { $lt: new Date() }
    });

    for (const subscription of expiredSubscriptions) {
      subscription.status = 'expired';
      await subscription.save();

      const user = await User.findById(subscription.user);
      if (user) {
        user.subscriptionTier = 'free';
        user.subscriptionExpiry = null;
        await user.save();

        // Send expiration notification
        await emailService.sendEmail({
          to: user.email,
          subject: 'Subscription Expired - WholeSale Connect',
          html: `
            <h2>Subscription Expired</h2>
            <p>Hi ${user.displayName},</p>
            <p>Your subscription has expired.</p>
            <p>Renew now to continue enjoying premium features!</p>
            <a href="${process.env.FRONTEND_URL}/subscription">Renew Subscription</a>
          `
        });
      }
    }

    return { expiredCount: expiredSubscriptions.length };
  } catch (error) {
    console.error('Check expired subscriptions error:', error);
    throw error;
  }
};

export default {
  getPlans,
  createSubscription,
  processPayment,
  cancelSubscription,
  checkExpiredSubscriptions,
  SUBSCRIPTION_PLANS
};
