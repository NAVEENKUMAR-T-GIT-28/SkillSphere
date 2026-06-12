import { Plus, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import api from '../../services/api';

export default function HODRoles() {
  const [assignments, setAssignments] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalRole, setModalRole] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    scope_label: '',
  });

  const roles = [
    { id: 'cc', title: 'Class Coordinators', description: 'Faculty assigned to a class' },
    { id: 'mentor', title: 'Mentors', description: 'Faculty mentoring individual students' },
    { id: 'rep', title: 'Class Representatives', description: 'Students representing their section' },
  ];

  const fetchAssignments = async () => {
    try {
      setFetching(true);
      const data = await api.get('/hod/role-assignments');
      // API might return array or data object
      const items = Array.isArray(data) ? data : data.data || [];
      
      setAssignments(items.map(a => ({
        id: a._id,
        role: a.role,
        faculty: a.user_id?.email || 'Unknown User', // user email for now
        class: a.scope_label,
        mentee: a.scope_label,
      })));
    } catch (err) {
      console.error('Failed to fetch role assignments:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const openAssignModal = (roleId) => {
    setModalRole(roleId);
    setFormData({ user_id: '', scope_label: '' });
    setShowModal(true);
  };

  const handleAssign = async () => {
    if (!formData.user_id || !formData.scope_label) {
      alert('Please provide a User ID and scope');
      return;
    }

    try {
      setProcessing(true);
      await api.post('/hod/role-assignments', {
        user_id: formData.user_id,
        role: modalRole,
        scope_type: modalRole === 'mentor' ? 'student' : (modalRole === 'rep' ? 'section' : 'class'),
        scope_label: formData.scope_label
      });
      setShowModal(false);
      setFormData({ user_id: '', scope_label: '' });
      fetchAssignments();
    } catch (err) {
      alert(err.message || 'Failed to assign role. Ensure User ID is valid.');
    } finally {
      setProcessing(false);
    }
  };

  const deleteAssignment = async (assignmentId) => {
    try {
      setProcessing(true);
      await api.delete(`/hod/role-assignments/${assignmentId}`);
      setAssignments(assignments.filter(a => a.id !== assignmentId));
    } catch (err) {
      alert(err.message || 'Failed to revoke role assignment');
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
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Assign ${roles.find(r => r.id === modalRole)?.title || 'Role'}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">User ID</label>
            <input
              type="text"
              className="input-field"
              placeholder="MongoDB Object ID of the user"
              value={formData.user_id}
              onChange={(e) => setFormData({...formData, user_id: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Scope Label</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. CSE-A 2026, John Doe"
              value={formData.scope_label}
              onChange={(e) => setFormData({...formData, scope_label: e.target.value})}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <button onClick={() => setShowModal(false)} disabled={processing} className="btn-secondary disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleAssign} disabled={processing} className="btn-primary disabled:opacity-50">
              {processing ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
