import { Plus, ExternalLink, Trash2, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import { ResumesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { getBadgeColor } from '../../utils/formatters';

export default function StudentResumes() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    label: '',
    driveLink: '',
  });

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        if (!user?.profileId) return;
        const { data } = await ResumesAPI.getResumes(user.profileId);
        setResumes(data);
      } catch (err) {
        console.error('Failed to load resumes:', err);
      } finally {
        setFetching(false);
      }
    };
    fetchResumes();
  }, [user]);

  const addResume = async () => {
    if (!formData.driveLink) {
      alert('Google Drive link is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        drive_link: formData.driveLink,
        label: formData.label,
      };

      const { data: newResume } = await ResumesAPI.addResume(user.profileId, payload);
      
      // Update previous latest to false in local state
      const updatedResumes = resumes.map(r => ({...r, is_latest: false}));
      setResumes([newResume, ...updatedResumes]);
      
      setFormData({ label: '', driveLink: '' });
      setShowModal(false);
    } catch (err) {
      alert(err.message || 'Failed to add resume');
    } finally {
      setLoading(false);
    }
  };

  const deleteResume = async (resumeId) => {
    try {
      await ResumesAPI.deleteResume(user.profileId, resumeId);
      
      let filtered = resumes.filter(r => r._id !== resumeId);
      
      // If we deleted the latest, the backend automatically assigns latest to the next one,
      // but we need to reflect that in the frontend. We can just refetch, or update locally.
      const deletedWasLatest = resumes.find(r => r._id === resumeId)?.is_latest;
      if (deletedWasLatest && filtered.length > 0) {
        filtered[0].is_latest = true;
      }
      
      setResumes(filtered);
    } catch (err) {
      alert(err.message || 'Failed to delete resume');
    }
  };

  if (fetching) {
    return <div className="p-8 text-center text-text-secondary">Loading resumes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Resumes</h1>
          <p className="text-text-secondary mt-1">Manage your resume versions</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={18} className="inline mr-2" />
          Add Version
        </button>
      </div>

      {/* Add Resume Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Upload Resume Version" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Label (optional)</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g., SDE Resume v2, Internship Resume"
              value={formData.label}
              onChange={(e) => setFormData({...formData, label: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Google Drive Link *</label>
            <input
              type="url"
              className="input-field"
              placeholder="https://drive.google.com/..."
              value={formData.driveLink}
              onChange={(e) => setFormData({...formData, driveLink: e.target.value})}
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
              onClick={addResume}
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload Resume'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Resume Versions */}
      {resumes.length === 0 ? (
        <EmptyState
          message="No resume versions uploaded"
          cta="Upload your first resume"
          onCtaClick={() => setShowModal(true)}
        />
      ) : (
        <div className="space-y-3">
          {resumes.map(resume => (
            <div key={resume._id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-text-primary">Version {resume.version}</h3>
                    {resume.is_latest && (
                      <span className="badge bg-green-100 text-green-700 text-xs flex items-center gap-1">
                        <Check size={12} />
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary">{resume.resume_version_name || resume.label || `Resume v${resume.version}`}</p>
                  <p className="text-xs text-text-muted mt-2">
                    Uploaded: {new Date(resume.uploaded_at).toLocaleDateString()}
                  </p>
                  
                  {(resume.ats_score !== undefined || resume.keywords?.length > 0 || resume.parsed_skills?.length > 0) && (
                    <div className="mt-4 pt-3 border-t border-border space-y-3">
                      {resume.ats_score !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">ATS Score:</span>
                          <span className={`badge text-xs ${getBadgeColor('score', resume.ats_score)}`}>
                            {resume.ats_score}/100
                          </span>
                        </div>
                      )}
                      
                      {resume.parsed_skills && resume.parsed_skills.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-text-primary mb-1">Parsed Skills:</p>
                          <div className="flex flex-wrap gap-1">
                            {resume.parsed_skills.map((skill, i) => (
                              <span key={i} className="px-2 py-0.5 bg-gray-100 text-text-secondary rounded text-[10px]">{skill}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {resume.keywords && resume.keywords.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-text-primary mb-1">Keywords Found:</p>
                          <div className="flex flex-wrap gap-1">
                            {resume.keywords.map((kw, i) => (
                              <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px]">{kw}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {resume.missing_keywords && resume.missing_keywords.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-text-primary mb-1">Missing Keywords:</p>
                          <div className="flex flex-wrap gap-1">
                            {resume.missing_keywords.map((kw, i) => (
                              <span key={i} className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[10px]">{kw}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <a
                    href={resume.drive_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-primary rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    <ExternalLink size={14} />
                    View
                  </a>
                  <button
                    onClick={() => deleteResume(resume._id)}
                    className="p-2 hover:bg-red-50 rounded-md transition-colors text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
