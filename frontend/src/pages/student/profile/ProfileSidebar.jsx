import {
  User,
  GraduationCap,
  Briefcase,
  Globe,
  FileText,
  ChevronRight,
} from "lucide-react";

const MENU_ITEMS = [
  {
    id: "basic",
    title: "Basic",
    subtitle: "Basic information",
    icon: User,
  },
  {
    id: "academic",
    title: "Academic",
    subtitle: "Education details",
    icon: GraduationCap,
  },
  {
    id: "career",
    title: "Career",
    subtitle: "Career preferences",
    icon: Briefcase,
  },
  {
    id: "social",
    title: "Social",
    subtitle: "Portfolio & links",
    icon: Globe,
  },
  {
    id: "resume",
    title: "Resume",
    subtitle: "Resume settings",
    icon: FileText,
  },
];

export default function ProfileSidebar({
  activeSection,
  onChange,
}) {
  return (
    <aside>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">

        {/* Header */}

        <div className="border-b border-slate-100 px-4 py-3">

          <h2 className="text-sm font-bold text-slate-900">
            Profile Settings
          </h2>

          <p className="mt-0.5 text-xs text-slate-500">
            Manage your profile information
          </p>

        </div>

        {/* Menu */}

        <nav className="p-1.5 space-y-0.5" role="tablist" aria-label="Profile sections">

          {MENU_ITEMS.map((item) => {

            const Icon = item.icon;

            const active =
              activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onChange(item.id)}
                role="tab"
                aria-selected={active}
                className={`group mb-0.5 flex w-full items-center justify-between rounded-lg px-2.5 py-2 transition-all duration-200

                ${
                  active
                    ? "bg-blue-600 text-white shadow-md"
                    : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2.5">

                  <div
                    className={`rounded-lg p-1.5

                    ${
                      active
                        ? "bg-white/20"
                        : "bg-slate-100"
                    }`}
                  >
                    <Icon size={14} />
                  </div>

                  <div className="text-left">

                    <h3
                      className={`text-[13px] font-semibold

                      ${
                        active
                          ? "text-white"
                          : "text-slate-800"
                      }`}
                    >
                      {item.title}
                    </h3>

                    <p
                      className={`text-[11px]

                      ${
                        active
                          ? "text-blue-100"
                          : "text-slate-500"
                      }`}
                    >
                      {item.subtitle}
                    </p>

                  </div>

                </div>

                <ChevronRight
                  size={14}
                  className={`transition-transform duration-200

                  ${
                    active
                      ? "translate-x-1"
                      : "group-hover:translate-x-1 opacity-50"
                  }`}
                />

              </button>
            );

          })}

        </nav>

      </div>

    </aside>
  );
}