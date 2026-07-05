import {
    GraduationCap,
    FolderKanban,
    BadgeCheck,
    FileText,
} from "lucide-react";

export default function ProfileStats({ statistics }) {
    const stats = [
        {
            title: "CGPA",
            value: statistics?.cgpa ?? "--",
            icon: GraduationCap,
            color:
                "from-blue-500/10 to-cyan-500/10 text-blue-600 border-blue-100",
        },
        {
            title: "Projects",
            value: statistics?.projects ?? 0,
            icon: FolderKanban,
            color:
                "from-violet-500/10 to-purple-500/10 text-violet-600 border-violet-100",
        },
        {
            title: "Skills",
            value: statistics?.skills ?? 0,
            icon: BadgeCheck,
            color:
                "from-emerald-500/10 to-green-500/10 text-emerald-600 border-emerald-100",
        },
        {
            title: "Resume",
            value: statistics?.resume_uploaded ? "Uploaded" : "Pending",
            icon: FileText,
            color:
                "from-orange-500/10 to-amber-500/10 text-orange-600 border-orange-100",
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {stats.map((item) => {
                const Icon = item.icon;

                return (
                    <div
                        key={item.title}
                        className={`rounded-xl border bg-gradient-to-br ${item.color} px-4 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="rounded-lg bg-white p-2 shadow-sm">
                                <Icon size={15} />
                            </div>

                            <span className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
                                {item.title}
                            </span>
                        </div>

                        <div className="mt-2">
                            <h2 className="text-xl font-bold text-slate-900">
                                {item.value}
                            </h2>

                            <p className="text-[11px] text-slate-500">
                                {item.title}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}