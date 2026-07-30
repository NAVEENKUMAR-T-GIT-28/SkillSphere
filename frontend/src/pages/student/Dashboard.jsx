import React, { useState, useEffect } from 'react';
import { AnalyticsAPI } from '../../services/api';
import { 
  Trophy, BookOpen, User, FolderGit2, ShieldCheck, Code2, Briefcase, 
  ChevronRight, Calendar, ArrowUpRight, ExternalLink, Activity, Play, Star, MapPin, Award, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [greeting, setGreeting] = useState('Good Morning');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 17) setGreeting('Good Afternoon');
    else if (hour >= 17) setGreeting('Good Evening');

    const fetchDashboard = async () => {
      try {
        const { data } = await AnalyticsAPI.getStudentDashboard();
        setDashboard(data);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col space-y-4 p-8 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-xl w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-24 bg-gray-200 rounded-xl"></div>
          <div className="h-24 bg-gray-200 rounded-xl"></div>
          <div className="h-24 bg-gray-200 rounded-xl"></div>
          <div className="h-24 bg-gray-200 rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-gray-200 rounded-xl"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-red-600 bg-red-50 rounded-xl m-4">{error}</div>;
  }

  if (!dashboard) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* 1. Hero Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between border border-blue-100">
        <div className="space-y-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {greeting}, {dashboard.hero.student.name.split(' ')[0]}! <span className="inline-block animate-wave">👋</span>
          </h1>
          <p className="text-gray-600">Let's make today productive and move closer to your dream career.</p>
          
          <div className="flex flex-wrap gap-3 mt-4">
            <span className="px-3 py-1 bg-white text-gray-700 rounded-full text-sm font-medium border border-gray-200 shadow-sm">{dashboard.hero.student.department} Department</span>
            <span className="px-3 py-1 bg-white text-gray-700 rounded-full text-sm font-medium border border-gray-200 shadow-sm">Batch {dashboard.hero.student.batch}</span>
            <span className="px-3 py-1 bg-white text-gray-700 rounded-full text-sm font-medium border border-gray-200 shadow-sm">{dashboard.hero.student.semester}th Semester</span>
            {dashboard.hero.student.cgpa && (
              <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-semibold border border-green-200 shadow-sm">CGPA {dashboard.hero.student.cgpa} / 10</span>
            )}
          </div>
        </div>
        <div className="mt-6 md:mt-0 max-w-xs text-right hidden md:block border-l border-blue-200 pl-6">
          <p className="text-gray-600 italic">"{dashboard.hero.quote}"</p>
          <p className="text-sm text-gray-400 mt-2">— SkillSphere Career Coach</p>
        </div>
      </div>

      {/* 2. Quick Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Profile Completion */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center space-x-4 cursor-pointer hover:shadow-md transition-shadow">
          <div className="w-16 h-16 flex-shrink-0">
            <CircularProgressbar 
              value={dashboard.quick_scores.profile_completion.score} 
              text={`${dashboard.quick_scores.profile_completion.score}%`}
              styles={buildStyles({ textSize: '24px', pathColor: '#2563eb', textColor: '#1e3a8a', trailColor: '#eff6ff' })}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-sm text-gray-500 font-medium flex items-center justify-between">Profile Completion <ChevronRight size={16}/></h3>
            <p className="text-lg font-bold text-gray-900 mt-1">{dashboard.quick_scores.profile_completion.score}%</p>
            <p className="text-xs text-blue-600 font-medium mt-0.5">{dashboard.quick_scores.profile_completion.status}</p>
          </div>
        </div>

        {/* ATS Score */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center space-x-4 cursor-pointer hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="text-green-600" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm text-gray-500 font-medium flex items-center justify-between">ATS Score <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded ml-1">BETA</span> <ChevronRight size={16}/></h3>
            <p className="text-lg font-bold text-gray-900 mt-1">{dashboard.quick_scores.ats.score || 0} <span className="text-xs text-gray-400 font-normal">/ 100</span></p>
            <p className="text-xs text-green-600 font-medium mt-0.5">Grade {dashboard.quick_scores.ats.grade || 'N/A'}</p>
          </div>
        </div>

        {/* Coding DNA */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center space-x-4 cursor-pointer hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <Code2 className="text-purple-600" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm text-gray-500 font-medium flex items-center justify-between">Coding DNA <ChevronRight size={16}/></h3>
            <p className="text-lg font-bold text-gray-900 mt-1">{dashboard.quick_scores.coding_dna.score}%</p>
            <p className="text-xs text-purple-600 font-medium mt-0.5">{dashboard.quick_scores.coding_dna.status}</p>
          </div>
        </div>

        {/* Readiness Score */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center space-x-4 cursor-not-allowed opacity-75">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
            <Star className="text-orange-500" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm text-gray-500 font-medium flex items-center justify-between">Readiness Score <ChevronRight size={16}/></h3>
            <p className="text-lg font-bold text-orange-600 mt-1">Coming Soon</p>
            <p className="text-xs text-orange-500 font-medium mt-0.5">Stay tuned</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3. Portfolio Progress */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Your Progress Overview</h2>
            <div className="flex space-x-4 text-sm font-medium">
              <button className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Portfolio</button>
              <button className="text-gray-500 hover:text-gray-700">Skills</button>
              <button className="text-gray-500 hover:text-gray-700">Learning</button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-48 h-48 flex-shrink-0 relative">
              <CircularProgressbar 
                value={dashboard.portfolio.overall} 
                text={`${dashboard.portfolio.overall}%`}
                styles={buildStyles({ textSize: '20px', pathColor: '#2563eb', textColor: '#111827', trailColor: '#eff6ff' })}
              />
              <p className="absolute bottom-10 left-1/2 -translate-x-1/2 text-xs text-gray-500 font-medium">Overall Portfolio</p>
            </div>
            
            <div className="flex-1 w-full space-y-4">
              <PortfolioBar label="Skills" icon={Award} value={dashboard.portfolio.skills.progress} color="bg-green-500" />
              <PortfolioBar label="Projects" icon={FolderGit2} value={dashboard.portfolio.projects.progress} color="bg-orange-500" />
              <PortfolioBar label="Internships" icon={Briefcase} value={dashboard.portfolio.internships.progress} color="bg-blue-500" />
              <PortfolioBar label="Certifications" icon={ShieldCheck} value={dashboard.portfolio.certifications.progress} color="bg-purple-500" />
              <PortfolioBar label="Achievements" icon={Trophy} value={dashboard.portfolio.achievements.progress} color="bg-yellow-500" />
              
              <div className="text-right mt-2">
                <Link to="/profile" className="text-sm text-blue-600 font-medium flex items-center justify-end hover:underline">
                  View Portfolio <ArrowUpRight size={16} className="ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3 flex-1">
            <QuickAction icon={FileText} label="Upload Resume" to="/resumes" />
            <QuickAction icon={FolderGit2} label="Add Project" to="/projects" />
            <QuickAction icon={Briefcase} label="Add Internship" to="/internships" />
            <QuickAction icon={FolderGit2} label="Sync GitHub" to="/coding" />
            <QuickAction icon={Briefcase} label="Browse Drives" to="/drives" />
            <QuickAction icon={ExternalLink} label="View Applications" to="/drives/applications" />
          </div>
          
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start justify-between">
            <div>
              <h4 className="text-sm font-semibold text-blue-800">Verify your skills & certificates</h4>
              <p className="text-xs text-blue-600 mt-1">Get verified by mentors and stand out</p>
            </div>
            <Link to="/skills" className="text-xs font-semibold text-blue-700 bg-white px-2 py-1 rounded border border-blue-200 shadow-sm">View Queue →</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 6. Coding Activity */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Coding Activity</h2>
            <Link to="/coding" className="text-sm text-blue-600 font-medium hover:underline">View All</Link>
          </div>
          <div className="space-y-5">
            <CodingRow 
              platform="LeetCode" 
              stat={`${dashboard.coding.leetcode.solved} problems solved`}
              highlight={dashboard.coding.leetcode.ranking ? `Top ${(dashboard.coding.leetcode.ranking / 3000000 * 100).toFixed(0)}%` : 'Active'}
              subHighlight="Ranking"
            />
            <CodingRow 
              platform="HackerRank" 
              stat={`${dashboard.coding.hackerrank.stars} Star (${dashboard.coding.hackerrank.language || 'Any'})`}
              highlight="Active"
              subHighlight="This month"
            />
            <CodingRow 
              platform="SkillRack" 
              stat={`${dashboard.coding.skillrack.points.toLocaleString()} points`}
              highlight={dashboard.coding.skillrack.rank ? `Top ${dashboard.coding.skillrack.rank}` : 'Active'}
              subHighlight="Ranking"
            />
            <CodingRow 
              platform="GitHub" 
              stat={`${dashboard.coding.github.repositories} repositories`}
              highlight="Active"
              subHighlight="This week"
            />
          </div>
        </div>

        {/* 7. Upcoming Drives */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Upcoming Drives</h2>
            <Link to="/drives" className="text-sm text-blue-600 font-medium hover:underline">View All</Link>
          </div>
          {dashboard.placements.upcoming.length > 0 ? (
            <div className="space-y-4">
              {dashboard.placements.upcoming.map((drive) => (
                <div key={drive.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">{drive.company}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{drive.role} • {drive.package}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="text-xs text-gray-500 mb-2">{format(new Date(drive.deadline), 'dd MMM yyyy')}</p>
                    {drive.applied ? (
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded">Applied</span>
                    ) : (
                      <Link to={`/drives/${drive.id}`} className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded transition-colors">Apply</Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-gray-500">No upcoming drives at the moment.</div>
          )}
        </div>

        {/* Mentor & Tasks */}
        <div className="space-y-6">
          {/* 8. Mentor Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Your Mentor</h2>
              <span className="text-sm text-blue-600 font-medium hover:underline cursor-pointer">View Profile</span>
            </div>
            {dashboard.mentor ? (
              <>
                <div className="flex items-center space-x-3 mb-4">
                  {dashboard.mentor.avatar ? (
                    <img src={dashboard.mentor.avatar} alt="Mentor" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                      {dashboard.mentor.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{dashboard.mentor.name}</h4>
                    <p className="text-xs text-gray-500">{dashboard.mentor.department} Department</p>
                  </div>
                </div>
                {dashboard.mentor.feedback && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-xs font-semibold text-gray-700">Recent Feedback</h5>
                      <span className="text-[10px] text-gray-400">{format(new Date(dashboard.mentor.feedback.created_at), 'dd MMM')}</span>
                    </div>
                    <div className="bg-green-50/50 border border-green-100 rounded-lg p-3 relative">
                      <span className="absolute top-2 left-2 text-green-300 text-2xl font-serif">"</span>
                      <p className="text-xs text-gray-700 pl-4 italic relative z-10 leading-relaxed">
                        {dashboard.mentor.feedback.message}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-500 py-4">No mentor assigned yet.</div>
            )}
          </div>

          {/* 9. Today's Tasks */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Today's Tasks</h2>
            {dashboard.tasks.length > 0 ? (
              <div className="space-y-3">
                {dashboard.tasks.map((task) => (
                  <Link key={task.id} to={task.action} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded -mx-2 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 border-2 border-gray-300 rounded flex-shrink-0 group-hover:border-blue-500 transition-colors"></div>
                      <span className="text-sm text-gray-700">{task.title}</span>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      task.priority === 'high' ? 'text-red-600 bg-red-50' : 
                      task.priority === 'medium' ? 'text-orange-600 bg-orange-50' : 
                      'text-gray-600 bg-gray-100'
                    }`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">You're all caught up!</div>
            )}
          </div>
        </div>
      </div>

      {/* 10. Timeline & Notifications Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Timeline</h2>
          {dashboard.timeline.length > 0 ? (
            <div className="relative flex justify-between items-start before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gray-200 py-4 overflow-x-auto pb-8">
              {/* Horizontal Timeline Implementation */}
              <div className="flex w-full min-w-max justify-between items-center relative z-10 px-4">
                {/* Connecting Line */}
                <div className="absolute top-4 left-8 right-8 h-0.5 bg-gray-200 -z-10"></div>
                
                {dashboard.timeline.map((event, idx) => (
                  <div key={event.id} className="flex flex-col items-center flex-1">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center border-4 border-white shadow-sm mb-3">
                      {event.type.includes('applied') ? <Briefcase size={14} /> :
                       event.type.includes('verified') ? <ShieldCheck size={14} /> :
                       event.type.includes('approved') ? <ShieldCheck size={14} /> :
                       event.type.includes('upload') ? <FileText size={14} /> :
                       <Activity size={14} />}
                    </div>
                    <h4 className="text-xs font-semibold text-gray-900 text-center">{event.title}</h4>
                    <p className="text-[10px] text-gray-500 mt-1">{format(new Date(event.created_at), 'dd MMM yyyy')}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-gray-500">No timeline events yet. Start building your profile!</div>
          )}
        </div>

        {/* 5. Notifications */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Notifications</h2>
            <Link to="/notifications" className="text-sm text-blue-600 font-medium hover:underline">View All</Link>
          </div>
          {dashboard.notifications.items.length > 0 ? (
            <div className="space-y-4">
              {dashboard.notifications.items.map((notif) => (
                <div key={notif.id} className="flex space-x-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                    notif.type.includes('approved') || notif.type.includes('verified') ? 'bg-green-50 text-green-600' :
                    notif.type.includes('drive') ? 'bg-blue-50 text-blue-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {notif.type.includes('approved') || notif.type.includes('verified') ? <ShieldCheck size={14} /> :
                     notif.type.includes('drive') ? <Briefcase size={14} /> :
                     <Activity size={14} />}
                  </div>
                  <div>
                    <p className="text-xs text-gray-800 leading-snug">{notif.title}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{format(new Date(notif.created_at), 'dd MMM')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-gray-500">No new notifications.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helpers
function PortfolioBar({ label, icon: Icon, value, color }) {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2 w-28 flex-shrink-0">
        <Icon size={16} className="text-gray-400" />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }}></div>
      </div>
      <span className="text-xs font-semibold text-gray-500 w-8 text-right">{value}%</span>
    </div>
  );
}

function QuickAction({ icon: Icon, label, to }) {
  return (
    <Link to={to} className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm transition-all group">
      <Icon size={20} className="text-gray-400 group-hover:text-blue-600 mb-2 transition-colors" />
      <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700 text-center">{label}</span>
    </Link>
  );
}

function CodingRow({ platform, stat, highlight, subHighlight }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded bg-gray-50 flex items-center justify-center border border-gray-100">
          <Code2 size={16} className="text-gray-600" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{platform}</h4>
          <p className="text-xs text-gray-500">{stat}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">{highlight}</p>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{subHighlight}</p>
      </div>
    </div>
  );
}
