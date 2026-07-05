import {
  FileText,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";

import SectionHeader from "../../../../components/ui/SectionHeader";
import SectionCard from "../../../../components/ui/SectionCard";

export default function ResumeSection({ resume }) {
  const hasResume = !!resume?.uploaded;

  return (
    <>
      <SectionHeader
        title="Resume"
        description="Your resume is managed from the Resume module."
      />

      <SectionCard>

        <div className="rounded-xl border border-slate-200 bg-white p-6">

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">

            <div className="flex gap-5">

              <div className="rounded-xl bg-blue-50 p-4">
                <FileText
                  size={30}
                  className="text-blue-600"
                />
              </div>

              <div>

                <h3 className="text-xl font-semibold text-slate-900">
                  {hasResume ? (resume.resume_name || "Resume.pdf") : "Resume"}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {hasResume
                    ? "View, replace or analyze your resume from the Resume module."
                    : "Upload your resume from the Resume module to get started."}
                </p>

              </div>

            </div>

            {hasResume ? (
              <div className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm text-green-700 shrink-0">
                <CheckCircle2 size={16} />
                Uploaded
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm text-orange-700 shrink-0">
                <AlertTriangle size={16} />
                Not Uploaded
              </div>
            )}

          </div>

          <div className="my-6 border-t border-slate-200" />

          <div className="grid gap-4 md:grid-cols-3">

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                ATS Score
              </p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">
                {resume?.ats_score ?? "--"}
              </h3>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Last Updated
              </p>
              <h3 className="mt-1 text-sm font-semibold text-slate-900">
                {resume?.uploaded_at
                  ? new Date(resume.uploaded_at).toLocaleDateString()
                  : "--"}
              </h3>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Resume Status
              </p>
              <h3 className="mt-1 text-sm font-semibold text-slate-900">
                {hasResume ? "Available" : "Missing"}
              </h3>
            </div>

          </div>

          <div className="mt-6">
            <Link
              to="/resumes"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Open Resume Module
              <ArrowRight size={16} />
            </Link>
          </div>

        </div>

      </SectionCard>
    </>
  );
}