import Input from "../../../../components/ui/Input";
import Textarea from "../../../../components/ui/Textarea";
import SectionCard from "../../../../components/ui/SectionCard";
import SectionHeader from "../../../../components/ui/SectionHeader";

export default function PersonalSection({
  formData,
  onChange,
}) {
  return (
    <>
      <SectionHeader
        title="Personal Information"
        description="Manage your personal details and career preferences."
      />

      <SectionCard>

        {/* Basic Information */}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          <Input
            label="Full Name"
            type="text"
            value={formData.fullName}
            placeholder="Enter your full name"
            onChange={(e) =>
              onChange("fullName", e.target.value)
            }
          />

          <Input
            label="Phone Number"
            type="tel"
            value={formData.phone}
            placeholder="+91 XXXXX XXXXX"
            onChange={(e) =>
              onChange("phone", e.target.value)
            }
          />

        </div>

        {/* Career Objective */}

        <Textarea
          label="Career Objective"
          rows={5}
          maxLength={500}
          placeholder="Write a short career objective..."
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

        {/* Personal Details */}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          <Input
            label="Date of Birth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) =>
              onChange("dateOfBirth", e.target.value)
            }
          />

          <Input
            label="Languages Known"
            type="text"
            placeholder="English, Tamil, Hindi"
            value={formData.languagesKnown}
            onChange={(e) =>
              onChange("languagesKnown", e.target.value)
            }
          />

        </div>

        {/* Address */}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          <Input
            label="City"
            type="text"
            placeholder="Enter your city"
            value={formData.city}
            onChange={(e) =>
              onChange("city", e.target.value)
            }
          />

          <Input
            label="State"
            type="text"
            placeholder="Enter your state"
            value={formData.state}
            onChange={(e) =>
              onChange("state", e.target.value)
            }
          />

        </div>

        {/* Career Preferences */}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          <Input
            label="Preferred Job Role"
            type="text"
            placeholder="Software Engineer"
            value={formData.preferredJobRole}
            onChange={(e) =>
              onChange("preferredJobRole", e.target.value)
            }
          />

          <Input
            label="Preferred Work Location"
            type="text"
            placeholder="Bangalore"
            value={formData.preferredWorkLocation}
            onChange={(e) =>
              onChange("preferredWorkLocation", e.target.value)
            }
          />

        </div>

      </SectionCard>
    </>
  );
}