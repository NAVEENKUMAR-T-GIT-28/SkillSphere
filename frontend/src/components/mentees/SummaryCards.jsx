import React from 'react';
import { Users, CheckCircle, AlertTriangle, TrendingUp, Target } from 'lucide-react';

export default function SummaryCards({ summary }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Mentees */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Total Mentees</p>
          <p className="text-3xl font-bold text-gray-900">{summary?.total_mentees || 0}</p>
          <p className="text-xs text-gray-400 mt-1">All assigned students</p>
        </div>
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
          <Users className="w-6 h-6" />
        </div>
      </div>

      {/* Avg Readiness (Coming Soon) */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm opacity-60 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Avg. Readiness</p>
          <p className="text-3xl font-bold text-gray-900">--</p>
          <p className="text-xs text-gray-400 mt-1">Across all mentees (Coming Soon)</p>
        </div>
        <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center">
          <TrendingUp className="w-6 h-6" />
        </div>
      </div>

      {/* Placement Ready */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Placement Ready</p>
          <p className="text-3xl font-bold text-gray-900">{summary?.placement_ready || 0}</p>
          <p className="text-xs text-gray-400 mt-1">
            {summary?.total_mentees > 0 ? Math.round(((summary?.placement_ready || 0) / summary.total_mentees) * 100) : 0}% of mentees
          </p>
        </div>
        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
          <CheckCircle className="w-6 h-6" />
        </div>
      </div>

      {/* Needs Attention */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Needs Attention</p>
          <p className="text-3xl font-bold text-gray-900">{summary?.needs_attention || 0}</p>
          <p className="text-xs text-gray-400 mt-1">
            {summary?.total_mentees > 0 ? Math.round(((summary?.needs_attention || 0) / summary.total_mentees) * 100) : 0}% of mentees
          </p>
        </div>
        <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
