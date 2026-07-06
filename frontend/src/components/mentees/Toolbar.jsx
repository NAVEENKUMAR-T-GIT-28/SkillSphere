import React from 'react';
import { Search, Filter } from 'lucide-react';

export default function Toolbar({ filters, setFilters }) {
  const handleSearchChange = (e) => setFilters(prev => ({ ...prev, search: e.target.value }));
  const handleSortChange = (e) => setFilters(prev => ({ ...prev, sort: e.target.value }));

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-wrap items-center gap-4">
      <div className="relative flex-1 min-w-[250px]">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input 
          type="text" 
          placeholder="Search by name or roll number..." 
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          value={filters.search}
          onChange={handleSearchChange}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select 
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:border-blue-500"
          value={filters.section}
          onChange={(e) => setFilters(prev => ({ ...prev, section: e.target.value }))}
        >
          <option value="All Sections">All Sections</option>
          <option value="A">Section A</option>
          <option value="B">Section B</option>
          <option value="C">Section C</option>
        </select>

        <select 
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:border-blue-500"
          value={filters.tier}
          onChange={(e) => setFilters(prev => ({ ...prev, tier: e.target.value }))}
        >
          <option value="All Tiers">All Tiers</option>
          <option value="Elite">Elite</option>
          <option value="Advanced">Advanced</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Beginner">Beginner</option>
        </select>

        <select 
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:border-blue-500"
          value={filters.resume}
          onChange={(e) => setFilters(prev => ({ ...prev, resume: e.target.value }))}
        >
          <option value="Resume: All">Resume: All</option>
          <option value="Uploaded">Uploaded</option>
          <option value="Missing">Missing</option>
        </select>
        
        <select 
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:border-blue-500"
          value={filters.sort}
          onChange={handleSortChange}
        >
          <option value="Sort by">Sort by</option>
          <option value="Name (A-Z)">Name (A-Z)</option>
          <option value="CGPA (High-Low)">CGPA (High-Low)</option>
        </select>

        <button className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
          <Filter className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
