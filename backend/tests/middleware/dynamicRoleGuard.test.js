const { requireDynamicRole, requireDynamicRoleWithScope } = require('../../middleware/dynamicRoleGuard');
const RoleAssignment = require('../../models/RoleAssignment');
const { createStudent, createFaculty, createHOD } = require('../helpers/factories');
const mongoose = require('mongoose');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('requireDynamicRole middleware', () => {
  test('returns 403 when no active role assignment found', async () => {
    const { user } = await createFaculty();
    const middleware = requireDynamicRole('mentor');
    const req = { user: { userId: user._id.toString() } };
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'ROLE_NOT_ASSIGNED' }) })
    );
  });

  test('calls next() and attaches roleAssignment when active role found', async () => {
    const { user: hodUser } = await createHOD();
    const { user: facultyUser } = await createFaculty();

    const assignment = await RoleAssignment.create({
      user_id: facultyUser._id,
      role: 'mentor',
      scope_type: 'student',
      scope_label: 'CS-A-2023',
      assigned_by: hodUser._id
    });

    const middleware = requireDynamicRole('mentor');
    const req = { user: { userId: facultyUser._id.toString() } };
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.roleAssignment).toBeDefined();
    expect(req.roleAssignment._id.toString()).toBe(assignment._id.toString());
  });

  test('returns 403 when role is revoked', async () => {
    const { user: hodUser } = await createHOD();
    const { user: facultyUser } = await createFaculty();

    await RoleAssignment.create({
      user_id: facultyUser._id,
      role: 'cc',
      scope_type: 'class',
      scope_label: 'CS-B-2023',
      assigned_by: hodUser._id,
      revoked_at: new Date() // revoked
    });

    const middleware = requireDynamicRole('cc');
    const req = { user: { userId: facultyUser._id.toString() } };
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('requireDynamicRoleWithScope middleware', () => {
  test('returns 403 when role scope does not match param', async () => {
    const { user: hodUser } = await createHOD();
    const { user: facultyUser } = await createFaculty();
    const { student } = await createStudent();

    // assigned to a different student
    const differentStudentId = new mongoose.Types.ObjectId();
    await RoleAssignment.create({
      user_id: facultyUser._id,
      role: 'mentor',
      scope_type: 'student',
      scope_id: differentStudentId,
      scope_label: 'John Doe',
      assigned_by: hodUser._id
    });

    const middleware = requireDynamicRoleWithScope('mentor', 'studentId');
    const req = {
      user: { userId: facultyUser._id.toString() },
      params: { studentId: student._id.toString() } // different student
    };
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'SCOPE_MISMATCH' }) })
    );
  });
});
