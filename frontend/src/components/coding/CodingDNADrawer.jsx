import { X, CheckCircle2 } from "lucide-react";
import ProgressBar from "./ProgressBar";
import { aggregateLanguageDNA } from "./CodingDNA";

export default function CodingDNADrawer({ isOpen, onClose, platforms }) {
  if (!isOpen) return null;

  const dna = aggregateLanguageDNA(platforms);
  const totalLanguages = dna.length;
  const totalContributions = dna.reduce((sum, item) => sum + item.total, 0);
  const connectedPlatforms = Object.values(platforms || {}).filter(p => p?.linked).length;
  
  const primary = dna[0];
  const secondary = dna[1];
  const primaryPercentage = primary ? Math.round((primary.total / totalContributions) * 100) : 0;
  const top2Percentage = primary && secondary ? Math.round(((primary.total + secondary.total) / totalContributions) * 100) : primaryPercentage;

  const insights = [];
  if (primary) insights.push(`Primary language is ${primary.name}`);
  if (secondary) insights.push(`${secondary.name} is secondary strength`);
  if (totalLanguages >= 2) insights.push(`Top 2 languages contribute ${top2Percentage}% of coding activity`);
  if (connectedPlatforms > 1) insights.push('Strong multi-platform coding profile');

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-[550px] bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧬</span>
            <h2 className="text-xl font-bold text-gray-800">Coding DNA</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-800">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
          
          {/* Section 1: Summary */}
          <section className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
              <div className="text-2xl font-extrabold text-blue-900">{totalLanguages}</div>
              <div className="text-[10px] text-blue-700 font-bold uppercase tracking-wide mt-1">Total Languages</div>
            </div>
            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
              <div className="text-2xl font-extrabold text-indigo-900">{totalContributions}</div>
              <div className="text-[10px] text-indigo-700 font-bold uppercase tracking-wide mt-1">Contributions</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
              <div className="text-2xl font-extrabold text-purple-900">{connectedPlatforms}</div>
              <div className="text-[10px] text-purple-700 font-bold uppercase tracking-wide mt-1">Platforms</div>
            </div>
          </section>

          {/* Section 2: Top Language Hero */}
          {primary && (
            <section>
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-xl shadow-md flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-indigo-100 mb-1">Primary Language</div>
                  <div className="text-4xl font-bold">{primary.name}</div>
                  <div className="text-indigo-50 text-sm mt-2">{primary.total} Contributions</div>
                  <div className="text-indigo-200 text-xs mt-0.5">{primaryPercentage}% of total language activity</div>
                </div>
                <div className="text-6xl opacity-20 font-serif font-black">{primary.name.substring(0, 1)}</div>
              </div>
            </section>
          )}

          {/* Section 3 & 4: Full Distribution & Breakdown */}
          {dna.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Distribution & Breakdown</h3>
              <div className="space-y-4">
                {dna.map((lang, idx) => (
                  <div key={lang.name} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                    <ProgressBar 
                      label={lang.name} 
                      value={lang.total} 
                      max={primary.total} 
                      color="bg-indigo-500" 
                    />
                    
                    <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-3 gap-2 text-center text-xs">
                      {lang.skillrack > 0 && (
                        <div>
                          <span className="text-gray-500">SkillRack: </span>
                          <span className="font-semibold text-gray-800">{lang.skillrack}</span>
                        </div>
                      )}
                      {lang.leetcode > 0 && (
                        <div>
                          <span className="text-gray-500">LeetCode: </span>
                          <span className="font-semibold text-gray-800">{lang.leetcode}</span>
                        </div>
                      )}
                      {lang.hackerrank > 0 && (
                        <div>
                          <span className="text-gray-500">HackerRank: </span>
                          <span className="font-semibold text-gray-800">{lang.hackerrank}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 5: Insights */}
          {insights.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Insights</h3>
              <div className="space-y-3">
                {insights.map((insight, idx) => (
                  <div key={idx} className="flex gap-3 items-start bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                    <CheckCircle2 className="text-indigo-500 mt-0.5 shrink-0" size={16} />
                    <span className="text-sm text-gray-700 font-medium">
                      {insight}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
