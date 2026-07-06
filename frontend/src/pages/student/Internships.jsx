import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, MoreVertical, Trash2, Plus, ExternalLink, Edit2, Building2 } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../contexts/ToastContext';
import { formatDate } from '../../utils/date';
import { InternshipsAPI } from '../../services/api/internships.api';
import { useAuth } from '../../contexts/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import defaultCompany from '../../assets/default-company.png';

export default function StudentInternships() {
  const { user } = useAuth();
  const [internships, setInternships] = useState([]);
  const [fetching, setFetching] = useState(true);
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    internship_type: 'Full-time',
    location: '',
    start_date: '',
    end_date: '',
    duration_months: '',
    description: '',
    company_logo_url: '',
    offer_letter_url: '',
    certificate_url: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);

  // Dropdown State
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        if (!user?.profileId) return;
        const { data } = await InternshipsAPI.getInternships(user.profileId);
        setInternships(data || []);
      } catch (err) {
        toast.error('Failed to load internships');
      } finally {
        setFetching(false);
      }
    };
    fetchInternships();
  }, [user]);

  // Handle click outside for dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenForm = (internship = null) => {
    if (internship) {
      setEditingId(internship._id);
      setFormData({
        company: internship.company || '',
        role: internship.role || '',
        internship_type: internship.internship_type || 'Full-time',
        location: internship.location || '',
        start_date: internship.start_date ? internship.start_date.split('T')[0] : '',
        end_date: internship.end_date ? internship.end_date.split('T')[0] : '',
        duration_months: internship.duration_months || '',
        description: internship.description || '',
        company_logo_url: internship.company_logo_url || '',
        offer_letter_url: internship.offer_letter_url || '',
        certificate_url: internship.certificate_url || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        company: '',
        role: '',
        internship_type: 'Full-time',
        location: '',
        start_date: '',
        end_date: '',
        duration_months: '',
        description: '',
        company_logo_url: '',
        offer_letter_url: '',
        certificate_url: '',
      });
    }
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company || !formData.role || !formData.start_date) {
      toast.error('Company, Role, and Start Date are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        company: formData.company,
        role: formData.role,
        internship_type: formData.internship_type,
        location: formData.location,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        duration_months: formData.duration_months ? Number(formData.duration_months) : undefined,
        description: formData.description,
        company_logo_url: formData.company_logo_url,
        offer_letter_url: formData.offer_letter_url,
        certificate_url: formData.certificate_url,
      };

      if (editingId) {
        const { data: updated } = await InternshipsAPI.updateInternship(user.profileId, editingId, payload);
        setInternships(internships.map(i => i._id === editingId ? updated : i));
        toast.success('Internship updated successfully');
      } else {
        const { data: newInternship } = await InternshipsAPI.addInternship(user.profileId, payload);
        setInternships([newInternship, ...internships]);
        toast.success('Internship added successfully');
      }
      handleCloseForm();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (internshipId) => {
    if (!window.confirm('Are you sure you want to delete this internship?')) return;
    try {
      await InternshipsAPI.deleteInternship(user.profileId, internshipId);
      setInternships(internships.filter(i => i._id !== internshipId));
      toast.success('Internship deleted');
      setOpenDropdownId(null);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.message || 'Failed to delete internship');
    }
  };

  // Filter & Search Logic
  const filteredInternships = useMemo(() => {
    let result = internships;
    
    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(i => 
        i.company.toLowerCase().includes(query) || 
        i.role.toLowerCase().includes(query) ||
        (i.location && i.location.toLowerCase().includes(query))
      );
    }

    // Tabs
    if (activeTab === 'Completed') {
      result = result.filter(i => i.end_date);
    } else if (activeTab === 'Current') {
      result = result.filter(i => !i.end_date);
    } else if (activeTab === 'Offers') {
      result = result.filter(i => i.offer_letter_url);
    }

    return result;
  }, [internships, searchQuery, activeTab]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: internships.length,
      completed: internships.filter(i => i.end_date).length,
      current: internships.filter(i => !i.end_date).length,
      offers: internships.filter(i => i.offer_letter_url).length,
    };
  }, [internships]);

  if (fetching) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-100 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl"></div>)}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">

      {/* Top Toolbar */}
<div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">

  {/* Left - Filter Tabs */}
  <div className="flex items-center gap-6">
    {["All", "Completed", "Current", "Offers"].map((tab) => (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`relative pb-3 text-sm font-medium transition-colors ${
          activeTab === tab
            ? "text-blue-600"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        {tab}

        {activeTab === tab && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-blue-600" />
        )}
      </button>
    ))}
  </div>

  {/* Right - Search + Add */}
  <div className="flex items-center gap-3">

    <div className="relative w-72">
      <Search
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />

      <input
        type="text"
        placeholder="Search internships..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>

    <button
      onClick={() => setShowForm(!showForm)}
      className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 whitespace-nowrap"
    >
      <Plus size={17} />
      {showForm ? "Cancel" : "Add Internship"}
    </button>

  </div>

</div>

      {/* Add/Edit Form Inline */}
      {showForm && (
        <div ref={formRef} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-semibold text-slate-800">
              {editingId ? 'Edit Internship' : 'Add New Internship'}
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Company Name *</label>
                <input
                  required
                  type="text"
                  className="input-field bg-slate-50 border-slate-200 focus:bg-white"
                  placeholder="e.g. Zoho Corporation"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Role / Title *</label>
                <input
                  required
                  type="text"
                  className="input-field bg-slate-50 border-slate-200 focus:bg-white"
                  placeholder="e.g. Software Developer Intern"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Internship Type</label>
                <select
                  className="input-field bg-slate-50 border-slate-200 focus:bg-white"
                  value={formData.internship_type}
                  onChange={(e) => setFormData({...formData, internship_type: e.target.value})}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                <input
                  type="text"
                  className="input-field bg-slate-50 border-slate-200 focus:bg-white"
                  placeholder="e.g. Chennai, India"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Start Date *</label>
                <input
                  required
                  type="date"
                  className="input-field bg-slate-50 border-slate-200 focus:bg-white"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                <div className="relative">
                  <input
                    type="date"
                    className="input-field bg-slate-50 border-slate-200 focus:bg-white"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  />
                  {!formData.end_date && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 bg-slate-50 px-1 pointer-events-none">
                      (Leave empty if current)
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea
                rows="3"
                className="input-field bg-slate-50 border-slate-200 focus:bg-white resize-none"
                placeholder="Describe your responsibilities and achievements..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Company Logo URL (Optional)</label>
                <input
                  type="url"
                  className="input-field bg-slate-50 border-slate-200 focus:bg-white"
                  placeholder="https://example.com/logo.png"
                  value={formData.company_logo_url}
                  onChange={(e) => setFormData({...formData, company_logo_url: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Duration (Months, Optional)</label>
                <input
                  type="number"
                  min="0"
                  className="input-field bg-slate-50 border-slate-200 focus:bg-white"
                  placeholder="e.g. 6"
                  value={formData.duration_months}
                  onChange={(e) => setFormData({...formData, duration_months: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Offer Letter URL (Optional)</label>
                <input
                  type="url"
                  className="input-field bg-slate-50 border-slate-200 focus:bg-white"
                  placeholder="https://drive.google.com/..."
                  value={formData.offer_letter_url}
                  onChange={(e) => setFormData({...formData, offer_letter_url: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Certificate URL (Optional)</label>
                <input
                  type="url"
                  className="input-field bg-slate-50 border-slate-200 focus:bg-white"
                  placeholder="https://drive.google.com/..."
                  value={formData.certificate_url}
                  onChange={(e) => setFormData({...formData, certificate_url: e.target.value})}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button 
                type="button" 
                onClick={handleCloseForm}
                className="px-5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-70 flex items-center shadow-sm hover:shadow"
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                ) : null}
                {editingId ? 'Save Changes' : 'Add Internship'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Internship Cards List */}
      {!showForm && filteredInternships.length === 0 ? (
        <EmptyState
          icon={Building2}
          message={searchQuery ? "Try adjusting your search or filters." : "You haven't added any internships yet."}
          cta={!searchQuery ? "Add Internship" : null}
          onCtaClick={!searchQuery ? () => handleOpenForm() : null}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredInternships.map(internship => (
            <div key={internship._id} className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col md:flex-row gap-5">
              
              {/* Logo Column */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {internship.company_logo_url ? (
                    <img 
                      src={internship.company_logo_url} 
                      alt={internship.company} 
                      className="w-full h-full object-contain p-2"
                      onError={(e) => { e.target.src = defaultCompany; e.target.classList.add('opacity-50'); }}
                    />
                  ) : (
                    <img 
                      src={internship.company_logo_url || defaultCompany} 
                      className="w-full h-full object-contain p-2 opacity-50" 
                    />
                  )}
                </div>
              </div>

              {/* Details Column */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 truncate">{internship.company}</h3>
                    <p className="text-slate-600 font-medium text-sm mt-0.5">{internship.role}</p>
                  </div>
                  
                  {/* Actions & Badges (Desktop Top-Right) */}
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={internship.status} />
                    
                    {/* Overflow Menu */}
                    <div className="relative" ref={openDropdownId === internship._id ? dropdownRef : null}>
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === internship._id ? null : internship._id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>
                      
                      {openDropdownId === internship._id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-10">
                          <button
                            onClick={() => { handleOpenForm(internship); setOpenDropdownId(null); }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center"
                          >
                            <Edit2 size={16} className="mr-2" />
                            Edit Internship
                          </button>
                          <button
                            onClick={() => handleDelete(internship._id)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                          >
                            <Trash2 size={16} className="mr-2" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-3 text-sm text-slate-500">
                  {internship.internship_type && (
                    <span className="flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2"></span>
                      {internship.internship_type}
                    </span>
                  )}
                  {internship.location && (
                    <span className="flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2"></span>
                      {internship.location}
                    </span>
                  )}
                  <span className="flex items-center text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md text-xs font-medium border border-slate-100">
                    {formatDate(internship.start_date)} - {internship.end_date ? formatDate(internship.end_date) : 'Present'}
                  </span>
                  {internship.duration_months && (
                    <span className="text-xs text-slate-400">({internship.duration_months} mos)</span>
                  )}
                </div>

                {internship.description && (
                  <p className="mt-3 text-sm text-slate-600 line-clamp-2">
                    {internship.description}
                  </p>
                )}
                
                {internship.status === 'rejected' && internship.rejection_reason && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                    <span className="font-semibold mr-1">Rejected:</span>
                    {internship.rejection_reason}
                  </div>
                )}

                {/* Buttons (Offer Letter / Cert) */}
                {(internship.offer_letter_url || internship.certificate_url) && (
                  <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-50">
                    {internship.offer_letter_url && (
                      <a
                        href={internship.offer_letter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                      >
                        <ExternalLink size={14} className="mr-2" />
                        Offer Letter
                      </a>
                    )}
                    {internship.certificate_url && (
                      <a
                        href={internship.certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
                      >
                        <ExternalLink size={14} className="mr-2" />
                        Certificate
                      </a>
                    )}
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Statistics Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 mt-6 border-t border-slate-100">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-slate-500 mb-1">Total</p>
          <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-slate-500 mb-1">Completed</p>
          <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-slate-500 mb-1">Current</p>
          <p className="text-3xl font-bold text-blue-600">{stats.current}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-slate-500 mb-1">Offers</p>
          <p className="text-3xl font-bold text-purple-600">{stats.offers}</p>
        </div>
      </div>

    </div>
  );
}
