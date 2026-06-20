import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { UsersAPI, CodingAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// Coding platform keys — stored in CodingProfiles, NOT Student
const CODING_LINK_KEYS = ['leetcode', 'hackerrank', 'skillrack'];
// General link keys — stored in Student collection
const GENERAL_LINK_KEYS = ['github', 'linkedin', 'portfolio'];

export default function StudentProfile() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    careerObjective: '',
    cgpa: '',
    batchYear: '',
    rollNumber: '',
    links: {
      github: '',
      linkedin: '',
      portfolio: '',
      leetcode: '',
      hackerrank: '',
      skillrack: ''
    }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user?.profileId) return;

        // Load student profile (general links only)
        const { data: studentData } = await UsersAPI.getProfile(user.profileId);
        setStudentInfo(studentData);

        // Load coding profile URLs from CodingProfiles collection
        let codingLinks = { leetcode: '', hackerrank: '', skillrack: '' };
        try {
          const { data: codingData } = await CodingAPI.getCodingProfile(user.profileId);
          if (codingData) {
            codingLinks = {
              leetcode: codingData.leetcode?.profile_url || '',
              hackerrank: codingData.hackerrank?.profile_url || '',
              skillrack: codingData.skillrack?.profile_url || ''
            };
          }
        } catch (err) {
          // CodingProfile may not exist yet — that's fine
          console.warn('Could not load coding profile:', err);
        }

        setFormData({
          fullName: studentData.full_name || '',
          phone: studentData.phone || '',
          careerObjective: studentData.career_objective || '',
          cgpa: studentData.cgpa || '',
          batchYear: studentData.batch_year || '',
          rollNumber: studentData.roll_number || '',
          links: {
            github: studentData.links?.github || '',
            linkedin: studentData.links?.linkedin || '',
            portfolio: studentData.links?.portfolio || '',
            ...codingLinks
          }
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async (section) => {
    setLoading(true);
    setMessage('');
    try {
      if (section === 'personal') {
        const payload = {
          full_name: formData.fullName,
          phone: formData.phone,
          career_objective: formData.careerObjective,
        };
        await UsersAPI.updateProfile(user.profileId, payload);
      } else if (section === 'academic') {
        const payload = {
          cgpa: formData.cgpa ? parseFloat(formData.cgpa) : undefined,
        };
        await UsersAPI.updateProfile(user.profileId, payload);
      } else if (section === 'links') {
        // Split: general links → Student API, coding links → Coding Profile API
        const generalLinks = {};
        for (const key of GENERAL_LINK_KEYS) {
          generalLinks[key] = formData.links[key] || '';
        }

        const codingLinks = {};
        for (const key of CODING_LINK_KEYS) {
          codingLinks[key] = formData.links[key] || '';
        }

        // Save general links to Student collection
        await UsersAPI.updateProfile(user.profileId, { links: generalLinks });

        // Save coding links to CodingProfiles collection
        await CodingAPI.updateCodingLinks(user.profileId, codingLinks);
      }

      setMessage('✓ Changes saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLinkChange = (network, value) => {
    setFormData(prev => ({
      ...prev,
      links: { ...prev.links, [network]: value }
    }));
  };

  if (fetching) {
    return <div className="p-8 text-center text-text-secondary">Loading profile...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Profile</h1>
        <p className="text-text-secondary mt-1">Manage your student profile information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section Nav */}
        <div className="card lg:h-fit">
          <nav className="space-y-2">
            {[
              { id: 'personal', label: 'Personal' },
              { id: 'academic', label: 'Academic' },
              { id: 'links', label: 'Links' },
            ].map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-50 text-primary font-medium'
                    : 'text-text-secondary hover:bg-gray-50'
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-text-secondary">Profile Completeness</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary h-full rounded-full" style={{ width: `${studentInfo?.profile_completeness || 0}%` }}></div>
            </div>
            <p className="text-xs text-text-muted mt-2">{studentInfo?.profile_completeness || 0}% Complete</p>
          </div>
        </div>

        {/* Active Section */}
        <div className="lg:col-span-3">
          <div className="card space-y-6">
            {message && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm flex items-center gap-2">
                <CheckCircle size={16} />
                {message}
              </div>
            )}
            
            {activeSection === 'personal' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-text-primary">Personal Information</h2>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Full Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Phone</label>
                  <input
                    type="tel"
                    className="input-field"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Career Objective</label>
                  <textarea
                    className="input-field"
                    rows="4"
                    maxLength="500"
                    value={formData.careerObjective}
                    onChange={(e) => handleChange('careerObjective', e.target.value)}
                  ></textarea>
                  <p className="text-xs text-text-muted mt-1">{formData.careerObjective.length}/500 characters</p>
                </div>
                <button
                  onClick={() => handleSave('personal')}
                  disabled={loading}
                  className="btn-primary disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {activeSection === 'academic' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-text-primary">Academic Information</h2>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Roll Number</label>
                  <input type="text" className="input-field" value={formData.rollNumber} disabled />
                  <p className="text-xs text-text-muted mt-1">Read-only</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">CGPA</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={formData.cgpa}
                    onChange={(e) => handleChange('cgpa', e.target.value)}
                    step="0.1" min="0" max="10" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Batch Year</label>
                  <input type="number" className="input-field" value={formData.batchYear} disabled />
                  <p className="text-xs text-text-muted mt-1">Read-only</p>
                </div>
                <button
                  onClick={() => handleSave('academic')}
                  disabled={loading}
                  className="btn-primary disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {activeSection === 'links' && (
              <div className="space-y-6">
                {/* General Links */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-text-primary">Social Links</h2>
                  <p className="text-sm text-text-muted -mt-2">These are stored in your student profile.</p>
                  {GENERAL_LINK_KEYS.map(link => (
                    <div key={link}>
                      <label className="block text-sm font-medium text-text-primary mb-2 capitalize">{link}</label>
                      <input 
                        type="url" 
                        className="input-field" 
                        placeholder={`https://${link}.com/...`} 
                        value={formData.links[link]}
                        onChange={(e) => handleLinkChange(link, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                {/* Coding Links */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h2 className="text-lg font-semibold text-text-primary">Coding Platform Links</h2>
                  <p className="text-sm text-text-muted -mt-2">These are synced with your coding profile.</p>
                  {CODING_LINK_KEYS.map(link => (
                    <div key={link}>
                      <label className="block text-sm font-medium text-text-primary mb-2 capitalize">{link}</label>
                      <input 
                        type="url" 
                        className="input-field" 
                        placeholder={
                          link === 'skillrack'
                            ? 'https://www.skillrack.com/faces/resume.xhtml?id=...&key=...'
                            : `https://${link}.com/...`
                        } 
                        value={formData.links[link]}
                        onChange={(e) => handleLinkChange(link, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSave('links')}
                  disabled={loading}
                  className="btn-primary disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
