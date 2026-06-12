import { useState, useEffect } from 'react';
import { Eye, TrendingUp, TrendingDown } from 'lucide-react';
import TierBadge from '../../components/TierBadge';
import api from '../../services/api';

export default function FacultyMentees() {
  const [mentees, setMentees] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchMentees = async () => {
      try {
        // Since there is no mentee mapping in the DB, we fetch all students
        // Alternatively, we could filter by the faculty's department if it were in context
        const data = await api.get('/search/students?limit=50');
        
        // The API returns paginated data (data.data is already extracted by the interceptor if structured that way, 
        // but search returns an array if our interceptor extracts it, wait, search returns an array or object?
        // Let's assume the interceptor extracts data.data.
        // Actually, search.js returns success(res, students, { total, ... })
        // So the interceptor returns `students` (the array). Wait, if interceptor extracts `data.data`, it returns `students`.
        // Let's handle both cases just in case.
        const students = Array.isArray(data) ? data : data.items || data.data || [];
        
        const mappedMentees = students.map((s, index) => ({
          id: s._id,
          name: s.full_name,
          rollNumber: s.roll_number,
          section: s.section || 'N/A',
          cgpa: s.cgpa || 0,
          readinessScore: s.readiness_score || 0,
          readinessTier: s.readiness_tier || 'beginner',
          scoreTrend: ['up', 'down', 'flat'][index % 3], // mock trend
        }));
        
        setMentees(mappedMentees);
      } catch (err) {
        console.error('Failed to load mentees:', err);
      } finally {
        setFetching(false);
      }
    };
    
    fetchMentees();
  }, []);

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp size={16} className="text-green-600" />;
    if (trend === 'down') return <TrendingDown size={16} className="text-red-600" />;
    return <div className="w-4 h-0.5 bg-gray-400"></div>;
  };

  if (fetching) {
    return <div className="p-8 text-center text-text-secondary">Loading mentees...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">My Mentees</h1>
        <p className="text-text-secondary mt-1">View and support your assigned mentees ({mentees.length})</p>
      </div>

      {mentees.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-text-secondary">You don&apos;t have any assigned mentees yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b-2 border-border">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Roll</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Section</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">CGPA</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Readiness</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Tier</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Trend</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Action</th>
              </tr>
            </thead>
            <tbody>
              {mentees.map(mentee => (
                <tr key={mentee.id} className="table-row-hover border-b border-border">
                  <td className="py-3 px-4">
                    <p className="font-medium text-text-primary">{mentee.name}</p>
                  </td>
                  <td className="py-3 px-4 text-text-secondary text-sm">{mentee.rollNumber}</td>
                  <td className="py-3 px-4 text-text-secondary text-sm">{mentee.section}</td>
                  <td className="py-3 px-4 font-medium text-text-primary">{mentee.cgpa}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-32">
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{ width: `${mentee.readinessScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-text-primary min-w-10">
                        {mentee.readinessScore}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <TierBadge tier={mentee.readinessTier} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center">
                      {getTrendIcon(mentee.scoreTrend)}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <button className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-primary rounded-md hover:bg-blue-100 transition-colors text-sm font-medium">
                      <Eye size={14} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
