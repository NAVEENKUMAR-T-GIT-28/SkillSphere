/**
 * Profile DTO
 * Transforms raw MongoDB documents into the stable frontend contract.
 * Every property must always exist — never return undefined.
 */

class ProfileDTO {
  static format(student, user, resume, statistics, completionData, codingProfile) {
    const links = student?.links || {};
    const codingPlatforms = codingProfile?.platforms || {};

    // Class-level fields may come from populated class_id
    const cls = student?.class_id || {};

    return {
      student: {
        id: student?._id || null,
        photo_url: student?.profile_photo_url || "",
        full_name: student?.full_name || "",
        email: user?.email || "",
        phone: student?.phone || "",
        alternate_phone: student?.alternate_phone || "",
        gender: student?.gender || "",
        date_of_birth: student?.date_of_birth
          ? new Date(student.date_of_birth).toISOString().split('T')[0]
          : "",
        city: student?.city || "",
        state: student?.state || "",
        country: student?.country || "",
        pincode: student?.pincode || "",
        department: student?.department || cls?.department || "",
        section: student?.section || cls?.section || "",
        semester: student?.semester || cls?.semester || null,
        batch_year: student?.batch_year || cls?.batch_year || null,
        graduation_year: student?.graduation_year || null,
        roll_number: student?.roll_number || "",
        register_number: student?.register_number || "",
        cgpa: student?.cgpa ?? null,
        career_objective: student?.career_objective || "",
        preferred_job_role: student?.preferred_job_role || "",
        preferred_locations: student?.preferred_work_location
          ? [student.preferred_work_location]
          : [],
        languages: student?.languages_known || [],
        tenth_percentage: student?.tenth_percentage ?? null,
        twelfth_percentage: student?.twelfth_percentage ?? null,
        current_backlogs: student?.current_backlogs ?? 0,
        backlog_history: student?.backlog_history ?? 0
      },
      social_links: {
        github: links.github || "",
        linkedin: links.linkedin || "",
        portfolio: links.portfolio || "",
        leetcode: codingPlatforms.leetcode?.profile_url || links.leetcode || "",
        hackerrank: codingPlatforms.hackerrank?.profile_url || links.hackerrank || "",
        codechef: codingPlatforms.codechef?.profile_url || links.codechef || "",
        codeforces: codingPlatforms.codeforces?.profile_url || links.codeforces || "",
        skillrack: codingPlatforms.skillrack?.profile_url || links.skillrack || ""
      },
      resume: resume
        ? {
            uploaded: true,
            resume_name: resume.resume_version_name || "Resume.pdf",
            resume_url: resume.drive_link || "",
            uploaded_at: resume.uploaded_at || null,
            ats_score: resume.ats_score ?? null
          }
        : {
            uploaded: false,
            resume_name: "",
            resume_url: "",
            uploaded_at: null,
            ats_score: null
          },
      statistics: statistics || {
        cgpa: null,
        projects: 0,
        skills: 0,
        resume_uploaded: false,
        ats_score: null
      },
      profile_completion: completionData || {
        percentage: 0,
        completed_sections: [],
        missing_sections: [],
        progress: []
      },
      last_updated: student?.updated_at || null
    };
  }
}

module.exports = ProfileDTO;
