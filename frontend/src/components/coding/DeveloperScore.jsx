import { Trophy, TrendingUp, Sparkles } from "lucide-react";
import { getTotalSolvedProblems } from "../../utils/codingUtils";

export default function DeveloperScore({ platforms }) {
  const lc = platforms?.leetcode?.data;
  const hr = platforms?.hackerrank?.data;
  const sr = platforms?.skillrack?.data;

  const problemsSolved = getTotalSolvedProblems(platforms);

  const certificates =
    (sr?.certificates || 0) +
    (hr?.certificates?.length || 0);

  const badges =
    hr?.badges?.length || 0;

  const problemsWeight = Math.min(
    (problemsSolved / 1000) * 40,
    40
  );

  const certsWeight = Math.min(
    (certificates / 10) * 20,
    20
  );

  const badgesWeight = Math.min(
    (badges / 5) * 20,
    20
  );

  let rankWeight = 0;

  if (sr?.rank) {
    if (sr.rank < 1000) {
      rankWeight = 20;
    } else if (sr.rank < 5000) {
      rankWeight = 15;
    } else if (sr.rank < 10000) {
      rankWeight = 10;
    } else {
      rankWeight = 5;
    }
  }

  const score = Math.round(
    problemsWeight +
      certsWeight +
      badgesWeight +
      rankWeight
  );

  const radius = 42;
  const circumference =
    2 * Math.PI * radius;

  const offset =
    circumference -
    (score / 100) * circumference;

  const level =
    score >= 90
      ? {
          title: "Elite Tier",
          icon: Trophy,
          badgeClass:
            "bg-amber-50 text-amber-700 border border-amber-200"
        }
      : score >= 75
      ? {
          title: "Advanced Tier",
          icon: TrendingUp,
          badgeClass:
            "bg-violet-50 text-violet-700 border border-violet-200"
        }
      : score >= 60
      ? {
          title: "Intermediate Tier",
          icon: Sparkles,
          badgeClass:
            "bg-blue-50 text-blue-700 border border-blue-200"
        }
      : {
          title: "Starter Tier",
          icon: Sparkles,
          badgeClass:
            "bg-slate-50 text-slate-700 border border-slate-200"
        };

  const Icon = level.icon;

  return (
    <div className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-all p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg text-gray-900">
          Developer Strength
        </h3>

        <div
          className={`px-3 py-1 rounded-full text-xs font-medium ${level.badgeClass}`}
        >
          {level.title}
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32">
          <svg
            className="w-32 h-32 -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="8"
            />

            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#4F46E5"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-gray-900">
              {score}
            </span>

            <span className="text-xs text-gray-500 uppercase tracking-wide">
              Score
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-5">
          <Icon
            size={18}
            className="text-indigo-600"
          />

          <span className="font-medium text-gray-900">
            {level.title}
          </span>
        </div>

        <p className="text-sm text-gray-500 text-center mt-3 max-w-xs">
          Calculated from coding activity,
          certificates, badges and platform
          rankings.
        </p>

        <div className="w-full mt-6 pt-4 border-t">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">
                Problems Solved
              </span>
              <span className="font-medium">
                {problemsSolved.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">
                Certificates
              </span>
              <span className="font-medium">
                {certificates}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">
                HackerRank Badges
              </span>
              <span className="font-medium">
                {badges}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">
                SkillRack Rank
              </span>
              <span className="font-medium">
                #{sr?.rank || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 