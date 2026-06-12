import { Plus, ExternalLink, Trash2, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentProjects() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    techStack: '',
    githubUrl: '',
    liveUrl: '',
    complexity: 'intermediate',
    teamMembers: '',
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (!user?.profileId) return;
        const data = await api.get(`/students/${user.profileId}/projects`);
        setProjects(data);
      } catch (err) {
        console.error('Failed to load projects:', err);
      } finally {
        setFetching(false);
      }
    };
    fetchProjects();
  }, [user]);

  const addProject = async () => {
    if (!formData.title || !formData.githubUrl) {
      alert('Title and GitHub URL are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        tech_stack: formData.techStack.split(',').map(t => t.trim()).filter(t => t),
        github_url: formData.githubUrl,
        live_demo_url: formData.liveUrl,
        complexity_tier: formData.complexity,
        // Optional team members logic not fully mapped, assuming comma separated student IDs for now,
        // or leaving it out if we just want single-owner projects.
        // team_member_ids: formData.teamMembers ? formData.teamMembers.split(',').map(m => m.trim()) : [],
      };

      const newProject = await api.post(`/students/${user.profileId}/projects`, payload);
      setProjects([newProject, ...projects]);
      
      setFormData({
        title: '',
        description: '',
        techStack: '',
        githubUrl: '',
        liveUrl: '',
        complexity: 'intermediate',
        teamMembers: '',
      });
      setShowModal(false);
    } catch (err) {
      alert(err.message || 'Failed to add project');
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId) => {
    try {
      await api.delete(`/students/${user.profileId}/projects/${projectId}`);
      setProjects(projects.filter(p => p._id !== projectId));
    } catch (err) {
      alert(err.message || 'Failed to delete project');
    }
  };

  const toggleFeatured = async (projectId, currentFeatured) => {
    try {
      await api.patch(`/students/${user.profileId}/projects/${projectId}`, { is_featured: !currentFeatured });
      setProjects(projects.map(p =>
        p._id === projectId ? {...p, is_featured: !currentFeatured} : p
      ));
    } catch (err) {
      alert(err.message || 'Failed to update feature status');
    }
  };

  const complexityColors = {
    basic: 'bg-green-100 text-green-700',
    intermediate: 'bg-blue-100 text-blue-700',
    advanced: 'bg-purple-100 text-purple-700',
  };

  if (fetching) {
    return <div className="p-8 text-center text-text-secondary">Loading projects...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Projects</h1>
          <p className="text-text-secondary mt-1">Showcase your project work</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={18} className="inline mr-2" />
          Add Project
        </button>
      </div>

      {/* Add Project Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Project" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Project Title *</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g., E-commerce Platform"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Description (max 1000 chars)</label>
            <textarea
              className="input-field"
              rows="4"
              maxLength="1000"
              placeholder="Describe your project..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
            <p className="text-xs text-text-muted mt-1">{formData.description.length}/1000</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Tech Stack (comma-separated)</label>
              <input
                type="text"
                className="input-field"
                placeholder="React, Node.js, MongoDB"
                value={formData.techStack}
                onChange={(e) => setFormData({...formData, techStack: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Complexity</label>
              <select
                className="input-field"
                value={formData.complexity}
                onChange={(e) => setFormData({...formData, complexity: e.target.value})}
              >
                <option value="basic">Basic</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">GitHub URL *</label>
            <input
              type="url"
              className="input-field"
              placeholder="https://github.com/..."
              value={formData.githubUrl}
              onChange={(e) => setFormData({...formData, githubUrl: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Live Demo URL (optional)</label>
            <input
              type="url"
              className="input-field"
              placeholder="https://..."
              value={formData.liveUrl}
              onChange={(e) => setFormData({...formData, liveUrl: e.target.value})}
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
              onClick={addProject}
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Project'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Projects List */}
      {projects.length === 0 ? (
        <EmptyState
          message="No projects yet"
          cta="Add your first project"
          onCtaClick={() => setShowModal(true)}
        />
      ) : (
        <div className="space-y-4">
          {projects.map(project => (
            <div key={project._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-text-primary">{project.title}</h3>
                    <span className={`badge text-xs capitalize ${complexityColors[project.complexity_tier]}`}>
                      {project.complexity_tier}
                    </span>
                    {project.is_featured && (
                      <span className="badge bg-yellow-100 text-yellow-700 text-xs">Featured</span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary line-clamp-2">{project.description}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleFeatured(project._id, project.is_featured)}
                    className={`p-2 rounded-md transition-colors ${
                      project.is_featured
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'hover:bg-gray-100 text-text-secondary'
                    }`}
                  >
                    <Star size={16} fill={project.is_featured ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => deleteProject(project._id)}
                    className="p-2 hover:bg-red-50 rounded-md transition-colors text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {project.tech_stack && project.tech_stack.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {project.tech_stack.map((tech, idx) => (
                    <span key={idx} className="badge bg-gray-100 text-text-secondary text-xs">
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-border">
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-text-primary rounded-md hover:bg-gray-200 transition-colors text-sm font-medium flex-1"
                >
                  <ExternalLink size={14} />
                  GitHub
                </a>
                {project.live_demo_url && (
                  <a
                    href={project.live_demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-primary rounded-md hover:bg-blue-100 transition-colors text-sm font-medium flex-1"
                  >
                    <ExternalLink size={14} />
                    Live Demo
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
