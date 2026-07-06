import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, DollarSign, Calendar, AlertCircle, Briefcase, GraduationCap, Check } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';
import { DrivesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import DefaultCompanyLogo from '../../assets/default-company.png';

const daysUntilDeadline = (deadline) => {
  if (!deadline) return 0;
  const d = new Date(deadline);
  const today = new Date();
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
};

const getDriveStatusInfo = (drive, appStatus) => {
  const daysLeft = daysUntilDeadline(drive.application_deadline);
  
  if (appStatus === 'offered' || appStatus === 'selected') {
    return { label: 'Offered', color: 'bg-purple-50 text-purple-600 border-purple-200', value: 'offered' };
  }
  if (appStatus === 'shortlisted') {
    return { label: 'Shortlisted', color: 'bg-orange-50 text-orange-600 border-orange-200', value: 'shortlisted' };
  }
  if (appStatus === 'applied' || appStatus === 'pending' || appStatus === 'rejected') {
    // If rejected, you could have a rejected badge, but user asked for these specific tabs. Let's map rejected to applied or a separate badge if needed.
    // The prompt specified: Applied, Shortlisted, Offered, Open, Closed, Expired. 
    return { label: 'Applied', color: 'bg-blue-50 text-blue-600 border-blue-200', value: 'applied' };
  }
  
  if (drive.status === 'closed') {
    return { label: 'Closed', color: 'bg-slate-50 text-slate-600 border-slate-200', value: 'closed' };
  }
  if (daysLeft < 0) {
    return { label: 'Expired', color: 'bg-red-50 text-red-600 border-red-200', value: 'expired' };
  }
  
  return { label: 'Open', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', value: 'open' };
};

export default function StudentDrives() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('All');
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, driveId: null });
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.profileId) return;
        const [{ data: drivesData }, { data: appsData }] = await Promise.all([
          DrivesAPI.getDrives(),
          DrivesAPI.getStudentApplications(user.profileId)
        ]);
        setDrives(drivesData);
        setApplications(appsData);
      } catch (err) {
        toast.error('Failed to load drives');
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [user, toast]);

  const handleApply = (driveId) => {
    setConfirmModal({ isOpen: true, driveId });
  };

  const confirmApply = async () => {
    if (confirmModal.driveId) {
      try {
        const { data: application } = await DrivesAPI.applyForDrive(confirmModal.driveId);
        setApplications([application, ...applications]);
        toast.success('Successfully applied to drive');
      } catch (err) {
        toast.error(err.message || 'Failed to apply for drive');
      }
    }
    setConfirmModal({ isOpen: false, driveId: null });
  };

  const appsByDriveId = useMemo(() => {
    return applications.reduce((acc, app) => {
      const driveId = String(app.drive_id?._id || app.drive_id);
      acc[driveId] = app.status || 'applied'; // Map application status
      return acc;
    }, {});
  }, [applications]);

  // Combine and format drives for easy filtering and rendering
  const processedDrives = useMemo(() => {
    return drives.map(drive => {
      const appStatus = appsByDriveId[String(drive._id)];
      const statusInfo = getDriveStatusInfo(drive, appStatus);
      return {
        ...drive,
        appStatus,
        statusInfo
      };
    });
  }, [drives, appsByDriveId]);

  // Statistics calculation
  const stats = useMemo(() => {
    return {
      total: drives.length,
      applied: applications.length,
      shortlisted: applications.filter(a => a.status === 'shortlisted').length,
      offers: applications.filter(a => a.status === 'offered' || a.status === 'selected').length
    };
  }, [drives, applications]);

  // Search and Filter
  const displayedDrives = useMemo(() => {
    let result = processedDrives;

    // Tab Filter
    if (activeTab === 'Applied') {
      result = result.filter(d => ['applied', 'shortlisted', 'offered'].includes(d.statusInfo.value));
    } else if (activeTab === 'Shortlisted') {
      result = result.filter(d => d.statusInfo.value === 'shortlisted' || d.statusInfo.value === 'offered');
    } else if (activeTab === 'Offered') {
      result = result.filter(d => d.statusInfo.value === 'offered');
    }

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => 
        (d.company_name || '').toLowerCase().includes(q) ||
        (d.title || d.role_title || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [processedDrives, activeTab, searchQuery]);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto pt-2">

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-6 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-hide">
          {['All', 'Applied', 'Shortlisted', 'Offered'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search company, title, or role..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
          />
        </div>
      </div>

      {/* Drive Cards List */}
      <div className="space-y-4">
        {fetching ? (
          // Loading Skeletons
          [1, 2, 3].map(i => (
            <div key={i} className="flex flex-col md:flex-row gap-6 p-6 bg-white border border-slate-200 rounded-2xl animate-pulse">
              <div className="flex items-center gap-4 w-full md:w-1/3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex-shrink-0"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-slate-100 rounded w-1/2"></div>
                  <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                </div>
              </div>
              <div className="flex items-center justify-between w-full md:w-2/3">
                <div className="space-y-2 w-full">
                  <div className="h-4 bg-slate-100 rounded w-1/3 mx-auto"></div>
                </div>
                <div className="h-10 bg-slate-100 rounded-lg w-24 flex-shrink-0"></div>
              </div>
            </div>
          ))
        ) : displayedDrives.length === 0 ? (
          // Empty State
          <div className="py-16 px-6 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
              <Briefcase size={32} className={searchQuery ? "opacity-50" : ""} />
            </div>
            {searchQuery ? (
              <>
                <h3 className="text-lg font-bold text-slate-800 mb-2">No matching drives found</h3>
                <p className="text-slate-500 max-w-sm">We couldn't find any opportunities matching "{searchQuery}".</p>
              </>
            ) : activeTab !== 'All' ? (
              <>
                <h3 className="text-lg font-bold text-slate-800 mb-2">No {activeTab.toLowerCase()} drives</h3>
                <p className="text-slate-500 max-w-sm">You haven't {activeTab.toLowerCase()} for any placement drives yet.</p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-slate-800 mb-2">No drives available</h3>
                <p className="text-slate-500 max-w-sm">There are currently no active placement drives. Check back later.</p>
              </>
            )}
          </div>
        ) : (
          displayedDrives.map(drive => (
            <div key={drive._id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 bg-white border border-slate-200 rounded-2xl hover:shadow-md transition-shadow">
              
              {/* Left: Logo & Company */}
              <div className="flex items-center gap-4 w-full md:w-1/3">
                <img 
                  src={drive.company_logo || DefaultCompanyLogo} 
                  alt={drive.company_name} 
                  className="w-12 h-12 rounded-xl object-contain border border-slate-100 bg-white flex-shrink-0"
                  onError={(e) => { e.target.src = DefaultCompanyLogo; }}
                />
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-800 truncate" title={drive.company_name}>{drive.company_name}</h3>
                  <p className="text-sm text-slate-500 truncate" title={drive.title || drive.role_title}>{drive.title || drive.role_title}</p>
                </div>
              </div>
              
              {/* Center: Details Grid */}
              <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto text-sm text-slate-600 flex-1 justify-between md:justify-center">
                <div className="flex flex-col md:items-center">
                  <span className="text-xs text-slate-400 mb-0.5">Package (CTC)</span>
                  <span className="font-medium text-slate-800 flex items-center gap-1">
                    <DollarSign size={14} className="text-slate-400 hidden md:block" /> {drive.ctc || 'Not specified'}
                  </span>
                </div>
                <div className="flex flex-col md:items-center">
                  <span className="text-xs text-slate-400 mb-0.5">Eligibility</span>
                  <span className="font-medium text-slate-800 flex items-center gap-1">
                    <GraduationCap size={14} className="text-slate-400 hidden md:block" />
                    {drive.eligibility?.min_cgpa ? `${drive.eligibility.min_cgpa} CGPA+` : 'Open'}
                  </span>
                </div>
                <div className="flex flex-col md:items-center">
                  <span className="text-xs text-slate-400 mb-0.5">Deadline</span>
                  <span className={`font-medium flex items-center gap-1 ${daysUntilDeadline(drive.application_deadline) < 3 && daysUntilDeadline(drive.application_deadline) >= 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                    <Calendar size={14} className={`${daysUntilDeadline(drive.application_deadline) < 3 && daysUntilDeadline(drive.application_deadline) >= 0 ? 'text-amber-500' : 'text-slate-400'} hidden md:block`} />
                    {new Date(drive.application_deadline).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Right: Actions & Status */}
              <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
                <div className={`px-2.5 py-1 text-xs font-medium border rounded-md capitalize ${drive.statusInfo.color}`}>
                  {drive.statusInfo.label}
                </div>

                {drive.statusInfo.value === 'open' && (
                  <button
                    onClick={() => handleApply(drive._id)}
                    className="btn-primary py-2 px-6 shadow-sm hover:shadow text-sm"
                  >
                    Apply
                  </button>
                )}
                {drive.statusInfo.value === 'applied' && (
                  <button disabled className="bg-slate-50 border border-slate-200 text-slate-500 py-2 px-6 rounded-lg text-sm font-medium flex items-center gap-1.5 cursor-not-allowed">
                    <Check size={14} /> Applied
                  </button>
                )}
                {/* Shortlisted and Offered might also not need an apply button, just showing status is fine */}
              </div>

            </div>
          ))
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 mt-8 border-t border-slate-200">
        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Drives</p>
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Applied</p>
          <p className="text-2xl font-bold text-blue-600">{stats.applied}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Shortlisted</p>
          <p className="text-2xl font-bold text-orange-600">{stats.shortlisted}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Offers</p>
          <p className="text-2xl font-bold text-purple-600">{stats.offers}</p>
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, driveId: null })}
        title="Confirm Application"
        message="Are you sure you want to apply for this drive? Ensure your profile is up to date."
        onConfirm={confirmApply}
      />
    </div>
  );
}
