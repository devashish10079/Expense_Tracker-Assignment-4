const express = require('express');
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, getExpenses)
  .post(protect, createExpense);

router.route('/:id')
  .get(protect, getExpenseById)
  .put(protect, updateExpense)
  .delete(protect, deleteExpense);

module.exports = router;
