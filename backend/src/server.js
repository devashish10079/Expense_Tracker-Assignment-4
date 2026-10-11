const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const adminRoutes = require('./routes/adminRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Must match the options in frontend/src/components/ExpenseForm.jsx
const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Bills', 'Other'];

// Expenses are kept in memory (they reset when the server restarts)
let expenses = [];
let nextId = 1;

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return !isNaN(date) && date.toISOString().slice(0, 10) === value;
}

// Checks the fields that are present. When `partial` is false, all required fields must be present.
function validateExpense(body, partial) {
  const errors = [];
  const has = (key) => body[key] !== undefined;

  if (has('title') || !partial) {
    if (typeof body.title !== 'string' || !body.title.trim()) errors.push('Title is required');
  }
  if (has('amount') || !partial) {
    const amount = typeof body.amount === 'string' && body.amount.trim() !== '' ? Number(body.amount) : body.amount;
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      errors.push('Amount must be a positive number');
    }
  }
  if (has('category') || !partial) {
    if (!CATEGORIES.includes(body.category)) errors.push(`Category must be one of: ${CATEGORIES.join(', ')}`);
  }
  if (has('date') || !partial) {
    if (!isValidDate(body.date)) errors.push('Date must be a valid date (YYYY-MM-DD)');
  }
  if (has('description') && typeof body.description !== 'string') {
    errors.push('Description must be text');
  }
  return errors;
}

// Builds a clean expense from only the allowed fields, so clients can't set the ID or extra fields
function pickFields(body) {
  const fields = {};
  if (body.title !== undefined) fields.title = body.title.trim();
  if (body.amount !== undefined) fields.amount = Number(body.amount);
  if (body.category !== undefined) fields.category = body.category;
  if (body.date !== undefined) fields.date = body.date;
  if (body.description !== undefined) fields.description = body.description.trim();
  return fields;
}

function findIndex(idParam) {
  const id = Number(idParam);
  if (!Number.isInteger(id)) return -1;
  return expenses.findIndex((e) => e.id === id);
}

function requireObjectBody(req, res, next) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ message: 'Request body must be a JSON object' });
  }
  next();
}

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Expense Tracker API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/admin', adminRoutes);

// Get all expenses
app.get('/api/expenses', (req, res) => {
  res.json(expenses);
});

// Get one expense
app.get('/api/expenses/:id', (req, res) => {
  const index = findIndex(req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Expense not found' });
  res.json(expenses[index]);
});

// Create an expense
app.post('/api/expenses', requireObjectBody, (req, res) => {
  const errors = validateExpense(req.body, false);
  if (errors.length) return res.status(400).json({ message: errors.join('. '), errors });

  const expense = { description: '', ...pickFields(req.body), id: nextId++ };
  expenses.push(expense);
  res.status(201).json(expense);
});

// Update an expense (only the fields that are sent are changed)
app.put('/api/expenses/:id', requireObjectBody, (req, res) => {
  const index = findIndex(req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Expense not found' });

  const errors = validateExpense(req.body, true);
  if (errors.length) return res.status(400).json({ message: errors.join('. '), errors });

  expenses[index] = { ...expenses[index], ...pickFields(req.body), id: expenses[index].id };
  res.json(expenses[index]);
});

// Delete an expense
app.delete('/api/expenses/:id', (req, res) => {
  const index = findIndex(req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Expense not found' });
  expenses.splice(index, 1);
  res.json({ message: 'Expense deleted' });
});

// Unknown routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Malformed JSON and other errors
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON in request body' });
  }

  console.error(err);
  return res.status(500).json({ message: 'Server error' });
});

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/expense_tracker';

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw error;
  }
};

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, connectDB, startServer };
