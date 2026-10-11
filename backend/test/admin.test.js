const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const Expense = require('../src/models/Expense');
const {
  adminGetAllExpenses,
  adminGetExpenseById,
  adminUpdateExpense,
  adminDeleteExpense
} = require('../src/controllers/adminController');
const { protect, admin } = require('../src/middleware/authMiddleware');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ADMIN_ID = new mongoose.Types.ObjectId().toString();
const USER_ID = new mongoose.Types.ObjectId().toString();
const EXPENSE_ID = new mongoose.Types.ObjectId().toString();

const createRes = () => {
  const res = { statusCode: 200, payload: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.payload = payload; return res; };
  return res;
};

const makeReq = (body, params, user) => ({ body: body || {}, params: params || {}, user: user || { _id: ADMIN_ID, role: 'admin' } });

const stubExpense = () => ({
  _id: EXPENSE_ID,
  title: 'Taxi',
  amount: 50,
  category: 'Travel',
  date: '2026-10-11',
  description: '',
  user: USER_ID,
  save: async function () { return this; }
});

// ---------------------------------------------------------------------------
// admin middleware — access control
// ---------------------------------------------------------------------------

test('admin middleware: blocks non-admin user with 403', (t) => {
  const req = { user: { role: 'user' } };
  const res = createRes();
  const next = () => { throw new Error('next should not be called'); };

  admin(req, res, next);

  assert.equal(res.statusCode, 403);
  assert.equal(res.payload.message, 'Access denied. Admin only.');
});

test('admin middleware: allows admin user and calls next', (t) => {
  const req = { user: { role: 'admin' } };
  const res = createRes();
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  admin(req, res, next);

  assert.equal(nextCalled, true);
  assert.equal(res.payload, null); // no response sent
});

// ---------------------------------------------------------------------------
// adminGetAllExpenses
// ---------------------------------------------------------------------------

test('adminGetAllExpenses: returns all expenses regardless of owner', async (t) => {
  const originalFind = Expense.find;
  t.after(() => { Expense.find = originalFind; });

  const list = [stubExpense(), { ...stubExpense(), _id: new mongoose.Types.ObjectId().toString(), user: ADMIN_ID }];
  Expense.find = () => ({ sort: async () => list });

  const req = makeReq();
  const res = createRes();
  await adminGetAllExpenses(req, res);

  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.payload));
  assert.equal(res.payload.length, 2);
});

test('adminGetAllExpenses: returns 500 on database error', async (t) => {
  const originalFind = Expense.find;
  t.after(() => { Expense.find = originalFind; });

  Expense.find = () => ({ sort: async () => { throw new Error('db error'); } });

  const req = makeReq();
  const res = createRes();
  await adminGetAllExpenses(req, res);

  assert.equal(res.statusCode, 500);
  assert.equal(res.payload.message, 'Server error');
});

// ---------------------------------------------------------------------------
// adminGetExpenseById
// ---------------------------------------------------------------------------

test('adminGetExpenseById: rejects invalid ObjectId', async () => {
  const req = makeReq({}, { id: 'bad-id' });
  const res = createRes();
  await adminGetExpenseById(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.message, 'Invalid expense ID');
});

test('adminGetExpenseById: returns 404 when expense does not exist', async (t) => {
  const originalFindById = Expense.findById;
  t.after(() => { Expense.findById = originalFindById; });

  Expense.findById = async () => null;

  const req = makeReq({}, { id: EXPENSE_ID });
  const res = createRes();
  await adminGetExpenseById(req, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.payload.message, 'Expense not found');
});

test('adminGetExpenseById: returns expense owned by a different user', async (t) => {
  const originalFindById = Expense.findById;
  t.after(() => { Expense.findById = originalFindById; });

  const expense = stubExpense(); // owned by USER_ID, not ADMIN_ID
  Expense.findById = async () => expense;

  const req = makeReq({}, { id: EXPENSE_ID });
  const res = createRes();
  await adminGetExpenseById(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.title, 'Taxi');
});

test('adminGetExpenseById: returns 500 on database error', async (t) => {
  const originalFindById = Expense.findById;
  t.after(() => { Expense.findById = originalFindById; });

  Expense.findById = async () => { throw new Error('db error'); };

  const req = makeReq({}, { id: EXPENSE_ID });
  const res = createRes();
  await adminGetExpenseById(req, res);

  assert.equal(res.statusCode, 500);
  assert.equal(res.payload.message, 'Server error');
});

// ---------------------------------------------------------------------------
// adminUpdateExpense
// ---------------------------------------------------------------------------

test('adminUpdateExpense: rejects non-object body', async () => {
  const req = { body: null, params: { id: EXPENSE_ID }, user: { _id: ADMIN_ID, role: 'admin' } };
  const res = createRes();
  await adminUpdateExpense(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.message, 'Request body must be a JSON object');
});

test('adminUpdateExpense: rejects invalid ObjectId', async () => {
  const req = makeReq({ title: 'New' }, { id: 'bad-id' });
  const res = createRes();
  await adminUpdateExpense(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.message, 'Invalid expense ID');
});

test('adminUpdateExpense: rejects blank title', async () => {
  const req = makeReq({ title: '  ' }, { id: EXPENSE_ID });
  const res = createRes();
  await adminUpdateExpense(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.message, 'Title is required');
});

test('adminUpdateExpense: rejects non-positive amount', async () => {
  const req = makeReq({ amount: 0 }, { id: EXPENSE_ID });
  const res = createRes();
  await adminUpdateExpense(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.message, 'Amount must be a positive number');
});

test('adminUpdateExpense: rejects blank category', async () => {
  const req = makeReq({ category: '' }, { id: EXPENSE_ID });
  const res = createRes();
  await adminUpdateExpense(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.message, 'Category is required');
});

test('adminUpdateExpense: returns 404 when expense does not exist', async (t) => {
  const originalFindById = Expense.findById;
  t.after(() => { Expense.findById = originalFindById; });

  Expense.findById = async () => null;

  const req = makeReq({ title: 'Updated' }, { id: EXPENSE_ID });
  const res = createRes();
  await adminUpdateExpense(req, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.payload.message, 'Expense not found');
});

test('adminUpdateExpense: updates expense owned by another user', async (t) => {
  const originalFindById = Expense.findById;
  t.after(() => { Expense.findById = originalFindById; });

  const expense = stubExpense(); // owned by USER_ID
  Expense.findById = async () => expense;

  const req = makeReq({ title: 'Hotel', amount: 200 }, { id: EXPENSE_ID });
  const res = createRes();
  await adminUpdateExpense(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(expense.title, 'Hotel');
  assert.equal(expense.amount, 200);
});

test('adminUpdateExpense: returns 500 on database error', async (t) => {
  const originalFindById = Expense.findById;
  t.after(() => { Expense.findById = originalFindById; });

  Expense.findById = async () => { throw new Error('db error'); };

  const req = makeReq({ title: 'X' }, { id: EXPENSE_ID });
  const res = createRes();
  await adminUpdateExpense(req, res);

  assert.equal(res.statusCode, 500);
  assert.equal(res.payload.message, 'Server error');
});

// ---------------------------------------------------------------------------
// adminDeleteExpense
// ---------------------------------------------------------------------------

test('adminDeleteExpense: rejects invalid ObjectId', async () => {
  const req = makeReq({}, { id: 'not-an-id' });
  const res = createRes();
  await adminDeleteExpense(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.message, 'Invalid expense ID');
});

test('adminDeleteExpense: returns 404 when expense does not exist', async (t) => {
  const originalFindByIdAndDelete = Expense.findByIdAndDelete;
  t.after(() => { Expense.findByIdAndDelete = originalFindByIdAndDelete; });

  Expense.findByIdAndDelete = async () => null;

  const req = makeReq({}, { id: EXPENSE_ID });
  const res = createRes();
  await adminDeleteExpense(req, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.payload.message, 'Expense not found');
});

test('adminDeleteExpense: deletes expense owned by another user and returns success', async (t) => {
  const originalFindByIdAndDelete = Expense.findByIdAndDelete;
  t.after(() => { Expense.findByIdAndDelete = originalFindByIdAndDelete; });

  Expense.findByIdAndDelete = async () => stubExpense();

  const req = makeReq({}, { id: EXPENSE_ID });
  const res = createRes();
  await adminDeleteExpense(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.message, 'Expense deleted successfully');
});

test('adminDeleteExpense: returns 500 on database error', async (t) => {
  const originalFindByIdAndDelete = Expense.findByIdAndDelete;
  t.after(() => { Expense.findByIdAndDelete = originalFindByIdAndDelete; });

  Expense.findByIdAndDelete = async () => { throw new Error('db error'); };

  const req = makeReq({}, { id: EXPENSE_ID });
  const res = createRes();
  await adminDeleteExpense(req, res);

  assert.equal(res.statusCode, 500);
  assert.equal(res.payload.message, 'Server error');
});

// ---------------------------------------------------------------------------
// Normal-user isolation: admin routes must NOT be reachable by normal users.
// This is enforced at the route level (protect + admin middleware) not in the
// controller, so we verify it here through the admin middleware directly.
// ---------------------------------------------------------------------------

test('normal user is blocked from admin routes via admin middleware', () => {
  const req = { user: { _id: USER_ID, role: 'user' } };
  const res = createRes();
  let nextCalled = false;

  admin(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.payload.message, 'Access denied. Admin only.');
});

test('unauthenticated user is blocked from admin routes with 401 via protect middleware', async () => {
  const req = { headers: {} };
  const res = createRes();
  let nextCalled = false;

  await protect(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.payload.message, 'Missing or invalid token');
});
