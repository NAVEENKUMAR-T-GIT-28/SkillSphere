import React from 'react';
import { Eye, FileText, MoreVertical, Code2, Award, Folder, Briefcase, Trophy } from 'lucide-react';

export default function MenteeRow({ student, onOpenDrawer }) {
  const { identity, academic, portfolio, verification, resume, readiness, activity } = student;

  const renderTierBadge = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'elite':
      case 'industry_ready':
      case 'placement_ready':
        return <span className="text-green-600 font-medium text-xs">Elite</span>;
      case 'advanced':
        return <span className="text-blue-600 font-medium text-xs">Advanced</span>;
      case 'intermediate':
      case 'developing':
        return <span className="text-orange-600 font-medium text-xs">Intermediate</span>;
      case 'beginner':
        return <span className="text-red-600 font-medium text-xs">Beginner</span>;
      default:
        return <span className="text-gray-500 font-medium text-xs">Unknown</span>;
    }
  };

  return (
    <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1.5fr_1fr] items-center p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {/* Student Identity */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
          {identity.avatar ? (
            <img src={identity.avatar} alt={identity.full_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold bg-blue-50">
              {identity.full_name?.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{identity.full_name}</h4>
          <p className="text-xs text-gray-500">{identity.roll_number}</p>
          <p className="text-xs text-gray-400">{academic.department} - {academic.section} • Sem {academic.semester}</p>
        </div>
      </div>

      {/* Readiness */}
      <div className="flex flex-col items-center">
        <span className="text-lg font-bold text-gray-900">{readiness.score !== null ? readiness.score : '--'}</span>
        {renderTierBadge(readiness.tier)}
      </div>

      {/* Portfolio Badges */}
      <div className="flex items-center gap-4 justify-center">
        <div className="flex flex-col items-center gap-1">
          <Code2 className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-medium text-gray-700">{portfolio.skills}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Award className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-medium text-gray-700">{portfolio.certifications}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Folder className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-medium text-gray-700">{portfolio.projects}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Briefcase className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-700">{portfolio.internships}</span>
        </div>
      </div>

      {/* Placement / Resume */}
      <div className="flex flex-col gap-1 items-center">
        {resume.uploaded ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
            <CheckCircleIcon className="w-3 h-3" /> Ready
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-medium">
            <AlertCircleIcon className="w-3 h-3" /> Not Ready
          </span>
        )}
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <FileText className="w-3 h-3" /> ATS {resume.ats_score !== null ? resume.ats_score : '--'}
        </span>
      </div>

      {/* Activity */}
      <div>
        <p className="text-xs font-medium text-gray-900 truncate pr-2">
          {activity.latest_submission ? 'Profile Updated' : 'No recent activity'}
        </p>
        <p className="text-xs text-gray-500 flex items-center gap-1">
          {activity.latest_submission_date ? new Date(activity.latest_submission_date).toLocaleDateString() : 'N/A'}
          <span className={`w-1.5 h-1.5 rounded-full ${activity.latest_submission ? 'bg-green-500' : 'bg-red-500'}`}></span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pr-2">
        <button onClick={() => onOpenDrawer(student)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
          <Eye className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors relative">
          <FileText className="w-4 h-4" />
          {verification.pending > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white"></span>
          )}
        </button>
        <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function CheckCircleIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function AlertCircleIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
