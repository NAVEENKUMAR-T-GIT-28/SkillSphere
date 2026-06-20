import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Eye, Search, X } from 'lucide-react';
import TierBadge from '../../components/TierBadge';
import Drawer from '../../components/Drawer';
import { useToast } from '../../contexts/ToastContext';
import { UsersAPI } from '../../services/api';

export default function HODSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const [filters, setFilters] = useState({
    tier: searchParams.get('tier') || 'All',
    section: searchParams.get('section') || 'All',
    name: searchParams.get('name') || '',
  });

  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.tier !== 'All') params.append('tier', filters.tier);
      if (filters.section !== 'All') params.append('section', filters.section);
      if (filters.name) params.append('name', filters.name);
      
      setSearchParams(params);

      // We still sort by readiness score desc
      params.append('sort_by', 'readiness_score');
      params.append('sort_order', 'desc');

      const { data } = await UsersAPI.searchStudents(params.toString());
      const students = Array.isArray(data) ? data : data.items || [];
      
      // Filter by name locally since the backend might not support it fully 
      // or we just trust the backend. For safety, we can local filter if needed.
      const filteredStudents = filters.name 
        ? students.filter(s => s.full_name.toLowerCase().includes(filters.name.toLowerCase())) 
        : students;

      setResults(filteredStudents.map(s => ({
        id: s._id,
        name: s.full_name,
        roll: s.roll_number,
        section: s.section || 'N/A',
        cgpa: s.cgpa || 0,
        readinessScore: s.readiness_score || 0,
        tier: s.readiness_tier || 'beginner',
      })));
      setSearched(true);
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Failed to perform search');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFilters({ tier: 'All', section: 'All', name: '' });
    setSearched(false);
    setResults([]);
    setSearchParams({});
  };

  const handleExport = () => {
    if (!results.length) return;
    const headers = ['Name', 'Roll Number', 'Section', 'CGPA', 'Readiness Score', 'Tier'];
    const csvContent = [
      headers.join(','),
      ...results.map(s => `"${s.name}","${s.roll}","${s.section}","${s.cgpa}","${s.readinessScore}","${s.tier}"`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'skill_sphere_students.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Results exported to CSV');
  };

  return (
    <div className="space-y-6">
      <div className="mb-5">
        <h1 className="text-xl font-medium text-text-primary mb-1">Search students</h1>
        <p className="text-[13px] text-text-secondary">Find candidates by skills, score, or tier</p>
      </div>

      <div className="bg-gray-50 rounded-md p-3.5 mb-5 border border-border">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-text-secondary">Tier</label>
            <select 
              className="text-[13px] px-2.5 py-1.5 border border-border rounded bg-surface w-32"
              value={filters.tier}
              onChange={(e) => setFilters({...filters, tier: e.target.value})}
            >
              <option value="All">All tiers</option>
              <option value="industry_ready">Industry Ready</option>
              <option value="placement_ready">Placement Ready</option>
              <option value="developing">Developing</option>
              <option value="beginner">Beginner</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-text-secondary">Section</label>
            <select 
              className="text-[13px] px-2.5 py-1.5 border border-border rounded bg-surface w-24"
              value={filters.section}
              onChange={(e) => setFilters({...filters, section: e.target.value})}
            >
              <option value="All">All</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-text-secondary">Name</label>
            <input 
              type="text" 
              placeholder="Search name..." 
              className="text-[13px] px-2.5 py-1.5 border border-border rounded bg-surface w-40"
              value={filters.name}
              onChange={(e) => setFilters({...filters, name: e.target.value})}
              onKeyDown={(e) => e.key === 'Enter' && fetchResults()}
            />
          </div>

          <button onClick={fetchResults} disabled={loading} className="px-3 py-1.5 bg-primary text-white text-[13px] font-medium rounded hover:bg-blue-700 flex items-center gap-1">
            <Search size={14} />
            {loading ? 'Searching' : 'Search'}
          </button>
          <button onClick={handleClear} className="px-3 py-1.5 border border-border text-text-secondary text-[13px] font-medium rounded hover:bg-gray-100 flex items-center gap-1">
            <X size={14} />
            Clear
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-2.5">
        <span className="text-[13px] text-text-secondary">
          {searched ? `${results.length} students match` : 'Enter criteria to search'}
        </span>
        {searched && results.length > 0 && (
          <button onClick={handleExport} className="px-2.5 py-1.5 border border-border text-text-secondary text-[12px] font-medium rounded hover:bg-gray-50 flex items-center gap-1 bg-surface">
            <Download size={14} /> Export CSV
          </button>
        )}
      </div>

      <div className="border border-border rounded-lg bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-gray-50/50">
                <th className="text-left text-[12px] font-medium text-text-secondary py-2 px-3">Name</th>
                <th className="text-left text-[12px] font-medium text-text-secondary py-2 px-3">Roll</th>
                <th className="text-left text-[12px] font-medium text-text-secondary py-2 px-3">Section</th>
                <th className="text-left text-[12px] font-medium text-text-secondary py-2 px-3">CGPA</th>
                <th className="text-left text-[12px] font-medium text-text-secondary py-2 px-3">Score</th>
                <th className="text-left text-[12px] font-medium text-text-secondary py-2 px-3">Tier</th>
                <th className="text-left py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {!searched ? (
                <tr><td colSpan="7" className="py-8 text-center text-[13px] text-text-secondary">Run a search to display students.</td></tr>
              ) : loading ? (
                <tr><td colSpan="7" className="py-8 text-center text-[13px] text-text-secondary">Searching...</td></tr>
              ) : results.length === 0 ? (
                <tr><td colSpan="7" className="py-8 text-center text-[13px] text-text-secondary">No students matched the criteria.</td></tr>
              ) : (
                results.map(student => (
                  <tr key={student.id} className="border-b border-border hover:bg-gray-50">
                    <td className="py-2.5 px-3 text-[13px] font-medium text-text-primary">{student.name}</td>
                    <td className="py-2.5 px-3 text-[13px] text-text-secondary">{student.roll}</td>
                    <td className="py-2.5 px-3 text-[13px] text-text-secondary">{student.section}</td>
                    <td className="py-2.5 px-3 text-[13px] font-medium text-text-primary">{student.cgpa}</td>
                    <td className="py-2.5 px-3 text-[13px]"><strong className="text-blue-600">{student.readinessScore}</strong></td>
                    <td className="py-2.5 px-3">
                      <TierBadge tier={student.tier} />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button 
                        onClick={() => setSelectedStudent(student)} 
                        className="p-1 text-text-secondary hover:text-primary hover:bg-blue-50 rounded transition-colors inline-flex"
                        title="View profile"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer isOpen={!!selectedStudent} onClose={() => setSelectedStudent(null)} title="Student Details">
        {selectedStudent && (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-text-primary text-lg">{selectedStudent.name}</h3>
              <p className="text-[13px] text-text-secondary">{selectedStudent.roll} • Section {selectedStudent.section}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 border border-border rounded-md">
                <p className="text-[12px] text-text-secondary mb-1">CGPA</p>
                <p className="text-lg font-medium text-text-primary">{selectedStudent.cgpa}</p>
              </div>
              <div className="p-3 bg-gray-50 border border-border rounded-md">
                <p className="text-[12px] text-text-secondary mb-1">Score</p>
                <p className="text-lg font-medium text-blue-600">{selectedStudent.readinessScore}</p>
              </div>
            </div>

            <div>
              <h4 className="text-[13px] font-medium text-text-primary mb-2">Readiness Tier</h4>
              <TierBadge tier={selectedStudent.tier} />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
