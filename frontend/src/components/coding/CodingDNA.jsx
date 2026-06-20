import { Eye } from "lucide-react";
import ProgressBar from "./ProgressBar";

export function aggregateLanguageDNA(platforms) {
  const sr = platforms?.skillrack?.data;
  const lc = platforms?.leetcode?.data;
  const hr = platforms?.hackerrank?.data;

  const map = {};

  const add = (lang, source, count) => {
    if (!count) return;
    if (!map[lang]) map[lang] = { total: 0, skillrack: 0, leetcode: 0, hackerrank: 0 };
    map[lang][source] += count;
    map[lang].total += count;
  };

  // SkillRack
  if (sr) {
    add('C', 'skillrack', sr.c);
    add('Python', 'skillrack', sr.python3);
    add('Java', 'skillrack', sr.java);
    add('C++', 'skillrack', sr.cpp23 || sr.cpp);
    add('SQL', 'skillrack', sr.sql);
  }

  // LeetCode
  if (lc?.languageProblemCount) {
    lc.languageProblemCount.forEach(item => {
      let lang = item.languageName;
      if (lang === 'Python3') lang = 'Python';
      if (lang === 'MySQL') lang = 'SQL';
      add(lang, 'leetcode', item.problemsSolved);
    });
  }

  // HackerRank
  if (hr?.badges) {
    const tutorialKeywords = ['days of', 'interview preparation', 'tutorial'];
    hr.badges.forEach(b => {
      const name = b.badgeName;
      if (!name) return;
      if (tutorialKeywords.some(kw => name.toLowerCase().includes(kw))) return;
      
      const count = b.solved || b.points || (b.stars ? b.stars * 5 : 5); 
      add(name, 'hackerrank', count);
    });
  }

  return Object.entries(map).map(([name, stats]) => ({
    name,
    ...stats
  })).sort((a, b) => b.total - a.total);
}

export default function CodingDNA({ platforms, onViewFullDNA }) {
  const dna = aggregateLanguageDNA(platforms);

  if (!dna || dna.length === 0) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm border h-full flex flex-col items-center justify-center text-center">
        <h3 className="font-semibold text-lg mb-2 text-gray-700">Coding DNA</h3>
        <p className="text-sm text-gray-500">Link platforms to view your strongest programming languages.</p>
      </div>
    );
  }

  const top3 = dna.slice(0, 3);
  const max = top3[0]?.total || 1;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border transition-all hover:shadow-md h-full flex flex-col">
      <h3 className="font-semibold text-lg mb-4 text-gray-800">
        Coding DNA
      </h3>

      <div className="space-y-4 flex-1">
        {top3.map((lang, idx) => {
          const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500'];
          return (
            <ProgressBar
              key={lang.name}
              label={lang.name}
              value={lang.total}
              max={max}
              color={colors[idx % colors.length]}
            />
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
        <button 
          onClick={onViewFullDNA}
          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-2 rounded-md hover:bg-indigo-100"
        >
          <Eye size={14} /> View Full DNA <span className="opacity-70">→</span>
        </button>
      </div>
    </div>
  );
}
