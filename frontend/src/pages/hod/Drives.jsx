import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import Modal from '../../components/Modal';

export default function HODDrives() {
  const [drives, setDrives] = useState([
    {
      id: 1,
      company: 'Google',
      role: 'Software Engineer',
      ctc: '12 LPA',
      driveDate: '2024-07-15',
      openings: 5,
      applications: 45,
      shortlisted: 8,
    },
    {
      id: 2,
      company: 'Amazon',
      role: 'SDE Intern',
      ctc: '1.5L/month',
      driveDate: '2024-07-20',
      openings: 10,
      applications: 120,
      shortlisted: 20,
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    ctc: '',
    location: '',
    driveDate: '',
    deadline: '',
    openings: '',
    jobDescUrl: '',
    minCgpa: '',
  });

  const addDrive = () => {
    if (!formData.company || !formData.role) {
      alert('Company and role are required');
      return;
    }

    const newDrive = {
      id: Date.now(),
      company: formData.company,
      role: formData.role,
      ctc: formData.ctc,
      driveDate: formData.driveDate,
      openings: parseInt(formData.openings) || 0,
      applications: 0,
      shortlisted: 0,
    };

    setDrives([newDrive, ...drives]);
    setFormData({
      company: '',
      role: '',
      ctc: '',
      location: '',
      driveDate: '',
      deadline: '',
      openings: '',
      jobDescUrl: '',
      minCgpa: '',
    });
    setShowModal(false);
  };

  const deleteDrive = (driveId) => {
    setDrives(drives.filter(d => d.id !== driveId));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Placement Drives</h1>
          <p className="text-text-secondary mt-1">Manage company placement drives ({drives.length})</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Create Drive
        </button>
      </div>

      {/* Create Drive Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Placement Drive"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Company Name *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Google"
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Role Title *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Software Engineer"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">CTC</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., 12 LPA"
                value={formData.ctc}
                onChange={(e) => setFormData({...formData, ctc: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Location</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Bangalore"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Openings</label>
              <input
                type="number"
                className="input-field"
                placeholder="e.g., 5"
                value={formData.openings}
                onChange={(e) => setFormData({...formData, openings: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Drive Date</label>
              <input
                type="date"
                className="input-field"
                value={formData.driveDate}
                onChange={(e) => setFormData({...formData, driveDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Application Deadline</label>
              <input
                type="date"
                className="input-field"
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Min CGPA</label>
            <input
              type="number"
              step="0.1"
              className="input-field"
              placeholder="e.g., 7.0"
              value={formData.minCgpa}
              onChange={(e) => setFormData({...formData, minCgpa: e.target.value})}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <button
              onClick={() => setShowModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={addDrive}
              className="btn-primary"
            >
              Create Drive
            </button>
          </div>
        </div>
      </Modal>

      {/* Drives List */}
      {drives.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-text-secondary">No placement drives created yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {drives.map(drive => (
            <div key={drive.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-text-primary">{drive.company}</h3>
                  <p className="text-text-secondary">{drive.role}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button className="p-2 hover:bg-blue-50 rounded-md transition-colors text-primary">
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteDrive(drive.id)}
                    className="p-2 hover:bg-red-50 rounded-md transition-colors text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 pb-4 border-b border-border">
                <div>
                  <p className="text-xs text-text-muted">CTC</p>
                  <p className="text-sm font-medium text-text-primary">{drive.ctc}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Drive Date</p>
                  <p className="text-sm font-medium text-text-primary">{new Date(drive.driveDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Openings</p>
                  <p className="text-sm font-medium text-text-primary">{drive.openings}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Applications</p>
                  <p className="text-sm font-medium text-text-primary">{drive.applications}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Shortlisted</p>
                  <p className="text-sm font-medium text-primary">{drive.shortlisted}</p>
                </div>
              </div>

              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-primary rounded-md hover:bg-blue-100 transition-colors text-sm font-medium">
                <Users size={16} />
                View Applications
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
