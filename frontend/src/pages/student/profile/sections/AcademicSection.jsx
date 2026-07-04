import Input from "../../../../components/ui/Input";
import SectionCard from "../../../../components/ui/SectionCard";
import SectionHeader from "../../../../components/ui/SectionHeader";

export default function AcademicSection({
  formData,
  onChange,
}) {
  return (
    <>
      <SectionHeader
        title="Academic Information"
        description="Manage your academic performance and educational details."
      />

      <SectionCard>

        {/* Read Only Fields */}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          <Input
            label="Roll Number"
            value={formData.rollNumber}
            disabled
          />

          <Input
            label="Batch Year"
            value={formData.batchYear}
            disabled
          />

        </div>

        {/* Academic Scores */}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

          <Input
            label="CGPA"
            type="number"
            min="0"
            max="10"
            step="0.01"
            value={formData.cgpa}
            placeholder="0.00"
            onChange={(e) =>
              onChange("cgpa", e.target.value)
            }
          />

          <Input
            label="10th Percentage"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={formData.tenthPercentage}
            placeholder="95.50"
            onChange={(e) =>
              onChange("tenthPercentage", e.target.value)
            }
          />

          <Input
            label="12th Percentage"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={formData.twelfthPercentage}
            placeholder="92.30"
            onChange={(e) =>
              onChange("twelfthPercentage", e.target.value)
            }
          />

        </div>

        {/* Backlogs */}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          <Input
            label="Current Backlogs"
            type="number"
            min="0"
            value={formData.currentBacklogs}
            onChange={(e) =>
              onChange("currentBacklogs", e.target.value)
            }
          />

          <Input
            label="History of Backlogs"
            type="number"
            min="0"
            value={formData.backlogHistory}
            onChange={(e) =>
              onChange("backlogHistory", e.target.value)
            }
          />

        </div>

        {/* Academic Summary */}

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">

          <h3 className="text-sm font-semibold text-blue-700">
            Academic Summary
          </h3>

          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">

            <div>
              <p className="text-xs text-slate-500">CGPA</p>
              <p className="text-xl font-bold text-slate-900">
                {formData.cgpa || "--"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">10th</p>
              <p className="text-xl font-bold text-slate-900">
                {formData.tenthPercentage || "--"}%
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">12th</p>
              <p className="text-xl font-bold text-slate-900">
                {formData.twelfthPercentage || "--"}%
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Backlogs</p>
              <p className="text-xl font-bold text-slate-900">
                {formData.currentBacklogs || 0}
              </p>
            </div>

          </div>

        </div>

      </SectionCard>
    </>
  );
}