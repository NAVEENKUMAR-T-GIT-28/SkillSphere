import { useState, useEffect } from 'react';
import { VerificationAPI, UsersAPI } from '../../services/api';
import TierBadge from '../../components/TierBadge';
import { Link } from 'react-router-dom';

export default function FacultyDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [{ data: queue }, { data: mentees }] = await Promise.all([
          VerificationAPI.getQueue(),
          UsersAPI.getMentees()
        ]);
        
        const q = Array.isArray(queue) ? queue : queue?.items || [];
        const m = Array.isArray(mentees) ? mentees : [];

        setData({
          pendingVerifications: q.length,
          totalMentees: m.length,
          menteesList: m
        });
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <div className="p-8 text-center text-text-secondary">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="mb-5">
        <h1 className="text-xl font-medium text-text-primary mb-1">Faculty Dashboard</h1>
        <p className="text-[13px] text-text-secondary">Overview of your verification queue and mentees</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-gray-50 rounded-md p-3.5 border border-border">
          <div className="text-[12px] text-text-secondary mb-1">Pending Verifications</div>
          <div className="text-[22px] font-medium text-red-600">{data?.pendingVerifications || 0}</div>
        </div>
        <div className="bg-gray-50 rounded-md p-3.5 border border-border">
          <div className="text-[12px] text-text-secondary mb-1">Total Mentees</div>
          <div className="text-[22px] font-medium text-blue-600">{data?.totalMentees || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <div className="border border-border rounded-lg p-4 bg-surface flex flex-col justify-center items-center h-48">
          <p className="text-[13px] text-text-secondary mb-3 text-center">Manage your verification queue</p>
          <Link to="/faculty/queue" className="btn-primary">
            View Verification Queue
          </Link>
        </div>
        
        <div className="border border-border rounded-lg p-4 bg-surface flex flex-col justify-center items-center h-48">
          <p className="text-[13px] text-text-secondary mb-3 text-center">Track your assigned mentees</p>
          <Link to="/faculty/mentees" className="btn-primary">
            View My Mentees
          </Link>
        </div>
      </div>

      <div className="border border-border rounded-lg p-4 bg-surface">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-medium">Top Mentees</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-[12px] font-medium text-text-secondary py-2 px-2.5">Name</th>
                <th className="text-left text-[12px] font-medium text-text-secondary py-2 px-2.5">Roll</th>
                <th className="text-left text-[12px] font-medium text-text-secondary py-2 px-2.5">Score</th>
                <th className="text-left text-[12px] font-medium text-text-secondary py-2 px-2.5">Tier</th>
              </tr>
            </thead>
            <tbody>
              {data?.menteesList?.slice(0, 5).map(m => (
                <tr key={m._id} className="border-b border-border hover:bg-gray-50">
                  <td className="py-2 px-2.5 text-[13px] font-medium">{m.full_name}</td>
                  <td className="py-2 px-2.5 text-[13px] text-text-secondary">{m.roll_number}</td>
                  <td className="py-2 px-2.5 text-[13px]"><strong className="text-blue-600">{m.readiness_score}</strong></td>
                  <td className="py-2 px-2.5">
                    <TierBadge tier={m.readiness_tier || 'beginner'} />
                  </td>
                </tr>
              ))}
              {data?.menteesList?.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-[13px] text-text-secondary">No mentees assigned</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
