import { useState, useEffect } from 'react';
import { BookOpen, Award, FileText, Code2, Users, FolderGit2, User, ShieldCheck } from 'lucide-react';
import React from 'react';
import ReadinessRing from '../../components/ReadinessRing';
import ScoreBar from '../../components/ScoreBar';
import TierBadge from '../../components/TierBadge';
import api from '../../services/api';

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/students/dashboard');
        setDashboard(data);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard');
        console.error('[StudentDashboard] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>;
  }

  if (error) {
    return <div className="card bg-red-50 border-red-200 text-red-700">{error}</div>;
  }

  const readinessData = dashboard?.readiness || {};
  const modules = dashboard?.modules || [];
  
  const ICONS = { profile: User, skills: Award, projects: FolderGit2, certs: ShieldCheck, coding: Code2 };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-1">Your placement readiness at a glance</p>
      </div>

      {/* Readiness Score Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Ring */}
        <div className="card flex flex-col items-center justify-center">
          <ReadinessRing score={readinessData.score || 0} />
          <div className="mt-6 text-center">
            <TierBadge tier={readinessData.tier || 'beginner'} />
            <p className="text-sm text-text-secondary mt-3">
              {readinessData.guidance || 'Keep working on your profile'}
            </p>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="lg:col-span-2 card space-y-4">
          <h3 className="font-semibold text-text-primary">Score Breakdown</h3>
          <ScoreBar label="Skills" value={readinessData.skills?.verified || 0} max={readinessData.skills?.total || 20} />
          <ScoreBar label="Certs" value={readinessData.certs?.verified || 0} max={readinessData.certs?.total || 20} />
          <ScoreBar label="Projects" value={readinessData.projects?.count || 0} max={25} />
          <ScoreBar label="Coding" value={readinessData.coding?.count || 0} max={15} />
          <ScoreBar label="Faculty" value={readinessData.faculty?.count || 0} max={5} />
        </div>
      </div>

      {/* Profile Modules */}
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-4">Your Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => (
            <a
              key={module.id}
              href={module.href}
              className="card hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary">{module.name}</h3>
                  <p className="text-sm text-text-secondary mt-1">{module.description}</p>
                  <p className="text-xs text-text-muted mt-2">{module.status}</p>
                </div>
                {ICONS[module.id] && React.createElement(ICONS[module.id], { className: 'text-primary opacity-50 flex-shrink-0 ml-2', size: 20 })}
              </div>
              <button className="btn-primary mt-3 text-sm w-full">
                {module.action}
              </button>
            </a>
          ))}
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="card">
        <h2 className="text-lg font-bold text-text-primary mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {dashboard?.notifications?.slice(0, 3).map((notif, idx) => (
            <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-md border-l-2 border-primary">
              <div className="flex-1">
                <p className="font-medium text-text-primary text-sm">{notif.title}</p>
                <p className="text-xs text-text-secondary">{notif.message}</p>
              </div>
            </div>
          )) || <p className="text-text-secondary text-sm">No recent activity</p>}
        </div>
      </div>
    </div>
  );
}
