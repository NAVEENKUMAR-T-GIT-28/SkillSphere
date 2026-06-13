const { requireRole } = require('../../middleware/roleGuard');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('requireRole middleware', () => {
  test('returns 401 when req.user is missing', () => {
    const middleware = requireRole('hod');
    const req = {};
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when user role is not in allowed list', () => {
    const middleware = requireRole('hod', 'admin');
    const req = { user: { baseRole: 'student' } };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'INSUFFICIENT_ROLE' }) })
    );
  });

  test('calls next() when role is allowed', () => {
    const middleware = requireRole('faculty', 'hod');
    const req = { user: { baseRole: 'faculty' } };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('handles multiple allowed roles correctly', () => {
    const middleware = requireRole('student', 'faculty', 'hod');

    ['student', 'faculty', 'hod'].forEach((role) => {
      const req = { user: { baseRole: role } };
      const res = mockRes();
      const next = jest.fn();
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
