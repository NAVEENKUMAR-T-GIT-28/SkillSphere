import React from 'react';
import { Check, X, Eye, Clock, Award, Code, Briefcase, FileText, Target } from 'lucide-react';
import { formatDate } from '../../utils/date';

const getIcon = (type) => {
  switch (type) {
    case 'certification': return <Award className="w-5 h-5 text-blue-500" />;
    case 'skill': return <Target className="w-5 h-5 text-indigo-500" />;
    case 'project': return <Code className="w-5 h-5 text-purple-500" />;
    case 'internship': return <Briefcase className="w-5 h-5 text-emerald-500" />;
    case 'achievement': return <Award className="w-5 h-5 text-amber-500" />;
    default: return <FileText className="w-5 h-5 text-gray-500" />;
  }
};

const getTypeLabel = (type) => {
  switch (type) {
    case 'certification': return 'Certification';
    case 'skill': return 'Skill';
    case 'project': return 'Project';
    case 'internship': return 'Internship';
    case 'achievement': return 'Achievement';
    default: return 'Submission';
  }
};

export default function VerificationCard({ item, onApprove, onReject, onViewDetails, isProcessing }) {
  const getInitials = (name) => {
    if (!name) return 'S';
    const parts = name.split(' ');
    if (parts.length > 1) return parts[0][0] + parts[1][0];
    return parts[0][0];
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
            {getInitials(item.studentName)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 leading-tight">{item.studentName}</h3>
            <p className="text-sm text-gray-500">{item.studentRoll}{item.department ? ` • ${item.department}` : ''}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
          <span className="text-xs text-gray-400">
            {formatDate(item.submittedDate)}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1">
        <div className="flex items-center gap-2 mb-3">
          {getIcon(item.type)}
          <span className="text-sm font-medium text-gray-600">{getTypeLabel(item.type)}</span>
        </div>
        <h4 className="font-bold text-gray-900 text-lg mb-2">{item.itemName}</h4>
        
        <div className="space-y-1.5 text-sm text-gray-600">
          {item.type === 'skill' && (
            <>
              <p><span className="font-medium text-gray-800">Category:</span> {item.category}</p>
              <p><span className="font-medium text-gray-800">Proficiency:</span> {item.proficiency}</p>
            </>
          )}
          {item.type === 'certification' && (
            <>
              <p><span className="font-medium text-gray-800">Issuer:</span> {item.issuer}</p>
            </>
          )}
          {item.type === 'project' && (
            <>
              <p><span className="font-medium text-gray-800">Tech Stack:</span> {item.techStack?.join(', ') || 'N/A'}</p>
              <p className="line-clamp-2 text-gray-500 mt-2">{item.description}</p>
            </>
          )}
          {item.type === 'internship' && (
            <>
              <p><span className="font-medium text-gray-800">Company:</span> {item.company}</p>
              <p><span className="font-medium text-gray-800">Duration:</span> {item.duration}</p>
            </>
          )}
          {item.type === 'achievement' && (
            <>
              <p><span className="font-medium text-gray-800">Issuer:</span> {item.issuer}</p>
              <p className="line-clamp-2 text-gray-500 mt-2">{item.description}</p>
            </>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-2">
        <button 
          onClick={() => onViewDetails(item)}
          className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors flex items-center gap-1.5"
        >
          <Eye className="w-4 h-4" /> View Details
        </button>
        <div className="flex gap-2">
          <button 
            onClick={() => onReject(item)}
            disabled={isProcessing}
            className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-md transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div> : <X className="w-4 h-4" />} Reject
          </button>
          <button 
            onClick={() => onApprove(item)}
            disabled={isProcessing}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Check className="w-4 h-4" />} Approve
          </button>
        </div>
      </div>
    </div>
  );
}
