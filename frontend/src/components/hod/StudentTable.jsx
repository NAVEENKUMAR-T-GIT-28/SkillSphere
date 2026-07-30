import React from 'react';
import { MoreVertical, Edit2, KeyRound, UserMinus, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';
import TierBadge from '../../components/TierBadge';

export default function StudentTable({ 
  students, loading, meta, onPageChange, 
  onViewDetails, onEdit, onChangeClass, onResetPassword, onChangeStatus 
}) {
  const [openMenuId, setOpenMenuId] = React.useState(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  
  if (loading) {
    return (
      <div className="bg-surface rounded-xl shadow-sm border border-border/50 p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-border/30 animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (!students || students.length === 0) {
    return (
      <div className="bg-surface rounded-xl shadow-sm border border-border/50 p-12 text-center flex flex-col items-center justify-center mt-6">
        <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4">
          <UserMinus className="w-8 h-8 text-text-muted" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-1">No Students Found</h3>
        <p className="text-text-secondary text-sm max-w-sm">
          No students match the selected criteria or the class is empty. 
          Use the 'Create Student' or 'Import' tools to add students.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border/50 overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-background/50 border-b border-border/50">
              <th className="px-4 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap">
                <input type="checkbox" className="rounded border-border text-primary focus:ring-primary/20" />
              </th>
              <th className="px-4 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Student</th>
              <th className="px-4 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Roll Number</th>
              <th className="px-4 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Reg Number</th>
              <th className="px-4 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
              <th className="px-4 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Phone</th>
              <th className="px-4 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Last Updated</th>
              <th className="px-4 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {students.map((s) => (
              <tr key={s._id} className="hover:bg-surface-hover transition-colors group">
                <td className="px-4 py-3">
                  <input type="checkbox" className="rounded border-border text-primary focus:ring-primary/20" />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    {s.identity?.avatar ? (
                      <img src={s.identity.avatar} alt="Profile" className="w-8 h-8 rounded-full shrink-0 object-cover border border-border" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {s.identity?.full_name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-text-primary text-sm">{s.identity?.full_name}</p>
                      <p className="text-xs text-text-secondary">{s.identity?.personal_email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <p className="text-text-primary text-sm">{s.identity?.roll_number}</p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <p className="text-text-secondary text-sm">{s.identity?.register_number || '—'}</p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        (s.identity?.account_status || 'ACTIVE') === 'ACTIVE' ? 'bg-green-500' :
                        (s.identity?.account_status || 'ACTIVE') === 'SUSPENDED' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></span>
                      <span className={`text-xs font-medium ${
                        (s.identity?.account_status || 'ACTIVE') === 'ACTIVE' ? 'text-green-700' :
                        (s.identity?.account_status || 'ACTIVE') === 'SUSPENDED' ? 'text-yellow-700' : 'text-red-700'
                      }`}>
                        {s.identity?.account_status || 'ACTIVE'}
                      </span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border w-fit ${
                      s.academic?.academic_status === 'ENROLLED' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                      s.academic?.academic_status === 'GRADUATED' ? 'border-purple-200 text-purple-700 bg-purple-50' :
                      s.academic?.academic_status === 'DROPPED' ? 'border-red-200 text-red-700 bg-red-50' :
                      'border-gray-200 text-gray-700 bg-gray-50'
                    }`}>
                      {s.academic?.academic_status || 'UNKNOWN'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">
                  {s.identity?.phone || '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-text-secondary">
                  <div>
                    <p>{new Date(s.system?.last_synced || s.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    <p>{new Date(s.system?.last_synced || s.createdAt || Date.now()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => setOpenMenuId(openMenuId === s._id ? null : s._id)}
                      className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-border/50 rounded transition-colors border border-transparent hover:border-border"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openMenuId === s._id && (
                      <div className="absolute right-12 top-0 mt-0 w-48 bg-surface border border-border rounded-lg shadow-lg z-50 text-left">
                        <div className="p-1">
                          <button onClick={() => { setOpenMenuId(null); onViewDetails(s); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background rounded">
                            <Edit2 className="w-4 h-4" /> View Details
                          </button>
                          <button onClick={() => { setOpenMenuId(null); onEdit(s); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background rounded">
                            <Edit2 className="w-4 h-4" /> Edit Student
                          </button>
                          <button onClick={() => { setOpenMenuId(null); onChangeClass(s); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background rounded">
                            <ShieldAlert className="w-4 h-4" /> Change Class
                          </button>
                          <button onClick={() => { setOpenMenuId(null); onResetPassword(s); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background rounded">
                            <KeyRound className="w-4 h-4" /> Reset Password
                          </button>
                          <div className="h-px bg-border my-1"></div>
                          <button onClick={() => { setOpenMenuId(null); onChangeStatus(s); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded">
                            <UserMinus className="w-4 h-4" /> Change Status
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Footer */}
      {meta && meta.totalPages > 1 && (
        <div className="p-4 border-t border-border/50 flex items-center justify-between bg-background/50">
          <p className="text-sm text-text-secondary">
            Showing <span className="font-medium text-text-primary">{(meta.page - 1) * meta.limit + 1}</span> to <span className="font-medium text-text-primary">{Math.min(meta.page * meta.limit, meta.total)}</span> of <span className="font-medium text-text-primary">{meta.total}</span> students
          </p>
          <div className="flex gap-2 items-center">
            <button 
              onClick={() => onPageChange(meta.page - 1)} 
              disabled={meta.page === 1}
              className="p-1.5 rounded bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-border/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm px-2 text-text-primary font-medium">{meta.page}</span>
            <button 
              onClick={() => onPageChange(meta.page + 1)} 
              disabled={meta.page === meta.totalPages}
              className="p-1.5 rounded bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-border/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="ml-4 flex items-center gap-2">
              <span className="text-sm text-text-secondary">10 / page</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
