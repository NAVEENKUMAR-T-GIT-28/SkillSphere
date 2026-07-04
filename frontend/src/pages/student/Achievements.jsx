import { Plus, ExternalLink, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../contexts/ToastContext';
import { formatDate } from '../../utils/date';
import { AchievementsAPI } from '../../services/api/achievements.api';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentAchievements() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'competition',
    custom_category: '',
    issuer: '',
    date: '',
    description: '',
    proofUrl: '',
  });

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        if (!user?.profileId) return;
        const { data } = await AchievementsAPI.getAchievements(user.profileId);
        setAchievements(data);
      } catch (err) {
        toast.error('Failed to load achievements');
      } finally {
        setFetching(false);
      }
    };
    fetchAchievements();
  }, [user]);

  const addAchievement = async () => {
    if (!formData.title || !formData.category || !formData.date) {
      toast.error('Title, Category, and Date are required');
      return;
    }
    if (formData.category === 'other' && !formData.custom_category) {
      toast.error('Please specify your custom category');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        category: formData.category,
        custom_category: formData.category === 'other' ? formData.custom_category : undefined,
        issuer: formData.issuer,
        date: formData.date,
        description: formData.description,
        proof_url: formData.proofUrl,
      };

      const { data: newAchievement } = await AchievementsAPI.addAchievement(user.profileId, payload);
      setAchievements([newAchievement, ...achievements]);
      
      setFormData({
        title: '',
        category: 'competition',
        custom_category: '',
        issuer: '',
        date: '',
        description: '',
        proofUrl: '',
      });
      setShowModal(false);
      toast.success('Achievement added successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to add achievement');
    } finally {
      setLoading(false);
    }
  };

  const deleteAchievement = async (achievementId) => {
    try {
      await AchievementsAPI.deleteAchievement(user.profileId, achievementId);
      setAchievements(achievements.filter(a => a._id !== achievementId));
      toast.success('Achievement deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete achievement');
    }
  };

  if (fetching) {
    return <div className="p-8 text-center text-text-secondary">Loading achievements...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Achievements</h1>
          <p className="text-text-secondary mt-1">Track your hackathons, competitions, and other achievements</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={18} className="inline mr-2" />
          Add Achievement
        </button>
      </div>

      {/* Add Achievement Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Achievement" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ach-title" className="block text-sm font-medium text-text-primary mb-2">Title *</label>
              <input
                id="ach-title"
                type="text"
                className="input-field"
                placeholder="e.g., 1st Place Smart India Hackathon"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div>
              <label htmlFor="ach-cat" className="block text-sm font-medium text-text-primary mb-2">Category *</label>
              <select
                id="ach-cat"
                className="input-field"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="hackathon">Hackathon</option>
                <option value="competition">Competition</option>
                <option value="paper">Publication (Paper)</option>
                <option value="patent">Patent</option>
                <option value="award">Award</option>
                <option value="sports">Sports</option>
                <option value="ncc">NCC</option>
                <option value="nss">NSS</option>
                <option value="volunteer">Volunteer</option>
                <option value="club">Club / Society</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {formData.category === 'other' && (
            <div>
              <label htmlFor="ach-custom-cat" className="block text-sm font-medium text-text-primary mb-2">Custom Category Name *</label>
              <input
                id="ach-custom-cat"
                type="text"
                className="input-field"
                placeholder="e.g., Community Service"
                value={formData.custom_category}
                onChange={(e) => setFormData({...formData, custom_category: e.target.value})}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ach-issuer" className="block text-sm font-medium text-text-primary mb-2">Issuer / Organizer</label>
              <input
                id="ach-issuer"
                type="text"
                className="input-field"
                placeholder="e.g., AICTE"
                value={formData.issuer}
                onChange={(e) => setFormData({...formData, issuer: e.target.value})}
              />
            </div>
            <div>
              <label htmlFor="ach-date" className="block text-sm font-medium text-text-primary mb-2">Date *</label>
              <input
                id="ach-date"
                type="date"
                className="input-field"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label htmlFor="ach-desc" className="block text-sm font-medium text-text-primary mb-2">Description</label>
            <textarea
              id="ach-desc"
              className="input-field"
              rows="3"
              placeholder="Describe your achievement..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div>
            <label htmlFor="ach-proof" className="block text-sm font-medium text-text-primary mb-2">Proof / Certificate URL</label>
            <input
              id="ach-proof"
              type="url"
              className="input-field"
              placeholder="https://drive.google.com/..."
              value={formData.proofUrl}
              onChange={(e) => setFormData({...formData, proofUrl: e.target.value})}
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
              onClick={addAchievement}
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Achievement'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Achievements Grid */}
      {achievements.length === 0 ? (
        <EmptyState
          message="No achievements yet"
          cta="Add your first achievement"
          onCtaClick={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map(achievement => (
            <div key={achievement._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary">{achievement.title}</h3>
                  {achievement.issuer && (
                    <p className="text-sm text-text-secondary">{achievement.issuer}</p>
                  )}
                </div>
                {achievement.status !== 'verified' && (
                  <button
                    onClick={() => deleteAchievement(achievement._id)}
                    className="p-2 hover:bg-red-50 rounded-md transition-colors text-red-600 flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <span className="badge bg-purple-100 text-purple-700 text-xs capitalize">
                    {achievement.category === 'other' ? achievement.custom_category : achievement.category}
                  </span>
                  <StatusBadge status={achievement.status} />
                </div>

                {achievement.date && (
                  <p className="text-xs text-text-muted">
                    Date: {formatDate(achievement.date)}
                  </p>
                )}

                {achievement.description && (
                  <p className="text-sm text-text-secondary line-clamp-2 mt-2">
                    {achievement.description}
                  </p>
                )}

                {achievement.status === 'rejected' && achievement.rejection_reason && (
                  <div className="mt-2 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-100">
                    <strong>Reason:</strong> {achievement.rejection_reason}
                  </div>
                )}
              </div>

              {achievement.proof_url && (
                <a
                  href={achievement.proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-primary rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  <ExternalLink size={14} />
                  View Proof
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
