import User from '../models/User.js';
import Subscription from '../models/Subscription.js';

// Check if user has active subscription
export const requireSubscription = (minTier = 'basic') => {
  const tierLevels = {
    free: 0,
    basic: 1,
    premium: 2,
    enterprise: 3
  };

  return async (req, res, next) => {
    try {
      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const userTierLevel = tierLevels[user.subscriptionTier] || 0;
      const requiredTierLevel = tierLevels[minTier] || 0;

      if (userTierLevel < requiredTierLevel) {
        return res.status(403).json({
          success: false,
          message: `This feature requires a ${minTier} subscription or higher`,
          upgradeRequired: true,
          currentTier: user.subscriptionTier,
          requiredTier: minTier
        });
      }

      // Check if subscription is expired
      if (user.subscriptionTier !== 'free' && user.subscriptionExpiry) {
        if (new Date() > user.subscriptionExpiry) {
          return res.status(403).json({
            success: false,
            message: 'Your subscription has expired. Please renew to continue.',
            subscriptionExpired: true
          });
        }
      }

      req.userSubscription = {
        tier: user.subscriptionTier,
        expiry: user.subscriptionExpiry,
        hasAccess: true
      };

      next();
    } catch (error) {
      console.error('Subscription check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking subscription status'
      });
    }
  };
};

// Check if user can access a specific feature
export const requireFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.canAccessFeature(featureName)) {
        return res.status(403).json({
          success: false,
          message: `This feature is not available in your current plan`,
          featureRequired: featureName,
          currentTier: user.subscriptionTier
        });
      }

      next();
    } catch (error) {
      console.error('Feature check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking feature access'
      });
    }
  };
};

// Check product limit based on subscription
export const checkProductLimit = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const Product = (await import('../models/Product.js')).default;
    const currentProductCount = await Product.countDocuments({
      seller: req.userId,
      status: 'active'
    });

    let maxProducts;
    switch (user.subscriptionTier) {
      case 'free':
        maxProducts = 5;
        break;
      case 'basic':
        maxProducts = 50;
        break;
      case 'premium':
        maxProducts = 200;
        break;
      case 'enterprise':
        maxProducts = Infinity;
        break;
      default:
        maxProducts = 5;
    }

    if (currentProductCount >= maxProducts) {
      return res.status(403).json({
        success: false,
        message: `You have reached the maximum number of products (${maxProducts}) for your ${user.subscriptionTier} plan`,
        upgradeRequired: true,
        currentTier: user.subscriptionTier,
        currentCount: currentProductCount,
        maxAllowed: maxProducts
      });
    }

    req.productLimit = {
      current: currentProductCount,
      max: maxProducts,
      remaining: maxProducts - currentProductCount
    };

    next();
  } catch (error) {
    console.error('Product limit check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking product limit'
    });
  }
};

// Attach subscription info to request
export const attachSubscriptionInfo = async (req, res, next) => {
  try {
    if (!req.userId) {
      return next();
    }

    const user = await User.findById(req.userId)
      .select('subscriptionTier subscriptionExpiry adCredits featuredUntil');

    if (user) {
      req.subscription = {
        tier: user.subscriptionTier,
        expiry: user.subscriptionExpiry,
        adCredits: user.adCredits,
        featuredUntil: user.featuredUntil,
        isActive: user.hasActiveSubscription()
      };
    }

    next();
  } catch (error) {
    console.error('Attach subscription info error:', error);
    next(); // Don't block request on error
  }
};

export default {
  requireSubscription,
  requireFeature,
  checkProductLimit,
  attachSubscriptionInfo
};
