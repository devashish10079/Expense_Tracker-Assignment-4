/**
 * Server-side Admin Provisioning CLI
 * Usage: node src/scripts/promoteUser.js <user-email>
 *
 * This trusted server-side script safely promotes an existing user to 'admin'.
 * It cannot be invoked via HTTP or public API endpoints.
 */
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment configuration once from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const User = require('../models/User');

const isValidEmail = (email) => typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const sanitizeDbError = (msg) => {
  if (typeof msg !== 'string') return '';
  return msg.replace(/mongodb(\+srv)?:\/\/[^@\s]+@/g, 'mongodb$1://***@');
};

const promoteUser = async (targetEmail) => {
  const rawEmail = targetEmail || process.argv[2];

  if (!rawEmail || !isValidEmail(rawEmail.trim())) {
    console.error('Usage: node src/scripts/promoteUser.js <valid-user-email>');
    if (require.main === module) process.exit(1);
    return { success: false, message: 'Invalid email argument' };
  }

  const normalizedEmail = rawEmail.trim().toLowerCase();

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is not configured in environment variables');
    if (require.main === module) process.exit(1);
    return { success: false, message: 'Database URI not configured' };
  }

  let exitCode = 0;
  let result = null;

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.error(`User with email "${normalizedEmail}" not found.`);
      exitCode = 1;
      result = { success: false, message: 'User not found' };
      return result;
    }

    user.role = 'admin';
    await user.save();

    console.log(`Successfully promoted user "${user.name}" (${user.email}) to role: admin.`);
    result = { success: true, user };
    return result;
  } catch (err) {
    console.error('Failed to promote user:', sanitizeDbError(err.message));
    exitCode = 1;
    result = { success: false, error: sanitizeDbError(err.message) };
    return result;
  } finally {
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      try {
        await mongoose.disconnect();
      } catch (disconnectErr) {
        // Log disconnect error with masked credentials without masking original result/exitCode
        console.error('Notice: Error during database disconnect:', sanitizeDbError(disconnectErr.message));
      }
    }
    if (require.main === module) {
      process.exit(exitCode);
    }
  }
};

if (require.main === module) {
  promoteUser();
}

module.exports = { promoteUser };
