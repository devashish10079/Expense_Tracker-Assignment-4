const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const Expense = require('../src/models/Expense');
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense
} = require('../src/controllers/expenseController');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const USER_ID = new mongoose.Types.ObjectId().toString();
const EXPENSE_ID = new mongoose.Types.ObjectId().toString();

const createRes = () => {
  const res = { statusCode: 200, payload: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.payload = payload; return res; };
  return res;
};

const makeReq = (body = {}, params = {}, user = { _id: USER_ID }) => ({
  body,
  params,
  user
});

// Reusable stub expense object returned by mocked DB methods
const stubExpense = () => ({
  _id: EXPENSE_ID,
  title: 'Lunch',
  amount: 12.5,
  category: 'Food',
  date: '2026-10-11',
  description: '',
  user: USER_ID,
  save: async function () { return this; }
});

// ---------------------------------------------------------------------------
// createExpense – validation
// ---------------------------------------------------------------------------

test('createExpense: rejects missing title', async () => {
  const req = makeReq({ amount: 10, category: 'Food' });
  const res = createRes();
  await createExpense(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.message, 'Title is required');
});

test('createExpense: rejects blank title', async () => {
  const req = makeReq({ title: '   ', amount: 10, category: 'Food' });
  const res = createRes();
  await createExpense(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.message, 'Title is required');
});

test('createExpense: rejects missing amount', async () => {
  const req = makeReq({ title: 'Lunch', category: 'Food' });
  const res = createRes();
  await createExpense(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.message, 'Amount must be a positive number');
});

test('createExpense: rejects zero amount', async () => {
  const req = makeReq({ title: 'Lunch', amount: 0, category: 'Food' });
  const res = createRes();
  await createExpense(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.message, 'Amount must be a positive number');
});

test('createExpense: rejects negative amount', async () => {
  const req = makeReq({ title: 'Lunch', amount: -5, category: 'Food' });
  const res = createRes();
  await createExpense(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.message, 'Amount must be a positive number');
});

test('createExpense: rejects missing category', async () => {
  const req = makeReq({ title: 'Lunch', amount: 10 });
  const res = createRes();
  await createExpense(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.message, 'Category is required');
});

test('createExpense: rejects non-object body', async () => {
  const req = { body: null, params: {}, user: { _id: USER_ID } };
  const res = createRes();
  await createExpense(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.message, 'Request body must be a JSON object');
});

// ---------------------------------------------------------------------------
// createExpense – success (Expense.create mocked)
// ---------------------------------------------------------------------------

test('createExpense: creates expense and returns 201', async (t) => {
  const originalCreate = Expense.create;
  t.after(() => { Expense.create = originalCreate; });

  const created = stubExpense();
  Expense.create = async () => created;

  const req = makeReq({ title: 'Lunch', amount: 12.5, category: 'Food' });
  const res = createRes();
  await createExpense(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.payload.title, 'Lunch');
  assert.equal(res.payload.amount, 12.5);
});

// ---------------------------------------------------------------------------
// getExpenses – success (Expense.find mocked)
// ---------------------------------------------------------------------------

test('getExpenses: returns array of user expenses', async (t) => {
  const originalFind = Expense.find;
  t.after(() => { Expense.find = originalFind; });

  const list = [stubExpense()];
  Expense.find = () => ({ sort: async () => list });

  const req = makeReq({}, {});
  const res = createRes();
  await getExpenses(req, res);

  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.payload));
  assert.equal(res.payload.length, 1);
  assert.equal(res.payload[0].title, 'Lunch');
});

// ---------------------------------------------------------------------------
// getExpenseById – validation and ownership
// ---------------------------------------------------------------------------

test('getExpenseById: rejects invalid ObjectId', async () => {
  const req = makeReq({}, { id: 'not-a-valid-id' });
  const res = createRes();
  await getExpenseById(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.message, 'Invalid expense ID');
});

test('getExpenseById: returns 404 when expense not found', async (t) => {
  const originalFindOne = Expense.findOne;
  t.after(() => { Expense.findOne = originalFindOne; });

  Expense.findOne = async () => null;

  const req = makeReq({}, { id: EXPENSE_ID });
  const res = createRes();
  await getExpenseById(req, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.payload.message, 'Expense not found');
});

test('getExpenseById: returns expense when found and owned', async (t) => {
  const originalFindOne = Expense.findOne;
  t.after(() => { Expense.findOne = originalFindOne; });

  const expense = stubExpense();
  Expense.findOne = async () => expense;

  const req = makeReq({}, { id: EXPENSE_ID });
  const res = createRes();
  await getExpenseById(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.title, 'Lunch');
});

test('getExpenseById: ownership enforced — another user gets 404', async (t) => {
  const originalFindOne = Expense.findOne;
  t.after(() => { Expense.findOne = originalFindOne; });

  // Simulate DB returning null because the user filter did not match
  Expense.findOne = async (filter) => {
    if (String(filter.user) !== String(USER_ID)) return null;
    return stubExpense();
  };

  const otherUserId = new mongoose.Types.ObjectId().toString();
  const req = makeReq({}, { id: EXPENSE_ID }, { _id: otherUserId });
  const res = createRes();
  await getExpenseById(req, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.payload.message, 'Expense not found');
});

// ---------------------------------------------------------------------------
// updateExpense – validation and success
// ---------------------------------------------------------------------------

test('updateExpense: rejects invalid ObjectId', async () => {
  const req = makeReq({ title: 'New' }, { id: 'bad-id' });
  const res = createRes();
  await updateExpense(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.message, 'Invalid expense ID');
});

test('updateExpense: rejects blank title', async () => {
  const req = makeReq({ title: '' }, { id: EXPENSE_ID });
  const res = createRes();
  await updateExpense(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.message, 'Title is required');
});

test('updateExpense: rejects non-positive amount', async () => {
  const req = makeReq({ amount: -1 }, { id: EXPENSE_ID });
  const res = createRes();
  await updateExpense(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.message, 'Amount must be a positive number');
});

test('updateExpense: returns 404 when expense not found', async (t) => {
  const originalFindOne = Expense.findOne;
  t.after(() => { Expense.findOne = originalFindOne; });

  Expense.findOne = async () => null;

  const req = makeReq({ title: 'Updated' }, { id: EXPENSE_ID });
  const res = createRes();
  await updateExpense(req, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.payload.message, 'Expense not found');
});

test('updateExpense: updates and returns the expense', async (t) => {
  const originalFindOne = Expense.findOne;
  t.after(() => { Expense.findOne = originalFindOne; });

  const expense = stubExpense();
  Expense.findOne = async () => expense;

  const req = makeReq({ title: 'Dinner', amount: 25 }, { id: EXPENSE_ID });
  const res = createRes();
  await updateExpense(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(expense.title, 'Dinner');
  assert.equal(expense.amount, 25);
});

// ---------------------------------------------------------------------------
// deleteExpense – validation and success
// ---------------------------------------------------------------------------

test('deleteExpense: rejects invalid ObjectId', async () => {
  const req = makeReq({}, { id: 'bad-id' });
  const res = createRes();
  await deleteExpense(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.message, 'Invalid expense ID');
});

test('deleteExpense: returns 404 when expense not found', async (t) => {
  const originalFindOneAndDelete = Expense.findOneAndDelete;
  t.after(() => { Expense.findOneAndDelete = originalFindOneAndDelete; });

  Expense.findOneAndDelete = async () => null;

  const req = makeReq({}, { id: EXPENSE_ID });
  const res = createRes();
  await deleteExpense(req, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.payload.message, 'Expense not found');
});

test('deleteExpense: deletes and returns success message', async (t) => {
  const originalFindOneAndDelete = Expense.findOneAndDelete;
  t.after(() => { Expense.findOneAndDelete = originalFindOneAndDelete; });

  Expense.findOneAndDelete = async () => stubExpense();

  const req = makeReq({}, { id: EXPENSE_ID });
  const res = createRes();
  await deleteExpense(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.message, 'Expense deleted successfully');
});

test('deleteExpense: ownership enforced — another user gets 404', async (t) => {
  const originalFindOneAndDelete = Expense.findOneAndDelete;
  t.after(() => { Expense.findOneAndDelete = originalFindOneAndDelete; });

  // Simulate DB returning null because user filter didn't match
  Expense.findOneAndDelete = async (filter) => {
    if (String(filter.user) !== String(USER_ID)) return null;
    return stubExpense();
  };

  const otherUserId = new mongoose.Types.ObjectId().toString();
  const req = makeReq({}, { id: EXPENSE_ID }, { _id: otherUserId });
  const res = createRes();
  await deleteExpense(req, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.payload.message, 'Expense not found');
});
