import { useState, useEffect, useMemo } from "react";
import { UsersAPI } from "../../../../services/api";
import { useAuth } from "../../../../contexts/AuthContext";
import calcProfileCompletion from "../helpers/calcProfileCompletion";

export default function useStudentProfile() {
  const { user } = useAuth();

  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  const [studentInfo, setStudentInfo] = useState(null);

  const [activeSection, setActiveSection] = useState("personal");

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
    currentBacklogs: "",
    backlogHistory: "",
    batchYear: "",
    rollNumber: "",

    links: {
      github: "",
      linkedin: "",
      portfolio: "",
    },
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      if (!user?.profileId) return;

      const { data } = await UsersAPI.getProfile(user.profileId);

      setStudentInfo(data);

      setFormData({
        fullName: data.full_name || "",
        phone: data.phone || "",
        careerObjective: data.career_objective || "",

        dateOfBirth: data.date_of_birth
          ? new Date(data.date_of_birth).toISOString().split("T")[0]
          : "",

        city: data.city || "",
        state: data.state || "",

        languagesKnown: data.languages_known
          ? data.languages_known.join(", ")
          : "",

        preferredJobRole: data.preferred_job_role || "",

        preferredWorkLocation:
          data.preferred_work_location || "",

        cgpa: data.cgpa || "",

        tenthPercentage:
          data.tenth_percentage || "",

        twelfthPercentage:
          data.twelfth_percentage || "",

        currentBacklogs:
          data.current_backlogs?.toString() || "0",

        backlogHistory:
          data.backlog_history?.toString() || "0",

        batchYear: data.batch_year || "",

        rollNumber: data.roll_number || "",

        links: {
          github: data.links?.github || "",
          linkedin: data.links?.linkedin || "",
          portfolio: data.links?.portfolio || "",
        },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLinkChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      links: {
        ...prev.links,
        [field]: value,
      },
    }));
  };

  const saveSection = async (section) => {
    setLoading(true);

    try {
      if (section === "personal") {
        await UsersAPI.updateProfile(user.profileId, {
          full_name: formData.fullName,
          phone: formData.phone,
          career_objective: formData.careerObjective,
          date_of_birth: formData.dateOfBirth || undefined,
          city: formData.city,
          state: formData.state,

          languages_known: formData.languagesKnown
            ? formData.languagesKnown
                .split(",")
                .map((i) => i.trim())
                .filter(Boolean)
            : [],

          preferred_job_role:
            formData.preferredJobRole,

          preferred_work_location:
            formData.preferredWorkLocation,
        });
      }

      if (section === "academic") {
        await UsersAPI.updateProfile(user.profileId, {
          cgpa: formData.cgpa
            ? parseFloat(formData.cgpa)
            : undefined,

          tenth_percentage:
            formData.tenthPercentage
              ? parseFloat(formData.tenthPercentage)
              : undefined,

          twelfth_percentage:
            formData.twelfthPercentage
              ? parseFloat(formData.twelfthPercentage)
              : undefined,

          current_backlogs:
            formData.currentBacklogs !== ""
              ? parseInt(formData.currentBacklogs)
              : undefined,

          backlog_history:
            formData.backlogHistory !== ""
              ? parseInt(formData.backlogHistory)
              : undefined,
        });
      }

      if (section === "social") {
        await UsersAPI.updateProfile(user.profileId, {
          links: formData.links,
        });
      }

      setMessage("Profile updated successfully.");

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      console.error(err);
      setMessage("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const profileCompletion = useMemo(
    () => calcProfileCompletion(studentInfo),
    [studentInfo]
  );

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

    refreshProfile: fetchProfile,
  };
}