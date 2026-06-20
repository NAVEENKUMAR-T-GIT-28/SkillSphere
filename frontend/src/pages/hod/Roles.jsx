import { Plus, Trash2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import AssignRoleModal from '../../components/AssignRoleModal';
import { RolesAPI, UsersAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

export default function HODRoles() {
  const [assignments, setAssignments] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [processing, setProcessing] = useState(false);
  const toast = useToast();

  const [showModal, setShowModal] = useState(false);
  const [modalRole, setModalRole] = useState(null);

  const roles = [
    { id: 'cc', title: 'Class coordinators' },
    { id: 'mentor', title: 'Mentors' },
    { id: 'rep', title: 'Class reps' },
  ];

  const fetchAssignments = async () => {
    try {
      setFetching(true);
      const { data } = await RolesAPI.getAssignments();
      const items = Array.isArray(data) ? data : [];
                                                                                                                              
      setAssignments(items.map(a => ({
        id: a._id,
        role: a.role,
        faculty: a.assignee_name || a.user_id?.name || a.user_id?.email || 'Unknown User',
        class: a.scope_label,
        mentee: a.scope_label,
      })));
    } catch (err) {
      toast.error('Failed to fetch role assignments');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const openAssignModal = (roleId) => {
    setModalRole(roleId);
    setShowModal(true);
  };

  const fetchUsers = useCallback(async (query, role) => {
    try {
      const { data } = await UsersAPI.searchUsers(query, role, 10);
      return data;
    } catch (err) {
      toast.error('Failed to fetch users');
      return [];
    }
  }, []);

  const handleAssign = async ({ userId, scopeLabel, studentId, class_id, scopeData }) => {
    try {
      setProcessing(true);
      await RolesAPI.assignRole({
        user_id: userId,
        role: modalRole,
        scope_type: modalRole === 'mentor' ? 'student' : (modalRole === 'rep' ? 'section' : 'class'),
        scope_id: modalRole === 'mentor' ? studentId : undefined,
        scope_label: scopeLabel,
        class_id: class_id || undefined,
        scope_data: scopeData
      });
      toast.success('Role assigned successfully');
      fetchAssignments();
    } catch (err) {
      toast.error(err.message || 'Failed to assign role. Ensure User ID is valid.');
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  const deleteAssignment = async (assignmentId) => {
    try {
      setProcessing(true);
      await RolesAPI.removeAssignment(assignmentId);
      setAssignments(assignments.filter(a => a.id !== assignmentId));
      toast.success('Role revoked successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to revoke role assignment');
    } finally {
      setProcessing(false);
    }
  };

  const getRoleAssignments = (roleId) => {
    return assignments.filter(a => a.role === roleId);
  };

  if (fetching) {
    return <div className="p-8 text-center text-text-secondary">Loading role assignments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="mb-5">
        <h1 className="text-xl font-medium text-text-primary mb-1">Role assignment</h1>
        <p className="text-[13px] text-text-secondary">Manage dynamic roles for faculty and students</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {roles.map(role => {
          const roleAssignments = getRoleAssignments(role.id);

          return (
            <div key={role.id} className="border border-border rounded-lg p-4 bg-surface">
              <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                <h2 className="text-[15px] font-medium">{role.title}</h2>
                <button
                  onClick={() => openAssignModal(role.id)}
                  className="px-2 py-1 text-xs font-medium bg-primary text-white rounded hover:bg-blue-700 flex items-center gap-1"
                >
                  <Plus size={14} />
                  Assign
                </button>
              </div>

              <div className="mt-1.5">
                {roleAssignments.length === 0 ? (
                  <p className="text-text-secondary text-[12px]">No assignments yet</p>
                ) : (
                  <div className="space-y-0">
                    {roleAssignments.map((assignment, idx) => (
                      <div 
                        key={assignment.id} 
                        className={`flex items-center justify-between py-2 ${idx !== roleAssignments.length - 1 ? 'border-b border-gray-100' : ''}`}
                      >
                        <div>
                          {role.id === 'cc' && (
                            <>
                              <p className="text-[13px] font-medium text-text-primary leading-tight">{assignment.faculty}</p>
                              <p className="text-[11px] text-text-secondary">{assignment.class}</p>
                            </>
                          )}
                          {role.id === 'mentor' && (
                            <>
                              <p className="text-[13px] font-medium text-text-primary leading-tight">{assignment.faculty}</p>
                              <p className="text-[11px] text-text-secondary">Mentoring: {assignment.mentee}</p>
                            </>
                          )}
                          {role.id === 'rep' && (
                            <>
                              <p className="text-[13px] font-medium text-text-primary leading-tight">{assignment.faculty}</p>
                              <p className="text-[11px] text-text-secondary">{assignment.class}</p>
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => deleteAssignment(assignment.id)}
                          disabled={processing}
                          className="px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border border-border rounded-lg p-4 bg-surface">
        <h2 className="text-[15px] font-medium mb-3 border-b border-border pb-3">Audit log</h2>
        <div className="space-y-2 text-[13px]">
          <div className="flex gap-4 p-2 border-b border-gray-100">
            <div className="text-text-secondary w-24 flex-shrink-0">Just now</div>
            <div className="text-text-primary">System logged activity will appear here</div>
          </div>
          {/* Note: In a full app, this would be fed by a backend audit log API endpoint */}
        </div>
      </div>

      <AssignRoleModal
        open={showModal}
        roleType={modalRole}
        onClose={() => setShowModal(false)}
        onAssign={handleAssign}
        fetchUsers={fetchUsers}
      />
    </div>
  );
}
