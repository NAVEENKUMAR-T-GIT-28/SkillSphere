export default function HackerRankDetails({ data }) {
  const allBadges = data.badges || [];
  
  const tutorialKeywords = ['days of', 'interview preparation', 'tutorial'];
  const tutorials = allBadges.filter(b => tutorialKeywords.some(kw => b.badgeName?.toLowerCase().includes(kw)));
  const languages = allBadges.filter(b => !tutorials.includes(b));
  
  const topBadge = allBadges.reduce((prev, current) => (prev.stars > current.stars) ? prev : current, { stars: 0 });

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <section>
        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Profile</h3>
        <div className="grid grid-cols-2 gap-4">
          {data.createdAt && <div><div className="text-xs text-gray-500 uppercase tracking-wide">Member Since</div><div className="font-medium text-gray-900">{new Date(data.createdAt).toLocaleDateString()}</div></div>}
        </div>
      </section>

      {/* Statistics */}
      <section>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-green-50 p-4 rounded-xl border border-green-100">
            <div className="text-3xl font-extrabold text-green-900">{allBadges.length}</div>
            <div className="text-xs text-green-700 font-medium uppercase tracking-wide mt-1">Badges</div>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <div className="text-3xl font-extrabold text-emerald-900">{data.certificates?.length || 0}</div>
            <div className="text-xs text-emerald-700 font-medium uppercase tracking-wide mt-1">Certificates</div>
          </div>
        </div>
      </section>

      {/* Top Skill */}
      {topBadge.stars > 0 && (
        <section>
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Top Skill</h3>
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-xl shadow-md flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-green-100 mb-1">Highest Proficiency</div>
              <div className="text-3xl font-bold">{topBadge.badgeName}</div>
              <div className="text-yellow-300 text-xl tracking-widest mt-2">
                {Array.from({ length: topBadge.stars }).map(() => '★').join('')}
              </div>
            </div>
            <div className="text-5xl opacity-80">
              {topBadge.badgeName?.toLowerCase().includes('python') ? '🐍' : '🏆'}
            </div>
          </div>
        </section>
      )}

      {/* Languages */}
      {languages.length > 0 && (
        <section>
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Language Skills</h3>
          <div className="grid gap-3">
            {languages.map((b, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
                <div>
                  <div className="font-bold text-gray-800">{b.badgeName}</div>
                  <div className="text-xs text-gray-500 mt-1 uppercase">Language Proficiency</div>
                </div>
                <div className="text-yellow-500 text-lg tracking-widest">
                  {Array.from({ length: b.stars }).map(() => '★').join('')}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tutorials */}
      {tutorials.length > 0 && (
        <section>
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Tutorial Achievements</h3>
          <div className="grid gap-3">
            {tutorials.map((b, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
                <div>
                  <div className="font-bold text-gray-800">{b.badgeName}</div>
                  <div className="text-xs text-gray-500 mt-1 uppercase">Tutorial</div>
                </div>
                <div className="text-yellow-500 text-lg tracking-widest">
                  {Array.from({ length: b.stars }).map(() => '★').join('')}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certificates */}
      {data.certificates?.length > 0 && (
        <section>
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">
            Certificates
          </h3>
      
          <div className="space-y-3">
            {data.certificates.map((cert, i) => (
              <div
                key={i}
                className="p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-green-200 hover:bg-green-50/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-gray-800">
                      {cert.name}
                    </div>
            
                    <div className="text-xs text-gray-500 mt-1">
                      {cert.level} Certification
                    </div>
            
                    {cert.completedAt && (
                      <div className="text-xs text-gray-400 mt-1">
                        Completed{" "}
                        {new Date(cert.completedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs font-bold">
                      {cert.score}%
                    </span>
                  
                    {cert.image && (
                      <a
                        href={cert.image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                          inline-flex
                          items-center
                          gap-1
                          px-3
                          py-1.5
                          rounded-lg
                          bg-green-600
                          text-white
                          text-xs
                          font-medium
                          hover:bg-green-700
                          transition-colors
                        "
                      >
                        View Certificate →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
