import { useState, useEffect } from "react";
import { UsersAPI } from "../../../../services/api";
import { useAuth } from "../../../../contexts/AuthContext";

export default function useStudentProfile() {
  const { user } = useAuth();

  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [profileData, setProfileData] = useState(null);
  const [activeSection, setActiveSection] = useState("basic");

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    careerObjective: "",
    dateOfBirth: "",
    city: "",
    state: "",
    languagesKnown: "",
    preferredJobRole: "",
    preferredWorkLocation: "",
    cgpa: "",
    tenthPercentage: "",
    twelfthPercentage: "",
    currentBacklogs: "0",
    backlogHistory: "0",
    batchYear: "",
    rollNumber: "",
    links: {
      github: "",
      linkedin: "",
      portfolio: "",
    },
  });

  // Derived from DTO — components read these directly
  const studentInfo = profileData?.student || null;
  const profileCompletion = profileData?.profile_completion || null;
  const statistics = profileData?.statistics || null;
  const resume = profileData?.resume || null;
  const socialLinks = profileData?.social_links || null;

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      if (!user) return;
      const { data } = await UsersAPI.getProfile();
      setProfileData(data);

      // Map DTO → flat formData expected by form section components
      const s = data?.student || {};
      const sl = data?.social_links || {};

      setFormData({
        fullName: s.full_name || "",
        phone: s.phone || "",
        careerObjective: s.career_objective || "",
        dateOfBirth: s.date_of_birth || "",
        city: s.city || "",
        state: s.state || "",
        languagesKnown: Array.isArray(s.languages)
          ? s.languages.join(", ")
          : "",
        preferredJobRole: s.preferred_job_role || "",
        preferredWorkLocation: s.preferred_locations?.[0] || "",
        cgpa: s.cgpa ?? "",
        tenthPercentage: s.tenth_percentage ?? "",
        twelfthPercentage: s.twelfth_percentage ?? "",
        currentBacklogs: String(s.current_backlogs ?? 0),
        backlogHistory: String(s.backlog_history ?? 0),
        batchYear: s.batch_year ?? "",
        rollNumber: s.roll_number || "",
        links: {
          github: sl.github || "",
          linkedin: sl.linkedin || "",
          portfolio: sl.portfolio || "",
        },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLinkChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      links: { ...prev.links, [field]: value },
    }));
  };

  const saveSection = async (section) => {
    setLoading(true);
    try {
      if (section === "basic" || section === "personal") {
        await UsersAPI.updateProfileBasic({
          full_name: formData.fullName,
          phone: formData.phone,
          date_of_birth: formData.dateOfBirth || undefined,
          city: formData.city,
          state: formData.state,
          languages: formData.languagesKnown
            ? formData.languagesKnown.split(",").map((i) => i.trim()).filter(Boolean)
            : [],
        });
      }

      if (section === "academic") {
        await UsersAPI.updateProfileAcademic({
          cgpa: formData.cgpa ? parseFloat(formData.cgpa) : undefined,
        });
      }

      if (section === "career") {
        await UsersAPI.updateProfileCareer({
          career_objective: formData.careerObjective,
          preferred_job_role: formData.preferredJobRole,
          preferred_locations: formData.preferredWorkLocation
            ? [formData.preferredWorkLocation]
            : [],
        });
      }

      if (section === "social") {
        await UsersAPI.updateProfileSocial({
          github: formData.links.github,
          linkedin: formData.links.linkedin,
          portfolio: formData.links.portfolio,
        });
      }

      setMessage("Profile updated successfully.");
      await fetchProfile();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return {
    fetching,
    loading,
    message,
    studentInfo,
    formData,
    activeSection,
    setActiveSection,
    handleChange,
    handleLinkChange,
    saveSection,
    profileCompletion,
    statistics,
    socialLinks,
    resume,
    refreshProfile: fetchProfile,
  };
}