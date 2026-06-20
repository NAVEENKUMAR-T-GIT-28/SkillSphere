import { Code2, Award, Trophy, Link2 } from "lucide-react";

function StatCard({ icon, title, value }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border transition-all hover:shadow-md">
      <div className="flex justify-between items-center">
        {icon}
        <span className="text-2xl font-bold">
          {value}
        </span>
      </div>

      <p className="text-sm text-gray-500 mt-2">
        {title}
      </p>
    </div>
  );
}

import { getTotalSolvedProblems } from "../../utils/codingUtils";

export default function CodingOverview({
  platforms
}) {
  const lc = platforms?.leetcode?.data;
  const hr = platforms?.hackerrank?.data;
  const sr = platforms?.skillrack?.data;

  const totalSolved = getTotalSolvedProblems(platforms);

  const totalCertificates =
    (sr?.certificates || 0) +
    (hr?.certificates?.length || 0);

  const connected =
    Object.values(platforms || {}).filter(
      p => p?.linked
    ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        icon={<Code2 className="text-blue-500" size={28} />}
        title="Problems Solved"
        value={totalSolved.toLocaleString()}
      />

      <StatCard
        icon={<Award className="text-purple-500" size={28} />}
        title="Certificates"
        value={totalCertificates}
      />

      <StatCard
        icon={<Link2 className="text-green-500" size={28} />}
        title="Platforms Linked"
        value={connected}
      />

      <StatCard
        icon={<Trophy className="text-yellow-500" size={28} />}
        title="SkillRack Rank"
        value={sr?.rank ? `#${sr.rank}` : "—"}
      />
    </div>
  );
}
