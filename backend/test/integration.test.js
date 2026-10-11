const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const Expense = require('../src/models/Expense');
const User = require('../src/models/User');
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense
} = require('../src/controllers/expenseController');
const {
  adminGetAllExpenses,
  adminGetExpenseById,
  adminUpdateExpense,
  adminDeleteExpense
} = require('../src/controllers/adminController');
const { protect, admin } = require('../src/middleware/authMiddleware');

const createRes = () => {
  const res = { statusCode: 200, payload: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.payload = payload; return res; };
  return res;
};

test('Integration: user and admin operations share the same Expense Mongoose model schema', () => {
  assert.ok(Expense.schema.paths.title, 'Expense model has title path');
  assert.ok(Expense.schema.paths.amount, 'Expense model has amount path');
  assert.ok(Expense.schema.paths.category, 'Expense model has category path');
  assert.ok(Expense.schema.paths.user, 'Expense model has user reference');
  assert.equal(Expense.schema.paths.user.options.ref, 'User');
});

test('Integration: unauthenticated request to admin endpoint is blocked with 401', async () => {
  const req = { headers: {} };
  const res = createRes();
  let nextCalled = false;

  await protect(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.payload.message, 'Missing or invalid token');
});

test('Integration: standard user requesting admin route is rejected with 403', () => {
  const req = { user: { _id: 'user-standard', role: 'user' } };
  const res = createRes();
  let nextCalled = false;

  admin(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.payload.message, 'Access denied. Admin only.');
});

test('Integration: admin can access expenses across multiple user accounts', async (t) => {
  const originalFind = Expense.find;
  t.after(() => { Expense.find = originalFind; });

  const USER_A = new mongoose.Types.ObjectId().toString();
  const USER_B = new mongoose.Types.ObjectId().toString();

  const allExpenses = [
    { _id: 'exp-1', title: 'User A Expense', amount: 100, user: USER_A },
    { _id: 'exp-2', title: 'User B Expense', amount: 200, user: USER_B }
  ];

  Expense.find = () => ({
    sort: () => ({
      populate: async () => allExpenses
    })
  });

  const req = { user: { _id: 'admin-1', role: 'admin' } };
  const res = createRes();

  await adminGetAllExpenses(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.length, 2);
  assert.equal(res.payload[0].user, USER_A);
  assert.equal(res.payload[1].user, USER_B);
});

test('Integration: regular user cannot access another user expenses (ownership isolation)', async (t) => {
  const originalFindOne = Expense.findOne;
  t.after(() => { Expense.findOne = originalFindOne; });

  const USER_OWNER = new mongoose.Types.ObjectId();
  const USER_ATTACKER = new mongoose.Types.ObjectId();
  const EXPENSE_ID = new mongoose.Types.ObjectId();

  // Mock findOne enforcing { _id: id, user: req.user._id }
  Expense.findOne = async (query) => {
    if (query._id.toString() === EXPENSE_ID.toString() && query.user.toString() === USER_OWNER.toString()) {
      return { _id: EXPENSE_ID, title: 'Private', amount: 50, user: USER_OWNER };
    }
    return null; // Not found for attacker
  };

  const req = {
    params: { id: EXPENSE_ID.toString() },
    user: { _id: USER_ATTACKER }
  };
  const res = createRes();

  await getExpenseById(req, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.payload.message, 'Expense not found');
});

test('Integration: end-to-end data persistence between user and admin across simulated DB lifecycle', async (t) => {
  // Shared simulated MongoDB collection
  const mockDb = new Map();
  const USER_ID = new mongoose.Types.ObjectId();
  const ADMIN_ID = new mongoose.Types.ObjectId();
  const EXPENSE_ID = new mongoose.Types.ObjectId();

  // Initial user expense in simulated database
  mockDb.set(EXPENSE_ID.toString(), {
    _id: EXPENSE_ID,
    title: 'Initial Title',
    amount: 150,
    category: 'Food',
    date: '2026-03-01',
    description: 'Initial lunch',
    user: USER_ID
  });

  const originalFind = Expense.find;
  const originalFindById = Expense.findById;
  const originalFindByIdAndUpdate = Expense.findByIdAndUpdate;
  const originalFindByIdAndDelete = Expense.findByIdAndDelete;
  const originalFindOne = Expense.findOne;

  t.after(() => {
    Expense.find = originalFind;
    Expense.findById = originalFindById;
    Expense.findByIdAndUpdate = originalFindByIdAndUpdate;
    Expense.findByIdAndDelete = originalFindByIdAndDelete;
    Expense.findOne = originalFindOne;
  });

  // Admin lists all expenses from shared database
  Expense.find = () => ({
    sort: () => ({
      populate: async () => Array.from(mockDb.values())
    })
  });
  const listReq = { user: { _id: ADMIN_ID, role: 'admin' } };
  const listRes = createRes();
  await adminGetAllExpenses(listReq, listRes);
  assert.equal(listRes.statusCode, 200);
  assert.equal(listRes.payload.length, 1);
  assert.equal(listRes.payload[0].title, 'Initial Title');

  // Admin views specific expense by ID and updates it
  Expense.findById = (id) => {
    const item = mockDb.get(id.toString());
    const doc = item
      ? {
          ...item,
          save: async function () {
            mockDb.set(id.toString(), { ...this });
            return this;
          }
        }
      : null;

    return {
      populate: () => Promise.resolve(doc),
      then: (resolve, reject) => Promise.resolve(doc).then(resolve, reject)
    };
  };

  const viewReq = { params: { id: EXPENSE_ID.toString() }, user: { _id: ADMIN_ID, role: 'admin' } };
  const viewRes = createRes();
  await adminGetExpenseById(viewReq, viewRes);
  assert.equal(viewRes.statusCode, 200);
  assert.equal(viewRes.payload.title, 'Initial Title');

  // Admin updates the expense in the shared database
  const updateReq = {
    params: { id: EXPENSE_ID.toString() },
    body: { title: 'Admin Updated Title', amount: 250, category: 'Food' },
    user: { _id: ADMIN_ID, role: 'admin' }
  };
  const updateRes = createRes();
  await adminUpdateExpense(updateReq, updateRes);
  assert.equal(updateRes.statusCode, 200);
  assert.equal(updateRes.payload.title, 'Admin Updated Title');

  // Verify regular user reloads updated expense from the shared database
  Expense.findOne = async (query) => {
    const item = mockDb.get(query._id.toString());
    if (item && item.user.toString() === query.user.toString()) {
      return item;
    }
    return null;
  };
  const userReloadReq = {
    params: { id: EXPENSE_ID.toString() },
    user: { _id: USER_ID }
  };
  const userReloadRes = createRes();
  await getExpenseById(userReloadReq, userReloadRes);
  assert.equal(userReloadRes.statusCode, 200);
  assert.equal(userReloadRes.payload.title, 'Admin Updated Title');
  assert.equal(userReloadRes.payload.amount, 250);

  // Admin deletes the expense from shared database
  Expense.findByIdAndDelete = async (id) => {
    const deleted = mockDb.get(id.toString());
    mockDb.delete(id.toString()); // Persist deletion
    return deleted || null;
  };
  const deleteReq = {
    params: { id: EXPENSE_ID.toString() },
    user: { _id: ADMIN_ID, role: 'admin' }
  };
  const deleteRes = createRes();
  await adminDeleteExpense(deleteReq, deleteRes);
  assert.equal(deleteRes.statusCode, 200);

  // Verify expense is no longer present in DB after reload
  const afterDeleteReq = {
    params: { id: EXPENSE_ID.toString() },
    user: { _id: USER_ID }
  };
  const afterDeleteRes = createRes();
  await getExpenseById(afterDeleteReq, afterDeleteRes);
  assert.equal(afterDeleteRes.statusCode, 404);
});

