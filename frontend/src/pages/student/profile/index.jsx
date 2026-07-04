import ProfileHero from "./ProfileHero";
import ProfileStats from "./ProfileStats";
import ProfileSidebar from "./ProfileSidebar";
import ProfileCompletion from "./ProfileCompletion";
import ProfileForm from "./ProfileForm";

import useStudentProfile from "./hooks/useStudentProfile";

export default function StudentProfile() {
  const {
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
  } = useStudentProfile();

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-text-secondary text-lg">
          Loading profile...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1700px] space-y-4 px-4 sm:px-6 py-4">

      {/* Hero */}
      <ProfileHero
        student={studentInfo}
        profileCompletion={profileCompletion}
      />

      {/* Statistics */}
      <ProfileStats
        student={studentInfo}
      />

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-4">

        {/* Left Sidebar */}
        <div className="w-full lg:w-[260px] shrink-0 space-y-4">

          <ProfileSidebar
            activeSection={activeSection}
            onChange={setActiveSection}
          />

          <ProfileCompletion
            profileCompletion={profileCompletion}
          />

        </div>

        {/* Right Content */}
        <div className="flex-1 min-w-0">

          <ProfileForm
            section={activeSection}

            student={studentInfo}

            formData={formData}

            loading={loading}

            message={message}

            onChange={handleChange}

            onLinkChange={handleLinkChange}

            onSave={saveSection}
          />

        </div>

      </div>

    </div>
  );
}