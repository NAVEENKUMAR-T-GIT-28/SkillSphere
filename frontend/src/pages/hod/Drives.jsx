import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import Drawer from '../../components/Drawer';
import { useToast } from '../../contexts/ToastContext';
import { DrivesAPI } from '../../services/api';

export default function HODDrives() {
  const [drives, setDrives] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [processing, setProcessing] = useState(false);
  const toast = useToast();

  const [selectedDrive, setSelectedDrive] = useState(null);
  const [applications, setApplications] = useState([]);
  const [fetchingApps, setFetchingApps] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    roleTitle: '',
    ctc: '',
    location: '',
    driveDate: '',
    deadline: '',
    openings: '',
    jobDescUrl: '',
    minCgpa: '',
    driveType: 'oncampus'
  });

  const fetchDrives = async () => {
    try {
      setFetching(true);
      const { data } = await DrivesAPI.getDrives(50);
      const items = data || [];
      
      setDrives(items.map(d => ({
        id: d._id,
        company: d.company_name,
        role: d.role_title,
        ctc: d.ctc || 'N/A',
        driveDate: d.drive_date,
        openings: d.openings || 0,
        applications: 0, // Mocked for now, backend could provide this or we fetch applications
        shortlisted: 0,
      })));
    } catch (err) {
      toast.error('Failed to fetch drives');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  const addDrive = async () => {
    if (!formData.companyName || !formData.roleTitle || !formData.driveDate || !formData.deadline) {
      toast.error('Company, Role, Drive Date, and Application Deadline are required');
      return;
    }

    try {
      setProcessing(true);
      await DrivesAPI.createDrive({
        company_name: formData.companyName,
        role_title: formData.roleTitle,
        ctc: formData.ctc,
        location: formData.location,
        drive_date: formData.driveDate,
        application_deadline: formData.deadline,
        openings: parseInt(formData.openings) || null,
        job_description_url: formData.jobDescUrl,
        drive_type: formData.driveType,
        eligibility: {
          min_cgpa: parseFloat(formData.minCgpa) || 0
        }
      });
      
      setFormData({
        companyName: '',
        roleTitle: '',
        ctc: '',
        location: '',
        driveDate: '',
        deadline: '',
        openings: '',
        jobDescUrl: '',
        minCgpa: '',
        driveType: 'oncampus'
      });
      setShowModal(false);
      toast.success('Drive created successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to create drive');
    } finally {
      setProcessing(false);
    }
  };

  const deleteDrive = async (driveId) => {
    try {
      setProcessing(true);
      await DrivesAPI.deleteDrive(driveId);
      toast.success('Drive deleted successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to delete drive');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewApplications = async (drive) => {
    try {
      setFetchingApps(true);
      const { data } = await DrivesAPI.getShortlist(drive.id);
      setApplications(data.applications || []);
      setSelectedDrive(drive);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch applications');
    } finally {
      setFetchingApps(false);
    }
  };

  if (fetching) {
    return <div className="p-8 text-center text-text-secondary">Loading placement drives...</div>;
  }

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
                value={formData.companyName}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Role Title *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Software Engineer"
                value={formData.roleTitle}
                onChange={(e) => setFormData({...formData, roleTitle: e.target.value})}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Drive Type *</label>
              <select
                className="input-field"
                value={formData.driveType}
                onChange={(e) => setFormData({...formData, driveType: e.target.value})}
              >
                <option value="oncampus">On Campus</option>
                <option value="offcampus">Off Campus</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Drive Date *</label>
              <input
                type="date"
                className="input-field"
                value={formData.driveDate}
                onChange={(e) => setFormData({...formData, driveDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Application Deadline *</label>
              <input
                type="date"
                className="input-field"
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Job Desc URL</label>
              <input
                type="url"
                className="input-field"
                placeholder="https://..."
                value={formData.jobDescUrl}
                onChange={(e) => setFormData({...formData, jobDescUrl: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Min CGPA Requirement</label>
              <input
                type="number"
                step="0.1"
                className="input-field"
                placeholder="e.g., 7.0"
                value={formData.minCgpa}
                onChange={(e) => setFormData({...formData, minCgpa: e.target.value})}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <button
              onClick={() => setShowModal(false)}
              disabled={processing}
              className="btn-secondary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={addDrive}
              disabled={processing}
              className="btn-primary disabled:opacity-50"
            >
              {processing ? 'Creating...' : 'Create Drive'}
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
                  <button
                    onClick={() => deleteDrive(drive.id)}
                    disabled={processing}
                    className="p-2 hover:bg-red-50 rounded-md transition-colors text-red-600 disabled:opacity-50"
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

              <button onClick={() => handleViewApplications(drive)} disabled={fetchingApps} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-primary rounded-md hover:bg-blue-100 transition-colors text-sm font-medium disabled:opacity-50">
                <Users size={16} />
                View Applications
              </button>
            </div>
          ))}
        </div>
      )}
      {/* View Applications Drawer */}
      <Drawer isOpen={!!selectedDrive} onClose={() => setSelectedDrive(null)} title="Drive Applications">
        {selectedDrive && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-text-primary text-lg">{selectedDrive.company}</h3>
              <p className="text-text-secondary">{selectedDrive.role}</p>
            </div>
            {applications.length === 0 ? (
              <p className="text-sm text-text-secondary">No applications for this drive yet.</p>
            ) : (
              <div className="space-y-4">
                {applications.map(app => (
                  <div key={app._id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-text-primary">{app.student_id?.full_name}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        app.status === 'shortlisted' ? 'bg-green-100 text-green-800' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">{app.student_id?.roll_number} • Dept: {app.student_id?.department}</p>
                    <p className="text-xs text-text-secondary mt-1">CGPA: {app.student_id?.cgpa} • Readiness: {app.student_id?.readiness_score}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
