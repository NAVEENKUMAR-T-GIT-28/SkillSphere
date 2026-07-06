import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, MoreVertical, Trash2, Plus, ExternalLink, Edit2, Trophy, Medal, Star, Shield, Calendar, Award } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../contexts/ToastContext';
import { formatDate } from '../../utils/date';
import { AchievementsAPI } from '../../services/api/achievements.api';
import { useAuth } from '../../contexts/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import defaultAchievement from '../../assets/default-achievement.png';

export default function StudentAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [fetching, setFetching] = useState(true);
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    issuer: '',
    category: 'hackathon',
    custom_category: '',
    date: '',
    description: '',
    image_url: '',
    certificate_url: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);

  // Dropdown State
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        if (!user?.profileId) return;
        const { data } = await AchievementsAPI.getAchievements(user.profileId);
        setAchievements(data || []);
      } catch (err) {
        toast.error('Failed to load achievements');
      } finally {
        setFetching(false);
      }
    };
    fetchAchievements();
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

  const handleOpenForm = (achievement = null) => {
    if (achievement) {
      setEditingId(achievement._id);
      setFormData({
        title: achievement.title || '',
        issuer: achievement.issuer || '',
        category: achievement.category || 'hackathon',
        custom_category: achievement.custom_category || '',
        date: achievement.date ? achievement.date.split('T')[0] : '',
        description: achievement.description || '',
        image_url: achievement.image_url || '',
        certificate_url: achievement.certificate_url || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        issuer: '',
        category: 'hackathon',
        custom_category: '',
        date: '',
        description: '',
        image_url: '',
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
    if (!formData.title || !formData.date) {
      toast.error('Title and Date are required');
      return;
    }
    if (formData.category === 'other' && !formData.custom_category) {
      toast.error('Please specify your custom category');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        issuer: formData.issuer,
        category: formData.category,
        custom_category: formData.category === 'other' ? formData.custom_category : undefined,
        date: formData.date,
        description: formData.description,
        image_url: formData.image_url,
        certificate_url: formData.certificate_url,
      };

      if (editingId) {
        const { data: updated } = await AchievementsAPI.updateAchievement(user.profileId, editingId, payload);
        setAchievements(achievements.map(a => a._id === editingId ? updated : a));
        toast.success('Achievement updated successfully');
      } else {
        const { data: newAchievement } = await AchievementsAPI.addAchievement(user.profileId, payload);
        setAchievements([newAchievement, ...achievements]);
        toast.success('Achievement added successfully');
      }
      handleCloseForm();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (achievementId) => {
    if (!window.confirm('Are you sure you want to delete this achievement?')) return;
    try {
      await AchievementsAPI.deleteAchievement(user.profileId, achievementId);
      setAchievements(achievements.filter(a => a._id !== achievementId));
      toast.success('Achievement deleted');
      setOpenDropdownId(null);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.message || 'Failed to delete achievement');
    }
  };

  // Filter & Search Logic
  const filteredAchievements = useMemo(() => {
    let result = achievements;
    
    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.title.toLowerCase().includes(query) || 
        (a.issuer && a.issuer.toLowerCase().includes(query)) ||
        (a.custom_category && a.custom_category.toLowerCase().includes(query))
      );
    }

    // Tabs logic - mapping custom tabs to specific backend categories
    if (activeTab === 'Awards') {
      result = result.filter(a => a.category === 'award');
    } else if (activeTab === 'Hackathons') {
      result = result.filter(a => a.category === 'hackathon');
    } else if (activeTab === 'Open Source') {
      result = result.filter(a => a.category === 'open_source' || a.title.toLowerCase().includes('open source') || (a.custom_category && a.custom_category.toLowerCase().includes('open source')));
    } else if (activeTab === 'Other') {
      result = result.filter(a => !['award', 'hackathon'].includes(a.category) && !a.title.toLowerCase().includes('open source') && !(a.custom_category && a.custom_category.toLowerCase().includes('open source')));
    }

    return result;
  }, [achievements, searchQuery, activeTab]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: achievements.length,
      verified: achievements.filter(a => a.status === 'verified').length,
      pending: achievements.filter(a => a.status === 'pending').length,
      rejected: achievements.filter(a => a.status === 'rejected').length,
    };
  }, [achievements]);

  if (fetching) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-100 rounded-xl"></div>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-xl"></div>)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        
        {/* Left - Tabs */}
        <div className="flex items-center gap-6 overflow-x-auto">
          {["All", "Awards", "Hackathons", "Open Source", "Other"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative pb-3 text-sm font-medium whitespace-nowrap transition-colors ${
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
        
        {/* Right */}
        <div className="flex items-center gap-3">
        
          <div className="relative w-72">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
      
            <input
              type="text"
              placeholder="Search achievements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        
          <button
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 whitespace-nowrap"
          >
            <Plus size={17} />
            Add Achievement
          </button>
        
        </div>
        
      </div>

      {/* Add/Edit Form Inline */}
      {showForm && (
        <div ref={formRef} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-semibold text-slate-800">
              {editingId ? 'Edit Achievement' : 'Add New Achievement'}
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Achievement Title *</label>
                <input
                  required
                  type="text"
                  className="input-field bg-slate-50 border-slate-200 focus:bg-white"
                  placeholder="e.g. Winner - Smart India Hackathon"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Issuer / Organizer</label>
                <input
                  type="text"
                  className="input-field bg-slate-50 border-slate-200 focus:bg-white"
                  placeholder="e.g. Ministry of Education"
                  value={formData.issuer}
                  onChange={(e) => setFormData({...formData, issuer: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
                <select
                  required
                  className="input-field bg-slate-50 border-slate-200 focus:bg-white"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="hackathon">Hackathon</option>
                  <option value="award">Award</option>
                  <option value="competition">Competition</option>
                  <option value="paper">Publication (Paper)</option>
                  <option value="patent">Patent</option>
                  <option value="sports">Sports</option>
                  <option value="ncc">NCC</option>
                  <option value="nss">NSS</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="club">Club / Society</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              {formData.category === 'other' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Custom Category Name *</label>
                  <input
                    required
                    type="text"
                    className="input-field bg-slate-50 border-slate-200 focus:bg-white"
                    placeholder="e.g. Open Source"
                    value={formData.custom_category}
                    onChange={(e) => setFormData({...formData, custom_category: e.target.value})}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Achievement Date *</label>
                <input
                  required
                  type="date"
                  className="input-field bg-slate-50 border-slate-200 focus:bg-white"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea
                rows="3"
                className="input-field bg-slate-50 border-slate-200 focus:bg-white resize-none"
                placeholder="Describe your achievement..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Image URL (Optional)</label>
                <input
                  type="url"
                  className="input-field bg-slate-50 border-slate-200 focus:bg-white"
                  placeholder="https://example.com/image.png"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
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
                {editingId ? 'Save Changes' : 'Add Achievement'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Achievement Cards List */}
      {!showForm && filteredAchievements.length === 0 ? (
        <EmptyState
          icon={Trophy}
          message={searchQuery ? "Try adjusting your search or filters." : "You haven't added any achievements yet."}
          cta={!searchQuery ? "Add Achievement" : null}
          onCtaClick={!searchQuery ? () => handleOpenForm() : null}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAchievements.map(achievement => (
            <div key={achievement._id} className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col md:flex-row gap-5">
              
              {/* Image Column */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {achievement.image_url ? (
                    <img 
                      src={achievement.image_url} 
                      alt={achievement.title} 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = defaultAchievement; e.target.classList.add('opacity-50'); }}
                    />
                  ) : (
                    <img 
                      src={defaultAchievement} 
                      alt={achievement.title} 
                      className="w-full h-full object-cover opacity-50" 
                      onError={(e) => { 
                        e.target.style.display = 'none'; 
                        e.target.nextSibling.style.display = 'block'; 
                      }}
                    />
                  )}
                  <Award className="text-slate-300 w-10 h-10 hidden" />
                </div>
              </div>

              {/* Details Column */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{achievement.title}</h3>
                    {achievement.issuer && (
                      <p className="text-slate-600 font-medium text-sm mt-0.5">{achievement.issuer}</p>
                    )}
                  </div>
                  
                  {/* Actions & Badges (Desktop Top-Right) */}
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={achievement.status} />
                    
                    {/* Overflow Menu */}
                    <div className="relative" ref={openDropdownId === achievement._id ? dropdownRef : null}>
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === achievement._id ? null : achievement._id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>
                      
                      {openDropdownId === achievement._id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-10">
                          <button
                            onClick={() => { handleOpenForm(achievement); setOpenDropdownId(null); }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center"
                          >
                            <Edit2 size={16} className="mr-2" />
                            Edit Achievement
                          </button>
                          <button
                            onClick={() => handleDelete(achievement._id)}
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
                  {achievement.date && (
                    <span className="flex items-center">
                      <Calendar size={14} className="mr-1.5 text-slate-400" />
                      {formatDate(achievement.date)}
                    </span>
                  )}
                  <span className="flex items-center text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md text-xs font-medium border border-slate-100 capitalize">
                    {achievement.category === 'other' ? achievement.custom_category : achievement.category}
                  </span>
                </div>

                {achievement.description && (
                  <p className="mt-3 text-sm text-slate-600 line-clamp-2">
                    {achievement.description}
                  </p>
                )}
                
                {achievement.status === 'rejected' && achievement.rejection_reason && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                    <span className="font-semibold mr-1">Rejected:</span>
                    {achievement.rejection_reason}
                  </div>
                )}

                {/* View Certificate Button */}
                {achievement.certificate_url && (
                  <div className="mt-4 pt-4 border-t border-slate-50">
                    <a
                      href={achievement.certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
                    >
                      <ExternalLink size={14} className="mr-2" />
                      View Certificate
                    </a>
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
          <p className="text-sm font-medium text-slate-500 mb-1">Verified</p>
          <p className="text-3xl font-bold text-green-600">{stats.verified}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-slate-500 mb-1">Pending</p>
          <p className="text-3xl font-bold text-amber-500">{stats.pending}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-slate-500 mb-1">Rejected</p>
          <p className="text-3xl font-bold text-red-500">{stats.rejected}</p>
        </div>
      </div>

    </div>
  );
}
