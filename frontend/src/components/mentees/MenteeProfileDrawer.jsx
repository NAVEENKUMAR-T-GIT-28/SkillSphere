import React from 'react';
import { X, Mail, Phone, Code2, Award, Folder, Briefcase, Trophy, FileText, CheckCircle, Clock } from 'lucide-react';

export default function MenteeProfileDrawer({ isOpen, onClose, student }) {
  if (!isOpen || !student) return null;
  const { identity, academic, portfolio, verification, resume, readiness, coding, mentor } = student;

  const renderTierBadge = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'elite':
      case 'industry_ready':
      case 'placement_ready':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium"><CheckCircle className="w-3 h-3" /> Elite</span>;
      case 'advanced':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"><CheckCircle className="w-3 h-3" /> Advanced</span>;
      case 'intermediate':
      case 'developing':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs font-medium"><Clock className="w-3 h-3" /> Intermediate</span>;
      case 'beginner':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium"><Clock className="w-3 h-3" /> Beginner</span>;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out translate-x-0 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {identity.avatar ? (
                <img src={identity.avatar} alt={identity.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-xl bg-blue-50">
                  {identity.full_name?.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-gray-900">{identity.full_name}</h2>
                {renderTierBadge(readiness.tier)}
              </div>
              <p className="text-sm text-gray-600 mb-1">{identity.roll_number}</p>
              <p className="text-xs text-gray-500">{academic.department} - {academic.section} • Sem {academic.semester}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Overview Stats */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Overview</h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl text-center">
                <p className="text-xs text-gray-500 mb-1">CGPA</p>
                <p className="font-semibold text-gray-900">{academic.cgpa}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl text-center opacity-60">
                <p className="text-xs text-gray-500 mb-1">Readiness</p>
                <p className="font-semibold text-gray-900">--</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl text-center opacity-60">
                <p className="text-xs text-gray-500 mb-1">ATS Score</p>
                <p className="font-semibold text-gray-900">--</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl text-center flex flex-col items-center justify-center">
                <p className="text-xs text-gray-500 mb-1">Placement</p>
                {resume.uploaded ? (
                  <span className="text-green-600 text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Ready</span>
                ) : (
                  <span className="text-orange-600 text-xs font-medium">Not Ready</span>
                )}
              </div>
            </div>
          </div>

          {/* Portfolio Summary */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Portfolio Summary</h3>
            <div className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
              <div className="text-center">
                <div className="w-10 h-10 mx-auto bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center mb-2">
                  <Code2 className="w-5 h-5" />
                </div>
                <p className="text-xs text-gray-500 mb-1">Skills</p>
                <p className="font-bold text-gray-900">{portfolio.skills}</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 mx-auto bg-blue-50 text-blue-400 rounded-lg flex items-center justify-center mb-2">
                  <Award className="w-5 h-5" />
                </div>
                <p className="text-xs text-gray-500 mb-1">Certifications</p>
                <p className="font-bold text-gray-900">{portfolio.certifications}</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 mx-auto bg-blue-50 text-orange-400 rounded-lg flex items-center justify-center mb-2">
                  <Folder className="w-5 h-5" />
                </div>
                <p className="text-xs text-gray-500 mb-1">Projects</p>
                <p className="font-bold text-gray-900">{portfolio.projects}</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 mx-auto bg-blue-50 text-gray-400 rounded-lg flex items-center justify-center mb-2">
                  <Briefcase className="w-5 h-5" />
                </div>
                <p className="text-xs text-gray-500 mb-1">Internships</p>
                <p className="font-bold text-gray-900">{portfolio.internships}</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 mx-auto bg-blue-50 text-yellow-500 rounded-lg flex items-center justify-center mb-2">
                  <Trophy className="w-5 h-5" />
                </div>
                <p className="text-xs text-gray-500 mb-1">Achievements</p>
                <p className="font-bold text-gray-900">{portfolio.achievements}</p>
              </div>
            </div>
          </div>

          {/* Coding Platforms */}
          {coding?.platforms?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Coding Platforms</h3>
              <div className="flex flex-wrap gap-2">
                {coding.platforms.map((platform, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 flex items-center gap-2">
                    {platform}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Future Modules */}
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-xl opacity-60">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold text-gray-900">Resume Status</h4>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md">Uploaded</span>
              </div>
              <p className="text-xs text-gray-500">ATS Engine features are coming in a future release.</p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-xl opacity-60">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Readiness Engine</h4>
              <p className="text-xs text-gray-500">Advanced placement readiness intelligence coming soon.</p>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button className="flex-1 py-2 px-4 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            View Full Profile
          </button>
          {verification.pending > 0 && (
            <button className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              Review Pending
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">{verification.pending}</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
