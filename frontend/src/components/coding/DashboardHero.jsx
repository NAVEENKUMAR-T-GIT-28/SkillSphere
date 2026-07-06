import { Trophy, Award, BrainCircuit, Clock3, UserRound, Link2, Medal } from "lucide-react";
import { getTotalSolvedProblems } from "../../utils/codingUtils";

function HeroStat({ icon, title, value, bg }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm min-w-[180px]">

      <div className={`rounded-lg p-2 ${bg}`}>
        {icon}
      </div>

      <div>
        <p className="text-xs text-slate-500">
          {title}
        </p>

        <p className="text-lg font-semibold text-slate-900">
          {value}
        </p>
      </div>

    </div>
  );
}

export default function DashboardHero({ user, platforms }) {
  const hr = platforms?.hackerrank?.data;
  const sr = platforms?.skillrack?.data;

  const totalSolved = getTotalSolvedProblems(platforms);
  const totalCertificates =
    (sr?.certificates || 0) + (hr?.certificates?.length || 0);
  const connectedPlatforms = Object.values(
    platforms || {})
    .filter((p) => p
    ?.linked).length;

  const skillrackRank =sr?.rank ? `#${sr.rank}` : "—";

  const topBadge = hr?.badges?.reduce(
    (prev, current) =>
      prev.stars > current.stars ? prev : current,
    { stars: 0 }
  );

  const topSkill =
    topBadge && topBadge.stars > 0
      ? topBadge.badgeName
      : sr?.python3 > sr?.c
      ? "Python"
      : sr?.c
      ? "C"
      : "Programming";

  const syncTimes = Object.values(platforms || {})
    .map((p) => (p.fetched_at ? new Date(p.fetched_at).getTime() : null))
    .filter(Boolean);

  const lastSync = syncTimes.length
    ? new Date(Math.max(...syncTimes))
    : null;

  const timeAgo = (date) => {
    if (!date) return "Never";

    const mins = Math.floor((Date.now() - date.getTime()) / 60000);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;

    const hrs = Math.floor(mins / 60);

    if (hrs < 24) return `${hrs} hr ago`;

    const days = Math.floor(hrs / 24);

    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-blue-50  px-8 py-5 shadow-sm">

      {/* Decorative background */}
      <div className="absolute -top-20 -right-20 h-12 w-12 rounded-full bg-blue-100 opacity-40 blur-3xl" />
      <div className="absolute bottom-0 left-1/2 h-12 w-12 rounded-full bg-indigo-100 opacity-30 blur-2xl" />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">

        {/* Left */}
        <div>

          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
            <UserRound size={24} className="text-blue-600" />
            <h1 className="text-2xl font-bold">{user?.name.trim() || "Developer"}</h1>
          </div>
          <div className="flex flex-wrap gap-4">

  <HeroStat
    icon={<Trophy className="h-5 w-5 text-amber-500" />}
    title="Problems Solved"
    value={totalSolved.toLocaleString()}
    bg="bg-amber-50"
  />

  <HeroStat
    icon={<Award className="h-5 w-5 text-violet-600" />}
    title="Certificates"
    value={totalCertificates}
    bg="bg-violet-50"
  />

  <HeroStat
    icon={<BrainCircuit className="h-5 w-5 text-green-600" />}
    title="Top Skill"
    value={topSkill}
    bg="bg-green-50"
  />

  <HeroStat
    icon={<Link2 className="h-5 w-5 text-blue-600" />}
    title="Platforms Linked"
    value={connectedPlatforms}
    bg="bg-blue-50"
  />

  <HeroStat
    icon={<Medal className="h-5 w-5 text-yellow-600" />}
    title="SkillRack Rank"
    value={skillrackRank}
    bg="bg-yellow-50"
  />

</div>

        </div>

        {/* Right */}

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">

          <Clock3 size={16} className="text-slate-500" />

          <div>
            <p className="text-xs text-slate-500">
              Last Synced
            </p>

            <p className="text-sm font-semibold text-slate-900">
              {timeAgo(lastSync)}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}