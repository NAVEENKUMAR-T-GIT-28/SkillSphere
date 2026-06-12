import { useState } from 'react';
import { Download, Eye } from 'lucide-react';
import TierBadge from '../../components/TierBadge';
import api from '../../services/api';

export default function HODSearch() {
  const [filters, setFilters] = useState({
    cgpaMin: 6.0,
    cgpaMax: 10,
    batchYears: [2026],
    sections: [],
    tiers: [],
  });

  const [sortBy, setSortBy] = useState('readiness_score');
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query string based on filters
      const params = new URLSearchParams();
      if (filters.cgpaMin) params.append('cgpa_min', filters.cgpaMin);
      if (filters.cgpaMax) params.append('cgpa_max', filters.cgpaMax);
      
      // In a real app we might pass arrays or multiple params. The backend might just accept a single value or comma-separated.
      // The backend expects batch_year, section, tier as single values, or we can send the first one selected, or loop them.
      // Looking at search.js: if (batch_year) filter.batch_year = parseInt(batch_year); - it expects single.
      // For this prototype, if multiple are selected, we can just pass the first one, or modify the backend.
      if (filters.batchYears.length > 0) params.append('batch_year', filters.batchYears.join(','));
      if (filters.sections.length > 0) params.append('section', filters.sections.join(','));
      if (filters.tiers.length > 0) params.append('tier', filters.tiers.join(','));

      params.append('sort_by', sortBy === 'name' ? 'full_name' : (sortBy === 'cgpa' ? 'cgpa' : 'readiness_score'));
      params.append('sort_order', 'desc');

      const { data } = await api.get(`/search/students?${params.toString()}`);
      
      const students = Array.isArray(data) ? data : data.data || data.items || [];
      
      setResults(students.map(s => ({
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
      setError(err.message || 'Failed to perform search');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchResults();
  };

  const handleClear = () => {
    setFilters({
      cgpaMin: 6.0,
      cgpaMax: 10,
      batchYears: [2026],
      sections: [],
      tiers: [],
    });
    setSearched(false);
    setResults([]);
  };

  const toggleBatchYear = (year) => {
    setFilters(prev => ({
      ...prev,
      batchYears: prev.batchYears.includes(year)
        ? prev.batchYears.filter(y => y !== year)
        : [...prev.batchYears, year]
    }));
  };

  const toggleSection = (section) => {
    setFilters(prev => ({
      ...prev,
      sections: prev.sections.includes(section)
        ? prev.sections.filter(s => s !== section)
        : [...prev.sections, section]
    }));
  };

  const toggleTier = (tier) => {
    setFilters(prev => ({
      ...prev,
      tiers: prev.tiers.includes(tier)
        ? prev.tiers.filter(t => t !== tier)
        : [...prev.tiers, tier]
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Search Students</h1>
        <p className="text-text-secondary mt-1">Find and filter students by various criteria</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <div className="card lg:h-fit">
          <h2 className="font-semibold text-text-primary mb-4">Filters</h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">CGPA Range</label>
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    className="input-field w-full text-sm"
                    value={filters.cgpaMin}
                    onChange={(e) => setFilters({...filters, cgpaMin: parseFloat(e.target.value)})}
                  />
                  <span className="text-text-secondary">-</span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    className="input-field w-full text-sm"
                    value={filters.cgpaMax}
                    onChange={(e) => setFilters({...filters, cgpaMax: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">Batch Year</label>
              <div className="space-y-2">
                {[2023, 2024, 2025, 2026].map(year => (
                  <label key={year} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={filters.batchYears.includes(year)}
                      onChange={() => toggleBatchYear(year)}
                    />
                    <span className="text-sm text-text-secondary">{year}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">Section</label>
              <div className="space-y-2">
                {['A', 'B', 'C'].map(section => (
                  <label key={section} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={filters.sections.includes(section)}
                      onChange={() => toggleSection(section)}
                    />
                    <span className="text-sm text-text-secondary">Section {section}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">Readiness Tier</label>
              <div className="space-y-2">
                {['beginner', 'developing', 'placement_ready', 'industry_ready'].map(tier => (
                  <label key={tier} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={filters.tiers.includes(tier)}
                      onChange={() => toggleTier(tier)}
                    />
                    <span className="text-sm text-text-secondary capitalize">{tier.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <button onClick={handleSearch} disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button onClick={handleClear} disabled={loading} className="btn-secondary w-full disabled:opacity-50">
              Clear Filters
            </button>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          <div className="card">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
              <div>
                <p className="text-text-secondary text-sm">
                  {searched ? `${results.length} students match` : 'Run a search to see results'}
                </p>
              </div>
              {searched && results.length > 0 && (
                <div className="flex items-center gap-3">
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      // Since we sort on backend, we could trigger a re-fetch here if we want, or sort locally.
                      // Local sort for now:
                      const newSort = e.target.value;
                      const sorted = [...results].sort((a, b) => {
                        if (newSort === 'readiness_score') return b.readinessScore - a.readinessScore;
                        if (newSort === 'cgpa') return b.cgpa - a.cgpa;
                        if (newSort === 'name') return a.name.localeCompare(b.name);
                        return 0;
                      });
                      setResults(sorted);
                    }}
                    className="input-field text-sm"
                  >
                    <option value="readiness_score">Sort: Readiness</option>
                    <option value="cgpa">Sort: CGPA</option>
                    <option value="name">Sort: Name</option>
                  </select>
                  <button className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-primary rounded-md hover:bg-blue-100 transition-colors text-sm font-medium">
                    <Download size={16} />
                    Export
                  </button>
                </div>
              )}
            </div>

            {!searched && !loading ? (
              <div className="text-center py-12">
                <p className="text-text-secondary">Adjust filters and click Search to see results</p>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <p className="text-text-secondary">Searching...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-text-secondary">No students match your criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Roll</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Section</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">CGPA</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Readiness</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Tier</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(student => (
                      <tr key={student.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-medium text-text-primary">{student.name}</p>
                        </td>
                        <td className="py-3 px-4 text-text-secondary text-sm">{student.roll}</td>
                        <td className="py-3 px-4 text-text-secondary text-sm">{student.section}</td>
                        <td className="py-3 px-4 font-medium text-text-primary">{student.cgpa}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-24">
                              <div
                                className="bg-primary h-full rounded-full"
                                style={{ width: `${student.readinessScore}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-text-primary min-w-8">{student.readinessScore}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <TierBadge tier={student.tier} />
                        </td>
                        <td className="py-3 px-4">
                          <button className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-primary rounded-md hover:bg-blue-100 transition-colors text-sm font-medium">
                            <Eye size={14} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
