import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Users, Briefcase, GraduationCap } from 'lucide-react';

export default function AcademicSelector({ classes, selectedClassId, onSelectClass }) {
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  // Department is auto-derived from the classes list (all classes for HOD have same department)
  const department = useMemo(() => classes.length > 0 ? classes[0].department : 'Loading...', [classes]);

  // Derived unique values based on selections
  const batches = useMemo(() => {
    return [...new Set(classes.map(c => c.batch_start))].sort((a, b) => b - a);
  }, [classes]);

  const years = useMemo(() => {
    if (!selectedBatch) return [];
    const filtered = classes.filter(c => c.batch_start === parseInt(selectedBatch));
    // current_year typically 1,2,3,4. Map to Roman numerals.
    const yearMap = { 1: 'I Year', 2: 'II Year', 3: 'III Year', 4: 'IV Year' };
    return [...new Set(filtered.map(c => c.current_year))].sort().map(y => ({ val: y, label: yearMap[y] || `${y} Year` }));
  }, [classes, selectedBatch]);

  const sections = useMemo(() => {
    if (!selectedBatch || !selectedYear) return [];
    return [...new Set(classes
      .filter(c => c.batch_start === parseInt(selectedBatch) && c.current_year === parseInt(selectedYear))
      .map(c => c.section)
    )].sort();
  }, [classes, selectedBatch, selectedYear]);

  // Sync internal state if a class is externally selected or auto-resolve the class
  useEffect(() => {
    if (selectedBatch && selectedYear && selectedSection) {
      const match = classes.find(c => 
        c.batch_start === parseInt(selectedBatch) && 
        c.current_year === parseInt(selectedYear) && 
        c.section === selectedSection
      );
      if (match && match._id !== selectedClassId) {
        onSelectClass(match._id);
      }
    }
  }, [selectedBatch, selectedYear, selectedSection, classes, selectedClassId, onSelectClass]);

  // If a class is already selected on mount, set the dropdowns
  useEffect(() => {
    if (selectedClassId && classes.length > 0) {
      const match = classes.find(c => c._id === selectedClassId);
      if (match) {
        setSelectedBatch(match.batch_start.toString());
        setSelectedYear(match.current_year.toString());
        setSelectedSection(match.section);
      }
    }
  }, [selectedClassId, classes]);

  return (
    <div className="bg-surface p-6 rounded-xl shadow-sm border border-border/50 mb-6">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Select Academic Class</h3>
      <p className="text-xs text-text-secondary mb-6">Choose a class to view and manage students</p>
      
      <div className="flex flex-wrap gap-4 items-end">
        {/* Department (Readonly) */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Department</label>
          <div className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-secondary">
            <Briefcase className="w-4 h-4" />
            {department}
          </div>
        </div>

        {/* Batch */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Batch</label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <select 
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors appearance-none"
              value={selectedBatch}
              onChange={(e) => {
                setSelectedBatch(e.target.value);
                setSelectedYear('');
                setSelectedSection('');
                onSelectClass('');
              }}
            >
              <option value="">Select Batch</option>
              {batches.map(b => <option key={b} value={b}>{b} - {b+4}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        {/* Year */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Year</label>
          <div className="relative">
            <GraduationCap className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <select 
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:opacity-50 appearance-none"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSelectedSection('');
                onSelectClass('');
              }}
              disabled={!selectedBatch}
            >
              <option value="">Select Year</option>
              {years.map(y => <option key={y.val} value={y.val}>{y.label}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        {/* Section */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Section / Class</label>
          <div className="relative">
            <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <select 
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:opacity-50 appearance-none"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={!selectedYear}
            >
              <option value="">Select Section</option>
              {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
