import React from 'react';
import { BookOpen, Users, Calendar, Hash, GraduationCap, User } from 'lucide-react';

export default function ClassOverview({ classData, stats, romanYear }) {
  if (!classData) {
    return null; // Will not render if no class selected in the new layout
  }

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border/50 overflow-hidden">
      <div className="p-4 border-b border-border/50 bg-background/50">
        <h3 className="font-semibold text-text-primary">Class Overview</h3>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-secondary uppercase">Department</p>
            <p className="font-medium text-text-primary text-sm">{classData.department}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-secondary uppercase">Batch</p>
            <p className="font-medium text-text-primary text-sm">{classData.batch_start} - {classData.batch_end}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-text-secondary uppercase">Year</p>
              <p className="font-medium text-text-primary text-sm">{romanYear || classData.current_year} Year</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-text-secondary uppercase">Section</p>
              <p className="font-medium text-text-primary text-sm">Section {classData.section}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-secondary uppercase">Semester</p>
            <p className="font-medium text-text-primary text-sm">{classData.current_semester} Semester</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-secondary uppercase">Class Advisor</p>
            <p className="font-medium text-text-primary text-sm">{classData.advisor_name || 'Dr. Arun Kumar'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-secondary uppercase">Total Students</p>
            <p className="font-medium text-text-primary text-sm">{stats?.total || 0}</p>
          </div>
        </div>

        <div className="pt-2">
          <button className="w-full py-2 bg-primary/5 text-primary hover:bg-primary/10 rounded-lg text-sm font-semibold transition-colors">
            View Class Analytics &rarr;
          </button>
        </div>

      </div>
    </div>
  );
}
