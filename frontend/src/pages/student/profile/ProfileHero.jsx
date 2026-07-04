import {
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Calendar,
  BadgeCheck,
} from "lucide-react";

export default function ProfileHero({ student, profileCompletion }) {
  const initials =
    student?.full_name
      ?.split(" ")
      .map((name) => name[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "ST";

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-r from-white via-blue-50 to-slate-50 shadow-sm">

      {/* Decorative background */}
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl" />
      <div className="absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-indigo-100/40 blur-2xl" />

      <div className="relative flex flex-col gap-5 px-6 py-5 lg:flex-row lg:items-center">

        {/* Avatar */}
        <div className="flex justify-center lg:block">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white shadow-md ring-4 ring-white">
            {initials}
          </div>
        </div>

        {/* Main Details */}
        <div className="flex-1 min-w-0">

          <h1 className="text-2xl font-bold text-slate-900">
            {student?.full_name || "Student"}
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            {student?.preferred_job_role || "Student"}
          </p>

          {/* Badges */}
          <div className="mt-3 flex flex-wrap gap-2">

            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {student?.roll_number || "Roll Number"}
            </span>

            <span className="rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              Batch {student?.batch_year || "--"}
            </span>

            <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              CGPA {student?.cgpa || "--"}
            </span>

          </div>

          {/* Info */}
          <div className="mt-4 grid gap-x-8 gap-y-2 text-sm md:grid-cols-2">

            <div className="flex items-center gap-2 text-slate-600">
              <Mail size={15} className="text-slate-400" />
              <span>{student?.email || "Not Available"}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <Phone size={15} className="text-slate-400" />
              <span>{student?.phone || "Not Available"}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <MapPin size={15} className="text-slate-400" />
              <span>
                {student?.city || "--"}
                {student?.state ? `, ${student.state}` : ""}
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <GraduationCap size={15} className="text-slate-400" />
              <span>{student?.department || "Department"}</span>
            </div>

          </div>

        </div>

        {/* Divider */}
        <div className="hidden h-28 w-px bg-slate-200 lg:block" />

        {/* Score Card */}
        <div className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:w-52">

          <div className="flex items-center gap-2 text-slate-600">
            <BadgeCheck size={15} className="text-blue-600" />
            <span className="text-sm font-semibold">
              Profile Score
            </span>
          </div>

          <div className="mt-3 text-4xl font-bold text-blue-600">
            {profileCompletion?.percentage ?? 0}%
          </div>

          <div className="text-sm text-slate-500">
            Complete
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
              style={{
                width: `${profileCompletion?.percentage ?? 0}%`,
              }}
            />
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <Calendar size={12} />
            Updated Recently
          </div>

        </div>

      </div>

    </div>
  );
}