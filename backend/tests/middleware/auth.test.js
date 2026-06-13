const { authenticate } = require('../../middleware/auth');
const { generateToken } = require('../helpers/tokenHelper');
const mongoose = require('mongoose');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authenticate middleware', () => {
  const fakeId = new mongoose.Types.ObjectId();

  test('returns 401 when no Authorization header', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'NO_TOKEN' }) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when header is malformed (no Bearer prefix)', () => {
    const req = { headers: { authorization: 'Basic sometoken' } };
    const res = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 for invalid token', () => {
    const req = { headers: { authorization: 'Bearer invalidtoken123' } };
    const res = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'INVALID_TOKEN' }) })
    );
  });

  test('returns 401 for expired token', () => {
    // Generate a token that expires immediately
    const jwt = require('jsonwebtoken');
    const { getKeys } = require('../../utils/jwtKeys');
    const { privateKey } = getKeys();
    const expiredToken = jwt.sign(
      { userId: fakeId.toString(), baseRole: 'student' },
      privateKey,
      { algorithm: 'RS256', expiresIn: '0s' }
    );

    const req = { headers: { authorization: `Bearer ${expiredToken}` } };
    const res = mockRes();
    const next = jest.fn();

    // Small delay to ensure expiry
    return new Promise((resolve) => setTimeout(() => {
      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.objectContaining({ code: 'TOKEN_EXPIRED' }) })
      );
      resolve();
    }, 100));
  });

  test('calls next() and attaches user for valid token', () => {
    const token = generateToken(fakeId, 'student');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.baseRole).toBe('student');
    expect(req.user.userId).toBe(fakeId.toString());
  });
});
