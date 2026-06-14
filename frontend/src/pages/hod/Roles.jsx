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
    { id: 'cc', title: 'Class Coordinators', description: 'Faculty assigned to a class' },
    { id: 'mentor', title: 'Mentors', description: 'Faculty mentoring individual students' },
    { id: 'rep', title: 'Class Representatives', description: 'Students representing their section' },
  ];

  const fetchAssignments = async () => {
    try {
      setFetching(true);
      const { data } = await RolesAPI.getAssignments();
      // API returns the array directly due to api interceptor
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

  const handleAssign = async ({ userId, scopeLabel, studentId, scopeData }) => {
    try {
      setProcessing(true);
      await RolesAPI.assignRole({
        user_id: userId,
        role: modalRole,
        scope_type: modalRole === 'mentor' ? 'student' : 'class',
        scope_id: modalRole === 'mentor' ? studentId : undefined,
        scope_label: scopeLabel,
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
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Role Assignment</h1>
        <p className="text-text-secondary mt-1">Assign and manage faculty and student roles</p>
      </div>

      {roles.map(role => {
        const roleAssignments = getRoleAssignments(role.id);

        return (
          <div key={role.id} className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">{role.title}</h2>
                <p className="text-sm text-text-secondary mt-1">{role.description}</p>
              </div>
              <button
                onClick={() => openAssignModal(role.id)}
                className="btn-primary flex items-center gap-2 flex-shrink-0"
              >
                <Plus size={16} />
                Assign
              </button>
            </div>

            <div className="border-t border-border pt-4">
              {roleAssignments.length === 0 ? (
                <p className="text-text-secondary text-sm">No assignments yet</p>
              ) : (
                <div className="space-y-3">
                  {roleAssignments.map(assignment => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div>
                        {role.id === 'cc' && (
                          <>
                            <p className="font-medium text-text-primary">{assignment.faculty}</p>
                            <p className="text-xs text-text-secondary">{assignment.class}</p>
                          </>
                        )}
                        {role.id === 'mentor' && (
                          <>
                            <p className="font-medium text-text-primary">{assignment.faculty}</p>
                            <p className="text-xs text-text-secondary">Mentoring: {assignment.mentee}</p>
                          </>
                        )}
                        {role.id === 'rep' && (
                          <>
                            <p className="font-medium text-text-primary">{assignment.faculty}</p>
                            <p className="text-xs text-text-secondary">{assignment.class}</p>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => deleteAssignment(assignment.id)}
                        disabled={processing}
                        className="p-2 hover:bg-red-50 rounded-md transition-colors text-red-600 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Assign Role Modal */}
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
