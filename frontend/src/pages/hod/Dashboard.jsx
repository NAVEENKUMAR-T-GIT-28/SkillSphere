import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

export default function HODDashboard() {
  const [data, setData] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/hod/dashboard');
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

  const { overview, tier_distribution, verification, top_students, top_skills, department_stats } = data;

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
    { label: 'Total Students', value: overview?.total_students || 0 },
    { label: 'Avg Readiness Score', value: overview?.avg_readiness_score || 0 },
    { label: 'Placement Ready', value: placementReadyCount },
    { label: 'Pending Verifications', value: pendingVerifications, highlight: pendingVerifications > 0 },
  ];

  const formatTierName = (tier) => {
    return tier.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const tierData = tier_distribution.map(t => ({
    name: formatTierName(t._id),
    count: t.count
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-1">Department-wide placement readiness metrics</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className={`card ${kpi.highlight ? 'border-red-200 bg-red-50' : ''}`}>
            <p className="text-text-secondary text-sm">{kpi.label}</p>
            <p className={`text-3xl font-bold mt-2 ${kpi.highlight ? 'text-red-700' : 'text-primary'}`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Readiness Tier Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tierData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Top Skills</h2>
          <div className="space-y-3">
            {top_skills?.length > 0 ? top_skills.slice(0, 7).map((skill, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-sm font-medium text-text-primary">{skill._id}</span>
                <span className="text-sm text-text-secondary bg-gray-100 px-2 py-1 rounded-full">{skill.count} students</span>
              </div>
            )) : (
              <p className="text-sm text-text-secondary">No skills data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Students & Departments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Top Performing Students</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-text-secondary">
                <tr>
                  <th className="py-2">Name</th>
                  <th className="py-2">Score</th>
                  <th className="py-2">CGPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {top_students?.slice(0, 5).map((student, idx) => (
                  <tr key={idx}>
                    <td className="py-2 font-medium text-text-primary">{student.full_name}</td>
                    <td className="py-2">{student.readiness_score}</td>
                    <td className="py-2">{student.cgpa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Department Averages</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-text-secondary">
                <tr>
                  <th className="py-2">Department</th>
                  <th className="py-2">Students</th>
                  <th className="py-2">Avg Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {department_stats?.map((dept, idx) => (
                  <tr key={idx}>
                    <td className="py-2 font-medium text-text-primary">{dept.department}</td>
                    <td className="py-2">{dept.count}</td>
                    <td className="py-2">{dept.avg_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
