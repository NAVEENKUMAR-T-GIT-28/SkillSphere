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

  if (loading && classes.length === 0) return <div className="p-8 text-center text-slate-400">Loading classes...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Classes Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage academic cohorts and sections</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          <span>New Class</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/80">
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Class Label</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Department</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Batch</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Graduation</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {classes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">No classes found.</td>
                </tr>
              ) : (
                classes.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                          <BookOpen size={16} />
                        </div>
                        <span className="font-medium text-white">{c.label}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">{c.department}</td>
                    <td className="p-4 text-slate-300">{c.batch_year}</td>
                    <td className="p-4 text-slate-300">{c.graduation_year}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
                        c.is_active 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleActive(c._id, c.is_active)}
                        className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                          c.is_active 
                            ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                            : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
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
            <label className="block text-sm font-medium text-slate-400 mb-1">Department</label>
            <input
              type="text"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="e.g. Computer Science"
              value={formData.department}
              onChange={e => setFormData({ ...formData, department: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Section</label>
            <input
              type="text"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="e.g. A"
              value={formData.section}
              onChange={e => setFormData({ ...formData, section: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Batch Year</label>
              <input
                type="number"
                required
                min="2000"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={formData.batch_year}
                onChange={e => setFormData({ ...formData, batch_year: parseInt(e.target.value) || '' })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Graduation Year</label>
              <input
                type="number"
                required
                min="2000"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={formData.graduation_year}
                onChange={e => setFormData({ ...formData, graduation_year: parseInt(e.target.value) || '' })}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-700 mt-6">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
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
