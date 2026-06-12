import { useState, useEffect } from 'react';
import { ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import Drawer from '../../components/Drawer';
import ConfirmModal from '../../components/ConfirmModal';
import api from '../../services/api';

export default function FacultyQueue() {
  const [activeTab, setActiveTab] = useState('certifications');
  const [queue, setQueue] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchQueue = async () => {
    try {
      setFetching(true);
      const data = await api.get('/verification/queue');
      
      const combinedQueue = [];
      
      if (data.certifications?.items) {
        data.certifications.items.forEach(c => {
          combinedQueue.push({
            id: c._id,
            type: 'certification',
            studentName: c.student_id?.full_name || 'Unknown',
            studentRoll: c.student_id?.roll_number || 'N/A',
            itemName: c.title,
            issuer: c.issuer,
            submittedDate: c.created_at,
            driveLink: c.drive_link,
            status: c.status,
          });
        });
      }
      
      if (data.skills?.items) {
        data.skills.items.forEach(s => {
          combinedQueue.push({
            id: s._id,
            type: 'skill',
            studentName: s.student_id?.full_name || 'Unknown',
            studentRoll: s.student_id?.roll_number || 'N/A',
            itemName: s.skill_name,
            category: s.taxonomy_id?.category || 'Custom',
            proficiency: s.proficiency,
            evidence: s.evidence_note,
            submittedDate: s.created_at,
            status: s.status,
          });
        });
      }

      if (data.projects?.items) {
        data.projects.items.forEach(p => {
          combinedQueue.push({
            id: p._id,
            type: 'project',
            studentName: p.created_by?.full_name || 'Unknown',
            studentRoll: p.created_by?.roll_number || 'N/A',
            itemName: p.title,
            description: p.description,
            techStack: p.tech_stack || [],
            githubLink: p.github_url,
            liveLink: p.live_demo_url,
            submittedDate: p.created_at,
            status: p.status,
          });
        });
      }

      // Sort combined queue by submitted date ascending (oldest first)
      combinedQueue.sort((a, b) => new Date(a.submittedDate) - new Date(b.submittedDate));
      
      setQueue(combinedQueue);
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const counts = {
    certifications: queue.filter(item => item.type === 'certification').length,
    skills: queue.filter(item => item.type === 'skill').length,
    projects: queue.filter(item => item.type === 'project').length,
  };

  const tabs = [
    { id: 'certifications', label: 'Certifications', count: counts.certifications },
    { id: 'skills', label: 'Skills', count: counts.skills },
    { id: 'projects', label: 'Projects', count: counts.projects },
  ];

  const filteredQueue = queue.filter(item => {
    if (activeTab === 'certifications') return item.type === 'certification';
    if (activeTab === 'skills') return item.type === 'skill';
    if (activeTab === 'projects') return item.type === 'project';
    return true;
  });

  const handleApprove = async (itemId, type) => {
    try {
      setProcessing(true);
      await api.post(`/verification/${type}/${itemId}/approve`);
      setQueue(queue.filter(item => item.id !== itemId));
      setSelectedItem(null);
    } catch (err) {
      alert(err.message || 'Failed to approve item');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason) {
      alert('Please provide a reason for rejection');
      return;
    }
    try {
      setProcessing(true);
      await api.post(`/verification/${selectedItem.type}/${selectedItem.id}/reject`, { reason: rejectReason });
      setQueue(queue.filter(item => item.id !== selectedItem.id));
      setRejectReason('');
      setShowRejectModal(false);
      setSelectedItem(null);
    } catch (err) {
      alert(err.message || 'Failed to reject item');
    } finally {
      setProcessing(false);
    }
  };

  const totalPending = queue.length;

  if (fetching) {
    return <div className="p-8 text-center text-text-secondary">Loading verification queue...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Verification Queue</h1>
          <p className="text-text-secondary mt-1">Review and verify student submissions</p>
        </div>
        {totalPending > 0 && (
          <div className="px-4 py-2 bg-red-100 text-red-700 rounded-md font-semibold">
            {totalPending} pending
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {tabs.map(tab => (
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
            {tab.count > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Queue list */}
      {filteredQueue.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle size={48} className="mx-auto text-green-600 mb-4 opacity-50" />
          <p className="text-lg font-medium text-text-primary">Queue is clear</p>
          <p className="text-text-secondary text-sm mt-1">All submissions have been reviewed</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQueue.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="card hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-text-primary">{item.itemName}</h3>
                    <span className="badge bg-blue-100 text-blue-700 text-xs capitalize">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">{item.studentName} ({item.studentRoll})</p>
                  <p className="text-xs text-text-muted mt-1">
                    Submitted {new Date(item.submittedDate).toLocaleDateString()}
                  </p>
                </div>
                <button className="btn-primary text-sm">Review</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Drawer */}
      <Drawer
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Review Submission"
      >
        {selectedItem && (
          <div className="space-y-6">
            {/* Student Info */}
            <div className="pb-4 border-b border-border">
              <h3 className="font-semibold text-text-primary mb-2">Student Information</h3>
              <p className="text-sm text-text-primary">{selectedItem.studentName}</p>
              <p className="text-xs text-text-secondary">{selectedItem.studentRoll}</p>
            </div>

            {/* Item Details */}
            <div className="pb-4 border-b border-border">
              <h3 className="font-semibold text-text-primary mb-3">Submission Details</h3>
              <div className="space-y-3">
                {selectedItem.type === 'certification' && (
                  <>
                    <div>
                      <p className="text-xs text-text-muted">Certificate Title</p>
                      <p className="text-sm font-medium text-text-primary">{selectedItem.itemName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Issuer</p>
                      <p className="text-sm font-medium text-text-primary">{selectedItem.issuer}</p>
                    </div>
                    {selectedItem.driveLink && (
                      <a
                        href={selectedItem.driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-primary rounded-md hover:bg-blue-100 transition-colors text-sm font-medium w-fit"
                      >
                        <ExternalLink size={14} />
                        View Certificate
                      </a>
                    )}
                  </>
                )}

                {selectedItem.type === 'skill' && (
                  <>
                    <div>
                      <p className="text-xs text-text-muted">Skill Name</p>
                      <p className="text-sm font-medium text-text-primary">{selectedItem.itemName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Category</p>
                      <p className="text-sm font-medium text-text-primary">{selectedItem.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Proficiency</p>
                      <p className="text-sm font-medium text-text-primary capitalize">{selectedItem.proficiency}</p>
                    </div>
                    {selectedItem.evidence && (
                      <div>
                        <p className="text-xs text-text-muted">Evidence</p>
                        <p className="text-sm text-text-primary p-3 bg-gray-50 rounded-md mt-1">
                          {selectedItem.evidence}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {selectedItem.type === 'project' && (
                  <>
                    <div>
                      <p className="text-xs text-text-muted">Project Title</p>
                      <p className="text-sm font-medium text-text-primary">{selectedItem.itemName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Description</p>
                      <p className="text-sm font-medium text-text-primary">{selectedItem.description}</p>
                    </div>
                    {selectedItem.techStack?.length > 0 && (
                      <div>
                        <p className="text-xs text-text-muted">Tech Stack</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedItem.techStack.map((tech, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-100 text-text-secondary text-xs rounded-full">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(selectedItem.githubLink || selectedItem.liveLink) && (
                      <div className="flex gap-2 mt-2">
                        {selectedItem.githubLink && (
                          <a href={selectedItem.githubLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-text-primary rounded-md hover:bg-gray-200 transition-colors text-xs font-medium">
                            <ExternalLink size={12} /> GitHub
                          </a>
                        )}
                        {selectedItem.liveLink && (
                          <a href={selectedItem.liveLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-xs font-medium">
                            <ExternalLink size={12} /> Live Site
                          </a>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => handleApprove(selectedItem.id, selectedItem.type)}
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors font-medium disabled:opacity-50"
              >
                <CheckCircle size={18} />
                Approve
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors font-medium disabled:opacity-50"
              >
                <XCircle size={18} />
                Reject
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Reject Modal */}
      {showRejectModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Reject Submission</h2>
            <textarea
              className="input-field w-full mb-4"
              rows="4"
              placeholder="Provide a reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={processing}
                className="btn-secondary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="btn-danger disabled:opacity-50"
              >
                {processing ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
