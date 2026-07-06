import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import SummaryCards from '../../components/mentees/SummaryCards';
import Toolbar from '../../components/mentees/Toolbar';
import MenteeRow from '../../components/mentees/MenteeRow';
import MenteeProfileDrawer from '../../components/mentees/MenteeProfileDrawer';

export default function MyMenteesWorkspace() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: {},
    items: [],
    pagination: {}
  });

  const [filters, setFilters] = useState({
    search: '',
    section: 'All Sections',
    tier: 'All Tiers',
    resume: 'Resume: All',
    sort: 'Sort by'
  });

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchMentees();
  }, []);

  const fetchMentees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/my/mentees');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      toast.error('Failed to load mentees');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering & sorting
  const filteredItems = useMemo(() => {
    let items = [...(data.items || [])];

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(s => 
        s.identity.full_name?.toLowerCase().includes(q) || 
        s.identity.roll_number?.toLowerCase().includes(q)
      );
    }

    // Section
    if (filters.section !== 'All Sections') {
      items = items.filter(s => s.academic.section === filters.section);
    }

    // Tier
    if (filters.tier !== 'All Tiers') {
      items = items.filter(s => s.readiness?.tier?.toLowerCase() === filters.tier.toLowerCase());
    }

    // Resume
    if (filters.resume === 'Uploaded') {
      items = items.filter(s => s.resume.uploaded);
    } else if (filters.resume === 'Missing') {
      items = items.filter(s => !s.resume.uploaded);
    }

    // Sort
    if (filters.sort === 'Name (A-Z)') {
      items.sort((a, b) => (a.identity.full_name || '').localeCompare(b.identity.full_name || ''));
    } else if (filters.sort === 'CGPA (High-Low)') {
      items.sort((a, b) => (b.academic.cgpa || 0) - (a.academic.cgpa || 0));
    }

    return items;
  }, [data.items, filters]);

  // Client-side pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  const handleOpenDrawer = (student) => {
    setSelectedStudent(student);
    setIsDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-8"></div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>)}
        </div>
        <div className="h-16 bg-gray-200 rounded-xl mb-6"></div>
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-gray-50/50">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Mentees</h1>
        <p className="text-gray-500">Students assigned to you for mentoring and guidance</p>
      </div>

      <div className="space-y-6">
        <SummaryCards summary={data.summary} />
        
        <Toolbar filters={filters} setFilters={setFilters} />

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1.5fr_1fr] p-4 border-b border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div>Student</div>
            <div className="text-center">Readiness</div>
            <div className="text-center">Portfolio</div>
            <div className="text-center">Placement</div>
            <div>Activity</div>
            <div className="text-right pr-4">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100 flex-1 overflow-y-auto min-h-[400px]">
            {paginatedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">No mentees found</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  {data.items.length === 0 
                    ? "You haven't been assigned any mentees yet." 
                    : "No mentees match your current search and filter criteria."}
                </p>
              </div>
            ) : (
              paginatedItems.map((student) => (
                <MenteeRow 
                  key={student.student_id} 
                  student={student} 
                  onOpenDrawer={handleOpenDrawer}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} students
              </span>
              <div className="flex items-center gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-1 border border-gray-200 rounded text-gray-500 disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-7 h-7 flex items-center justify-center rounded text-sm ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="p-1 border border-gray-200 rounded text-gray-500 disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <MenteeProfileDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        student={selectedStudent}
      />
    </div>
  );
}
