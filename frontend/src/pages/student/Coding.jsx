import { useState, useEffect } from 'react';
import { Edit2, X, Check, ExternalLink } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentCoding() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState({});
  const [editingPlatform, setEditingPlatform] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    problemsSolved: '',
    contestRating: '',
    profileUrl: '',
  });

  const platforms = [
    { name: 'LeetCode', color: 'bg-yellow-100 text-yellow-700' },
    { name: 'HackerRank', color: 'bg-green-100 text-green-700' },
    { name: 'CodeChef', color: 'bg-blue-100 text-blue-700' },
    { name: 'SkillRack', color: 'bg-purple-100 text-purple-700' },
    { name: 'GitHub', color: 'bg-gray-700 text-white' },
    { name: 'Codeforces', color: 'bg-red-100 text-red-700' },
  ];

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        if (!user?.profileId) return;
        const data = await api.get(`/students/${user.profileId}/coding-profiles`);
        // Map array to object keyed by platform
        const profileMap = {};
        data.forEach(p => {
          profileMap[p.platform.toLowerCase()] = p;
        });
        setProfiles(profileMap);
      } catch (err) {
        console.error('Failed to load coding profiles:', err);
      } finally {
        setFetching(false);
      }
    };
    fetchProfiles();
  }, [user]);

  const startEdit = (platform) => {
    const platformKey = platform.name.toLowerCase();
    setEditingPlatform(platformKey);
    const profile = profiles[platformKey] || {};
    setFormData({
      username: profile.username || '',
      problemsSolved: profile.problems_solved || '',
      contestRating: profile.contest_rating || '',
      profileUrl: profile.profile_url || `https://${platformKey}.com/`,
    });
  };

  const saveProfile = async (platformName) => {
    if (!formData.username || !formData.profileUrl) {
      alert('Username and Profile URL are required');
      return;
    }

    setLoading(true);
    const platformKey = platformName.toLowerCase();
    const existingProfile = profiles[platformKey];
    
    try {
      const payload = {
        platform: platformKey,
        username: formData.username,
        profile_url: formData.profileUrl,
        problems_solved: formData.problemsSolved ? parseInt(formData.problemsSolved) : 0,
        contest_rating: formData.contestRating ? parseInt(formData.contestRating) : 0,
      };

      let savedProfile;
      if (existingProfile && existingProfile._id) {
        // Update
        savedProfile = await api.patch(`/students/${user.profileId}/coding-profiles/${existingProfile._id}`, payload);
      } else {
        // Create
        savedProfile = await api.post(`/students/${user.profileId}/coding-profiles`, payload);
      }

      setProfiles({
        ...profiles,
        [platformKey]: savedProfile
      });

      setEditingPlatform(null);
      setFormData({ username: '', problemsSolved: '', contestRating: '', profileUrl: '' });
    } catch (err) {
      alert(err.message || 'Failed to save coding profile');
    } finally {
      setLoading(false);
    }
  };

  const removeProfile = async (platformName) => {
    const platformKey = platformName.toLowerCase();
    const existingProfile = profiles[platformKey];
    
    if (!existingProfile || !existingProfile._id) return;

    try {
      await api.delete(`/students/${user.profileId}/coding-profiles/${existingProfile._id}`);
      
      const newProfiles = { ...profiles };
      delete newProfiles[platformKey];
      setProfiles(newProfiles);
    } catch (err) {
      alert(err.message || 'Failed to remove coding profile');
    }
  };

  if (fetching) {
    return <div className="p-8 text-center text-text-secondary">Loading coding profiles...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Coding Profiles</h1>
        <p className="text-text-secondary mt-1">Link and track your competitive coding profiles</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms.map(platform => {
          const platformKey = platform.name.toLowerCase();
          const profile = profiles[platformKey];
          const isEditing = editingPlatform === platformKey;

          return (
            <div key={platform.name} className="card">
              {isEditing ? (
                <div className="space-y-3">
                  <h3 className="font-semibold text-text-primary">{platform.name}</h3>
                  
                  <div>
                    <label className="text-xs font-medium text-text-primary mb-1 block">Username *</label>
                    <input
                      type="text"
                      className="input-field text-sm"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-text-primary mb-1 block">Profile URL *</label>
                    <input
                      type="url"
                      className="input-field text-sm"
                      value={formData.profileUrl}
                      onChange={(e) => setFormData({...formData, profileUrl: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-text-primary mb-1 block">Problems Solved</label>
                    <input
                      type="number"
                      className="input-field text-sm"
                      value={formData.problemsSolved}
                      onChange={(e) => setFormData({...formData, problemsSolved: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-text-primary mb-1 block">Contest Rating</label>
                    <input
                      type="number"
                      className="input-field text-sm"
                      value={formData.contestRating}
                      onChange={(e) => setFormData({...formData, contestRating: e.target.value})}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => saveProfile(platform.name)}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors disabled:opacity-50"
                    >
                      <Check size={14} />
                      {loading ? '...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingPlatform(null)}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-gray-100 text-text-secondary rounded text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${platform.color}`}>
                    {platform.name}
                  </div>

                  {profile ? (
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-text-primary font-medium">@{profile.username}</p>
                        {profile.profile_url && (
                          <a href={profile.profile_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      {profile.problems_solved > 0 && (
                        <p className="text-xs text-text-secondary">Problems: {profile.problems_solved}</p>
                      )}
                      {profile.contest_rating > 0 && (
                        <p className="text-xs text-text-secondary">Rating: {profile.contest_rating}</p>
                      )}
                      <p className="text-xs text-text-muted">
                        Updated: {new Date(profile.last_updated).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted mb-3">Not linked</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(platform)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-primary rounded hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      <Edit2 size={14} />
                      {profile ? 'Edit' : 'Add'}
                    </button>
                    {profile && (
                      <button
                        onClick={() => removeProfile(platform.name)}
                        className="px-3 py-2 hover:bg-red-50 rounded transition-colors text-red-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
