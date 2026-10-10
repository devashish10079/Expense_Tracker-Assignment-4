const test = require('node:test');
const assert = require('node:assert/strict');

const { registerUser } = require('../src/controllers/authController');

test('registerUser should return validation error when required fields are missing', async () => {
  const req = { body: {} };
  const res = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };

  await registerUser(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.message, 'Name, email and password are required');
});
