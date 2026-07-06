import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, MoreVertical, Trash2, Plus, ExternalLink, Edit2 } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../contexts/ToastContext';
import { formatDate } from '../../utils/date';
import { CertificationsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const isExpired = (expiryDate) => {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
};

const computeStatus = (cert) => {
  if (cert.status === 'expired') return 'expired';
  if (cert.status === 'verified' && isExpired(cert.expiry_date)) return 'expired';
  return cert.status;
};

function CertCard({ cert, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const effectiveStatus = computeStatus(cert);

  const getBadgeClass = (status) => {
    switch (status) {
      case 'verified': return 'bg-green-50 text-green-700 border-green-200';
      case 'pending': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      case 'expired': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 w-full">
        <div className="w-64">
          <h3 className="font-bold text-slate-900 text-base">{cert.title}</h3>
          <p className="text-sm text-slate-500">{cert.issuer}</p>
        </div>
        
        <div className="w-28">
          <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border ${getBadgeClass(effectiveStatus)}`}>
            {effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1)}
          </span>
        </div>

        <div className="flex-1 text-left text-sm text-slate-500">
          {cert.issue_date ? formatDate(cert.issue_date) : '-'}
        </div>
      </div>

      <div className="relative" ref={menuRef}>
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <MoreVertical size={20} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-10">
            {cert.drive_link && (
              <a
                href={cert.drive_link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                onClick={() => setMenuOpen(false)}
              >
                <ExternalLink size={16} /> View Certificate
              </a>
            )}
            
            {effectiveStatus !== 'verified' && effectiveStatus !== 'expired' && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(cert);
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Edit2 size={16} /> Edit
              </button>
            )}

            {effectiveStatus !== 'verified' && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(cert._id);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
          </div>
        )}
      </div>
      
      {cert.status === 'rejected' && (cert.notes || cert.rejection_reason) && (
        <div className="mt-3 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-100 w-full col-span-full">
          <strong>Reason:</strong> {cert.notes || cert.rejection_reason}
        </div>
      )}
    </div>
  );
}

function CertificationsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 bg-slate-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-64"></div>
        </div>
        <div className="h-10 bg-slate-200 rounded-xl w-40"></div>
      </div>
      
      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
        <div className="flex gap-4">
          <div className="h-6 bg-slate-200 rounded w-16"></div>
          <div className="h-6 bg-slate-200 rounded w-16"></div>
          <div className="h-6 bg-slate-200 rounded w-16"></div>
          <div className="h-6 bg-slate-200 rounded w-16"></div>
        </div>
        <div className="h-10 bg-slate-200 rounded-lg w-64"></div>
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-slate-100 rounded-xl border border-slate-200"></div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-slate-100 rounded-xl border border-slate-200"></div>
        ))}
      </div>
    </div>
  );
}

const initialFormState = {
  title: '',
  issuer: '',
  category: 'technical',
  issueDate: '',
  expiryDate: '',
  credentialId: '',
  driveLink: '',
};

export default function StudentCertifications() {
  const { user } = useAuth();
  const [filterTab, setFilterTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [certs, setCerts] = useState([]);
  const [fetching, setFetching] = useState(true);
  const toast = useToast();
  
  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'verified', label: 'Verified' },
    { id: 'pending', label: 'Pending' },
    { id: 'expired', label: 'Expired' },
  ];

  useEffect(() => {
    const fetchCerts = async () => {
      try {
        if (!user?.profileId) return;
        const { data } = await CertificationsAPI.getCertifications(user.profileId);
        setCerts(data);
      } catch (err) {
        toast.error('Failed to load certifications');
      } finally {
        setFetching(false);
      }
    };
    fetchCerts();
  }, [user]);

  const handleSubmit = async () => {
    if (!formData.title || !formData.driveLink || !formData.issuer || !formData.issueDate) {
      toast.error('Title, Issuer, Issue Date and Drive link are required');
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

      if (editingId) {
        const { data: updatedCert } = await CertificationsAPI.updateCertification(user.profileId, editingId, payload);
        setCerts(certs.map(c => c._id === editingId ? updatedCert : c));
        toast.success('Certification updated successfully');
      } else {
        const { data: newCert } = await CertificationsAPI.addCertification(user.profileId, payload);
        setCerts([newCert, ...certs]);
        toast.success('Certification added successfully');
      }
      
      setFormData(initialFormState);
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      toast.error(err.message || 'Failed to save certification');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cert) => {
    setFormData({
      title: cert.title,
      issuer: cert.issuer,
      category: cert.category || 'technical',
      issueDate: cert.issue_date ? cert.issue_date.split('T')[0] : '',
      expiryDate: cert.expiry_date ? cert.expiry_date.split('T')[0] : '',
      credentialId: cert.credential_id || '',
      driveLink: cert.drive_link || '',
    });
    setEditingId(cert._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteCert = async (certId) => {
    try {
      await CertificationsAPI.deleteCertification(user.profileId, certId);
      setCerts(certs.filter(c => c._id !== certId));
      toast.success('Certification deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete certification');
    }
  };

  const filteredCerts = useMemo(() => {
    return certs.filter(c => {
      const effectiveStatus = computeStatus(c);
      const matchesTab = filterTab === 'all' || effectiveStatus === filterTab;
      const certName = (c.title || '').toLowerCase();
      const matchesSearch = certName.includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [certs, filterTab, searchQuery]);

  const stats = useMemo(() => {
    const statuses = certs.map(computeStatus);
    return {
      total: certs.length,
      verified: statuses.filter(s => s === 'verified').length,
      pending: statuses.filter(s => s === 'pending').length,
      expired: statuses.filter(s => s === 'expired').length,
    };
  }, [certs]);

  if (fetching) {
    return <CertificationsSkeleton />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-lg font-bold text-slate-900">
            {editingId ? 'Edit Certification' : 'Add New Certification'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cert-title" className="block text-sm font-semibold text-slate-700 mb-1.5">Title *</label>
              <input
                id="cert-title"
                type="text"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                placeholder="e.g., AWS Solutions Architect"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div>
              <label htmlFor="cert-issuer" className="block text-sm font-semibold text-slate-700 mb-1.5">Issuer *</label>
              <input
                id="cert-issuer"
                type="text"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                placeholder="e.g., Amazon Web Services"
                value={formData.issuer}
                onChange={(e) => setFormData({...formData, issuer: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cert-cat" className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
              <select
                id="cert-cat"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
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
              <label htmlFor="cert-cred" className="block text-sm font-semibold text-slate-700 mb-1.5">Credential ID (Optional)</label>
              <input
                id="cert-cred"
                type="text"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                placeholder="Credential ID"
                value={formData.credentialId}
                onChange={(e) => setFormData({...formData, credentialId: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cert-issue-date" className="block text-sm font-semibold text-slate-700 mb-1.5">Issue Date *</label>
              <input
                id="cert-issue-date"
                type="date"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                value={formData.issueDate}
                onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
              />
            </div>
            <div>
              <label htmlFor="cert-exp-date" className="block text-sm font-semibold text-slate-700 mb-1.5">Expiry Date (Optional)</label>
              <input
                id="cert-exp-date"
                type="date"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                value={formData.expiryDate}
                onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label htmlFor="cert-drive" className="block text-sm font-semibold text-slate-700 mb-1.5">Google Drive Link *</label>
            <input
              id="cert-drive"
              type="url"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
              placeholder="https://drive.google.com/..."
              value={formData.driveLink}
              onChange={(e) => setFormData({...formData, driveLink: e.target.value})}
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Certification' : 'Add Certification')}
            </button>
          </div>
        </div>
      )}

      {/* Page Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">

        {/* Filter Tabs */}
        <div className="flex items-center gap-8">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`pb-2 text-sm font-medium transition-all relative whitespace-nowrap ${
                filterTab === tab.id
                  ? 'text-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {filterTab === tab.id && (
                <span className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
        
        {/* Search + Add */}
        <div className="flex items-center gap-3">
        
          <div className="relative w-72">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search certifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        
          <button
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                setEditingId(null);
                setFormData(initialFormState);
              } else {
                setShowForm(true);
              }
            }}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 whitespace-nowrap transition-colors"
          >
            {showForm ? (
              "Cancel"
            ) : (
              <>
                <Plus size={16} />
                Add Certification
              </>
            )}
          </button>
          
        </div>
          
      </div>

      {/* Certs List */}
      {filteredCerts.length === 0 ? (
        <EmptyState
          message={searchQuery ? "No certifications match your search" : "No certifications yet"}
          cta={searchQuery ? "Clear Search" : "Add your first certification"}
          onCtaClick={() => searchQuery ? setSearchQuery('') : setShowForm(true)}
        />
      ) : (
        <div className="space-y-3 flex-1">
          {filteredCerts.map(cert => (
            <CertCard key={cert._id} cert={cert} onEdit={handleEdit} onDelete={deleteCert} />
          ))}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-900' },
          { label: 'Verified', value: stats.verified, color: 'text-slate-900' },
          { label: 'Pending', value: stats.pending, color: 'text-slate-900' },
          { label: 'Expired', value: stats.expired, color: 'text-slate-900' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
            <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
