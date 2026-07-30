import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  UserRound,
  CheckCircle2,
  Award,
  Briefcase,
  Code2,
  FileText
} from 'lucide-react';
import TierBadge from '../../components/TierBadge';
import Drawer from '../../components/Drawer';
import { useToast } from '../../contexts/ToastContext';
import { UsersAPI } from '../../services/api';

const QUICK_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Placement Ready', params: { tier: 'placement_ready' } },
  { label: 'High CGPA (8.0+)', params: { cgpa_min: '8.0' } },
  { label: 'Python Devs', params: { skills: 'Python' } },
  { label: 'Java Devs', params: { skills: 'Java' } },
  { label: 'Resume Uploaded', params: { has_resume: 'true' } },
];

const CODING_PLATFORMS = ['LeetCode', 'HackerRank', 'SkillRack', 'GitHub'];
const DEPARTMENTS = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIDS', 'AIML'];

export default function HODSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const [filters, setFilters] = useState({
    name: searchParams.get('name') || '',
    roll_number: searchParams.get('roll_number') || '',
    department: searchParams.get('department') || '',
    section: searchParams.get('section') || '',
    year: searchParams.get('year') || '',
    cgpa_min: searchParams.get('cgpa_min') || '',
    cgpa_max: searchParams.get('cgpa_max') || '',
    tier: searchParams.get('tier') || '',
    skills: searchParams.get('skills') || '',
    projects_min: searchParams.get('projects_min') || '',
    internships_min: searchParams.get('internships_min') || '',
    certifications_min: searchParams.get('certifications_min') || '',
    coding_platforms: searchParams.get('coding_platforms') ? searchParams.get('coding_platforms').split(',') : [],
    has_resume: searchParams.get('has_resume') === 'true',
  });

  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const limit = 12;

  const [showFilters, setShowFilters] = useState(false);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [meta, setMeta] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchResults = async (currentPage = page, customFilters = filters) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      Object.entries(customFilters).forEach(([key, value]) => {
        if (value && (typeof value === 'string' || typeof value === 'number')) {
          params.append(key, value);
        } else if (Array.isArray(value) && value.length > 0) {
          params.append(key, value.join(','));
        } else if (typeof value === 'boolean' && value) {
          params.append(key, 'true');
        }
      });

      params.append('page', currentPage);
      params.append('limit', limit);
      params.append('sort_by', 'readiness_score');
      params.append('sort_order', 'desc');

      setSearchParams(params);

      const response = await UsersAPI.searchStudentsV2(params.toString());
      const data = response.data;
      
      const students = Array.isArray(data) ? data : data.students || data.items || [];
      const metadata = data.meta || { total: students.length, page: currentPage, totalPages: 1 };
      
      setResults(students);
      setMeta(metadata);
      setSearched(true);
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Failed to perform search');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchResults(1, filters);
    setShowFilters(false);
  };

  const handleClear = () => {
    const emptyFilters = {
      name: '', roll_number: '', department: '', section: '', year: '',
      cgpa_min: '', cgpa_max: '', tier: '', skills: '', projects_min: '', internships_min: '',
      certifications_min: '', coding_platforms: [], has_resume: false
    };
    setFilters(emptyFilters);
    setPage(1);
    setSearched(false);
    setResults([]);
    setMeta(null);
    setSearchParams({});
  };

  const handleQuickFilter = (quickFilter) => {
    if (quickFilter.value === 'all') {
      handleClear();
      fetchResults(1, { tier: '' });
      return;
    }
    const emptyFilters = {
      name: '', roll_number: '', department: '', section: '', year: '',
      cgpa_min: '', cgpa_max: '', tier: '', skills: '', projects_min: '', internships_min: '',
      certifications_min: '', coding_platforms: [], has_resume: false
    };
    const newFilters = { ...emptyFilters, ...quickFilter.params };
    setFilters(newFilters);
    setPage(1);
    fetchResults(1, newFilters);
  };

  const handleExport = () => {
    if (!results.length) return;
    const headers = ['Name', 'Roll Number', 'Department', 'Section', 'CGPA', 'Score', 'Tier'];
    const csvContent = [
      headers.join(','),
      ...results.map(s => `"${s.identity?.full_name || ''}","${s.identity?.roll_number || ''}","${s.class?.department || ''}","${s.class?.section || ''}","${s.academic?.cgpa || 0}","${s.mentor?.readiness_score || 0}","${s.mentor?.readiness_tier || ''}"`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'students_search_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Results exported to CSV');
  };

  const handlePlatformToggle = (platform) => {
    setFilters(prev => ({
      ...prev,
      coding_platforms: prev.coding_platforms.includes(platform)
        ? prev.coding_platforms.filter(p => p !== platform)
        : [...prev.coding_platforms, platform]
    }));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Toolbar */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by student name or roll number..."
              value={filters.name || filters.roll_number}
              onChange={(e) => {
                const val = e.target.value;
                setFilters({ ...filters, name: val, roll_number: val });
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
                showFilters 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter size={16} />
              Filters
              {Object.values(filters).filter(v => v !== '' && v !== false && (!Array.isArray(v) || v.length > 0)).length > 0 && (
                <span className="flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded-full text-[10px]">
                  {Object.values(filters).filter(v => v !== '' && v !== false && (!Array.isArray(v) || v.length > 0)).length}
                </span>
              )}
            </button>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-70"
            >
              <Search size={16} />
              Search
            </button>
          </div>
        </div>

        {/* Expandable Filters Panel */}
        {showFilters && (
          <div className="pt-4 mt-2 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Academic */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Academic</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[13px] font-medium text-slate-700">Department</label>
                    <select
                      value={filters.department}
                      onChange={(e) => setFilters({...filters, department: e.target.value})}
                      className="mt-1 w-full p-2 border border-slate-200 rounded-md text-sm bg-slate-50"
                    >
                      <option value="">All</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[13px] font-medium text-slate-700">Year</label>
                      <input type="number" placeholder="YYYY" value={filters.year} onChange={e => setFilters({...filters, year: e.target.value})} className="mt-1 w-full p-2 border border-slate-200 rounded-md text-sm bg-slate-50" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[13px] font-medium text-slate-700">Min CGPA</label>
                      <input type="number" step="0.1" max="10" value={filters.cgpa_min} onChange={e => setFilters({...filters, cgpa_min: e.target.value})} className="mt-1 w-full p-2 border border-slate-200 rounded-md text-sm bg-slate-50" />
                    </div>
                    <div>
                      <label className="text-[13px] font-medium text-slate-700">Max CGPA</label>
                      <input type="number" step="0.1" max="10" value={filters.cgpa_max} onChange={e => setFilters({...filters, cgpa_max: e.target.value})} className="mt-1 w-full p-2 border border-slate-200 rounded-md text-sm bg-slate-50" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills & Tier */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Evaluation</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[13px] font-medium text-slate-700">Readiness Tier</label>
                    <select
                      value={filters.tier}
                      onChange={(e) => setFilters({...filters, tier: e.target.value})}
                      className="mt-1 w-full p-2 border border-slate-200 rounded-md text-sm bg-slate-50"
                    >
                      <option value="">All Tiers</option>
                      <option value="industry_ready">Industry Ready</option>
                      <option value="placement_ready">Placement Ready</option>
                      <option value="developing">Developing</option>
                      <option value="beginner">Beginner</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-slate-700">Specific Skills (comma separated)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. React, Node.js" 
                      value={filters.skills} 
                      onChange={e => setFilters({...filters, skills: e.target.value})} 
                      className="mt-1 w-full p-2 border border-slate-200 rounded-md text-sm bg-slate-50" 
                    />
                  </div>
                </div>
              </div>

              {/* Portfolio */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Portfolio Counts</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[13px] font-medium text-slate-700">Projects &ge;</label>
                      <input type="number" min="0" value={filters.projects_min} onChange={e => setFilters({...filters, projects_min: e.target.value})} className="mt-1 w-full p-2 border border-slate-200 rounded-md text-sm bg-slate-50" />
                    </div>
                    <div>
                      <label className="text-[13px] font-medium text-slate-700">Internships &ge;</label>
                      <input type="number" min="0" value={filters.internships_min} onChange={e => setFilters({...filters, internships_min: e.target.value})} className="mt-1 w-full p-2 border border-slate-200 rounded-md text-sm bg-slate-50" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[13px] font-medium text-slate-700">Certificates &ge;</label>
                      <input type="number" min="0" value={filters.certifications_min} onChange={e => setFilters({...filters, certifications_min: e.target.value})} className="mt-1 w-full p-2 border border-slate-200 rounded-md text-sm bg-slate-50" />
                    </div>
                    <div className="flex flex-col justify-end">
                      <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-md bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={filters.has_resume}
                          onChange={e => setFilters({...filters, has_resume: e.target.checked})}
                          className="rounded text-blue-600 focus:ring-blue-500" 
                        />
                        <span className="text-[13px] font-medium text-slate-700">Has Resume</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coding Platforms */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Coding Platforms</h3>
                <div className="flex flex-wrap gap-2">
                  {CODING_PLATFORMS.map(platform => (
                    <button
                      key={platform}
                      onClick={() => handlePlatformToggle(platform)}
                      className={`px-3 py-1.5 text-[13px] font-medium rounded-full border transition-colors ${
                        filters.coding_platforms.includes(platform)
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

            </div>
            
            {/* Filter Panel Actions */}
            <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
              <button onClick={handleClear} className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {QUICK_FILTERS.map((qf, i) => (
          <button
            key={i}
            onClick={() => handleQuickFilter(qf)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[13px] font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
          >
            {qf.label}
          </button>
        ))}
      </div>

      {/* Search Header / Results Meta */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-600">
          {loading ? 'Searching...' : searched ? `Found ${meta?.total || 0} students` : 'Enter criteria and search'}
        </h2>
        {searched && results.length > 0 && (
          <button onClick={handleExport} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
            <Download size={16} />
            Export CSV
          </button>
        )}
      </div>

      {/* Results Grid */}
      {searched && !loading && results.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="text-slate-400" size={24} />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">No students found</h3>
          <p className="text-slate-500">Try adjusting your filters to broaden your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {results.map((student) => (
            <div key={student._id || student.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg shadow-inner">
                    {student.identity?.full_name ? student.identity.full_name.charAt(0) : <UserRound size={20} />}
                  </div>
                  <TierBadge tier={student.mentor?.readiness_tier || 'beginner'} />
                </div>
                
                <h3 className="font-semibold text-slate-900 text-lg leading-tight mb-1 truncate" title={student.identity?.full_name}>
                  {student.identity?.full_name || 'Unnamed Student'}
                </h3>
                <p className="text-sm text-slate-500 font-medium mb-4">
                  {student.identity?.roll_number || 'No Roll'} &bull; {student.class?.department || 'No Dept'} {student.class?.section ? `(${student.class.section})` : ''}
                </p>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-0.5">CGPA</p>
                    <p className="font-bold text-slate-900">{student.academic?.cgpa || 'N/A'}</p>
                  </div>
                  <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                    <p className="text-[11px] text-blue-600 font-medium uppercase tracking-wider mb-0.5">Score</p>
                    <p className="font-bold text-blue-700">{student.mentor?.readiness_score || 0}</p>
                  </div>
                </div>

                {/* Badges / Stats */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="flex items-center gap-1 text-[12px] font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md" title="Projects">
                    <Code2 size={14} className="text-slate-400" /> {student.portfolio?.project_count || 0}
                  </div>
                  <div className="flex items-center gap-1 text-[12px] font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md" title="Internships">
                    <Briefcase size={14} className="text-slate-400" /> {student.portfolio?.internship_count || 0}
                  </div>
                  <div className="flex items-center gap-1 text-[12px] font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md" title="Certificates">
                    <Award size={14} className="text-slate-400" /> {student.verification?.verified_certifications?.length || 0}
                  </div>
                </div>

                <div className="flex gap-2">
                  {student.ats?.has_resume && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                      <FileText size={12} /> Resume
                    </span>
                  )}
                  {student.coding?.platforms?.slice(0,2).map(platform => (
                    <span key={platform} className="inline-flex items-center text-[11px] font-medium text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full truncate">
                      {platform}
                    </span>
                  ))}
                  {student.coding?.platforms?.length > 2 && (
                    <span className="inline-flex items-center text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                      +{student.coding.platforms.length - 2}
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 p-3 bg-slate-50 group-hover:bg-blue-50 transition-colors">
                <button 
                  onClick={() => setSelectedStudent(student)}
                  className="w-full flex items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  <Eye size={16} /> View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {searched && meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-6 mt-8">
          <p className="text-sm text-slate-500">
            Showing <span className="font-medium text-slate-900">{((page - 1) * limit) + 1}</span> to <span className="font-medium text-slate-900">{Math.min(page * limit, meta.total)}</span> of <span className="font-medium text-slate-900">{meta.total}</span> results
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const newPage = Math.max(1, page - 1);
                setPage(newPage);
                fetchResults(newPage);
              }}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => {
                const newPage = Math.min(meta.totalPages, page + 1);
                setPage(newPage);
                fetchResults(newPage);
              }}
              disabled={page === meta.totalPages}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      <Drawer isOpen={!!selectedStudent} onClose={() => setSelectedStudent(null)} title="Student Details">
        {selectedStudent && (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-slate-900 text-lg">{selectedStudent.identity?.full_name}</h3>
              <p className="text-[13px] text-slate-500">{selectedStudent.identity?.roll_number || 'N/A'} &bull; Section {selectedStudent.class?.section || 'N/A'}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[12px] text-slate-500 mb-1 font-medium">CGPA</p>
                <p className="text-xl font-bold text-slate-900">{selectedStudent.academic?.cgpa}</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-[12px] text-blue-600 mb-1 font-medium">Readiness Score</p>
                <p className="text-xl font-bold text-blue-700">{selectedStudent.mentor?.readiness_score}</p>
              </div>
            </div>

            <div>
              <h4 className="text-[13px] font-medium text-slate-900 mb-3 uppercase tracking-wider">Readiness Tier</h4>
              <TierBadge tier={selectedStudent.mentor?.readiness_tier} />
            </div>

            {selectedStudent.verification?.verified_skills?.length > 0 && (
              <div>
                <h4 className="text-[13px] font-medium text-slate-900 mb-3 uppercase tracking-wider">Verified Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedStudent.verification.verified_skills.map(s => (
                    <span key={s} className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200 flex items-center gap-1">
                      <CheckCircle2 size={12} /> {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
