import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentSkills() {
  const { user } = useAuth();
  const [filterTab, setFilterTab] = useState('all');
  const [skills, setSkills] = useState([]);
  const [taxonomy, setTaxonomy] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [formData, setFormData] = useState({
    taxonomy_id: '',
    proficiency: 'intermediate',
    evidence_note: '',
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
        if (!user?.profileId) return;
        const [taxonomyData, skillsData] = await Promise.all([
          api.get('/skill-taxonomy'),
          api.get(`/students/${user.profileId}/skills`)
        ]);
        setTaxonomy(taxonomyData);
        setSkills(skillsData);
      } catch (err) {
        console.error('Failed to load skills:', err);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [user]);

  const addSkill = async () => {
    if (!formData.taxonomy_id) {
      alert('Please select a skill');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        taxonomy_id: formData.taxonomy_id,
        proficiency: formData.proficiency,
        evidence_note: formData.evidence_note,
      };
      
      const newSkill = await api.post(`/students/${user.profileId}/skills`, payload);
      // Wait for it to be added, then fetch fresh list or prepend the response
      // The API response doesn't have the populated taxonomy_id, so a refetch might be safer
      // but let's just prepend it. We know the name from taxonomy list.
      const taxonomyItem = taxonomy.find(t => t._id === formData.taxonomy_id);
      
      const formattedSkill = {
        ...newSkill,
        taxonomy_id: taxonomyItem,
      };
      
      setSkills([formattedSkill, ...skills]);
      setFormData({ taxonomy_id: '', proficiency: 'intermediate', evidence_note: '' });
      setShowForm(false);
    } catch (err) {
      alert(err.message || 'Failed to add skill');
    } finally {
      setLoading(false);
    }
  };

  const deleteSkill = async (skillId) => {
    try {
      await api.delete(`/students/${user.profileId}/skills/${skillId}`);
      setSkills(skills.filter(s => s._id !== skillId));
    } catch (err) {
      alert(err.message || 'Failed to delete skill');
    }
  };

  const filteredSkills = skills.filter(s => {
    if (filterTab === 'all') return true;
    return s.status === filterTab;
  });

  if (fetching) {
    return <div className="p-8 text-center text-text-secondary">Loading skills...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Skills</h1>
          <p className="text-text-secondary mt-1">Manage and verify your technical skills</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? 'Cancel' : '+ Add Skill'}
        </button>
      </div>

      {/* Add Skill Form */}
      {showForm && (
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">Add a New Skill</h2>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Select Skill</label>
            <select
              className="input-field"
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
            <label className="block text-sm font-medium text-text-primary mb-2">Proficiency</label>
            <div className="grid grid-cols-4 gap-2">
              {['beginner', 'intermediate', 'advanced', 'expert'].map(level => (
                <button
                  key={level}
                  onClick={() => setFormData({...formData, proficiency: level})}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    formData.proficiency === level
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {(formData.proficiency === 'advanced' || formData.proficiency === 'expert') && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Evidence / Experience</label>
              <textarea
                className="input-field"
                rows="3"
                placeholder="Describe your experience with this skill..."
                value={formData.evidence_note}
                onChange={(e) => setFormData({...formData, evidence_note: e.target.value})}
              />
            </div>
          )}

          <button
            onClick={addSkill}
            disabled={loading || !formData.taxonomy_id}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Skill'}
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              filterTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Skills List */}
      {filteredSkills.length === 0 ? (
        <EmptyState
          message="No skills yet"
          cta="Add your first skill"
          onCtaClick={() => setShowForm(true)}
        />
      ) : (
        <div className="space-y-3">
          {filteredSkills.map(skill => (
            <div key={skill._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary">{skill.skill_name || skill.taxonomy_id?.name}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-text-secondary capitalize">{skill.proficiency}</span>
                    <StatusBadge status={skill.status} />
                    <span className="text-xs text-text-muted">
                      {new Date(skill.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {skill.status !== 'verified' && (
                  <button
                    onClick={() => deleteSkill(skill._id)}
                    className="p-2 hover:bg-red-50 rounded-md transition-colors text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
