import Input from "../../../../components/ui/Input";
import Textarea from "../../../../components/ui/Textarea";
import SectionCard from "../../../../components/ui/SectionCard";
import SectionHeader from "../../../../components/ui/SectionHeader";

export default function CareerSection({
  formData,
  onChange,
}) {
  return (
    <>
      <SectionHeader
        title="Career Preferences"
        description="Tell recruiters what kind of opportunities you're looking for."
      />

      <SectionCard>

        <Textarea
          label="Career Objective"
          rows={6}
          maxLength={500}
          placeholder="Describe your career objective..."
          value={formData.careerObjective}
          onChange={(e) =>
            onChange("careerObjective", e.target.value)
          }
        />

        <div className="flex justify-end">
          <span className="text-xs text-slate-500">
            {(formData.careerObjective || "").length}/500
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          <Input
            label="Preferred Job Role"
            placeholder="Software Engineer"
            value={formData.preferredJobRole}
            onChange={(e) =>
              onChange(
                "preferredJobRole",
                e.target.value
              )
            }
          />

          <Input
            label="Preferred Work Location"
            placeholder="Bangalore"
            value={formData.preferredWorkLocation}
            onChange={(e) =>
              onChange(
                "preferredWorkLocation",
                e.target.value
              )
            }
          />

        </div>

        {/* Preview Card */}

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">

          <h3 className="font-semibold text-slate-800">
            Career Preferences Preview
          </h3>

          <div className="mt-5 space-y-4">

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Preferred Role
              </p>

              <p className="font-medium text-slate-900">
                {formData.preferredJobRole || "--"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Preferred Location
              </p>

              <p className="font-medium text-slate-900">
                {formData.preferredWorkLocation || "--"}
              </p>
            </div>

          </div>

        </div>

      </SectionCard>
    </>
  );
}