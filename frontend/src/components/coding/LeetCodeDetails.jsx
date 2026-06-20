import ProgressBar from "./ProgressBar";

export default function LeetCodeDetails({ data }) {
  // Aggregate tags for top topics
  const allTags = [];
  if (data.tagProblemCounts) {
    Object.values(data.tagProblemCounts).forEach(levelArray => {
      if (Array.isArray(levelArray)) {
        levelArray.forEach(tag => {
          const existing = allTags.find(t => t.tagName === tag.tagName);
          if (existing) {
            existing.problemsSolved += tag.problemsSolved;
          } else {
            allTags.push({ ...tag });
          }
        });
      }
    });
  }
  const topTags = allTags.sort((a, b) => b.problemsSolved - a.problemsSolved).slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <section>
        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Profile</h3>
        <div className="grid grid-cols-2 gap-4">
          {data.username && <div><div className="text-xs text-gray-500 uppercase tracking-wide">Username</div><div className="font-medium text-gray-900">{data.username}</div></div>}
          {data.ranking && <div><div className="text-xs text-gray-500 uppercase tracking-wide">Ranking</div><div className="font-medium text-gray-900">{data.ranking.toLocaleString()}</div></div>}
          {data.reputation > 0 && <div><div className="text-xs text-gray-500 uppercase tracking-wide">Reputation</div><div className="font-medium text-gray-900">{data.reputation}</div></div>}
          {data.country && <div><div className="text-xs text-gray-500 uppercase tracking-wide">Country</div><div className="font-medium text-gray-900">{data.country}</div></div>}
          {data.school && <div><div className="text-xs text-gray-500 uppercase tracking-wide">School</div><div className="font-medium text-gray-900">{data.school}</div></div>}
          {data.company && <div><div className="text-xs text-gray-500 uppercase tracking-wide">Company</div><div className="font-medium text-gray-900">{data.company}</div></div>}
        </div>
      </section>

      {/* Problem Solving */}
      <section>
        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Problem Solving</h3>
        <div className="mb-4 text-center p-4 bg-yellow-50 rounded-xl border border-yellow-100">
          <div className="text-4xl font-extrabold text-yellow-900">{data.totalSolved || 0}</div>
          <div className="text-xs text-yellow-700 font-medium uppercase tracking-wide mt-1">Problems Solved</div>
        </div>
        <div className="space-y-3">
          <ProgressBar label="Easy" value={data.easySolved || 0} max={data.totalSolved} color="bg-green-500" />
          <ProgressBar label="Medium" value={data.mediumSolved || 0} max={data.totalSolved} color="bg-yellow-500" />
          <ProgressBar label="Hard" value={data.hardSolved || 0} max={data.totalSolved} color="bg-red-500" />
        </div>
      </section>

      {/* Contest Section */}
      <section>
        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Contest Performance</h3>
        {data.contestRating ? (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="text-xl font-bold text-gray-800">{Math.round(data.contestRating)}</div>
              <div className="text-xs text-gray-500 mt-1">Rating</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="text-xl font-bold text-gray-800">{data.globalRanking || '—'}</div>
              <div className="text-xs text-gray-500 mt-1">Global Rank</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="text-xl font-bold text-gray-800">{data.topPercentage ? `${data.topPercentage}%` : '—'}</div>
              <div className="text-xs text-gray-500 mt-1">Top %</div>
            </div>
          </div>
        ) : (
          <div className="text-center p-4 bg-gray-50 rounded-lg text-gray-500 text-sm">
            No contest participation yet
          </div>
        )}
      </section>

      {/* Languages */}
      {data.languageProblemCount?.length > 0 && (
        <section>
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Language Usage</h3>
          <div className="space-y-3">
            {data.languageProblemCount.map(lang => (
              <ProgressBar 
                key={lang.languageName} 
                label={lang.languageName} 
                value={lang.problemsSolved} 
                max={data.totalSolved} 
                color="bg-blue-500" 
              />
            ))}
          </div>
        </section>
      )}

      {/* Topics */}
      {topTags.length > 0 && (
        <section>
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Top Topics</h3>
          <div className="space-y-3">
            {topTags.map(tag => (
              <ProgressBar 
                key={tag.tagName} 
                label={tag.tagName} 
                value={tag.problemsSolved} 
                max={topTags[0]?.problemsSolved} 
                color="bg-indigo-500" 
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
