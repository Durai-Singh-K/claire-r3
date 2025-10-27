import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

async function fixPhoneNumbers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/b2b-textile');
    console.log('Connected to MongoDB');

    // Find all users with phone numbers
    const users = await User.find({
      $or: [
        { phone: { $exists: true, $ne: null, $ne: '' } },
        { whatsapp: { $exists: true, $ne: null, $ne: '' } }
      ]
    });

    console.log(`Found ${users.length} users with phone numbers`);

    for (const user of users) {
      let updated = false;

      // Check and fix phone number
      if (user.phone && user.phone.startsWith('+91') && user.phone.length === 13) {
        // Phone number is in format +916379964654 (already correct)
        console.log(`User ${user.email}: phone number already in correct format`);
      } else if (user.phone && !user.phone.startsWith('+') && user.phone.length === 10) {
        // Phone number is 10 digits without country code - this is valid
        console.log(`User ${user.email}: phone number is valid 10-digit format`);
      } else if (user.phone) {
        console.log(`User ${user.email}: phone needs checking - ${user.phone}`);
      }

      // Check and fix whatsapp number
      if (user.whatsapp && user.whatsapp.startsWith('+91') && user.whatsapp.length === 13) {
        console.log(`User ${user.email}: whatsapp number already in correct format`);
      } else if (user.whatsapp && !user.whatsapp.startsWith('+') && user.whatsapp.length === 10) {
        console.log(`User ${user.email}: whatsapp number is valid 10-digit format`);
      } else if (user.whatsapp) {
        console.log(`User ${user.email}: whatsapp needs checking - ${user.whatsapp}`);
      }

      if (updated) {
        // Skip validation for this update
        await User.updateOne({ _id: user._id }, user, { runValidators: false });
        console.log(`Updated user ${user.email}`);
      }
    }

    console.log('Phone number fix completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing phone numbers:', error);
    process.exit(1);
  }
}

fixPhoneNumbers();
