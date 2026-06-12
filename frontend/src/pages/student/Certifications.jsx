import { Plus, ExternalLink, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentCertifications() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [certs, setCerts] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    issuer: '',
    category: 'technical',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
    driveLink: '',
  });

  useEffect(() => {
    const fetchCerts = async () => {
      try {
        if (!user?.profileId) return;
        const { data } = await api.get(`/students/${user.profileId}/certifications`);
        setCerts(data);
      } catch (err) {
        console.error('Failed to load certifications:', err);
      } finally {
        setFetching(false);
      }
    };
    fetchCerts();
  }, [user]);

  const addCertification = async () => {
    if (!formData.title || !formData.driveLink || !formData.issuer || !formData.issueDate) {
      alert('Title, Issuer, Issue Date and Drive link are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        issuer: formData.issuer,
        category: formData.category,
        issue_date: formData.issueDate,
        expiry_date: formData.expiryDate || null,
        credential_id: formData.credentialId,
        drive_link: formData.driveLink,
      };

      const { data: newCert } = await api.post(`/students/${user.profileId}/certifications`, payload);
      setCerts([newCert, ...certs]);
      
      setFormData({
        title: '',
        issuer: '',
        category: 'technical',
        issueDate: '',
        expiryDate: '',
        credentialId: '',
        driveLink: '',
      });
      setShowModal(false);
    } catch (err) {
      alert(err.message || 'Failed to add certification');
    } finally {
      setLoading(false);
    }
  };

  const deleteCert = async (certId) => {
    try {
      await api.delete(`/students/${user.profileId}/certifications/${certId}`);
      setCerts(certs.filter(c => c._id !== certId));
    } catch (err) {
      alert(err.message || 'Failed to delete certification');
    }
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const daysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const days = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : null;
  };

  if (fetching) {
    return <div className="p-8 text-center text-text-secondary">Loading certifications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Certifications</h1>
          <p className="text-text-secondary mt-1">Track your professional certifications</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={18} className="inline mr-2" />
          Add Certification
        </button>
      </div>

      {/* Add Certification Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Certification" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Title *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., AWS Solutions Architect"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Issuer *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Amazon Web Services"
                value={formData.issuer}
                onChange={(e) => setFormData({...formData, issuer: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Category</label>
              <select
                className="input-field"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="technical">Technical</option>
                <option value="language">Language</option>
                <option value="soft_skills">Soft Skills</option>
                <option value="domain">Domain</option>
                <option value="academic">Academic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Credential ID</label>
              <input
                type="text"
                className="input-field"
                placeholder="Optional"
                value={formData.credentialId}
                onChange={(e) => setFormData({...formData, credentialId: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Issue Date *</label>
              <input
                type="date"
                className="input-field"
                value={formData.issueDate}
                onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Expiry Date</label>
              <input
                type="date"
                className="input-field"
                value={formData.expiryDate}
                onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
              />
            </div>
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
              onClick={addCertification}
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Certification'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Certifications Grid */}
      {certs.length === 0 ? (
        <EmptyState
          message="No certifications yet"
          cta="Add your first certification"
          onCtaClick={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certs.map(cert => (
            <div key={cert._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary">{cert.title}</h3>
                  <p className="text-sm text-text-secondary">{cert.issuer}</p>
                </div>
                {cert.status !== 'verified' && (
                  <button
                    onClick={() => deleteCert(cert._id)}
                    className="p-2 hover:bg-red-50 rounded-md transition-colors text-red-600 flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <span className="badge bg-blue-100 text-blue-700 text-xs capitalize">{cert.category}</span>
                  <StatusBadge status={cert.status} />
                </div>

                {cert.issue_date && (
                  <p className="text-xs text-text-muted">
                    Issued: {new Date(cert.issue_date).toLocaleDateString()}
                  </p>
                )}

                {cert.expiry_date && (
                  <p className={`text-xs ${
                    isExpired(cert.expiry_date)
                      ? 'text-red-600'
                      : daysUntilExpiry(cert.expiry_date) <= 30
                      ? 'text-amber-600'
                      : 'text-text-muted'
                  }`}>
                    {isExpired(cert.expiry_date)
                      ? 'Expired'
                      : `Expires in ${daysUntilExpiry(cert.expiry_date)} days`}
                  </p>
                )}
              </div>

              <a
                href={cert.drive_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-primary rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                <ExternalLink size={14} />
                View Certificate
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
