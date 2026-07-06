import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, MoreVertical, Trash2, Plus } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../contexts/ToastContext';
import { formatDate } from '../../utils/date';
import { SkillsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

function SkillCard({ skill, onDelete }) {
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

  const getBadgeClass = (status) => {
    switch (status) {
      case 'verified': return 'bg-green-50 text-green-700 border-green-200';
      case 'pending': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 w-full">
        <div className="w-48">
          <h3 className="font-bold text-slate-900 text-base">{skill.skill_name || skill.taxonomy_id?.name}</h3>
          <p className="text-sm text-slate-500 capitalize">{skill.proficiency}</p>
        </div>
        
        <div className="w-24">
          <p className="text-sm font-medium text-slate-700">{skill.years_experience ? `${skill.years_experience} YOE` : '-'}</p>
        </div>

        <div className="w-28">
          <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border ${getBadgeClass(skill.status)}`}>
            {skill.status.charAt(0).toUpperCase() + skill.status.slice(1)}
          </span>
        </div>

        <div className="flex-1 text-left text-sm text-slate-500">
          {skill.created_at ? formatDate(skill.created_at) : '-'}
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
          <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-10">
            {skill.status !== 'verified' ? (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(skill._id);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={16} /> Delete
              </button>
            ) : (
              <div className="px-4 py-2 text-sm text-slate-400 italic">No actions</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SkillsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 bg-slate-200 rounded w-32 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-64"></div>
        </div>
        <div className="h-10 bg-slate-200 rounded-xl w-28"></div>
      </div>
      
      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
        <div className="flex gap-4">
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

export default function StudentSkills() {
  const { user } = useAuth();
  const [filterTab, setFilterTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [skills, setSkills] = useState([]);
  const [taxonomy, setTaxonomy] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [fetching, setFetching] = useState(true);
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    taxonomy_id: '',
    proficiency: 'intermediate',
    evidence_note: '',
    years_experience: '',
    projects_using_skill: '',
  });
  const [loading, setLoading] = useState(false);

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'verified', label: 'Verified' },
    { id: 'pending', label: 'Pending' },
    { id: 'rejected', label: 'Rejected' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: taxonomyData } = await SkillsAPI.getTaxonomy();
        setTaxonomy(taxonomyData);
        
        if (!user?.profileId) return;
        
        const { data: skillsData } = await SkillsAPI.getSkills(user.profileId);
        setSkills(skillsData);
      } catch (err) {
        console.error('Failed to load skills:', err);
        toast.error('Authentication error or failed to load data');
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [user]);

  const addSkill = async () => {
    if (!formData.taxonomy_id) {
      toast.error('Please select a skill');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        taxonomy_id: formData.taxonomy_id,
        proficiency: formData.proficiency,
        evidence_note: formData.evidence_note,
        years_experience: formData.years_experience ? parseFloat(formData.years_experience) : undefined,
        projects_using_skill: formData.projects_using_skill,
      };
      
      const { data: newSkill } = await SkillsAPI.addSkill(user.profileId, payload);
      const taxonomyItem = taxonomy.find(t => t._id === formData.taxonomy_id);
      
      const formattedSkill = {
        ...newSkill,
        taxonomy_id: taxonomyItem,
      };
      
      setSkills([formattedSkill, ...skills]);
      setFormData({ taxonomy_id: '', proficiency: 'intermediate', evidence_note: '', years_experience: '', projects_using_skill: '' });
      setShowForm(false);
      toast.success('Skill added successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to add skill');
    } finally {
      setLoading(false);
    }
  };

  const deleteSkill = async (skillId) => {
    try {
      await SkillsAPI.deleteSkill(user.profileId, skillId);
      setSkills(skills.filter(s => s._id !== skillId));
      toast.success('Skill deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete skill');
    }
  };

  const filteredSkills = useMemo(() => {
    return skills.filter(s => {
      const matchesTab = filterTab === 'all' || s.status === filterTab;
      const skillName = (s.skill_name || s.taxonomy_id?.name || '').toLowerCase();
      const matchesSearch = skillName.includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [skills, filterTab, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: skills.length,
      verified: skills.filter(s => s.status === 'verified').length,
      pending: skills.filter(s => s.status === 'pending').length,
      rejected: skills.filter(s => s.status === 'rejected').length,
    };
  }, [skills]);

  if (fetching) {
    return <SkillsSkeleton />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* Add Skill Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-lg font-bold text-slate-900">Add a New Skill</h2>
          
          <div>
            <label htmlFor="skill-select" className="block text-sm font-semibold text-slate-700 mb-1.5">Select Skill</label>
            <select
              id="skill-select"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
              value={formData.taxonomy_id}
              onChange={(e) => setFormData({...formData, taxonomy_id: e.target.value})}
            >
              <option value="">-- Select a skill --</option>
              {taxonomy.map(t => (
                <option key={t._id} value={t._id}>{t.name} ({t.category})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Proficiency</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['beginner', 'intermediate', 'advanced', 'expert'].map(level => (
                <button
                  key={level}
                  onClick={() => setFormData({...formData, proficiency: level})}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.proficiency === level
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="skill-exp" className="block text-sm font-semibold text-slate-700 mb-1.5">Years of Experience (Optional)</label>
              <input
                id="skill-exp"
                type="number"
                step="0.5"
                min="0"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                placeholder="e.g. 1.5"
                value={formData.years_experience}
                onChange={(e) => setFormData({...formData, years_experience: e.target.value})}
              />
            </div>
            <div>
              <label htmlFor="skill-projects" className="block text-sm font-semibold text-slate-700 mb-1.5">Projects Using Skill (Optional)</label>
              <input
                id="skill-projects"
                type="text"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                placeholder="e.g. E-commerce site, Chat API"
                value={formData.projects_using_skill}
                onChange={(e) => setFormData({...formData, projects_using_skill: e.target.value})}
              />
            </div>
          </div>

          {(formData.proficiency === 'advanced' || formData.proficiency === 'expert') && (
            <div>
              <label htmlFor="skill-evidence" className="block text-sm font-semibold text-slate-700 mb-1.5">Evidence / Experience</label>
              <textarea
                id="skill-evidence"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all min-h-[100px]"
                rows="3"
                placeholder="Describe your experience with this skill (required for advanced/expert)..."
                value={formData.evidence_note}
                onChange={(e) => setFormData({...formData, evidence_note: e.target.value})}
              />
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={addSkill}
              disabled={loading || !formData.taxonomy_id}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding Skill...' : 'Add Skill'}
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
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 whitespace-nowrap transition-colors"
          >
            {showForm ? (
              "Cancel"
            ) : (
              <>
                <Plus size={16} />
                Add Skill
              </>
            )}
          </button>
          
        </div>
          
      </div>

      {/* Skills List */}
      {filteredSkills.length === 0 ? (
        <EmptyState
          message={searchQuery ? "No skills match your search" : "No skills yet"}
          cta={searchQuery ? "Clear Search" : "Add your first skill"}
          onCtaClick={() => searchQuery ? setSearchQuery('') : setShowForm(true)}
        />
      ) : (
        <div className="space-y-3">
          {filteredSkills.map(skill => (
            <SkillCard key={skill._id} skill={skill} onDelete={deleteSkill} />
          ))}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
        {[
          { label: 'Total Skills', value: stats.total, color: 'text-slate-900' },
          { label: 'Verified', value: stats.verified, color: 'text-slate-900' },
          { label: 'Pending', value: stats.pending, color: 'text-slate-900' },
          { label: 'Rejected', value: stats.rejected, color: 'text-slate-900' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
            <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* TODO: Issue #123 - Implement Edit Skill functionality in Phase 2 */}
    </div>
  );
}
