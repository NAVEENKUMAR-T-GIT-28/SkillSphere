import { useState, useEffect } from 'react';
import { AnalyticsAPI } from '../../services/api';
import TierBadge from '../../components/TierBadge';

export default function HODDashboard() {
  const [data, setData] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: response } = await AnalyticsAPI.getHodDashboard();
        setData(response);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setFetching(false);
      }
    };
    fetchDashboard();
  }, []);

  if (fetching) {
    return <div className="p-8 text-center text-text-secondary">Loading dashboard...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-red-600">Failed to load dashboard data.</div>;
  }

  const { overview, tier_distribution, verification, top_students, top_skills } = data;

  const placementReadyCount = tier_distribution.reduce((acc, curr) => {
    if (curr._id === 'placement_ready' || curr._id === 'industry_ready') {
      return acc + curr.count;
    }
    return acc;
  }, 0);

  const pendingVerifications = 
    (verification?.pending?.skills || 0) + 
    (verification?.pending?.certifications || 0) + 
    (verification?.pending?.projects || 0);

  const kpis = [
    { label: 'Total students', value: overview?.total_students || 0, color: 'text-text-primary' },
    { label: 'Avg readiness score', value: overview?.avg_readiness_score || 0, color: 'text-blue-600' },
    { label: 'Placement ready', value: placementReadyCount, color: 'text-green-600' },
    { label: 'Pending verifications', value: pendingVerifications, color: 'text-red-600' },
  ];

  const formatTierName = (tier) => {
    return tier.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const tierData = tier_distribution.map(t => ({
    name: formatTierName(t._id),
    count: t.count
  })).sort((a, b) => b.count - a.count);

  const maxTierCount = Math.max(...tierData.map(t => t.count), 1);
  const maxSkillCount = Math.max(...(top_skills?.map(s => s.count) || []), 1);

  return (
    <div className="space-y-6">
      <div className="mb-5">
        <h1 className="text-xl font-medium text-text-primary mb-1">HOD dashboard</h1>
        <p className="text-[13px] text-text-secondary">Department-wide placement intelligence</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-gray-50 rounded-md p-3.5 border border-border">
            <div className="text-[12px] text-text-secondary mb-1">{kpi.label}</div>
            <div className={`text-[22px] font-medium ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <div className="border border-border rounded-lg p-4 bg-surface">
          <h2 className="text-[15px] font-medium mb-3">Tier distribution</h2>
          <div className="flex items-end gap-2 h-40 border-b border-border pb-2 mb-3">
            {tierData.map((t, i) => {
              const heightPct = (t.count / maxTierCount) * 100;
              return (
                <div key={i} className="flex flex-col items-center flex-1 justify-end h-full group relative">
                  <div className="w-full bg-blue-100 rounded-t-sm hover:bg-blue-200 transition-colors relative" style={{ height: `${heightPct}%`, minHeight: '4px' }}>
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white px-2 rounded">
                      {t.count}
                    </div>
                  </div>
                  <div className="text-[11px] text-text-secondary mt-1 text-center w-full truncate" title={t.name}>{t.name}</div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] text-text-secondary">
            {tierData.map((t, i) => (
              <span key={i}>■ <span className="text-text-primary">{t.name}: {t.count}</span></span>
            ))}
          </div>
        </div>

        <div className="border border-border rounded-lg p-4 bg-surface">
          <h2 className="text-[15px] font-medium mb-3">Top skills (verified)</h2>
          <div className="space-y-3">
            {top_skills?.slice(0, 5).map((skill, idx) => {
              const widthPct = (skill.count / maxSkillCount) * 100;
              return (
                <div key={idx} className="flex items-center text-[12px]">
                  <div className="w-28 flex-shrink-0 text-text-secondary truncate pr-2" title={skill._id}>{skill._id}</div>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded overflow-hidden">
                    <div className="h-full bg-blue-600 rounded" style={{ width: `${widthPct}%` }}></div>
                  </div>
                  <div className="w-8 flex-shrink-0 text-right font-medium text-text-primary pl-2">{skill.count}</div>
                </div>
              );
            })}
            {(!top_skills || top_skills.length === 0) && (
              <div className="text-[13px] text-text-secondary">No skills data available</div>
            )}
          </div>
        </div>
      </div>

      <div className="border border-border rounded-lg p-4 bg-surface">
        <h2 className="text-[15px] font-medium mb-3">Top performing students</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-[12px] font-medium text-text-secondary py-2 px-2.5 w-10">#</th>
                <th className="text-left text-[12px] font-medium text-text-secondary py-2 px-2.5">Name</th>
                <th className="text-left text-[12px] font-medium text-text-secondary py-2 px-2.5">Score</th>
                <th className="text-left text-[12px] font-medium text-text-secondary py-2 px-2.5">CGPA</th>
                <th className="text-left text-[12px] font-medium text-text-secondary py-2 px-2.5">Tier</th>
              </tr>
            </thead>
            <tbody>
              {top_students?.slice(0, 5).map((student, idx) => (
                <tr key={idx} className="border-b border-border hover:bg-gray-50">
                  <td className="py-2 px-2.5 text-[13px] text-text-secondary">{idx + 1}</td>
                  <td className="py-2 px-2.5 text-[13px] font-medium text-text-primary">{student.full_name}</td>
                  <td className="py-2 px-2.5 text-[13px]"><strong className="text-blue-600">{student.readiness_score}</strong></td>
                  <td className="py-2 px-2.5 text-[13px] text-text-secondary">{student.cgpa}</td>
                  <td className="py-2 px-2.5">
                    <TierBadge tier={student.readiness_tier || 'beginner'} />
                  </td>
                </tr>
              ))}
              {(!top_students || top_students.length === 0) && (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-[13px] text-text-secondary">No student data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
