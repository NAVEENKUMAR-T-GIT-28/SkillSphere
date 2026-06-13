const { errorHandler } = require('../../middleware/errorHandler');
const mongoose = require('mongoose');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('errorHandler middleware', () => {
  const req = {};
  const next = jest.fn();

  test('handles Mongoose ValidationError with 400', () => {
    const err = new mongoose.Error.ValidationError();
    err.errors = { email: { message: 'Email is required' } };
    const res = mockRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'VALIDATION_ERROR' }) })
    );
  });

  test('handles duplicate key error (code 11000) with 409', () => {
    const err = { code: 11000, keyPattern: { email: 1 } };
    const res = mockRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'DUPLICATE_KEY' }) })
    );
  });

  test('handles CastError with 400', () => {
    const err = new mongoose.Error.CastError('ObjectId', 'bad-id', '_id');
    const res = mockRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'CAST_ERROR' }) })
    );
  });

  test('handles JWT error with 401', () => {
    const err = { name: 'JsonWebTokenError', message: 'invalid token' };
    const res = mockRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('handles generic error with 500', () => {
    const err = new Error('Something went wrong');
    const res = mockRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  test('uses statusCode from error if provided', () => {
    const err = { message: 'Not Found', statusCode: 404, code: 'NOT_FOUND' };
    const res = mockRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
