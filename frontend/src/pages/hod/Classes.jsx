import React, { useState, useEffect } from 'react';
import { Plus, Search, BookOpen, AlertCircle, ArrowUpCircle, Users } from 'lucide-react';
import { AcademicAPI } from '../../services/api';
import Modal from '../../components/Modal';
import { useNavigate } from 'react-router-dom';

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    department: '',
    section: '',
    batch_start: new Date().getFullYear(),
    capacity: 60
  });

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const { data } = await AcademicAPI.getClasses({ status: 'all' });
      setClasses(data || []);
      setError('');
    } catch (err) {
      setError(err?.message || 'Failed to load classes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await AcademicAPI.createClass(formData);
      setShowCreateModal(false);
      setFormData({
        department: '',
        section: '',
        batch_start: new Date().getFullYear(),
        capacity: 60
      });
      fetchClasses();
    } catch (err) {
      alert(err?.message || 'Failed to create class');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePromote = async (classId) => {
    if (!window.confirm('Are you sure you want to promote this class to the next semester? This action will sync to all students in the cohort.')) return;
    try {
      await AcademicAPI.promoteClass(classId);
      fetchClasses();
    } catch (err) {
      alert(err?.message || 'Failed to promote class');
    }
  };

  const handleToggleStatus = async (classId, currentStatus) => {
    const isArchiving = currentStatus === 'ACTIVE';
    if (!window.confirm(`Are you sure you want to ${isArchiving ? 'archive' : 'activate'} this class?`)) return;
    try {
      if (isArchiving) {
        await AcademicAPI.deactivateClass(classId);
      } else {
        await AcademicAPI.updateClass(classId, { status: 'ACTIVE' });
      }
      fetchClasses();
    } catch (err) {
      alert(err?.message || 'Failed to update class status');
    }
  };

  if (loading && classes.length === 0) return <div className="p-8 text-center text-text-secondary">Loading classes...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <h1 className="text-xl font-medium text-text-primary mb-1">Classes Management</h1>
          <p className="text-[13px] text-text-secondary">Manage academic cohorts as the single source of truth</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary text-white text-[13px] font-medium px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          <span>New Class</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-600 text-[13px]">
          <AlertCircle size={16} />
          <p>{error}</p>
        </div>
      )}

      <div className="border border-border rounded-lg bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="text-left text-[12px] font-medium text-text-secondary py-3 px-4">Class Label</th>
                <th className="text-left text-[12px] font-medium text-text-secondary py-3 px-4">Batch</th>
                <th className="text-left text-[12px] font-medium text-text-secondary py-3 px-4">State</th>
                <th className="text-left text-[12px] font-medium text-text-secondary py-3 px-4">Advisor</th>
                <th className="text-left text-[12px] font-medium text-text-secondary py-3 px-4">Capacity</th>
                <th className="text-left text-[12px] font-medium text-text-secondary py-3 px-4">Status</th>
                <th className="text-right text-[12px] font-medium text-text-secondary py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-[13px] text-text-secondary">No classes found.</td>
                </tr>
              ) : (
                classes.map((c) => (
                  <tr key={c._id} className={`border-b border-border hover:bg-gray-50 transition-colors ${c.status !== 'ACTIVE' ? 'opacity-70 bg-gray-50/50' : ''}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">
                          <BookOpen size={16} />
                        </div>
                        <div>
                          <span className="text-[13px] font-medium text-text-primary block">{c.label}</span>
                          <span className="text-[11px] text-text-secondary">{c.department}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[13px] text-text-secondary">{c.batch_start} - {c.batch_end}</td>
                    <td className="py-3 px-4">
                      <div className="text-[13px] text-text-primary">Year {c.current_year}</div>
                      <div className="text-[11px] text-text-secondary">Semester {c.current_semester}</div>
                    </td>
                    <td className="py-3 px-4 text-[13px] text-text-secondary">
                      {c.advisor ? c.advisor.full_name : <span className="italic text-gray-400">Unassigned</span>}
                    </td>
                    <td className="py-3 px-4 text-[13px] text-text-secondary">{c.capacity}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 text-[11px] font-medium rounded-full ${
                        c.status === 'ACTIVE' 
                          ? 'bg-status-verified text-status-verifiedText' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/hod/classes/${c._id}/students`)}
                          className="text-[12px] px-2 py-1.5 rounded-md text-text-secondary hover:text-primary hover:bg-blue-50 transition-colors flex items-center gap-1"
                          title="View Students"
                        >
                          <Users size={14} />
                        </button>
                        <button
                          onClick={() => handlePromote(c._id)}
                          className="text-[12px] px-2 py-1.5 rounded-md text-text-secondary hover:text-green-600 hover:bg-green-50 transition-colors flex items-center gap-1"
                          title="Promote Semester"
                          disabled={c.status !== 'ACTIVE' || c.current_semester >= 8}
                        >
                          <ArrowUpCircle size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(c._id, c.status)}
                          className={`text-[12px] px-2 py-1.5 rounded-md border transition-colors ${
                            c.status === 'ACTIVE'
                              ? 'border-transparent text-text-secondary hover:text-red-600 hover:bg-red-50'
                              : 'border-status-verified text-status-verifiedText hover:bg-status-verified/50'
                          }`}
                        >
                          {c.status === 'ACTIVE' ? 'Archive' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => !submitting && setShowCreateModal(false)}
        title="Create Academic Cohort (Class)"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="bg-blue-50/50 p-3 rounded-md border border-blue-100 mb-4">
            <p className="text-[12px] text-blue-700">
              Department is automatically assigned from your HOD profile.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-text-secondary mb-1">Section</label>
              <input
                type="text"
                required
                className="w-full bg-surface border border-border rounded-md px-3 py-2 text-[13px] text-text-primary focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                placeholder="e.g. A"
                value={formData.section}
                onChange={e => setFormData({ ...formData, section: e.target.value.toUpperCase() })}
              />
            </div>
            
            <div>
              <label className="block text-[12px] font-medium text-text-secondary mb-1">Batch Start Year</label>
              <input
                type="number"
                required
                min="2000"
                className="w-full bg-surface border border-border rounded-md px-3 py-2 text-[13px] text-text-primary focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                value={formData.batch_start}
                onChange={e => setFormData({ ...formData, batch_start: parseInt(e.target.value) || '' })}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-1">Capacity</label>
            <input
              type="number"
              required
              min="1"
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-[13px] text-text-primary focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              value={formData.capacity}
              onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 60 })}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary text-white text-[13px] font-medium px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
