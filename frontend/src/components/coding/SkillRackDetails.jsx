import ProgressBar from "./ProgressBar";

export default function SkillRackDetails({ data }) {
  const languages = [
    { name: 'C', value: data.c || 0 },
    { name: 'Python', value: data.python3 || 0 },
    { name: 'Java', value: data.java || 0 },
    { name: 'C++', value: data.cpp || 0 },
    { name: 'SQL', value: data.sql || 0 }
  ].filter(l => l.value > 0).sort((a, b) => b.value - a.value);
  
  const maxLang = languages.length > 0 ? languages[0].value : 1;

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <section>
        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Profile</h3>
        <div className="grid grid-cols-2 gap-4">
          {data.name && <div><div className="text-xs text-gray-500 uppercase tracking-wide">Name</div><div className="font-medium text-gray-900">{data.name}</div></div>}
          {data.department && <div><div className="text-xs text-gray-500 uppercase tracking-wide">Department</div><div className="font-medium text-gray-900">{data.department}</div></div>}
          {data.college && <div><div className="text-xs text-gray-500 uppercase tracking-wide">College</div><div className="font-medium text-gray-900">{data.college}</div></div>}
          {data.year && <div><div className="text-xs text-gray-500 uppercase tracking-wide">Year</div><div className="font-medium text-gray-900">{data.year}</div></div>}
        </div>
      </section>

      {/* Performance Hero */}
      <section>
        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-center">
            <div className="text-2xl font-extrabold text-purple-900">{data.solved || 0}</div>
            <div className="text-[10px] text-purple-700 font-bold uppercase tracking-wide mt-1">Problems Solved</div>
          </div>
          <div className="bg-violet-50 p-4 rounded-xl border border-violet-100 text-center">
            <div className="text-2xl font-extrabold text-violet-900">{data.points?.toLocaleString() || 0}</div>
            <div className="text-[10px] text-violet-700 font-bold uppercase tracking-wide mt-1">Points</div>
          </div>
          <div className="bg-fuchsia-50 p-4 rounded-xl border border-fuchsia-100 text-center">
            <div className="text-2xl font-extrabold text-fuchsia-900">{data.rank ? `#${data.rank}` : '—'}</div>
            <div className="text-[10px] text-fuchsia-700 font-bold uppercase tracking-wide mt-1">Rank</div>
          </div>
        </div>
      </section>

      {/* Languages */}
      {languages.length > 0 && (
        <section>
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Languages</h3>
          <div className="space-y-3">
            {languages.map(lang => (
              <ProgressBar 
                key={lang.name} 
                label={lang.name} 
                value={lang.value} 
                max={maxLang} 
                color="bg-purple-500" 
              />
            ))}
          </div>
        </section>
      )}

      {/* Activity Breakdown */}
      <section>
        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Activity Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
            <div className="text-lg font-bold text-gray-800">{data.codeTrack || 0}</div>
            <div className="text-xs text-gray-500 mt-1">CodeTrack</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
            <div className="text-lg font-bold text-gray-800">{data.dc || 0}</div>
            <div className="text-xs text-gray-500 mt-1">DC</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
            <div className="text-lg font-bold text-gray-800">{data.dt || 0}</div>
            <div className="text-xs text-gray-500 mt-1">DT</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
            <div className="text-lg font-bold text-gray-800">{data.codeTutor || 0}</div>
            <div className="text-xs text-gray-500 mt-1">CodeTutor</div>
          </div>
        </div>
      </section>

      {/* Medals */}
      <section>
        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Medals</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-yellow-50/50 p-3 rounded-lg border border-yellow-200 text-center">
            <div className="text-2xl mb-1">🥇</div>
            <div className="text-lg font-bold text-yellow-900">{data.gold || 0}</div>
            <div className="text-xs text-yellow-700 mt-1 uppercase">Gold</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-300 text-center">
            <div className="text-2xl mb-1">🥈</div>
            <div className="text-lg font-bold text-gray-800">{data.silver || 0}</div>
            <div className="text-xs text-gray-600 mt-1 uppercase">Silver</div>
          </div>
          <div className="bg-orange-50/50 p-3 rounded-lg border border-orange-200 text-center">
            <div className="text-2xl mb-1">🥉</div>
            <div className="text-lg font-bold text-orange-900">{data.bronze || 0}</div>
            <div className="text-xs text-orange-700 mt-1 uppercase">Bronze</div>
          </div>
        </div>
      </section>

      {/* Certificates */}
      {data.certificates > 0 && (
        <section>
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Certificates</h3>
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-5 rounded-xl shadow-sm flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{data.certificates}</div>
              <div className="text-sm text-purple-100 mt-1">Certificates Earned</div>
            </div>
            <div className="text-4xl">📜</div>
          </div>
        </section>
      )}
    </div>
  );
}
