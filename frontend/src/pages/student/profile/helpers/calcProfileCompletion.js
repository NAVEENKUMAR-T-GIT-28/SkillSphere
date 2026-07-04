/**
 * calcProfileCompletion
 *
 * Single source of truth for profile completion.
 * Accepts a student object from the API and returns a
 * standardized completion object.
 *
 * Designed so the frontend can later swap this local
 * calculation for a backend-provided object without
 * changing any UI components.
 */

const SECTIONS = [
  {
    id: "personal",
    label: "Personal Information",
    check: (s) =>
      !!s?.full_name &&
      !!s?.phone &&
      !!s?.date_of_birth &&
      !!s?.city &&
      !!s?.state &&
      Array.isArray(s?.languages_known) &&
      s.languages_known.length > 0,
  },
  {
    id: "academic",
    label: "Academic Details",
    check: (s) =>
      !!s?.roll_number &&
      !!s?.department &&
      !!s?.batch_year &&
      !!s?.cgpa,
  },
  {
    id: "career",
    label: "Career Preferences",
    check: (s) =>
      !!s?.career_objective &&
      !!s?.preferred_job_role &&
      !!s?.preferred_work_location,
  },
  {
    id: "social",
    label: "Social Profiles",
    check: (s) =>
      !!s?.links?.github &&
      !!s?.links?.linkedin,
  },
  {
    id: "resume",
    label: "Resume Uploaded",
    check: (s) => !!s?.resume_uploaded,
  },
];

export default function calcProfileCompletion(student) {
  if (!student) {
    return {
      percentage: 0,
      completedSections: 0,
      totalSections: SECTIONS.length,
      checklist: SECTIONS.map((sec) => ({
        id: sec.id,
        label: sec.label,
        completed: false,
      })),
    };
  }

  const checklist = SECTIONS.map((sec) => ({
    id: sec.id,
    label: sec.label,
    completed: sec.check(student),
  }));

  const completedSections = checklist.filter(
    (item) => item.completed
  ).length;

  const totalSections = checklist.length;

  const percentage = Math.round(
    (completedSections / totalSections) * 100
  );

  return {
    percentage,
    completedSections,
    totalSections,
    checklist,
  };
}
