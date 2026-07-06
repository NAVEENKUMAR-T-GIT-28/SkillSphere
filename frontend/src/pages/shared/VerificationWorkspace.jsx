import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ShieldCheck, Clock, CheckCircle, XCircle, LayoutGrid, CheckSquare, MoreVertical } from 'lucide-react';
import { VerificationAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/date';
import VerificationCard from '../../components/verification/VerificationCard';
import ReviewDrawer from '../../components/verification/ReviewDrawer';

export default function VerificationWorkspace() {
  const { user } = useAuth();
  const toast = useToast();

  const [queue, setQueue] = useState([]);
  const [fetching, setFetching] = useState(true);
  
  // Workspace UI State
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterSection, setFilterSection] = useState('All');
  const [sortOrder, setSortOrder] = useState('Oldest'); // 'Oldest' or 'Newest'
  
  // Drawer State
  const [selectedItem, setSelectedItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [processingItemId, setProcessingItemId] = useState(null);

  const fetchQueue = async () => {
    try {
      setFetching(true);
      const { data } = await VerificationAPI.getQueue();
      
      const combinedQueue = [];
      
      if (data.certifications?.items) {
        data.certifications.items.forEach(c => {
          combinedQueue.push({
            id: c._id,
            type: 'certification',
            studentName: c.student_id?.full_name || 'Unknown',
            studentRoll: c.student_id?.roll_number || 'N/A',
            department: c.student_id?.department || 'N/A',
            section: c.student_id?.section || 'N/A',
            itemName: c.title,
            issuer: c.issuer,
            submittedDate: c.created_at,
            driveLink: c.drive_link,
            status: c.status,
          });
        });
      }
      
      if (data.skills?.items) {
        data.skills.items.forEach(s => {
          combinedQueue.push({
            id: s._id,
            type: 'skill',
            studentName: s.student_id?.full_name || 'Unknown',
            studentRoll: s.student_id?.roll_number || 'N/A',
            department: s.student_id?.department || 'N/A',
            section: s.student_id?.section || 'N/A',
            itemName: s.skill_name,
            category: s.taxonomy_id?.category || 'Custom',
            proficiency: s.proficiency,
            evidence: s.evidence_note,
            submittedDate: s.created_at,
            status: s.status,
          });
        });
      }

      if (data.projects?.items) {
        data.projects.items.forEach(p => {
          combinedQueue.push({
            id: p._id,
            type: 'project',
            studentName: p.created_by?.full_name || 'Unknown',
            studentRoll: p.created_by?.roll_number || 'N/A',
            department: p.created_by?.department || 'N/A',
            section: p.created_by?.section || 'N/A',
            itemName: p.title,
            description: p.description,
            techStack: p.tech_stack || [],
            githubLink: p.github_url,
            liveLink: p.live_demo_url,
            submittedDate: p.created_at,
            status: p.status,
          });
        });
      }

      if (data.internships?.items) {
        data.internships.items.forEach(i => {
          combinedQueue.push({
            id: i._id,
            type: 'internship',
            studentName: i.student_id?.full_name || 'Unknown',
            studentRoll: i.student_id?.roll_number || 'N/A',
            department: i.student_id?.department || 'N/A',
            section: i.student_id?.section || 'N/A',
            itemName: `${i.role} @ ${i.company}`,
            company: i.company,
            role: i.role,
            duration: `${formatDate(i.start_date)} - ${i.end_date ? formatDate(i.end_date) : 'Present'} ${i.duration_months ? `(${i.duration_months} months)` : ''}`,
            description: i.description,
            offerLink: i.offer_letter_url,
            certLink: i.certificate_url,
            submittedDate: i.created_at,
            status: i.status,
          });
        });
      }

      if (data.achievements?.items) {
        data.achievements.items.forEach(a => {
          combinedQueue.push({
            id: a._id,
            type: 'achievement',
            studentName: a.student_id?.full_name || 'Unknown',
            studentRoll: a.student_id?.roll_number || 'N/A',
            department: a.student_id?.department || 'N/A',
            section: a.student_id?.section || 'N/A',
            itemName: a.title,
            category: a.category,
            customCategory: a.custom_category,
            issuer: a.issuer,
            date: a.date,
            description: a.description,
            proofLink: a.proof_url,
            submittedDate: a.created_at,
            status: a.status,
          });
        });
      }
      
      setQueue(combinedQueue);
    } catch (err) {
      toast.error('Failed to load queue');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = async (item) => {
    try {
      setProcessingItemId(item.id);
      await VerificationAPI.approveItem(item.type, item.id);
      toast.success(`${item.itemName} approved successfully!`);
      setQueue(prev => prev.filter(q => q.id !== item.id));
      if (selectedItem?.id === item.id) {
        setIsDrawerOpen(false);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to approve item');
    } finally {
      setProcessingItemId(null);
    }
  };

  const handleReject = async (item) => {
    if (selectedItem?.id !== item.id) {
      // If rejecting from card, open drawer to get reason
      setSelectedItem(item);
      setRejectReason('');
      setIsDrawerOpen(true);
      return;
    }

    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection in the comments area.');
      return;
    }
    
    try {
      setProcessingItemId(item.id);
      await VerificationAPI.rejectItem(item.type, item.id, rejectReason);
      toast.success(`${item.itemName} rejected.`);
      setQueue(prev => prev.filter(q => q.id !== item.id));
      setRejectReason('');
      setIsDrawerOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to reject item');
    } finally {
      setProcessingItemId(null);
    }
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setRejectReason('');
    setIsDrawerOpen(true);
  };

  // Local Filtering & Sorting
  const filteredQueue = useMemo(() => {
    return queue.filter(item => {
      if (activeTab !== 'all' && item.type !== activeTab) return false;
      if (filterDepartment !== 'All' && item.department !== filterDepartment) return false;
      if (filterSection !== 'All' && item.section !== filterSection) return false;
      
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          item.studentName?.toLowerCase().includes(query) ||
          item.studentRoll?.toLowerCase().includes(query) ||
          item.itemName?.toLowerCase().includes(query)
        );
      }
      return true;
    }).sort((a, b) => {
      const dateA = new Date(a.submittedDate);
      const dateB = new Date(b.submittedDate);
      return sortOrder === 'Oldest' ? dateA - dateB : dateB - dateA;
    });
  }, [queue, activeTab, filterDepartment, filterSection, searchQuery, sortOrder]);

  const departments = ['All', ...new Set(queue.map(item => item.department).filter(d => d && d !== 'N/A'))];
  const sections = ['All', ...new Set(queue.map(item => item.section).filter(s => s && s !== 'N/A'))];

  const counts = {
    all: queue.length,
    certification: queue.filter(item => item.type === 'certification').length,
    skill: queue.filter(item => item.type === 'skill').length,
    project: queue.filter(item => item.type === 'project').length,
    internship: queue.filter(item => item.type === 'internship').length,
    achievement: queue.filter(item => item.type === 'achievement').length,
  };

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'certification', label: 'Certificates' },
    { id: 'skill', label: 'Skills' },
    { id: 'project', label: 'Projects' },
    { id: 'internship', label: 'Internships' },
    { id: 'achievement', label: 'Achievements' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Auth Context */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">  
        <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-3 flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-md text-blue-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Role</p>
            <p className="text-sm font-medium text-gray-900">
              {user?.role === 'hod' ? 'Department HOD' : 'Assigned Mentor'}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-gray-600">
            <CheckSquare className="w-5 h-5" />
            <h3 className="font-medium">Total Pending</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{queue.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm opacity-60">
          <div className="flex items-center gap-3 mb-2 text-gray-600">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h3 className="font-medium">Approved Today</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">--</p>
          <p className="text-xs text-gray-400 mt-1">Metrics coming soon</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm opacity-60">
          <div className="flex items-center gap-3 mb-2 text-gray-600">
            <XCircle className="w-5 h-5 text-red-500" />
            <h3 className="font-medium">Rejected Today</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">--</p>
          <p className="text-xs text-gray-400 mt-1">Metrics coming soon</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm opacity-60">
          <div className="flex items-center gap-3 mb-2 text-gray-600">
            <Clock className="w-5 h-5 text-blue-500" />
            <h3 className="font-medium">Avg Review Time</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">--</p>
          <p className="text-xs text-gray-400 mt-1">Metrics coming soon</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by student name, roll number, or submission title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {departments.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
              </select>
              <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {sections.map(s => <option key={s} value={s}>{s === 'All' ? 'All Sections' : s}</option>)}
              </select>
              <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
              >
                <option value="Oldest">Oldest First</option>
                <option value="Newest">Newest First</option>
              </select>
              <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-100 overflow-x-auto hide-scrollbar pt-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg'
              }`}
            >
              {tab.label}
              {counts[tab.id] > 0 && (
                <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === tab.id ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {counts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area - Enterprise Table */}
      {fetching ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="animate-pulse flex flex-col">
            <div className="h-12 bg-gray-50 border-b border-gray-100"></div>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center px-6 py-4 border-b border-gray-50 gap-6">
                <div className="flex items-center gap-3 w-1/4">
                  <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <div className="h-3 w-32 bg-gray-100 rounded"></div>
                  </div>
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded"></div>
                <div className="flex-1 h-4 w-48 bg-gray-200 rounded"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="h-6 w-16 bg-gray-200 rounded"></div>
                <div className="h-8 w-24 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      ) : filteredQueue.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <LayoutGrid className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Queue is empty</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            {searchQuery || filterDepartment !== 'All' || filterSection !== 'All'
              ? 'No submissions match your current filters. Try adjusting your search criteria.'
              : 'You have no pending verification requests at this time. Great job!'}
          </p>
          {(searchQuery || filterDepartment !== 'All' || filterSection !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterDepartment('All');
                setFilterSection('All');
              }}
              className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4 whitespace-nowrap">Student</th>
                  <th className="px-6 py-4 whitespace-nowrap">Module</th>
                  <th className="px-6 py-4 whitespace-nowrap">Item</th>
                  <th className="px-6 py-4 whitespace-nowrap">Submitted On</th>
                  <th className="px-6 py-4 whitespace-nowrap">Priority</th>
                  <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredQueue.map(item => {
                  const getInitials = (name) => {
                    if (!name) return 'S';
                    const parts = name.split(' ');
                    return parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0];
                  };

                  const getModuleBadge = (type) => {
                    switch(type) {
                      case 'certification': return <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">Certificate</span>;
                      case 'skill': return <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700">Skill</span>;
                      case 'project': return <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-50 text-yellow-700">Project</span>;
                      case 'internship': return <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700">Internship</span>;
                      case 'achievement': return <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700">Achievement</span>;
                      default: return <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-700">Submission</span>;
                    }
                  };

                  // Mock priority based on type for visual fidelity since backend doesn't provide it
                  const getPriorityBadge = (type) => {
                    if (type === 'certification' || type === 'project') {
                      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-red-200 text-red-600 bg-red-50">High</span>;
                    } else if (type === 'skill' || type === 'internship') {
                      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-amber-200 text-amber-600 bg-amber-50">Medium</span>;
                    } else {
                      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-green-200 text-green-600 bg-green-50">Low</span>;
                    }
                  };

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {getInitials(item.studentName)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{item.studentName}</p>
                            <p className="text-xs text-gray-500">{item.studentRoll}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getModuleBadge(item.type)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 line-clamp-1" title={item.itemName}>{item.itemName}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-600">{formatDate(item.submittedDate)}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPriorityBadge(item.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(item)}
                            className="px-4 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                          >
                            Review
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-out Drawer */}
      <ReviewDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        item={selectedItem}
        onApprove={handleApprove}
        onReject={handleReject}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        isProcessing={processingItemId === selectedItem?.id}
      />
    </div>
  );
}
