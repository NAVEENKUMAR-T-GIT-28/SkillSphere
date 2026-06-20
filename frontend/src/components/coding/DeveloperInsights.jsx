import { CheckCircle2, AlertTriangle } from "lucide-react";
import { getTotalSolvedProblems } from "../../utils/codingUtils";

export default function DeveloperInsights({ platforms }) {
  const lc = platforms?.leetcode?.data;
  const hr = platforms?.hackerrank?.data;
  const sr = platforms?.skillrack?.data;

  const insights = [];

  if (sr?.c > 500) insights.push({ type: 'positive', text: 'Strong C foundation' });
  if (sr?.python3 > 300 || hr?.badges?.some(b => b.badgeName?.toLowerCase().includes('python') && b.stars >= 4)) {
    insights.push({ type: 'positive', text: 'Strong Python proficiency' });
  }
  
  const totalSolved = getTotalSolvedProblems(platforms);
  if (totalSolved >= 1000) {
    insights.push({ type: 'positive', text: `${totalSolved}+ solved problems` });
  }

  if (sr?.rank && sr.rank < 5000) {
    insights.push({ type: 'positive', text: 'Top performer on SkillRack' });
  }

  if (lc?.hardSolved > 20) {
    insights.push({ type: 'positive', text: 'Excellent complex problem solving skills' });
  }

  if ((!lc?.contestRating || lc.contestRating < 1500) && (!hr?.badges?.length)) {
    insights.push({ type: 'warning', text: 'Participate in contests to improve competitive profile' });
  } else if (!lc?.totalSolved || lc.totalSolved < 50) {
    insights.push({ type: 'warning', text: 'Solve more LeetCode problems to improve interview readiness' });
  }

  if (insights.length === 0) {
    insights.push({ type: 'positive', text: 'Keep practicing to unlock insights!' });
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border transition-all hover:shadow-md h-full">
      <h3 className="font-semibold text-lg mb-4 text-gray-800">
        Developer Insights
      </h3>

      <div className="space-y-4">
        {insights.map((insight, idx) => (
          <div key={idx} className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg border border-gray-100">
            {insight.type === 'positive' ? (
              <CheckCircle2 className="text-green-500 mt-0.5 shrink-0" size={18} />
            ) : (
              <AlertTriangle className="text-amber-500 mt-0.5 shrink-0" size={18} />
            )}
            <span className={`text-sm ${insight.type === 'positive' ? 'text-gray-700 font-medium' : 'text-amber-700 font-semibold'}`}>
              {insight.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
