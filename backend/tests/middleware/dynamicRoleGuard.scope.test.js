const { requireDynamicRoleWithScope, requireDynamicRole } = require('../../middleware/dynamicRoleGuard');
const RoleAssignment = require('../../models/RoleAssignment');
const { createStudent, createFaculty, createHOD } = require('../helpers/factories');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('requireDynamicRoleWithScope middleware — success path', () => {
  test('calls next() and attaches roleAssignment when scope matches', async () => {
    const { user: hodUser } = await createHOD();
    const { user: facultyUser } = await createFaculty();
    const { student } = await createStudent();

    const assignment = await RoleAssignment.create({
      user_id: facultyUser._id,
      role: 'mentor',
      scope_type: 'student',
      scope_id: student._id,
      scope_label: 'Mentor scope match',
      assigned_by: hodUser._id
    });

    const middleware = requireDynamicRoleWithScope('mentor', 'studentId');
    const req = {
      user: { userId: facultyUser._id.toString() },
      params: { studentId: student._id.toString() }
    };
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.roleAssignment).toBeDefined();
    expect(req.roleAssignment._id.toString()).toBe(assignment._id.toString());
  });

  test('requireDynamicRole calls next(err) on unexpected DB error', async () => {
    const middleware = requireDynamicRole('mentor');
    // Malformed userId triggers a CastError inside findOne, caught by try/catch -> next(err)
    const req = { user: { userId: 'not-a-valid-object-id' } };
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
  });
});
