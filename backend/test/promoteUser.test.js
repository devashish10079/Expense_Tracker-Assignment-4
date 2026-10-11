const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const User = require('../src/models/User');
const { promoteUser } = require('../src/scripts/promoteUser');

test('promoteUser: rejects invalid or missing email arguments', async () => {
  const resEmpty = await promoteUser('');
  assert.equal(resEmpty.success, false);
  assert.equal(resEmpty.message, 'Invalid email argument');

  const resInvalid = await promoteUser('not-an-email');
  assert.equal(resInvalid.success, false);
  assert.equal(resInvalid.message, 'Invalid email argument');
});

test('promoteUser: returns error when target user does not exist in database', async (t) => {
  const originalConnect = mongoose.connect;
  const originalDisconnect = mongoose.disconnect;
  const originalFindOne = User.findOne;

  t.after(() => {
    mongoose.connect = originalConnect;
    mongoose.disconnect = originalDisconnect;
    User.findOne = originalFindOne;
  });

  process.env.MONGO_URI = 'mongodb://localhost:27017/test-expense-db';
  mongoose.connect = async () => {};
  mongoose.disconnect = async () => {};
  User.findOne = async () => null;

  const result = await promoteUser('missing@example.com');
  assert.equal(result.success, false);
  assert.equal(result.message, 'User not found');
});

test('promoteUser: successfully promotes existing user to admin', async (t) => {
  const originalConnect = mongoose.connect;
  const originalDisconnect = mongoose.disconnect;
  const originalFindOne = User.findOne;

  t.after(() => {
    mongoose.connect = originalConnect;
    mongoose.disconnect = originalDisconnect;
    User.findOne = originalFindOne;
  });

  process.env.MONGO_URI = 'mongodb://localhost:27017/test-expense-db';
  mongoose.connect = async () => {};
  mongoose.disconnect = async () => {};

  const fakeUser = {
    _id: 'user-123',
    name: 'Target User',
    email: 'target@example.com',
    role: 'user',
    save: async function () {
      return this;
    }
  };
  User.findOne = async () => fakeUser;

  const result = await promoteUser('target@example.com');
  assert.equal(result.success, true);
  assert.equal(fakeUser.role, 'admin');
});

test('promoteUser: handles failed disconnect without masking success or throwing unhandled rejection', async (t) => {
  const originalConnect = mongoose.connect;
  const originalDisconnect = mongoose.disconnect;
  const originalFindOne = User.findOne;

  t.after(() => {
    mongoose.connect = originalConnect;
    mongoose.disconnect = originalDisconnect;
    User.findOne = originalFindOne;
  });

  process.env.MONGO_URI = 'mongodb://localhost:27017/test-expense-db';
  mongoose.connect = async () => {};
  // Simulate disconnect error
  mongoose.disconnect = async () => {
    throw new Error('Socket timeout during disconnect');
  };

  const fakeUser = {
    _id: 'user-456',
    name: 'Disconnect User',
    email: 'disconnect@example.com',
    role: 'user',
    save: async function () {
      return this;
    }
  };
  User.findOne = async () => fakeUser;

  const result = await promoteUser('disconnect@example.com');
  assert.equal(result.success, true);
  assert.equal(fakeUser.role, 'admin');
});
