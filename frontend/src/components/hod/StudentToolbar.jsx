import React from 'react';
import { Search, Filter } from 'lucide-react';

export default function StudentToolbar({ search, onSearch, disabled }) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface p-4 rounded-xl shadow-sm border border-border/50 mb-6">
      <div className="flex-1 w-full relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input 
          type="text" 
          placeholder="Search by name, roll number or login id..."
          className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:opacity-50"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          disabled={disabled}
        />
      </div>
      
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</label>
          <select className="px-3 py-2 bg-background border border-border rounded-lg text-sm disabled:opacity-50" disabled={disabled}>
            <option>All Status</option>
            <option>ACTIVE</option>
            <option>SUSPENDED</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Academic Status</label>
          <select className="px-3 py-2 bg-background border border-border rounded-lg text-sm disabled:opacity-50" disabled={disabled}>
            <option>All</option>
            <option>ENROLLED</option>
            <option>DROPPED</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Sort By</label>
          <select className="px-3 py-2 bg-background border border-border rounded-lg text-sm disabled:opacity-50" disabled={disabled}>
            <option>Created At (Newest)</option>
            <option>Name (A-Z)</option>
          </select>
        </div>
        <button 
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-background border border-border text-text-secondary rounded-lg hover:bg-surface-hover hover:text-text-primary transition-colors disabled:opacity-50"
          disabled={disabled}
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters</span>
        </button>
      </div>
    </div>
  );
}
