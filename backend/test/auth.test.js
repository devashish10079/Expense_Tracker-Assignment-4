const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../src/models/User');
const { registerUser, loginUser, generateToken } = require('../src/controllers/authController');
const { protect, admin } = require('../src/middleware/authMiddleware');

const TEST_SECRET = 'test-jwt-secret-key-12345';
process.env.JWT_SECRET = TEST_SECRET;

const createRes = () => {
  const res = {
    statusCode: 200,
    payload: null
  };

  res.status = (code) => {
    res.statusCode = code;
    return res;
  };

  res.json = (payload) => {
    res.payload = payload;
    return res;
  };

  return res;
};

test('registerUser should return validation error when required fields are missing', async () => {
  const req = { body: {} };
  const res = createRes();

  await registerUser(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.message, 'Name, email and password are required');
});

test('registerUser should handle duplicate email errors from MongoDB', async (t) => {
  const originalCreate = User.create;
  const originalFindOne = User.findOne;

  t.after(() => {
    User.create = originalCreate;
    User.findOne = originalFindOne;
  });

  User.findOne = async () => null;
  User.create = async () => {
    const error = new Error('duplicate key');
    error.code = 11000;
    throw error;
  };

  const req = { body: { name: 'Test User', email: 'test@example.com', password: 'Password123' } };
  const res = createRes();

  await registerUser(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.message, 'User already exists with this email');
});

test('generateToken should sign token with configured JWT secret', () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'configured-secret';

  const token = generateToken({ _id: 'user-123', role: 'admin' });
  const decoded = jwt.verify(token, 'configured-secret');

  assert.equal(decoded.id, 'user-123');
  assert.equal(decoded.role, 'admin');

  process.env.JWT_SECRET = previousSecret;
});

test('generateToken should throw configuration error when JWT_SECRET is missing', (t) => {
  const previousSecret = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  t.after(() => {
    process.env.JWT_SECRET = previousSecret;
  });

  assert.throws(
    () => generateToken({ _id: 'user-123', role: 'user' }),
    /JWT_SECRET environment variable is not configured/
  );
});

test('loginUser should reject invalid password', async (t) => {
  const originalFindOne = User.findOne;
  t.after(() => {
    User.findOne = originalFindOne;
  });

  const passwordHash = await bcrypt.hash('correct-password', 10);
  User.findOne = async () => ({
    _id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    password: passwordHash,
    role: 'user'
  });

  const req = { body: { email: 'test@example.com', password: 'wrong-password' } };
  const res = createRes();

  await loginUser(req, res);

  assert.equal(res.statusCode, 401);
  assert.equal(res.payload.message, 'Invalid email or password');
});

test('protect should return 500 when JWT_SECRET is not configured', async (t) => {
  const previousSecret = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  t.after(() => {
    process.env.JWT_SECRET = previousSecret;
  });

  const req = {
    headers: {
      authorization: 'Bearer some.token.value'
    }
  };
  const res = createRes();

  await protect(req, res, () => {
    throw new Error('next should not be called');
  });

  assert.equal(res.statusCode, 500);
  assert.equal(res.payload.message, 'Server configuration error');
});

test('protect should reject invalid or expired tokens with 401 when JWT_SECRET is configured', async () => {
  const expiredToken = jwt.sign({ id: 'user-123', role: 'user' }, TEST_SECRET, { expiresIn: '0s' });
  const req = {
    headers: {
      authorization: `Bearer ${expiredToken}`
    }
  };
  const res = createRes();

  await protect(req, res, () => {
    throw new Error('next should not be called');
  });

  assert.equal(res.statusCode, 401);
  assert.equal(res.payload.message, 'Invalid or expired token');
});

test('admin should block non-admin users', async () => {
  const req = { user: { role: 'user' } };
  const res = createRes();
  const next = () => {
    throw new Error('next should not be called');
  };

  await admin(req, res, next);

  assert.equal(res.statusCode, 403);
  assert.equal(res.payload.message, 'Access denied. Admin only.');
});

test('registerUser should always assign role=user even if role=admin is requested in body', async (t) => {
  const originalCreate = User.create;
  const originalFindOne = User.findOne;

  t.after(() => {
    User.create = originalCreate;
    User.findOne = originalFindOne;
  });

  User.findOne = async () => null;
  let createdData = null;
  User.create = async (userData) => {
    createdData = userData;
    return {
      _id: 'user-new',
      name: userData.name,
      email: userData.email,
      role: userData.role
    };
  };

  const req = {
    body: {
      name: 'Sneaky Admin',
      email: 'sneaky@example.com',
      password: 'Password123',
      role: 'admin'
    }
  };
  const res = createRes();

  await registerUser(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(createdData.role, 'user');
  assert.equal(res.payload.user.role, 'user');
});
