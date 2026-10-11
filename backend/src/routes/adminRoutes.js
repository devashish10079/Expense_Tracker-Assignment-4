const express = require('express');
const {
  adminGetAllExpenses,
  adminGetExpenseById,
  adminUpdateExpense,
  adminDeleteExpense
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// All admin routes require a valid JWT (protect) and admin role (admin)
router.get('/expenses', protect, admin, adminGetAllExpenses);
router.get('/expenses/:id', protect, admin, adminGetExpenseById);
router.put('/expenses/:id', protect, admin, adminUpdateExpense);
router.delete('/expenses/:id', protect, admin, adminDeleteExpense);

module.exports = router;
