import { Plus, Trash2, Users, FileText, CheckCircle, IndianRupee } from 'lucide-react';
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
        applications: 0, 
        shortlisted: 0,
        type: d.drive_type || 'oncampus'
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
      fetchDrives();
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
      setDrives(drives.filter(d => d.id !== driveId));
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
      <div className="mb-5">
        <h1 className="text-xl font-medium text-text-primary mb-1">Placement drives</h1>
        <p className="text-[13px] text-text-secondary">Create and manage company drives</p>
      </div>
      
      <div className="mb-4">
        <button onClick={() => setShowModal(true)} className="px-3 py-1.5 bg-primary text-white text-[13px] font-medium rounded hover:bg-blue-700 flex items-center gap-1.5">
          <Plus size={14} />
          Create drive
        </button>
      </div>

      <div className="space-y-2.5">
        {drives.length === 0 ? (
          <div className="p-8 text-center border border-border rounded-lg bg-surface text-[13px] text-text-secondary">
            No placement drives created yet
          </div>
        ) : (
          drives.map(drive => (
            <div key={drive.id} className="border border-border rounded-lg p-4 bg-surface flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[14px] font-medium text-text-primary">{drive.company} — {drive.role}</p>
                  <p className="text-[12px] text-text-secondary capitalize">
                    {drive.type.replace('-', ' ')} &middot; {new Date(drive.driveDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1.5 items-center">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700">Active</span>
                  <button
                    onClick={() => deleteDrive(drive.id)}
                    disabled={processing}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-[12px] text-text-secondary">
                <span className="flex items-center gap-1"><Users size={14} className="text-text-muted" /> {drive.openings || 'Any'} eligible</span>
                <span className="flex items-center gap-1"><FileText size={14} className="text-text-muted" /> {drive.applications} applied</span>
                <span className="flex items-center gap-1"><CheckCircle size={14} className="text-text-muted" /> {drive.shortlisted} shortlisted</span>
                <span className="flex items-center gap-1"><IndianRupee size={14} className="text-text-muted" /> {drive.ctc}</span>
              </div>

              <div>
                <button 
                  onClick={() => handleViewApplications(drive)} 
                  disabled={fetchingApps} 
                  className="px-2.5 py-1 border border-border text-text-primary text-[12px] font-medium rounded hover:bg-gray-50 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Users size={14} />
                  View applications & shortlist
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Placement Drive"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1">Company Name *</label>
              <input
                type="text"
                className="input-field text-[13px]"
                placeholder="e.g., Google"
                value={formData.companyName}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1">Role Title *</label>
              <input
                type="text"
                className="input-field text-[13px]"
                placeholder="e.g., Software Engineer"
                value={formData.roleTitle}
                onChange={(e) => setFormData({...formData, roleTitle: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1">CTC</label>
              <input
                type="text"
                className="input-field text-[13px]"
                placeholder="e.g., 12 LPA"
                value={formData.ctc}
                onChange={(e) => setFormData({...formData, ctc: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1">Location</label>
              <input
                type="text"
                className="input-field text-[13px]"
                placeholder="e.g., Bangalore"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1">Openings</label>
              <input
                type="number"
                className="input-field text-[13px]"
                placeholder="e.g., 5"
                value={formData.openings}
                onChange={(e) => setFormData({...formData, openings: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1">Drive Type *</label>
              <select
                className="input-field text-[13px]"
                value={formData.driveType}
                onChange={(e) => setFormData({...formData, driveType: e.target.value})}
              >
                <option value="oncampus">On Campus</option>
                <option value="offcampus">Off Campus</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1">Drive Date *</label>
              <input
                type="date"
                className="input-field text-[13px]"
                value={formData.driveDate}
                onChange={(e) => setFormData({...formData, driveDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1">Application Deadline *</label>
              <input
                type="date"
                className="input-field text-[13px]"
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1">Job Desc URL</label>
              <input
                type="url"
                className="input-field text-[13px]"
                placeholder="https://..."
                value={formData.jobDescUrl}
                onChange={(e) => setFormData({...formData, jobDescUrl: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1">Min CGPA Requirement</label>
              <input
                type="number"
                step="0.1"
                className="input-field text-[13px]"
                placeholder="e.g., 7.0"
                value={formData.minCgpa}
                onChange={(e) => setFormData({...formData, minCgpa: e.target.value})}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <button
              onClick={() => setShowModal(false)}
              disabled={processing}
              className="px-3 py-1.5 border border-border text-text-primary text-[13px] font-medium rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={addDrive}
              disabled={processing}
              className="px-3 py-1.5 bg-primary text-white text-[13px] font-medium rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {processing ? 'Creating...' : 'Create Drive'}
            </button>
          </div>
        </div>
      </Modal>

      <Drawer isOpen={!!selectedDrive} onClose={() => setSelectedDrive(null)} title="Drive Applications">
        {selectedDrive && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-text-primary text-lg">{selectedDrive.company}</h3>
              <p className="text-[13px] text-text-secondary">{selectedDrive.role}</p>
            </div>
            {applications.length === 0 ? (
              <p className="text-[13px] text-text-secondary">No applications for this drive yet.</p>
            ) : (
              <div className="space-y-3">
                {applications.map(app => (
                  <div key={app._id} className="p-3 bg-gray-50 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[13px] font-medium text-text-primary">{app.student_id?.full_name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        app.status === 'shortlisted' ? 'bg-green-100 text-green-800' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-[12px] text-text-secondary">{app.student_id?.roll_number} • Dept: {app.student_id?.department}</p>
                    <p className="text-[12px] text-text-secondary mt-1">CGPA: {app.student_id?.cgpa} • Readiness: <strong className="text-blue-600">{app.student_id?.readiness_score}</strong></p>
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
