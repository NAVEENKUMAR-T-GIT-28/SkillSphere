import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import TierBadge from '../../components/TierBadge';
import Drawer from '../../components/Drawer';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { RolesAPI, UsersAPI } from '../../services/api';

export default function SharedMentees() {
  const [mentees, setMentees] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const toast = useToast();
  const { user } = useAuth();
  const isHod = user?.role === 'hod' || user?.baseRole === 'hod';

  useEffect(() => {
    const fetchMentees = async () => {
      try {
        if (isHod) {
          const { data } = await RolesAPI.getAssignments();
          const mentorAssignments = (data || []).filter(a => a.role === 'mentor');
          
          const mappedMentees = mentorAssignments.map(a => ({
            id: a._id,
            name: a.scope_label || 'Unknown Student',
            rollNumber: '',
            section: 'N/A',
            cgpa: 0,
            readinessScore: 0,
            readinessTier: 'beginner',
            mentorName: a.assignee_name || 'Unknown Faculty',
          }));
          
          setMentees(mappedMentees);
        } else {
          const { data } = await UsersAPI.getMentees();
          const students = data || [];
          
          const mappedMentees = students.map((s) => ({
            id: s._id,
            name: s.full_name,
            rollNumber: s.roll_number,
            section: s.section || 'N/A',
            cgpa: s.cgpa || 0,
            readinessScore: s.readiness_score || 0,
            readinessTier: s.readiness_tier || 'beginner',
          }));
          
          setMentees(mappedMentees);
        }
      } catch (err) {
        toast.error('Failed to load mentees');
      } finally {
        setFetching(false);
      }
    };
    
    fetchMentees();
  }, []);

  if (fetching) {
    return <div className="p-8 text-center text-text-secondary">Loading mentees...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">
          {isHod ? 'All Mentor Assignments' : 'My Mentees'}
        </h1>
        <p className="text-text-secondary mt-1">
          {isHod
            ? `Overview of all mentor–mentee assignments (${mentees.length})`
            : `View and support your assigned mentees (${mentees.length})`}
        </p>
      </div>

      {mentees.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-text-secondary">
            {isHod
              ? 'No mentors have been assigned yet. Go to Role Assignment to assign mentors.'
              : "You don't have any assigned mentees yet"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b-2 border-border">
              <tr>
                {isHod && (
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Mentor</th>
                )}
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Mentee</th>
                {!isHod && (
                  <>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Roll</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Section</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">CGPA</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Readiness</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Tier</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Action</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {mentees.map(mentee => (
                <tr key={mentee.id} className="table-row-hover border-b border-border">
                  {isHod && (
                    <td className="py-3 px-4">
                      <p className="font-medium text-text-primary">{mentee.mentorName}</p>
                    </td>
                  )}
                  <td className="py-3 px-4">
                    <p className="font-medium text-text-primary">{mentee.name}</p>
                  </td>
                  {!isHod && (
                    <>
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
                        <button onClick={() => setSelectedStudent(mentee)} className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-primary rounded-md hover:bg-blue-100 transition-colors text-sm font-medium">
                          <Eye size={14} />
                          View
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer isOpen={!!selectedStudent} onClose={() => setSelectedStudent(null)} title="Mentee Details">
        {selectedStudent && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-text-primary text-lg">{selectedStudent.name}</h3>
              <p className="text-text-secondary">{selectedStudent.rollNumber} • Section {selectedStudent.section}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-text-muted mb-1">CGPA</p>
                <p className="text-xl font-bold text-text-primary">{selectedStudent.cgpa}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-text-muted mb-1">Readiness Score</p>
                <p className="text-xl font-bold text-text-primary">{selectedStudent.readinessScore}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-text-primary mb-2">Readiness Tier</h4>
              <TierBadge tier={selectedStudent.readinessTier} />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
