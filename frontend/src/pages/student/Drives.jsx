import { useState, useEffect } from 'react';
import { Clock, MapPin, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentDrives() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('eligible');
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, driveId: null });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.profileId) return;
        const [drivesData, appsData] = await Promise.all([
          api.get('/placement-drives'),
          api.get(`/students/${user.profileId}/applications`)
        ]);
        setDrives(drivesData);
        setApplications(appsData);
      } catch (err) {
        console.error('Failed to load drives:', err);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [user]);

  const daysUntilDeadline = (deadline) => {
    const d = new Date(deadline);
    const today = new Date();
    return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
  };

  const handleApply = (driveId) => {
    setConfirmModal({ isOpen: true, driveId });
  };

  const confirmApply = async () => {
    if (confirmModal.driveId) {
      try {
        const application = await api.post(`/placement-drives/${confirmModal.driveId}/apply`);
        setApplications([application, ...applications]);
      } catch (err) {
        alert(err.message || 'Failed to apply for drive');
      }
    }
    setConfirmModal({ isOpen: false, driveId: null });
  };

  // Map applications to drive object
  const appsByDriveId = applications.reduce((acc, app) => {
    // app.drive_id could be an object if populated, or string
    const driveId = typeof app.drive_id === 'object' ? app.drive_id._id : app.drive_id;
    acc[driveId] = app;
    return acc;
  }, {});

  const appliedDrives = applications.map(app => {
    const drive = typeof app.drive_id === 'object' ? app.drive_id : drives.find(d => d._id === app.drive_id) || {};
    return {
      ...drive,
      applicationStatus: app.status,
      appliedAt: app.applied_at
    };
  });

  if (fetching) {
    return <div className="p-8 text-center text-text-secondary">Loading placement drives...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Placement Drives</h1>
        <p className="text-text-secondary mt-1">View and apply to placement drives</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        {[
          { id: 'eligible', label: 'All Drives', count: drives.length },
          { id: 'applied', label: 'My Applications', count: applications.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium ${
              activeTab === tab.id
                ? 'bg-primary/20 text-primary'
                : 'bg-gray-100 text-text-secondary'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Eligible Drives Tab */}
      {activeTab === 'eligible' && (
        <div className="space-y-4">
          {drives.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-text-secondary">No drives available at the moment</p>
            </div>
          ) : (
            drives.map(drive => (
              <div key={drive._id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-text-primary">{drive.company_name}</h3>
                    <p className="text-text-secondary">{drive.role}</p>
                  </div>
                  {!appsByDriveId[drive._id] && drive.status !== 'closed' && (
                    <button
                      onClick={() => handleApply(drive._id)}
                      className="btn-primary text-sm flex-shrink-0"
                    >
                      Apply
                    </button>
                  )}
                  {appsByDriveId[drive._id] && (
                    <div className="px-3 py-2 bg-green-100 text-green-700 rounded-md text-sm flex items-center gap-2 flex-shrink-0">
                      <CheckCircle size={16} />
                      Applied
                    </div>
                  )}
                  {drive.status === 'closed' && !appsByDriveId[drive._id] && (
                    <div className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm flex items-center gap-2 flex-shrink-0">
                      Closed
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-text-muted" />
                    <div>
                      <p className="text-xs text-text-muted">CTC</p>
                      <p className="text-sm font-medium text-text-primary">{drive.ctc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-text-muted" />
                    <div>
                      <p className="text-xs text-text-muted">Location</p>
                      <p className="text-sm font-medium text-text-primary">{drive.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-text-muted" />
                    <div>
                      <p className="text-xs text-text-muted">Drive Date</p>
                      <p className="text-sm font-medium text-text-primary">
                        {new Date(drive.drive_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-amber-600" />
                    <div>
                      <p className="text-xs text-text-muted">Deadline</p>
                      <p className="text-sm font-medium text-amber-600">
                        {daysUntilDeadline(drive.application_deadline) > 0 ? `${daysUntilDeadline(drive.application_deadline)}d left` : 'Passed'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-text-primary font-medium mb-2">Eligibility Criteria</p>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-secondary">Min CGPA: <span className="font-medium text-text-primary">{drive.eligibility_criteria?.min_cgpa || 'N/A'}</span></span>
                    </div>
                    {drive.eligibility_criteria?.required_skills?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-secondary">Skills: <span className="font-medium text-text-primary">{drive.eligibility_criteria.required_skills.join(', ')}</span></span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-secondary">No Active Backlogs: <span className="font-medium text-text-primary">{drive.eligibility_criteria?.no_active_backlogs ? 'Required' : 'No'}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* My Applications Tab */}
      {activeTab === 'applied' && (
        <div className="space-y-4">
          {appliedDrives.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-text-secondary">You haven&apos;t applied to any drives yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b-2 border-border">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Company</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Applied On</th>
                  </tr>
                </thead>
                <tbody>
                  {appliedDrives.map(drive => (
                    <tr key={drive._id || Math.random()} className="table-row-hover border-b border-border">
                      <td className="py-3 px-4">
                        <p className="font-medium text-text-primary">{drive.company_name}</p>
                      </td>
                      <td className="py-3 px-4 text-text-secondary text-sm">{drive.role}</td>
                      <td className="py-3 px-4">
                        <span className={`badge text-xs capitalize ${
                          drive.applicationStatus === 'shortlisted' || drive.applicationStatus === 'selected' ? 'bg-green-100 text-green-700' :
                          drive.applicationStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {drive.applicationStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary text-sm">
                        {new Date(drive.appliedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, driveId: null })}
        title="Confirm Application"
        message="Are you sure you want to apply for this drive? Ensure your profile is up to date."
        onConfirm={confirmApply}
      />
    </div>
  );
}
