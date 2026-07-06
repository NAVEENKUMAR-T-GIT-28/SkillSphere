import React from 'react';
import Drawer from '../Drawer';
import { ExternalLink, Check, X, FileText } from 'lucide-react';
import { formatDate } from '../../utils/date';

export default function ReviewDrawer({ 
  isOpen, 
  onClose, 
  item, 
  onApprove, 
  onReject, 
  rejectReason, 
  setRejectReason,
  isProcessing
}) {
  if (!item) return null;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Review Submission">
      <div className="p-6 space-y-8 pb-24">
        {/* Student Context */}
        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Student Information</h3>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
              {item.studentName?.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{item.studentName}</p>
              <p className="text-sm text-gray-500">{item.studentRoll} • {item.department}</p>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Verification Timeline</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-medium">1</div>
              <div className="w-0.5 h-6 bg-blue-100 my-1"></div>
            </div>
            <div className="pb-8">
              <p className="font-medium text-gray-900">Submitted</p>
              <p className="text-gray-500">{formatDate(item.submittedDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm -mt-6">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-medium border border-amber-200 shadow-sm animate-pulse">2</div>
            </div>
            <div>
              <p className="font-medium text-amber-700">Waiting Review</p>
              <p className="text-amber-600/70">Action required</p>
            </div>
          </div>
        </section>

        {/* Submission Data */}
        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Submission Details</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Title</p>
              <p className="font-medium text-gray-900">{item.itemName}</p>
            </div>
            
            {item.type === 'skill' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Category</p>
                  <p className="font-medium text-gray-900">{item.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Proficiency</p>
                  <p className="font-medium text-gray-900">{item.proficiency}</p>
                </div>
                {item.evidence && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Evidence Note</p>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-md border border-gray-100">{item.evidence}</p>
                  </div>
                )}
              </div>
            )}

            {item.type === 'project' && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-gray-900 leading-relaxed">{item.description}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tech Stack</p>
                  <div className="flex flex-wrap gap-2">
                    {item.techStack?.map(tech => (
                      <span key={tech} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">{tech}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {item.type === 'internship' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Company</p>
                  <p className="font-medium text-gray-900">{item.company}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Duration</p>
                  <p className="font-medium text-gray-900">{item.duration}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-gray-900 leading-relaxed">{item.description}</p>
                </div>
              </div>
            )}

            {item.type === 'achievement' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Issuer</p>
                  <p className="font-medium text-gray-900">{item.issuer}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Date</p>
                  <p className="font-medium text-gray-900">{formatDate(item.date)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-gray-900 leading-relaxed">{item.description}</p>
                </div>
              </div>
            )}
            
            {item.type === 'certification' && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Issuer</p>
                <p className="font-medium text-gray-900">{item.issuer}</p>
              </div>
            )}
          </div>
        </section>

        {/* Evidence Links */}
        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Evidence & Links</h3>
          <div className="flex flex-col gap-2">
            {item.driveLink && (
              <a href={item.driveLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3 text-gray-700 group-hover:text-blue-700">
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">Drive Link (Certificate)</span>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
              </a>
            )}
            {item.githubLink && (
              <a href={item.githubLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3 text-gray-700 group-hover:text-blue-700">
                  <Code className="w-5 h-5" />
                  <span className="font-medium">GitHub Repository</span>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
              </a>
            )}
            {item.liveLink && (
              <a href={item.liveLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3 text-gray-700 group-hover:text-blue-700">
                  <ExternalLink className="w-5 h-5" />
                  <span className="font-medium">Live Demo</span>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
              </a>
            )}
            {item.offerLink && (
              <a href={item.offerLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3 text-gray-700 group-hover:text-blue-700">
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">Offer Letter</span>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
              </a>
            )}
            {item.certLink && (
              <a href={item.certLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3 text-gray-700 group-hover:text-blue-700">
                  <Award className="w-5 h-5" />
                  <span className="font-medium">Completion Certificate</span>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
              </a>
            )}
            {item.proofLink && (
              <a href={item.proofLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3 text-gray-700 group-hover:text-blue-700">
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">Proof Document</span>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
              </a>
            )}
            {(!item.driveLink && !item.githubLink && !item.liveLink && !item.offerLink && !item.certLink && !item.proofLink) && (
              <p className="text-sm text-gray-500 italic">No external evidence provided.</p>
            )}
          </div>
        </section>

        {/* Comments */}
        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Reviewer Comments (Optional)</h3>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Add a comment... (Required for rejection)"
            className="w-full rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-3 text-sm resize-none h-24 shadow-sm"
          />
        </section>
      </div>

      {/* Sticky Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex items-center justify-end gap-3 z-10">
        <button 
          onClick={onClose}
          disabled={isProcessing}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button 
          onClick={() => onReject(item)}
          disabled={isProcessing}
          className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div> : <X className="w-4 h-4" />} Reject
        </button>
        <button 
          onClick={() => onApprove(item)}
          disabled={isProcessing}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Check className="w-4 h-4" />} Approve
        </button>
      </div>
    </Drawer>
  );
}
