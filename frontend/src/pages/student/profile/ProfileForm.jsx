import { CheckCircle2, AlertCircle, Save } from "lucide-react";

import PersonalSection from "./sections/PersonalSection";
import AcademicSection from "./sections/AcademicSection";
import CareerSection from "./sections/CareerSection";
import SocialSection from "./sections/SocialSection";
import ResumeSection from "./sections/ResumeSection";

export default function ProfileForm({
    section,
    student,
    formData,

    loading,
    message,

    onChange,
    onLinkChange,

    onSave,
}) {

    const renderSection = () => {
        switch (section) {

            case "personal":
                return (
                    <PersonalSection
                        formData={formData}
                        onChange={onChange}
                    />
                );

            case "academic":
                return (
                    <AcademicSection
                        formData={formData}
                        onChange={onChange}
                    />
                );

            case "career":
                return (
                    <CareerSection
                        formData={formData}
                        onChange={onChange}
                    />
                );

            case "social":
                return (
                    <SocialSection
                        formData={formData}
                        onLinkChange={onLinkChange}
                    />
                );

            case "resume":
                return (
                    <ResumeSection
                        student={student}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="space-y-3">

            {/* Success Message */}

            {message && (

                <div
                    className={`mb-4 flex items-center gap-2.5 rounded-xl border px-4 py-3

          ${message.toLowerCase().includes("success")
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-red-200 bg-red-50 text-red-700"
                        }`}
                >

                    {message.toLowerCase().includes("success") ? (
                        <CheckCircle2 size={16} />
                    ) : (
                        <AlertCircle size={16} />
                    )}

                    <span className="font-medium text-[13px]">
                        {message}
                    </span>

                </div>

            )}

            {/* Main Card */}

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">

                {renderSection()}

            </div>

            {/* Action Bar */}

{section !== "resume" && (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white px-5 py-3">
        <div className="flex items-center justify-between">

            <p className="text-xs text-slate-500">
                Changes are saved only after clicking
                <span className="ml-1 font-medium text-slate-700">
                    Save Changes
                </span>.
            </p>

            <button
                onClick={() => onSave(section)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
                <Save size={16} />

                {loading ? "Saving..." : "Save Changes"}
            </button>

        </div>
    </div>
)}

        </div>
    );
}