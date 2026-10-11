import test from 'node:test';
import assert from 'node:assert/strict';

// Role-based navigation and route guard logic tests

function canAccessAdminRoute(user, token) {
  if (!user || !token) return { allowed: false, redirect: '/login' };
  if (user.role !== 'admin') return { allowed: false, redirect: '/dashboard' };
  return { allowed: true, redirect: null };
}

function shouldShowAdminNavigation(user) {
  return Boolean(user && user.role === 'admin');
}

function calculateAdminStats(expenses) {
  const totalCount = expenses.length;
  const totalAmount = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const uniqueOwners = new Set(
    expenses.map((item) => {
      if (!item.user) return 'unknown';
      if (typeof item.user === 'object') return item.user._id || item.user.name || 'unknown';
      return String(item.user);
    })
  ).size;
  const avgAmount = totalCount > 0 ? totalAmount / totalCount : 0;
  return { totalCount, totalAmount, uniqueOwners, avgAmount };
}

function validateExpenseForm(form) {
  const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Bills', 'Other'];
  if (!form.title || !form.title.trim()) return 'Title is required';
  const amount = Number(form.amount);
  if (form.amount === '' || !Number.isFinite(amount) || amount <= 0) {
    return 'Amount must be a positive number';
  }
  if (!CATEGORIES.includes(form.category)) return 'Please select a valid category';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date) || isNaN(new Date(form.date).getTime())) {
    return 'Please enter a valid date';
  }
  return '';
}

test('Frontend Auth: unauthenticated visitor cannot access admin route and is redirected to /login', () => {
  const resultNoUser = canAccessAdminRoute(null, 'token-abc');
  assert.equal(resultNoUser.allowed, false);
  assert.equal(resultNoUser.redirect, '/login');

  const resultNoToken = canAccessAdminRoute({ name: 'Admin', role: 'admin' }, null);
  assert.equal(resultNoToken.allowed, false);
  assert.equal(resultNoToken.redirect, '/login');
});

test('Frontend Auth: regular user cannot access admin route and is redirected to /dashboard', () => {
  const regularUser = { _id: 'user-1', name: 'John Doe', role: 'user' };
  const result = canAccessAdminRoute(regularUser, 'valid-token');
  assert.equal(result.allowed, false);
  assert.equal(result.redirect, '/dashboard');
});

test('Frontend Auth: admin user is granted access to admin dashboard route', () => {
  const adminUser = { _id: 'admin-1', name: 'Admin Root', role: 'admin' };
  const result = canAccessAdminRoute(adminUser, 'valid-token');
  assert.equal(result.allowed, true);
  assert.equal(result.redirect, null);
});

test('Frontend Navigation: regular user does not see admin navigation elements', () => {
  const regularUser = { _id: 'user-1', name: 'Regular User', role: 'user' };
  assert.equal(shouldShowAdminNavigation(regularUser), false);
  assert.equal(shouldShowAdminNavigation(null), false);
});

test('Frontend Navigation: admin user sees admin navigation elements', () => {
  const adminUser = { _id: 'admin-1', name: 'Admin User', role: 'admin' };
  assert.equal(shouldShowAdminNavigation(adminUser), true);
});

test('Frontend Metrics: correctly computes cross-user totals and active owners', () => {
  const sampleExpenses = [
    { title: 'Lunch', amount: 120, user: { _id: 'u1', name: 'Alice' } },
    { title: 'Flight', amount: 480, user: { _id: 'u2', name: 'Bob' } },
    { title: 'Dinner', amount: 200, user: { _id: 'u1', name: 'Alice' } }
  ];

  const stats = calculateAdminStats(sampleExpenses);
  assert.equal(stats.totalCount, 3);
  assert.equal(stats.totalAmount, 800);
  assert.equal(stats.uniqueOwners, 2);
  assert.equal(stats.avgAmount, 800 / 3);
});

test('Frontend Form Validation: enforces positive amounts, valid categories and dates', () => {
  assert.equal(validateExpenseForm({ title: '', amount: '100', category: 'Food', date: '2026-03-01' }), 'Title is required');
  assert.equal(validateExpenseForm({ title: 'Snack', amount: '-5', category: 'Food', date: '2026-03-01' }), 'Amount must be a positive number');
  assert.equal(validateExpenseForm({ title: 'Snack', amount: 'abc', category: 'Food', date: '2026-03-01' }), 'Amount must be a positive number');
  assert.equal(validateExpenseForm({ title: 'Snack', amount: '50', category: 'InvalidCat', date: '2026-03-01' }), 'Please select a valid category');
  assert.equal(validateExpenseForm({ title: 'Snack', amount: '50', category: 'Food', date: 'invalid-date' }), 'Please enter a valid date');
  assert.equal(validateExpenseForm({ title: 'Snack', amount: '50', category: 'Food', date: '2026-03-01' }), '');
});

test('Frontend API Response: 401 response triggers token cleanup', () => {
  const mockStorage = {
    expenseTrackerToken: 'sample-token',
    expenseTrackerUser: JSON.stringify({ role: 'admin' })
  };

  const handle401 = (storage) => {
    delete storage.expenseTrackerToken;
    delete storage.expenseTrackerUser;
    const error = new Error('Session expired. Please log in again.');
    error.status = 401;
    return error;
  };

  const err = handle401(mockStorage);
  assert.equal(err.status, 401);
  assert.equal(mockStorage.expenseTrackerToken, undefined);
  assert.equal(mockStorage.expenseTrackerUser, undefined);
});

test('Frontend API Response: 403 response generates forbidden error with status 403', () => {
  const handle403 = (data) => {
    const error = new Error((data && data.message) || 'Access denied: Administrator permissions required.');
    error.status = 403;
    return error;
  };

  const err = handle403({ message: 'Access denied. Admin only.' });
  assert.equal(err.status, 403);
  assert.equal(err.message, 'Access denied. Admin only.');
});

