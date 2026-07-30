import React, { useState } from 'react';
import { X, User, BookOpen, ShieldCheck, Activity, Award, Briefcase, FileText, Code2, Map } from 'lucide-react';
import Drawer from '../../components/Drawer';
import TierBadge from '../../components/TierBadge';

export default function StudentDetailsDrawer({ 
  isOpen, onClose, student, 
  onEdit, onChangeClass, onResetPassword, onChangeStatus 
}) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!student) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'identity', label: 'Identity', icon: ShieldCheck },
    { id: 'communication', label: 'Communication', icon: BookOpen },
    { id: 'activity', label: 'Activity Timeline', icon: Activity },
    { id: 'enrollment', label: 'Enrollment', icon: FileText }
  ];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Student Details"
      size="xl"
    >
      <div className="flex flex-col h-full bg-background">
        
        {/* Header Profile Section */}
        <div className="p-6 bg-surface border-b border-border/50 flex items-start justify-between gap-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">
              {student.identity?.full_name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
                {student.identity?.full_name}
                <TierBadge tier={student.mentor?.readiness_tier} />
              </h2>
              <div className="flex items-center gap-4 text-sm text-text-secondary mt-1">
                <span>{student.identity?.roll_number}</span>
                <span>•</span>
                <span>ID: {student.identity?.user_id?.login_identifier || '-'}</span>
                <span>•</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                  student.academic?.academic_status === 'ENROLLED' ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-gray-200 text-gray-700 bg-gray-50'
                }`}>
                  {student.academic?.academic_status}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative group inline-block text-left">
              <button className="px-4 py-2 bg-background border border-border text-sm font-medium text-text-secondary rounded-lg hover:bg-surface-hover hover:text-text-primary transition-colors">
                Administrative Actions
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                <div className="p-1">
                  <button onClick={() => onEdit(student)} className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background rounded">Edit Identity</button>
                  <button onClick={() => onChangeClass(student)} className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background rounded">Change Class</button>
                  <button onClick={() => onResetPassword(student)} className="w-full text-left px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 rounded">Reset Password</button>
                  <button onClick={() => onChangeStatus(student)} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded">Change Status</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-border/50 bg-surface flex overflow-x-auto shrink-0 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-4 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-surface p-4 rounded-xl border border-border/50">
                <h3 className="font-semibold text-text-primary mb-4">Class Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Class</p>
                    <p className="font-medium text-text-primary">{student.class?.display_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Department</p>
                    <p className="font-medium text-text-primary">{student.class?.department || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Status</p>
                    <p className="font-medium text-text-primary">{student.academic?.academic_status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Account Status</p>
                    <p className="font-medium text-text-primary">{student.identity?.account_status || 'ACTIVE'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'identity' && (
            <div className="bg-surface rounded-xl border border-border/50 divide-y divide-border/50">
              <div className="p-4 grid grid-cols-3">
                <span className="text-sm text-text-secondary">Full Name</span>
                <span className="text-sm font-medium col-span-2">{student.identity?.full_name}</span>
              </div>
              <div className="p-4 grid grid-cols-3">
                <span className="text-sm text-text-secondary">Roll Number</span>
                <span className="text-sm font-medium col-span-2">{student.identity?.roll_number}</span>
              </div>
              <div className="p-4 grid grid-cols-3">
                <span className="text-sm text-text-secondary">Register Number</span>
                <span className="text-sm font-medium col-span-2">{student.identity?.register_number || '-'}</span>
              </div>
              <div className="p-4 grid grid-cols-3">
                <span className="text-sm text-text-secondary">Personal Email</span>
                <span className="text-sm font-medium col-span-2">{student.identity?.personal_email || '-'}</span>
              </div>
              <div className="p-4 grid grid-cols-3">
                <span className="text-sm text-text-secondary">Phone</span>
                <span className="text-sm font-medium col-span-2">{student.identity?.phone || '-'}</span>
              </div>
            </div>
          )}

          {activeTab !== 'overview' && activeTab !== 'identity' && (
            <div className="flex items-center justify-center h-48 text-text-muted bg-surface rounded-xl border border-border border-dashed">
              Detailed view for {tab?.label || activeTab} is coming in a future phase.
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
