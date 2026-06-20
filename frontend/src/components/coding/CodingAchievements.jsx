export default function CodingAchievements({
  platforms
}) {
  const sr = platforms?.skillrack?.data;
  const hr = platforms?.hackerrank?.data;

  const totalCertificates = (sr?.certificates || 0) + (hr?.certificates?.length || 0);
  const totalSolved = (platforms?.leetcode?.data?.totalSolved || 0) + (sr?.solved || 0);

  const hasPython5Star = hr?.badges?.some(b => 
    b.badgeName?.toLowerCase().includes('python') && b.stars >= 5
  );

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border transition-all hover:shadow-md h-full">
      <h3 className="font-semibold text-lg mb-4 text-gray-800">
        Achievements
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border border-gray-100 rounded-lg p-4 bg-gray-50 flex items-center gap-3 transition-transform hover:scale-[1.02]">
          <span className="text-2xl">🏆</span>
          <span className="font-medium text-sm text-gray-700">{totalSolved} Problems Solved</span>
        </div>

        <div className="border border-gray-100 rounded-lg p-4 bg-gray-50 flex items-center gap-3 transition-transform hover:scale-[1.02]">
          <span className="text-2xl">🥇</span>
          <span className="font-medium text-sm text-gray-700">SkillRack Rank #{sr?.rank || '—'}</span>
        </div>

        <div className="border border-gray-100 rounded-lg p-4 bg-gray-50 flex items-center gap-3 transition-transform hover:scale-[1.02]">
          <span className="text-2xl">📜</span>
          <span className="font-medium text-sm text-gray-700">{totalCertificates} Certificates Earned</span>
        </div>

        {hasPython5Star && (
          <div className="border border-gray-100 rounded-lg p-4 bg-gray-50 flex items-center gap-3 transition-transform hover:scale-[1.02]">
            <span className="text-2xl">🐍</span>
            <span className="font-medium text-sm text-gray-700">Python 5★ HackerRank</span>
          </div>
        )}
      </div>
    </div>
  );
}
