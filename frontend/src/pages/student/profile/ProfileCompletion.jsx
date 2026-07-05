import {
  CheckCircle2,
  Circle,
} from "lucide-react";

export default function ProfileCompletion({
  profileCompletion,
}) {
  const {
    percentage = 0,
    completed_sections = [],
    missing_sections = [],
    progress = [],
  } = profileCompletion || {};

  const totalSections = progress.length || 0;
  const completedCount = completed_sections.length || 0;

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference -
    (percentage / 100) * circumference;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

      {/* Header */}

      <div className="mb-3 flex items-center justify-between">

        <div>

          <h3 className="text-sm font-bold text-slate-900">
            Profile Completion
          </h3>

        </div>

      </div>

      {/* Circular Progress */}

      <div className="flex items-center gap-4">

        <div className="relative h-[72px] w-[72px] shrink-0">

          <svg
            className="-rotate-90"
            width="72"
            height="72"
          >
            <circle
              cx="36"
              cy="36"
              r={radius}
              stroke="#E2E8F0"
              strokeWidth="8"
              fill="none"
            />

            <circle
              cx="36"
              cy="36"
              r={radius}
              stroke="#2563EB"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">

            <span className="text-sm font-bold text-slate-900">
              {percentage}%
            </span>

          </div>

        </div>

        <div>
          <div className="text-sm font-semibold text-slate-900">
            {completedCount} of {totalSections}
          </div>
          <div className="text-xs text-slate-500">
            Sections Completed
          </div>
        </div>

      </div>

      {/* Divider */}

      <div className="my-3 border-t border-slate-100" />

      {/* Checklist */}

      <div className="space-y-1.5">

        {progress.map((item) => (

          <div
            key={item.id}
            className="flex items-center justify-between"
          >

            <div className="flex items-center gap-2">

              {item.completed ? (
                <CheckCircle2
                  size={14}
                  className="text-emerald-500"
                />
              ) : (
                <Circle
                  size={14}
                  className="text-slate-300"
                />
              )}

              <span
                className={`text-xs ${
                  item.completed
                    ? "text-slate-800"
                    : "text-slate-500"
                }`}
              >
                {item.title}
              </span>

            </div>

          </div>

        ))}

      </div>

      {/* Footer */}

      <div className="mt-3 rounded-lg bg-slate-50 p-2">

        <p className="text-xs text-slate-600">

          <span className="font-semibold text-slate-900">
            {completedCount}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-slate-900">
            {totalSections}
          </span>{" "}
          profile sections completed.

        </p>

      </div>

    </div>
  );
}