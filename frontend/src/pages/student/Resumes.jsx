import { 
  Plus, ExternalLink, Trash2, Check, 
  FileText, CloudUpload, Shield, History, 
  Download, Lock, ChevronRight, FileBadge,
  Eye, FileCode2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import AtsPanel from '../../components/resume/AtsPanel';
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
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-pulse">
        <div className="h-20 bg-slate-100 rounded-2xl mb-8"></div>
        <div className="h-[320px] bg-slate-100 rounded-3xl"></div>
        <div className="grid grid-cols-4 gap-4 mt-8">
          <div className="h-32 bg-slate-100 rounded-2xl"></div>
          <div className="h-32 bg-slate-100 rounded-2xl"></div>
          <div className="h-32 bg-slate-100 rounded-2xl"></div>
          <div className="h-32 bg-slate-100 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const latestResume = resumes.find(r => r.is_latest) || resumes[0];
  const olderResumes = resumes.filter(r => r._id !== latestResume?._id);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-end gap-4 pb-2 pt-2">
        <button 
          onClick={() => setShowModal(true)} 
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-xl transition-colors shadow-sm"
        >
          <Plus size={16} />
          Add Version
        </button>
      </div>

      {/* Main Hero Card or Latest Resume */}
      {resumes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] h-[320px]">
          <div className="relative mb-6">
            <div className="w-20 h-24 bg-blue-50/50 rounded-xl border border-blue-100/50 flex items-center justify-center">
              <FileText size={40} className="text-blue-500" strokeWidth={1.5} />
            </div>
            <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center text-blue-600">
              <CloudUpload size={20} strokeWidth={2} />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No resumes uploaded</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-8 text-sm leading-relaxed">
            Upload your first resume to start building your professional portfolio. Your resume will be versioned automatically for future updates.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button 
              onClick={() => setShowModal(true)} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-xl transition-colors shadow-sm"
            >
              Upload Resume
            </button>
            <button className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
              Learn about resume versions
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              
              <div className="flex gap-5">
                <div className="w-16 h-20 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-center flex-shrink-0">
                  <FileText size={32} className="text-blue-600" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold text-slate-800">
                      {latestResume.resume_version_name || latestResume.label || `Resume v${latestResume.version}`}
                    </h2>
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check size={12} strokeWidth={3} />
                      Latest
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">Version {latestResume.version} &bull; Uploaded {new Date(latestResume.uploaded_at).toLocaleDateString()}</p>
                  
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href={latestResume.drive_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors text-sm font-medium"
                >
                  <Eye size={16} />
                  Preview
                </a>
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl transition-colors text-sm font-medium"
                >
                  <CloudUpload size={16} />
                  Replace
                </button>
              </div>

            </div>
          </div>

          {/* Version History */}
          {olderResumes.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Version History</h3>
              <div className="space-y-3">
                {olderResumes.map(resume => (
                  <div key={resume._id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-2xl hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-12 bg-slate-50 rounded flex items-center justify-center border border-slate-200 text-slate-400 flex-shrink-0">
                        <FileText size={20} strokeWidth={1.5} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">{resume.resume_version_name || resume.label || `Resume v${resume.version}`}</h4>
                        <p className="text-xs text-slate-500">Version {resume.version} &bull; Uploaded {new Date(resume.uploaded_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={resume.drive_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                        title="Preview"
                      >
                        <Eye size={16} />
                      </a>
                      <button
                        onClick={() => deleteResume(resume._id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Version"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {resumes.length > 0 && <AtsPanel profileId={user.profileId} />}

      {/* Feature Cards Grid (Always visible for educational purposes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col hover:shadow-sm transition-shadow relative overflow-hidden group">
          <div className="absolute top-4 right-4">
            <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md">Live</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Shield size={20} />
          </div>
          <h4 className="font-bold text-slate-800 mb-1">ATS Score</h4>
          <p className="text-xs text-slate-500 leading-relaxed">Deterministic ATS compatibility scoring — upload above to run it.</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col hover:shadow-sm transition-shadow group">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <History size={20} />
          </div>
          <h4 className="font-bold text-slate-800 mb-1">Multiple Versions</h4>
          <p className="text-xs text-slate-500 leading-relaxed">Track every resume update perfectly.</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col hover:shadow-sm transition-shadow group">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Download size={20} />
          </div>
          <h4 className="font-bold text-slate-800 mb-1">Easy Download</h4>
          <p className="text-xs text-slate-500 leading-relaxed">Export PDF and DOCX versions easily.</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col hover:shadow-sm transition-shadow group">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Lock size={20} />
          </div>
          <h4 className="font-bold text-slate-800 mb-1">Private & Secure</h4>
          <p className="text-xs text-slate-500 leading-relaxed">Only verified placement staff can access.</p>
        </div>

      </div>

      {/* Add Resume Modal (Preserved exactly as is, functionally) */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Upload Resume Version" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">Version Label (optional)</label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
              placeholder="e.g., SDE Resume v2, Internship Resume"
              value={formData.label}
              onChange={(e) => setFormData({...formData, label: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">Google Drive Link *</label>
            <input
              type="url"
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
              placeholder="https://drive.google.com/..."
              value={formData.driveLink}
              onChange={(e) => setFormData({...formData, driveLink: e.target.value})}
            />
          </div>

          <div className="flex gap-3 justify-end pt-5 border-t border-slate-100 mt-6">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={addResume}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload Resume'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
