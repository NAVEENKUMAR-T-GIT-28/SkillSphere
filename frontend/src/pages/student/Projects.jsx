import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, MoreVertical, Trash2, Plus, ExternalLink, Edit2, Star, Code } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import StudentSearchInput from '../../components/StudentSearchInput';
import { useToast } from '../../contexts/ToastContext';
import { ProjectsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import defaultProjectImg from '../../assets/default-project.png';

function ProjectCard({ project, onEdit, onDelete, onToggleFeature }) {
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

  const getVerificationBadge = (status) => {
    switch (status) {
      case 'reviewed': return 'bg-green-50 text-green-700 border-green-200';
      case 'pending': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getCompletionBadge = (status) => {
    switch (status) {
      case 'completed': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'in_progress': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5">
      <div className="w-full md:w-48 h-32 shrink-0 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center relative group">
        <img 
          src={project.thumbnail_url || defaultProjectImg} 
          alt={project.title}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.onerror = null; e.target.src = defaultProjectImg; e.target.className = "w-full h-full object-cover opacity-50 grayscale"; }}
        />
        {project.is_featured && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 p-1 rounded-full shadow-sm" title="Featured Project">
            <Star size={14} fill="currentColor" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-slate-900 text-lg truncate">{project.title}</h3>
            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getVerificationBadge(project.status)}`}>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getCompletionBadge(project.completion_status)}`}>
              {project.completion_status === 'in_progress' ? 'In Progress' : 'Completed'}
            </span>
            {project.is_featured && (
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full border bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1">
                Featured
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 line-clamp-2 mt-1 mb-3">{project.description}</p>
        </div>

        {project.tech_stack && project.tech_stack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {project.tech_stack.map((tech, idx) => (
              <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[11px] font-medium border border-slate-200">
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex md:flex-col justify-between items-end gap-3 shrink-0">
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <MoreVertical size={20} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-10">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onToggleFeature(project._id, project.is_featured);
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Star size={16} className={project.is_featured ? "text-yellow-500" : ""} fill={project.is_featured ? "currentColor" : "none"} /> 
                {project.is_featured ? 'Remove Feature' : 'Mark Featured'}
              </button>
              
              {project.status !== 'reviewed' && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(project);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Edit2 size={16} /> Edit
                </button>
              )}

              {project.status !== 'reviewed' && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(project._id);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 size={16} /> Delete
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title="GitHub Repository"
            >
              <Code size={18} />
            </a>
          )}
          {project.live_demo_url && (
            <a
              href={project.live_demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              title="Live Demo"
            >
              <ExternalLink size={18} />
            </a>
          )}
        </div>
      </div>
      
      {project.status === 'rejected' && (project.rejection_reason) && (
        <div className="mt-3 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-100 w-full col-span-full">
          <strong>Reason:</strong> {project.rejection_reason}
        </div>
      )}
    </div>
  );
}

function ProjectsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 bg-slate-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-64"></div>
        </div>
        <div className="h-10 bg-slate-200 rounded-xl w-32"></div>
      </div>
      
      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
        <div className="flex gap-4">
          <div className="h-6 bg-slate-200 rounded w-16"></div>
          <div className="h-6 bg-slate-200 rounded w-24"></div>
          <div className="h-6 bg-slate-200 rounded w-24"></div>
          <div className="h-6 bg-slate-200 rounded w-20"></div>
        </div>
        <div className="h-10 bg-slate-200 rounded-lg w-64"></div>
      </div>

      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="h-40 bg-slate-100 rounded-xl border border-slate-200 flex gap-4 p-5">
            <div className="w-48 h-full bg-slate-200 rounded-lg"></div>
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-slate-200 rounded w-1/3"></div>
              <div className="h-4 bg-slate-200 rounded w-full"></div>
              <div className="h-4 bg-slate-200 rounded w-2/3"></div>
            </div>
          </div>
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
  description: '',
  techStack: '',
  githubUrl: '',
  liveUrl: '',
  thumbnailUrl: '',
  complexity: 'intermediate',
  completionStatus: 'completed',
  startDate: '',
  endDate: '',
  teamMembers: [],
  isFeatured: false,
};

export default function StudentProjects() {
  const { user } = useAuth();
  const [filterTab, setFilterTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState([]);
  const [fetching, setFetching] = useState(true);
  const toast = useToast();
  
  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'completed', label: 'Completed' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'featured', label: 'Featured' },
  ];

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (!user?.profileId) return;
        const { data } = await ProjectsAPI.getProjects(user.profileId);
        setProjects(data);
      } catch (err) {
        toast.error('Failed to load projects');
      } finally {
        setFetching(false);
      }
    };
    fetchProjects();
  }, [user]);

  const handleSubmit = async () => {
    if (!formData.title || !formData.githubUrl) {
      toast.error('Title and GitHub URL are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        tech_stack: formData.techStack ? formData.techStack.split(',').map(t => t.trim()).filter(t => t) : [],
        github_url: formData.githubUrl,
        live_demo_url: formData.liveUrl,
        thumbnail_url: formData.thumbnailUrl,
        complexity_tier: formData.complexity,
        completion_status: formData.completionStatus,
        start_date: formData.startDate || null,
        end_date: formData.endDate || null,
        team_member_ids: formData.teamMembers.map(m => m._id),
        is_featured: formData.isFeatured,
      };

      if (editingId) {
        const { data: updatedProject } = await ProjectsAPI.updateProject(user.profileId, editingId, payload);
        setProjects(projects.map(p => p._id === editingId ? updatedProject : p));
        toast.success('Project updated successfully');
      } else {
        const { data: newProject } = await ProjectsAPI.addProject(user.profileId, payload);
        setProjects([newProject, ...projects]);
        toast.success('Project added successfully');
      }
      
      setFormData(initialFormState);
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      toast.error(err.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (project) => {
    setFormData({
      title: project.title,
      description: project.description || '',
      techStack: project.tech_stack ? project.tech_stack.join(', ') : '',
      githubUrl: project.github_url || '',
      liveUrl: project.live_demo_url || '',
      thumbnailUrl: project.thumbnail_url || '',
      complexity: project.complexity_tier || 'intermediate',
      completionStatus: project.completion_status || 'completed',
      startDate: project.start_date ? project.start_date.split('T')[0] : '',
      endDate: project.end_date ? project.end_date.split('T')[0] : '',
      teamMembers: [], 
      isFeatured: project.is_featured || false,
    });
    setEditingId(project._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProject = async (projectId) => {
    try {
      await ProjectsAPI.deleteProject(user.profileId, projectId);
      setProjects(projects.filter(p => p._id !== projectId));
      toast.success('Project deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete project');
    }
  };

  const toggleFeature = async (projectId, currentFeatured) => {
    try {
      await ProjectsAPI.updateFeature(user.profileId, projectId, !currentFeatured);
      setProjects(projects.map(p =>
        p._id === projectId ? {...p, is_featured: !currentFeatured} : p
      ));
    } catch (err) {
      toast.error(err.message || 'Failed to update feature status');
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      let matchesTab = false;
      if (filterTab === 'all') matchesTab = true;
      else if (filterTab === 'completed') matchesTab = p.completion_status === 'completed';
      else if (filterTab === 'in_progress') matchesTab = p.completion_status === 'in_progress';
      else if (filterTab === 'featured') matchesTab = p.is_featured === true;

      const projectName = (p.title || '').toLowerCase();
      const matchesSearch = projectName.includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [projects, filterTab, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: projects.length,
      completed: projects.filter(p => p.completion_status === 'completed').length,
      inProgress: projects.filter(p => p.completion_status === 'in_progress').length,
      featured: projects.filter(p => p.is_featured === true).length,
    };
  }, [projects]);

  if (fetching) {
    return <ProjectsSkeleton />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">

          {/* Left */}
          <div className="flex items-center gap-8">

              {filterTabs.map(tab => (
                  <button
                      key={tab.id}
                      onClick={() => setFilterTab(tab.id)}
                      className={`relative pb-3 text-sm font-medium transition-colors ${
                          filterTab === tab.id
                              ? "text-blue-600"
                              : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                      {tab.label}
                    
                      {filterTab === tab.id && (
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
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 whitespace-nowrap"
              >
                  <Plus size={17} />
                  {showForm ? "Cancel" : "Add Project"}
              </button>
                
          </div>
                
      </div>
                
      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">
              {editingId ? 'Edit Project' : 'Add New Project'}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="proj-title" className="block text-sm font-semibold text-slate-700 mb-1.5">Project Title *</label>
              <input
                id="proj-title"
                type="text"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                placeholder="e.g., E-commerce Platform"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div>
              <label htmlFor="proj-tech" className="block text-sm font-semibold text-slate-700 mb-1.5">Tech Stack (comma separated)</label>
              <input
                id="proj-tech"
                type="text"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                placeholder="React, Node.js, MongoDB"
                value={formData.techStack}
                onChange={(e) => setFormData({...formData, techStack: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label htmlFor="proj-desc" className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
            <textarea
              id="proj-desc"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all min-h-[100px]"
              rows="3"
              maxLength="1000"
              placeholder="Describe your project..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{formData.description.length}/1000 chars</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="proj-github" className="block text-sm font-semibold text-slate-700 mb-1.5">GitHub URL *</label>
              <input
                id="proj-github"
                type="url"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                placeholder="https://github.com/..."
                value={formData.githubUrl}
                onChange={(e) => setFormData({...formData, githubUrl: e.target.value})}
              />
            </div>
            <div>
              <label htmlFor="proj-live" className="block text-sm font-semibold text-slate-700 mb-1.5">Live Demo URL (Optional)</label>
              <input
                id="proj-live"
                type="url"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                placeholder="https://..."
                value={formData.liveUrl}
                onChange={(e) => setFormData({...formData, liveUrl: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="proj-thumb" className="block text-sm font-semibold text-slate-700 mb-1.5">Thumbnail URL (Optional)</label>
              <input
                id="proj-thumb"
                type="url"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                placeholder="https://example.com/image.png"
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData({...formData, thumbnailUrl: e.target.value})}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="proj-status" className="block text-sm font-semibold text-slate-700 mb-1.5">Completion Status</label>
                <select
                  id="proj-status"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  value={formData.completionStatus}
                  onChange={(e) => setFormData({...formData, completionStatus: e.target.value})}
                >
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                </select>
              </div>
              <div className="flex items-end pb-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
                  />
                  <span className="text-sm font-semibold text-slate-700">Featured</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="proj-start" className="block text-sm font-semibold text-slate-700 mb-1.5">Start Date (Optional)</label>
              <input
                id="proj-start"
                type="date"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
            <div>
              <label htmlFor="proj-end" className="block text-sm font-semibold text-slate-700 mb-1.5">End Date (Optional)</label>
              <input
                id="proj-end"
                type="date"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
          </div>
          
          {!editingId && (
            <div>
              <label htmlFor="proj-team" className="block text-sm font-semibold text-slate-700 mb-1.5">Team Members (Optional)</label>
              <div className="relative z-10">
                <StudentSearchInput
                  selected={formData.teamMembers}
                  onChange={(val) => setFormData({...formData, teamMembers: val})}
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Project' : 'Add Project')}
            </button>
          </div>
        </div>
      )}

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          message={searchQuery ? "No projects match your search" : "No projects added yet."}
          cta={searchQuery ? "Clear Search" : "Add your first project"}
          onCtaClick={() => searchQuery ? setSearchQuery('') : setShowForm(true)}
        />
      ) : (
        <div className="space-y-4 flex-1">
          {filteredProjects.map(project => (
            <ProjectCard key={project._id} project={project} onEdit={handleEdit} onDelete={deleteProject} onToggleFeature={toggleFeature} />
          ))}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
        {[
          { label: 'Total Projects', value: stats.total, color: 'text-slate-900' },
          { label: 'Completed', value: stats.completed, color: 'text-slate-900' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-slate-900' },
          { label: 'Featured', value: stats.featured, color: 'text-slate-900' },
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
