const { requireOwnerOrRole } = require('../../middleware/ownerGuard');
const Student = require('../../models/Student');
const { createStudent } = require('../helpers/factories');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('requireOwnerOrRole middleware', () => {
  test('bypasses ownership check for HOD', async () => {
    const middleware = requireOwnerOrRole('hod');
    const req = { user: { baseRole: 'hod', userId: 'anyid' }, params: { studentId: 'someStudentId' } };
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('bypasses ownership check for faculty', async () => {
    const middleware = requireOwnerOrRole('faculty', 'hod');
    const req = { user: { baseRole: 'faculty', userId: 'anyid' }, params: {} };
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('returns 404 when student profile not found', async () => {
    const mongoose = require('mongoose');
    const middleware = requireOwnerOrRole('hod');
    const req = {
      user: { baseRole: 'student', userId: new mongoose.Types.ObjectId().toString() },
      params: { studentId: new mongoose.Types.ObjectId().toString() }
    };
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'PROFILE_NOT_FOUND' }) })
    );
  });

  test('returns 403 when student tries to access another student profile', async () => {
    const { student: s1, user: u1 } = await createStudent();
    const { student: s2 } = await createStudent();

    const middleware = requireOwnerOrRole('hod');
    const req = {
      user: { baseRole: 'student', userId: u1._id.toString() },
      params: { studentId: s2._id.toString() }
    };
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'NOT_OWNER' }) })
    );
  });

  test('calls next() and attaches student when owner accesses own profile', async () => {
    const { student, user } = await createStudent();

    const middleware = requireOwnerOrRole('hod');
    const req = {
      user: { baseRole: 'student', userId: user._id.toString() },
      params: { studentId: student._id.toString() }
    };
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.student).toBeDefined();
    expect(req.student._id.toString()).toBe(student._id.toString());
  });
});
