const mongoose = require('mongoose');
const Expense = require('../models/Expense');

// Create an expense for the authenticated user
const createExpense = async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ message: 'Request body must be a JSON object' });
  }

  const { title, amount, category, date, description } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ message: 'Title is required' });
  }

  if (amount == null || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Amount must be a positive number' });
  }

  if (!category || typeof category !== 'string' || !category.trim()) {
    return res.status(400).json({ message: 'Category is required' });
  }

  try {
    const expense = await Expense.create({
      title: title.trim(),
      amount: Number(amount),
      category: category.trim(),
      date: date !== undefined ? date : Date.now(),
      description: description !== undefined ? String(description).trim() : '',
      user: req.user._id
    });

    return res.status(201).json(expense);
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get all expenses belonging to the authenticated user
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user._id }).sort({ date: -1 });
    return res.status(200).json(expenses);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get a single expense by ID (must belong to the authenticated user)
const getExpenseById = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid expense ID' });
  }

  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    return res.status(200).json(expense);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update an expense by ID (must belong to the authenticated user)
const updateExpense = async (req, res) => {
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
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });

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

// Delete an expense by ID (must belong to the authenticated user)
const deleteExpense = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid expense ID' });
  }

  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    return res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense
};
