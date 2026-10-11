const mongoose = require('mongoose');
const Expense = require('../models/Expense');

// GET /api/admin/expenses — list all expenses from all users
const adminGetAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({}).sort({ date: -1 });
    return res.status(200).json(expenses);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/expenses/:id — get any single expense by ID
const adminGetExpenseById = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid expense ID' });
  }

  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    return res.status(200).json(expense);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/admin/expenses/:id — update any expense by ID
const adminUpdateExpense = async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ message: 'Request body must be a JSON object' });
  }

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid expense ID' });
  }

  const { title, amount, category, date, description } = req.body;

  if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
    return res.status(400).json({ message: 'Title is required' });
  }

  if (amount !== undefined && (!Number.isFinite(Number(amount)) || Number(amount) <= 0)) {
    return res.status(400).json({ message: 'Amount must be a positive number' });
  }

  if (category !== undefined && (typeof category !== 'string' || !category.trim())) {
    return res.status(400).json({ message: 'Category is required' });
  }

  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (title !== undefined) expense.title = title.trim();
    if (amount !== undefined) expense.amount = Number(amount);
    if (category !== undefined) expense.category = category.trim();
    if (date !== undefined) expense.date = date;
    if (description !== undefined) expense.description = String(description).trim();

    await expense.save();
    return res.status(200).json(expense);
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/admin/expenses/:id — delete any expense by ID
const adminDeleteExpense = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid expense ID' });
  }

  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    return res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  adminGetAllExpenses,
  adminGetExpenseById,
  adminUpdateExpense,
  adminDeleteExpense
};
