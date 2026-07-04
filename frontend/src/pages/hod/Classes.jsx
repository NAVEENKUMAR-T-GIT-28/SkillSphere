import React, { useState, useEffect } from 'react';
import { Plus, Search, BookOpen, AlertCircle } from 'lucide-react';
import { AcademicAPI } from '../../services/api';
import Modal from '../../components/Modal';

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    department: '',
    section: '',
    batch_year: new Date().getFullYear(),
    graduation_year: new Date().getFullYear() + 4
  });

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const { data } = await AcademicAPI.getClasses({ is_active: 'all' });
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
        batch_year: new Date().getFullYear(),
        graduation_year: new Date().getFullYear() + 4
      });
      fetchClasses();
    } catch (err) {
      alert(err?.message || 'Failed to create class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (classId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this class?`)) return;
    try {
      if (currentStatus) {
        await AcademicAPI.deactivateClass(classId);
      } else {
        await AcademicAPI.updateClass(classId, { is_active: true });
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
          <p className="text-[13px] text-text-secondary">Manage academic cohorts and sections</p>
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
                <th className="text-left text-[12px] font-medium text-text-secondary py-3 px-4">Department</th>
                <th className="text-left text-[12px] font-medium text-text-secondary py-3 px-4">Batch</th>
                <th className="text-left text-[12px] font-medium text-text-secondary py-3 px-4">Graduation</th>
                <th className="text-left text-[12px] font-medium text-text-secondary py-3 px-4">Status</th>
                <th className="text-right text-[12px] font-medium text-text-secondary py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-[13px] text-text-secondary">No classes found.</td>
                </tr>
              ) : (
                classes.map((c) => (
                  <tr key={c._id} className="border-b border-border hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">
                          <BookOpen size={16} />
                        </div>
                        <span className="text-[13px] font-medium text-text-primary">{c.label}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[13px] text-text-secondary">{c.department}</td>
                    <td className="py-3 px-4 text-[13px] text-text-secondary">{c.batch_year}</td>
                    <td className="py-3 px-4 text-[13px] text-text-secondary">{c.graduation_year}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 text-[11px] font-medium rounded-full ${
                        c.is_active 
                          ? 'bg-status-verified text-status-verifiedText' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleActive(c._id, c.is_active)}
                        className={`text-[12px] px-3 py-1.5 rounded-md border transition-colors ${
                          c.is_active 
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-status-verified text-status-verifiedText hover:bg-status-verified/50'
                        }`}
                      >
                        {c.is_active ? 'Deactivate' : 'Activate'}
                      </button>
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
        title="Create New Class"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-1">Department</label>
            <input
              type="text"
              required
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-[13px] text-text-primary focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              placeholder="e.g. Computer Science"
              value={formData.department}
              onChange={e => setFormData({ ...formData, department: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-1">Section</label>
            <input
              type="text"
              required
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-[13px] text-text-primary focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              placeholder="e.g. A"
              value={formData.section}
              onChange={e => setFormData({ ...formData, section: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-text-secondary mb-1">Batch Year</label>
              <input
                type="number"
                required
                min="2000"
                className="w-full bg-surface border border-border rounded-md px-3 py-2 text-[13px] text-text-primary focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                value={formData.batch_year}
                onChange={e => setFormData({ ...formData, batch_year: parseInt(e.target.value) || '' })}
              />
            </div>
            
            <div>
              <label className="block text-[12px] font-medium text-text-secondary mb-1">Graduation Year</label>
              <input
                type="number"
                required
                min="2000"
                className="w-full bg-surface border border-border rounded-md px-3 py-2 text-[13px] text-text-primary focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                value={formData.graduation_year}
                onChange={e => setFormData({ ...formData, graduation_year: parseInt(e.target.value) || '' })}
              />
            </div>
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
