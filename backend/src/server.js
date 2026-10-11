const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Load environment variables once from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Production CORS Configuration
const allowedOrigins = [
  'https://expense-tracker-assignment-4.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:5001',
  'http://127.0.0.1:5173'
];

if (process.env.CLIENT_ORIGIN) {
  const normalized = process.env.CLIENT_ORIGIN.replace(/\/+$/, '');
  if (!allowedOrigins.includes(normalized)) {
    allowedOrigins.push(normalized);
  }
}
if (process.env.FRONTEND_URL) {
  const normalized = process.env.FRONTEND_URL.replace(/\/+$/, '');
  if (!allowedOrigins.includes(normalized)) {
    allowedOrigins.push(normalized);
  }
}

// Exact production origin and strictly constrained Vercel preview domain pattern
const isAllowedVercelOrigin = (origin) => {
  if (origin === 'https://expense-tracker-assignment-4.vercel.app') {
    return true;
  }
  // Allow only official Vercel preview deployments belonging to this specific project and team/user scope
  return /^https:\/\/expense-tracker-assignment-4(-[a-z0-9-]+)?-devashish10079s-projects\.vercel\.app$/.test(origin);
};

app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser requests (e.g. curl, server-to-server, mobile)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      process.env.NODE_ENV !== 'production' ||
      isAllowedVercelOrigin(origin)
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

// Base health route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Expense Tracker API is running' });
});

// Mounted Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/admin', adminRoutes);

// Unknown route handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Central error handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON in request body' });
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS origin not allowed' });
  }

  console.error(err);
  return res.status(500).json({ message: 'Server error' });
});

// Mask MongoDB credentials in connection error logs
const sanitizeDbError = (msg) => {
  if (typeof msg !== 'string') return '';
  return msg.replace(/mongodb(\+srv)?:\/\/[^@\s]+@/g, 'mongodb$1://***@');
};

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    const errorMsg = 'Database connection failed: MONGO_URI (or MONGODB_URI) is not defined';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  } catch (error) {
    const safeMsg = sanitizeDbError(error.message);
    console.error('Database connection failed:', safeMsg);
    throw new Error(safeMsg);
  }
};

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    return server;
  } catch (error) {
    console.error('Failed to start server:', sanitizeDbError(error.message));
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, connectDB, startServer };
