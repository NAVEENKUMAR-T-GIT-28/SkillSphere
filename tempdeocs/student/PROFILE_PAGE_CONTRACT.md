    # SkillSphere Profile Page Data Contract

Version: 1.0
Module: Student Profile
Status: Source of Truth
Owner: Student Domain

---

# Purpose

This document defines the complete data contract for the Student Profile page.

It includes:

- UI Components
- Frontend State
- Backend API Contract
- GET/PATCH Operations
- JSON Request & Response
- Database Ownership
- StudentSearch Mapping
- Synchronization Rules

This page is the primary write interface for Student personal information.

---

# Route

/student/profile

---

# Authorization

Bearer JWT

Role Required

Student

---

# Architecture

                    Student Profile UI
                           │
                           ▼
                 GET /api/profile
                           │
                           ▼
                 Profile Controller
                           │
                           ▼
                  Profile Service
                           │
                           ▼
                  Student Repository
                           │
                           ▼
                     MongoDB Student
                           │
                           ▼
                StudentUpdated Event
                           │
                           ▼
                    StudentSearch Sync
                           │
                           ▼
                   Dashboard / Search

---

# Frontend Layout

Profile Page

├── Header Card
├── Statistics Cards
├── Profile Completion
├── Basic Information
├── Academic Information
├── Career Preferences
├── Social Profiles
└── Resume

---

# Complete GET API

GET

/api/profile

Authorization

Bearer JWT

Response

{
  "success": true,
  "data": {

    "header": {},

    "statistics": {},

    "completion": {},

    "basic": {},

    "academic": {},

    "career": {},

    "social": {},

    "resume": {}

  }
}

================================================================================
SECTION 1
HEADER CARD
================================================================================

Frontend Component

Student Header

Displays

• Avatar
• Name
• Current Role
• Register Number
• Batch
• CGPA Badge
• Email
• Phone
• Department
• City
• Profile Score

Frontend Needs

{
    "avatar": null,

    "name":"NAVEENKUMAR T",

    "role":"Software Engineer",

    "register_number":"SIT24C0042",

    "batch":"Computer Science",

    "cgpa":8.85,

    "email":"student@skillsphere.dev",

    "phone":"9080629615",

    "department":"Computer Science",

    "city":"Chennai",

    "profile_score":100,

    "last_updated":"2026-07-06"
}

Backend Source

Student

StudentSearch (Read)

Mongo Source

students

StudentSearch

identity

academic

profile

Owner

Student Domain

================================================================================
SECTION 2
STATISTICS CARDS
================================================================================

Cards

CGPA

Projects

Skills

Resume

Frontend Needs

{
    "cgpa":8.85,

    "projects":0,

    "skills":2,

    "resume_uploaded":true
}

Backend Source

StudentSearch

academic

portfolio

ats

Mongo Owner

students

projects

skills

resumes

================================================================================
SECTION 3
PROFILE COMPLETION
================================================================================

Frontend Needs

{
    "percentage":100,

    "completed_sections":5,

    "total_sections":5,

    "sections":[

        {
            "name":"Basic Information",
            "completed":true
        },

        {
            "name":"Academic Information",
            "completed":true
        },

        {
            "name":"Career Information",
            "completed":true
        },

        {
            "name":"Social Links",
            "completed":true
        },

        {
            "name":"Resume",
            "completed":true
        }

    ]
}

Backend Source

StudentSearch.profile

Mongo Owner

Student Projection

================================================================================
SECTION 4
BASIC INFORMATION
================================================================================

Editable Fields

Full Name

Phone Number

Career Objective

Date of Birth

Languages

City

State

Preferred Role

Preferred Location

GET Response

{
    "full_name":"NAVEENKUMAR T",

    "phone_number":"9080629615",

    "career_objective":"MERN Developer",

    "date_of_birth":"2008-09-28",

    "languages":[
        "English",
        "Tamil"
    ],

    "city":"Chennai",

    "state":"Tamil Nadu",

    "preferred_role":"Software Engineer",

    "preferred_location":"Chennai"
}

PATCH

/api/profile/basic

Request

{
    "full_name":"NAVEENKUMAR T",

    "phone_number":"9080629615",

    "career_objective":"MERN Developer",

    "date_of_birth":"2008-09-28",

    "languages":[
        "English",
        "Tamil"
    ],

    "city":"Chennai",

    "state":"Tamil Nadu",

    "preferred_role":"Software Engineer",

    "preferred_location":"Chennai"
}

Response

{
    "success":true,

    "message":"Basic profile updated successfully."
}

Database

students

Document Path

personal.full_name

personal.phone_number

personal.date_of_birth

personal.languages

personal.city

personal.state

career.objective

career.preferred_role

career.preferred_location

Event

StudentProfileUpdated

Projection Updated

StudentSearch.identity

StudentSearch.profile

Validation

Full Name

Required

Maximum 100 characters

Phone

Required

10 digits

DOB

Cannot be future date

Languages

Maximum 10 entries

Preferred Role

Maximum 100 characters

Preferred Location

Maximum 100 characters

================================================================================
SECTION 5
ACADEMIC INFORMATION
================================================================================

Purpose

Displays the student's academic information.

This section is editable only if permitted by institutional policy.

If controlled by Admin, all PATCH APIs should be disabled.

---

Frontend Component

Academic Information Card

Displays

• Register Number
• Department
• Degree
• Batch
• Current Semester
• Section
• CGPA
• Academic Status

---

GET Response

{
  "register_number": "SIT24C0042",
  "department": "Computer Science",
  "degree": "B.E",
  "batch": "2024-2028",
  "semester": 5,
  "section": "A",
  "cgpa": 8.85,
  "academic_status": "ENROLLED"
}

---

PATCH

/api/profile/academic

Request

{
  "semester": 5,
  "cgpa": 8.85
}

Response

{
  "success": true,
  "message": "Academic information updated successfully."
}

---

Database

students

Document Path

academic.register_number

academic.department

academic.degree

academic.batch

academic.semester

academic.section

academic.cgpa

academic.status

---

StudentSearch Projection

academic

class

---

Event

StudentAcademicUpdated

---

Validation

CGPA

Minimum

0

Maximum

10

Semester

Minimum

1

Maximum

8

Department

Read Only

Register Number

Read Only

================================================================================
SECTION 6
CAREER PREFERENCES
================================================================================

Purpose

Stores career goals and placement preferences.

---

Frontend Component

Career Preferences

---

GET Response

{
  "career_objective": "Become a Full Stack Developer",

  "preferred_role": "Software Engineer",

  "preferred_location": "Chennai",

  "expected_ctc": 800000,

  "willing_to_relocate": true,

  "higher_studies": false
}

---

PATCH

/api/profile/career

Request

{
  "career_objective": "Become a Full Stack Developer",

  "preferred_role": "Software Engineer",

  "preferred_location": "Chennai",

  "expected_ctc": 800000,

  "willing_to_relocate": true,

  "higher_studies": false
}

---

Response

{
  "success": true,
  "message": "Career preferences updated successfully."
}

---

Database

students

Document Path

career.objective

career.preferred_role

career.preferred_location

career.expected_ctc

career.willing_to_relocate

career.higher_studies

---

Projection

StudentSearch.profile

---

Event

StudentCareerUpdated

---

Validation

Preferred Role

Required

Preferred Location

Required

Expected CTC

Positive Integer

Career Objective

Maximum 1000 characters

================================================================================
SECTION 7
SOCIAL LINKS
================================================================================

Purpose

Stores student's public professional links.

---

Frontend Component

Social Links

---

GET Response

{
  "linkedin": "https://linkedin.com/in/example",

  "github": "https://github.com/example",

  "portfolio": "https://portfolio.com",

  "leetcode": "example",

  "hackerrank": "example",

  "skillrack": "example"
}

---

PATCH

/api/profile/social

Request

{
  "linkedin": "...",

  "github": "...",

  "portfolio": "...",

  "leetcode": "...",

  "hackerrank": "...",

  "skillrack": "..."
}

---

Response

{
  "success": true,
  "message": "Social profiles updated successfully."
}

---

Database

coding_profiles

students

---

Document Path

students.social.linkedin

students.social.portfolio

coding_profiles.github

coding_profiles.leetcode

coding_profiles.hackerrank

coding_profiles.skillrack

---

Projection

StudentSearch.coding

StudentSearch.profile

---

Events

StudentSocialUpdated

CodingProfileUpdated

---

Validation

All URLs must be valid.

GitHub username

Maximum 100 characters.

================================================================================
SECTION 8
RESUME
================================================================================

Purpose

Stores uploaded resume and ATS status.

---

Frontend Component

Resume Card

Displays

Resume Status

Resume Name

Upload Date

ATS Score

ATS Grade

Download

Replace

Delete

---

GET Response

{
  "uploaded": true,

  "file_name": "Resume.pdf",

  "uploaded_at": "2026-07-06",

  "ats_score": 80.55,

  "grade": "A",

  "resume_id": "abc123"
}

---

POST

/api/profile/resume

Content-Type

multipart/form-data

Request

file=<resume.pdf>

---

Response

{
  "success": true,

  "message": "Resume uploaded successfully.",

  "resume_id": "abc123"
}

---

PATCH

/api/profile/resume

Purpose

Replace existing resume.

---

DELETE

/api/profile/resume

Purpose

Remove uploaded resume.

---

Database

resumes

resume_analyses

---

Projection

StudentSearch.ats

---

Events

ResumeUploaded

ResumeUpdated

ResumeDeleted

ATSAnalysisCompleted

---

Validation

Allowed Types

PDF

Maximum Size

5 MB

Only one active resume per student.

================================================================================
SECTION 9
PROFILE ACTIONS
================================================================================

Available Buttons

Save

Cancel

Reset

Upload Resume

Replace Resume

Delete Resume

Refresh ATS Score

================================================================================
DATABASE OWNERSHIP
================================================================================

Source of Truth

students

Responsible For

• Identity
• Personal Information
• Academic Information
• Career Preferences
• Social Links (LinkedIn, Portfolio)
• Profile Completion

-------------------------------------------------------------------------------

coding_profiles

Responsible For

• GitHub
• LeetCode
• HackerRank
• SkillRack
• Coding Statistics

-------------------------------------------------------------------------------

resumes

Responsible For

• Resume File
• Resume Metadata

-------------------------------------------------------------------------------

resume_analyses

Responsible For

• ATS Score
• ATS Grade
• ATS Analysis History

================================================================================
STUDENTSEARCH PROJECTION
================================================================================

Profile Page reads only the required fields from StudentSearch for fast access.

Projection Structure

{
  "identity": {
    "student_id": "",
    "name": "",
    "avatar": "",
    "email": "",
    "phone": ""
  },

  "academic": {
    "department": "",
    "degree": "",
    "batch": "",
    "semester": 0,
    "section": "",
    "cgpa": 0
  },

  "profile": {
    "completion": 0,
    "career": {},
    "social": {}
  },

  "coding": {
    "github": {},
    "leetcode": {},
    "hackerrank": {},
    "skillrack": {}
  },

  "ats": {
    "score": 0,
    "grade": ""
  }
}

================================================================================
FIELD OWNERSHIP MATRIX
================================================================================

| UI Section             | Collection          | StudentSearch | Owner Domain      |
|-------------------------|--------------------|---------------|-------------------|
| Header                  | students           | Yes           | Student           |
| Basic Information       | students           | Yes           | Student           |
| Academic Information    | students/classes   | Yes           | Student/Class     |
| Career Preferences      | students           | Yes           | Student           |
| Social Links            | students           | Yes           | Student           |
| GitHub                  | coding_profiles    | Yes           | Coding            |
| LeetCode                | coding_profiles    | Yes           | Coding            |
| HackerRank              | coding_profiles    | Yes           | Coding            |
| SkillRack               | coding_profiles    | Yes           | Coding            |
| Resume Metadata         | resumes            | No            | Resume            |
| ATS Score               | resume_analyses    | Yes           | Resume            |

================================================================================
BACKEND FLOW
================================================================================

GET Flow

Profile Page
      │
      ▼
GET /api/profile
      │
      ▼
Profile Controller
      │
      ▼
Profile Service
      │
      ▼
StudentSearch Repository
      │
      ▼
StudentSearch Collection
      │
      ▼
Frontend

-------------------------------------------------------------------------------

UPDATE Flow

Profile Page
      │
      ▼
PATCH /api/profile/basic
      │
      ▼
Profile Controller
      │
      ▼
Profile Service
      │
      ▼
Student Repository
      │
      ▼
students Collection
      │
      ▼
StudentProfileUpdated Event
      │
      ▼
StudentSearch Projection
      │
      ▼
Dashboard
Profile
Search

================================================================================
EVENTBUS SYNCHRONIZATION
================================================================================

StudentUpdated
    ├── Update StudentSearch.identity
    └── Update StudentSearch.profile

------------------------------------------------------------

StudentAcademicUpdated
    ├── Update StudentSearch.academic
    └── Refresh Dashboard Hero

------------------------------------------------------------

StudentCareerUpdated
    └── Update StudentSearch.profile

------------------------------------------------------------

StudentSocialUpdated
    └── Update StudentSearch.profile

------------------------------------------------------------

CodingProfileUpdated
    └── Update StudentSearch.coding

------------------------------------------------------------

ResumeUploaded
    └── Trigger ATS Analysis

------------------------------------------------------------

ATSAnalysisCompleted
    └── Update StudentSearch.ats

================================================================================
SYNCHRONIZATION FLOW
================================================================================

students
coding_profiles
resumes
resume_analyses

        │

        ▼

Domain Events

        │

        ▼

Event Bus

        │

        ▼

Projection Handlers

        │

        ▼

StudentSearch

        │

        ▼

Profile API

        │

        ▼

Frontend Profile Page

================================================================================
VALIDATION RULES
================================================================================

Basic Information

✔ Name Required

✔ Phone Required

✔ DOB cannot be future

✔ Maximum 10 languages

------------------------------------------------------------

Academic

✔ Semester between 1 and 8

✔ CGPA between 0 and 10

------------------------------------------------------------

Career

✔ Preferred Role Required

✔ Preferred Location Required

✔ Expected CTC must be positive

------------------------------------------------------------

Social

✔ URLs must be valid

✔ Usernames cannot exceed 100 characters

------------------------------------------------------------

Resume

✔ PDF only

✔ Maximum 5 MB

✔ One active resume

================================================================================
ERROR RESPONSES
================================================================================

400

Invalid Request

------------------------------------------------------------

401

Unauthorized

------------------------------------------------------------

403

Forbidden

------------------------------------------------------------

404

Student Not Found

------------------------------------------------------------

409

Duplicate Resource

------------------------------------------------------------

413

Uploaded File Too Large

------------------------------------------------------------

422

Validation Failed

------------------------------------------------------------

500

Internal Server Error

================================================================================
PERFORMANCE GUIDELINES
================================================================================

✔ GET /api/profile should read from StudentSearch whenever possible.

✔ Avoid MongoDB aggregations during page load.

✔ Resume files should be fetched separately from metadata.

✔ Keep StudentSearch synchronized using domain events.

✔ Profile completion should be precomputed rather than calculated on every request.

================================================================================
CQRS RULES
================================================================================

✔ students collection is the Write Model.

✔ StudentSearch is the Read Model.

✔ All profile updates must modify the source collection first.

✔ StudentSearch must never be edited directly.

✔ Dashboard and Profile should consume the same StudentSearch projection where applicable.

================================================================================
DEVELOPMENT RULES
================================================================================

✅ Profile page never updates StudentSearch directly.

✅ All writes go through the owning domain.

✅ StudentSearch is updated asynchronously via EventBus.

✅ Resume upload does not calculate ATS synchronously.

✅ Coding profile synchronization belongs to the Coding Domain.

✅ Admin-controlled fields (Register Number, Department, Degree, Batch) should be read-only unless explicitly enabled.

================================================================================
FUTURE ENHANCEMENTS
================================================================================

- Profile version history
- Profile audit logs
- Multiple resumes with active selection
- Profile privacy settings
- Auto-complete profile suggestions
- Social profile verification
- Resume parsing for auto-fill
- Profile completion recommendations

================================================================================
END OF DOCUMENT

PROFILE_PAGE_CONTRACT.md
Version: 1.0
Status: Source of Truth
Module: Student Profile
================================================================================