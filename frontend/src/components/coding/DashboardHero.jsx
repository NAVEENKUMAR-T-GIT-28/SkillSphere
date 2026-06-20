import { getTotalSolvedProblems } from "../../utils/codingUtils";

export default function DashboardHero({ user, platforms }) {
  const hr = platforms?.hackerrank?.data;
  const sr = platforms?.skillrack?.data;

  const totalSolved = getTotalSolvedProblems(platforms);
  const totalCertificates = (sr?.certificates || 0) + (hr?.certificates?.length || 0);

  const topBadge = hr?.badges?.reduce((prev, current) => (prev.stars > current.stars) ? prev : current, { stars: 0 });
  const topSkill = topBadge && topBadge.stars > 0 ? topBadge.badgeName : (sr?.python3 > sr?.c ? 'Python' : (sr?.c ? 'C' : 'Programming'));

  const syncTimes = Object.values(platforms || {}).map(p => p.fetched_at ? new Date(p.fetched_at).getTime() : null).filter(Boolean);
  const lastSync = syncTimes.length ? new Date(Math.max(...syncTimes)) : null;

  const timeAgo = (date) => {
    if (!date) return null;
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl min-h-[180px] p-8 shadow-md relative overflow-hidden mb-6">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-10 blur-2xl"></div>
      <div className="absolute bottom-0 right-40 w-40 h-40 rounded-full bg-white opacity-5 blur-xl"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end h-full gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-100 font-medium mb-1">
            <span className="text-xl">👨‍💻</span> {user?.name || 'Developer'}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Developer Dashboard</h1>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-blue-50">
            <div className="flex items-center gap-1.5">
              <span className="text-xl">🏆</span> {totalSolved.toLocaleString()} Problems Solved
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl">📜</span> {totalCertificates} Certificates
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl">🔥</span> Top Skill: {topSkill}
            </div>
          </div>
        </div>
        
        <div className="text-xs font-medium text-blue-200 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
          Last Synced {lastSync ? timeAgo(lastSync) : 'Never'}
        </div>
      </div>
    </div>
  );
}
