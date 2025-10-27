import User from '../models/User.js';
import Product from '../models/Product.js';
import Post from '../models/Post.js';
import Review from '../models/Review.js';
import Transaction from '../models/Transaction.js';

// Calculate trust score for a user
export const calculateTrustScore = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  // Trust score is calculated in the User model pre-save hook
  // This function just triggers a save to recalculate
  await user.save();

  return user.trustScore;
};

// Get business analytics dashboard
export const getBusinessAnalytics = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const [
      productCount,
      postCount,
      reviewStats,
      transactionStats,
      friendCount,
      communityCount
    ] = await Promise.all([
      Product.countDocuments({ seller: userId, status: 'active' }),
      Post.countDocuments({ author: userId }),
      Review.getRatingStats(userId),
      Transaction.getUserTransactionSummary(userId, 'seller'),
      User.findById(userId).then(u => u?.friends?.length || 0),
      User.findById(userId).then(u => u?.communities?.length || 0)
    ]);

    return {
      overview: {
        profileViews: user.analytics?.profileViews || 0,
        trustScore: user.trustScore,
        rating: user.rating,
        totalReviews: user.totalReviews,
        responseTime: user.responseTime,
        completionRate: user.completionRate
      },
      content: {
        totalProducts: productCount,
        totalPosts: postCount,
        productViews: user.analytics?.productViews || 0,
        catalogDownloads: user.analytics?.catalogDownloads || 0
      },
      engagement: {
        totalLikes: user.analytics?.totalLikes || 0,
        totalComments: user.analytics?.totalComments || 0,
        totalShares: user.analytics?.totalShares || 0
      },
      network: {
        friendCount,
        communityCount
      },
      transactions: transactionStats,
      reviews: reviewStats,
      subscription: {
        tier: user.subscriptionTier,
        expiry: user.subscriptionExpiry,
        adCredits: user.adCredits
      }
    };
  } catch (error) {
    console.error('Get business analytics error:', error);
    throw error;
  }
};

// Update response time
export const updateResponseTime = async (userId, responseTimeMinutes) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Calculate average response time
    const currentAvg = user.responseTime || 0;
    const newAvg = currentAvg === 0 ? responseTimeMinutes : (currentAvg + responseTimeMinutes) / 2;

    user.responseTime = Math.round(newAvg);
    await user.save();

    return user.responseTime;
  } catch (error) {
    console.error('Update response time error:', error);
    throw error;
  }
};

// Update completion rate
export const updateCompletionRate = async (userId) => {
  try {
    const transactions = await Transaction.find({
      seller: userId,
      status: { $in: ['completed', 'cancelled', 'failed'] }
    });

    if (transactions.length === 0) return 0;

    const completed = transactions.filter(t => t.status === 'completed').length;
    const rate = (completed / transactions.length) * 100;

    await User.findByIdAndUpdate(userId, {
      completionRate: Math.round(rate)
    });

    return Math.round(rate);
  } catch (error) {
    console.error('Update completion rate error:', error);
    throw error;
  }
};

// Increment analytics counter
export const incrementAnalytics = async (userId, metric) => {
  try {
    const updateField = `analytics.${metric}`;
    await User.findByIdAndUpdate(userId, {
      $inc: { [updateField]: 1 }
    });

    return { success: true };
  } catch (error) {
    console.error('Increment analytics error:', error);
    throw error;
  }
};

export default {
  calculateTrustScore,
  getBusinessAnalytics,
  updateResponseTime,
  updateCompletionRate,
  incrementAnalytics
};
