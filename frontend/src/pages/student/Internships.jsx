import { Plus, ExternalLink, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../contexts/ToastContext';
import { formatDate } from '../../utils/date';
import { InternshipsAPI } from '../../services/api/internships.api';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentInternships() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [internships, setInternships] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState({
    company: '',
    role: '',
    start_date: '',
    end_date: '',
    duration_months: '',
    description: '',
    offer_letter_url: '',
    certificate_url: '',
  });

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        if (!user?.profileId) return;
        const { data } = await InternshipsAPI.getInternships(user.profileId);
        setInternships(data);
      } catch (err) {
        toast.error('Failed to load internships');
      } finally {
        setFetching(false);
      }
    };
    fetchInternships();
  }, [user]);

  const addInternship = async () => {
    if (!formData.company || !formData.role || !formData.start_date) {
      toast.error('Company, Role, and Start Date are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        company: formData.company,
        role: formData.role,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        duration_months: formData.duration_months ? Number(formData.duration_months) : undefined,
        description: formData.description,
        offer_letter_url: formData.offer_letter_url,
        certificate_url: formData.certificate_url,
      };

      const { data: newInternship } = await InternshipsAPI.addInternship(user.profileId, payload);
      setInternships([newInternship, ...internships]);
      
      setFormData({
        company: '',
        role: '',
        start_date: '',
        end_date: '',
        duration_months: '',
        description: '',
        offer_letter_url: '',
        certificate_url: '',
      });
      setShowModal(false);
      toast.success('Internship added successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to add internship');
    } finally {
      setLoading(false);
    }
  };

  const deleteInternship = async (internshipId) => {
    try {
      await InternshipsAPI.deleteInternship(user.profileId, internshipId);
      setInternships(internships.filter(i => i._id !== internshipId));
      toast.success('Internship deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete internship');
    }
  };

  if (fetching) {
    return <div className="p-8 text-center text-text-secondary">Loading internships...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Internships</h1>
          <p className="text-text-secondary mt-1">Showcase your internship experience</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={18} className="inline mr-2" />
          Add Internship
        </button>
      </div>

      {/* Add Internship Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Internship" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="internship-company" className="block text-sm font-medium text-text-primary mb-2">Company Name *</label>
              <input
                id="internship-company"
                type="text"
                className="input-field"
                placeholder="e.g., Google"
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
              />
            </div>
            <div>
              <label htmlFor="internship-role" className="block text-sm font-medium text-text-primary mb-2">Role *</label>
              <input
                id="internship-role"
                type="text"
                className="input-field"
                placeholder="e.g., Software Engineering Intern"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="internship-start-date" className="block text-sm font-medium text-text-primary mb-2">Start Date *</label>
              <input
                id="internship-start-date"
                type="date"
                className="input-field"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              />
            </div>
            <div>
              <label htmlFor="internship-end-date" className="block text-sm font-medium text-text-primary mb-2">End Date (optional)</label>
              <input
                id="internship-end-date"
                type="date"
                className="input-field"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              />
            </div>
            <div>
              <label htmlFor="internship-duration-months" className="block text-sm font-medium text-text-primary mb-2">Duration (months)</label>
              <input
                id="internship-duration-months"
                type="number"
                min="0"
                className="input-field"
                placeholder="e.g., 3"
                value={formData.duration_months}
                onChange={(e) => setFormData({...formData, duration_months: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label htmlFor="internship-desc" className="block text-sm font-medium text-text-primary mb-2">Description</label>
            <textarea
              id="internship-desc"
              className="input-field"
              rows="3"
              placeholder="Describe your responsibilities and achievements..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="internship-offer" className="block text-sm font-medium text-text-primary mb-2">Offer Letter URL</label>
              <input
                id="internship-offer"
                type="url"
                className="input-field"
                placeholder="https://drive.google.com/..."
                value={formData.offer_letter_url}
                onChange={(e) => setFormData({...formData, offer_letter_url: e.target.value})}
              />
            </div>
            <div>
              <label htmlFor="internship-cert" className="block text-sm font-medium text-text-primary mb-2">Certificate URL</label>
              <input
                id="internship-cert"
                type="url"
                className="input-field"
                placeholder="https://drive.google.com/..."
                value={formData.certificate_url}
                onChange={(e) => setFormData({...formData, certificate_url: e.target.value})}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <button
              onClick={() => setShowModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={addInternship}
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Internship'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Internships List */}
      {internships.length === 0 ? (
        <EmptyState
          message="No internships yet"
          cta="Add your first internship"
          onCtaClick={() => setShowModal(true)}
        />
      ) : (
        <div className="space-y-4">
          {internships.map(internship => (
            <div key={internship._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-text-primary">{internship.role} @ {internship.company}</h3>
                    <StatusBadge status={internship.status} />
                  </div>
                  <p className="text-xs text-text-muted mb-2">
                    {formatDate(internship.start_date)} - {internship.end_date ? formatDate(internship.end_date) : 'Present'} {internship.duration_months ? `(${internship.duration_months} months)` : ''}
                  </p>
                  {internship.description && (
                    <p className="text-sm text-text-secondary">{internship.description}</p>
                  )}
                  {internship.status === 'rejected' && internship.rejection_reason && (
                    <div className="mt-2 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-100">
                      <strong>Reason:</strong> {internship.rejection_reason}
                    </div>
                  )}
                </div>
                {internship.status !== 'verified' && (
                  <button
                    onClick={() => deleteInternship(internship._id)}
                    className="p-2 hover:bg-red-50 rounded-md transition-colors text-red-600 flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {(internship.offer_letter_url || internship.certificate_url) && (
                <div className="flex gap-3 pt-3 border-t border-border">
                  {internship.offer_letter_url && (
                    <a
                      href={internship.offer_letter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-text-primary rounded-md hover:bg-gray-200 transition-colors text-sm font-medium flex-1"
                    >
                      <ExternalLink size={14} />
                      Offer Letter
                    </a>
                  )}
                  {internship.certificate_url && (
                    <a
                      href={internship.certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-primary rounded-md hover:bg-blue-100 transition-colors text-sm font-medium flex-1"
                    >
                      <ExternalLink size={14} />
                      Certificate
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
