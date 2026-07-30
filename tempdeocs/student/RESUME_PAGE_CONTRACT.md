# SkillSphere Resume Page Data Contract

Version: 1.0
Module: Student Resume
Status: Source of Truth
Owner: Resume Domain

---

# Purpose

This document defines the complete data contract for the Student Resume Management System.

It includes

- Resume Upload
- Resume Version Management
- ATS Analysis
- Resume Parsing
- Resume Download
- Resume Re-analysis
- Dashboard Synchronization
- StudentSearch Projection

The Resume Domain is responsible for storing resume versions, analyzing resume quality, extracting structured information, and publishing ATS summary data to StudentSearch.

---

# Route

/student/resumes

---

# Authorization

Bearer JWT

Role Required

Student

---

# Architecture

               Resume UI
                   │
                   ▼
          GET /api/resumes
                   │
                   ▼
         Resume Controller
                   │
                   ▼
          Resume Service
                   │
                   ▼
         Resume Repository
                   │
                   ▼
            MongoDB Resume
                   │
                   ▼
             ATS Engine
                   │
                   ▼
        ResumeAnalysis Repository
                   │
                   ▼
      ATSAnalysisCompleted Event
                   │
                   ▼
         StudentSearch.ats
                   │
                   ▼
        Dashboard ATS Widget

---

# Frontend Layout

Resume Page

├── ATS Score Card
├── ATS Breakdown
├── Strengths
├── Improvements
├── Resume Actions
├── Resume Versions
└── Feature Cards

================================================================================
SECTION 1
ATS SCORE CARD
================================================================================

Displays

• ATS Score

• Grade

• Summary

• Last Analysis Time

• Engine Version

Frontend Needs

{
    "score":80.55,

    "grade":"A",

    "summary":"Strong, well-rounded resume.",

    "last_analyzed":"2026-07-07",

    "engine_version":"1.1.0"
}

Backend Source

Resume Analysis

Current API

GET

/api/resumes/ats

Response

{
    "ats_score":80.55,

    "grade":"A",

    "summary":"Strong, well-rounded resume.",

    "last_analyzed":"2026-07-07",

    "engine_version":"1.1.0"
}

================================================================================
SECTION 2
ATS BREAKDOWN
================================================================================

Displays

Contact

Education

Skills

Projects

Internships

Certifications

Keywords

Formatting

Links

Completeness

Frontend Needs

{
    "contact":9,

    "education":9,

    "skills":2.38,

    "projects":14,

    "internships":14,

    "certifications":9,

    "keywords":7.5,

    "formatting":4,

    "links":2.67,

    "completeness":9
}

================================================================================
SECTION 3
STRENGTHS
================================================================================

Displays

Positive ATS Findings

Example

[
    "Projects look solid.",

    "Internships look solid.",

    "Education looks solid."
]

================================================================================
SECTION 4
IMPROVEMENTS
================================================================================

Displays

Improvement Suggestions

Example

[
    "Improve Skills."
]

================================================================================
SECTION 5
PARSING WARNINGS
================================================================================

Displays

Resume Parsing Issues

Example

[
    "Missing LinkedIn link."
]

================================================================================
SECTION 6
RESUME ACTIONS
================================================================================

Buttons

Upload Resume

Replace Resume

Download Resume

Analyze

Re-analyze

Delete

================================================================================
SECTION 7
RESUME VERSIONS
================================================================================

Displays

Version

Upload Date

Current Version

Drive Link

Label

Frontend Needs

{
    "version":1,

    "label":"Resume V1",

    "uploaded_at":"2026-07-06",

    "is_latest":true
}

================================================================================
SECTION 8
FEATURE CARDS
================================================================================

Displays

ATS Score

Multiple Versions

Easy Download

Private & Secure

================================================================================
GET RESUME API
================================================================================

GET

/api/resumes

Returns

Resume Metadata

Drive Link

Current Version

ATS Summary

================================================================================
UPLOAD RESUME
================================================================================

POST

/api/resumes

Content-Type

multipart/form-data

Request

resume.pdf

Response

{
    "success":true,

    "message":"Resume uploaded successfully."
}

After Upload

↓

Parse Resume

↓

Analyze ATS

↓

Store Version

↓

Publish Event

================================================================================
RE-ANALYZE
================================================================================

POST

/api/resumes/analyze

Purpose

Run ATS Engine again.

Returns

Updated Analysis

================================================================================
DOWNLOAD
================================================================================

GET

/api/resumes/:id/download

Returns

PDF

================================================================================
DELETE
================================================================================

DELETE

/api/resumes/:id

Deletes

Resume Version

================================================================================
DATABASE OWNERSHIP
================================================================================

Source of Truth

resumes

Responsible For

• Resume File

• Resume Version

• Resume Label

• Drive Link

• Upload History

• Current Resume

------------------------------------------------------------

resume_analyses

Responsible For

• ATS Score

• ATS Grade

• ATS Summary

• ATS Breakdown

• Strengths

• Improvements

• Missing Sections

• Parsing Warnings

• Engine Version

• Analysis History

------------------------------------------------------------

students

Responsible For

• Student Reference

• Profile Resume Status

================================================================================
STUDENTSEARCH PROJECTION
================================================================================

Dashboard only requires ATS summary.

Projection

{
    "ats": {

        "enabled": true,

        "score": 80.55,

        "grade": "A",

        "last_analyzed": "2026-07-07T03:41:01Z"

    }
}

StudentSearch intentionally does NOT store

• Resume File

• Parsed Resume

• Extracted Text

• Breakdown

• Improvements

• Strengths

Those belong only to the Resume Domain.

================================================================================
FIELD OWNERSHIP MATRIX
================================================================================

| UI Field | Collection | StudentSearch | Owner Domain |
|----------|------------|---------------|--------------|
| Resume File | resumes | No | Resume |
| Version | resumes | No | Resume |
| Drive Link | resumes | No | Resume |
| Upload Date | resumes | No | Resume |
| ATS Score | resume_analyses | Yes | Resume |
| ATS Grade | resume_analyses | Yes | Resume |
| ATS Summary | resume_analyses | No | Resume |
| ATS Breakdown | resume_analyses | No | Resume |
| Strengths | resume_analyses | No | Resume |
| Improvements | resume_analyses | No | Resume |
| Missing Sections | resume_analyses | No | Resume |
| Parsing Warnings | resume_analyses | No | Resume |
| Parsed Resume | resume_analyses | No | Resume |
| Extracted Text | resume_analyses | No | Resume |

================================================================================
BACKEND FLOW
================================================================================

GET FLOW

Resume Page

        │

        ▼

GET /api/resumes

        │

        ▼

Resume Controller

        │

        ▼

Resume Service

        │

        ▼

Resume Repository

        │

        ▼

MongoDB

        │

        ▼

Frontend

------------------------------------------------------------

UPLOAD FLOW

Student

        │

        ▼

POST /api/resumes

        │

        ▼

Upload Resume

        │

        ▼

Store Resume

        │

        ▼

Resume Parser

        │

        ▼

ATS Engine

        │

        ▼

Save Analysis

        │

        ▼

Publish Event

        │

        ▼

StudentSearch

        │

        ▼

Dashboard ATS Widget

------------------------------------------------------------

REANALYZE FLOW

Student

        │

        ▼

POST /api/resumes/analyze

        │

        ▼

ATS Engine

        │

        ▼

Update Analysis

        │

        ▼

Publish Event

        │

        ▼

StudentSearch

================================================================================
EVENTBUS
================================================================================

ResumeUploaded

↓

Parse Resume

------------------------------------------------------------

ResumeParsed

↓

Run ATS Analysis

------------------------------------------------------------

ATSAnalysisCompleted

↓

Update StudentSearch.ats

------------------------------------------------------------

ResumeDeleted

↓

Clear ATS Summary

------------------------------------------------------------

ResumeReanalyzed

↓

Refresh Dashboard ATS

================================================================================
SYNCHRONIZATION FLOW
================================================================================

Resume Upload

        │

        ▼

resumes

        │

        ▼

Resume Parser

        │

        ▼

resume_analyses

        │

        ▼

Domain Events

        │

        ▼

StudentSearch Projection

        │

        ▼

Dashboard

================================================================================
VALIDATION RULES
================================================================================

Resume

Required

------------------------------------------------------------

Allowed File Types

PDF

DOCX

------------------------------------------------------------

Maximum Size

5 MB

------------------------------------------------------------

Maximum Active Resume

1

------------------------------------------------------------

Version Label

Maximum 100 Characters

------------------------------------------------------------

Drive Link

Must be valid URL

================================================================================
ERROR RESPONSES
================================================================================

400

Invalid Resume

------------------------------------------------------------

401

Unauthorized

------------------------------------------------------------

404

Resume Not Found

------------------------------------------------------------

409

Duplicate Version

------------------------------------------------------------

413

File Too Large

------------------------------------------------------------

415

Unsupported File Type

------------------------------------------------------------

422

ATS Analysis Failed

------------------------------------------------------------

500

Internal Server Error

================================================================================
PERFORMANCE GUIDELINES
================================================================================

✔ Resume file should never be downloaded during dashboard load.

✔ Dashboard only reads ATS summary.

✔ ATS analysis should execute asynchronously.

✔ Resume parsing should execute asynchronously.

✔ Resume versions should be paginated if history grows.

✔ Store only lightweight ATS summary inside StudentSearch.

================================================================================
CQRS RULES
================================================================================

✔ resumes collection is the Write Model.

✔ resume_analyses is the ATS Analysis Store.

✔ StudentSearch is the Read Model.

✔ ATS Engine owns all scoring logic.

✔ Resume Parser owns extraction logic.

✔ Dashboard never queries resumes directly.

================================================================================
DEVELOPMENT RULES
================================================================================

✔ Resume documents remain the source of truth.

✔ Analysis results are never manually edited.

✔ StudentSearch stores only ATS summary.

✔ Resume Parser can be replaced without affecting UI.

✔ ATS Engine versions must remain backward compatible.

✔ Uploading a new resume should never block the UI while analysis runs.

================================================================================
FUTURE ENHANCEMENTS
================================================================================

• Resume Version History

• Resume Comparison

• AI Resume Suggestions

• Job Specific ATS Score

• Resume Templates

• Auto Resume Builder

• Keyword Recommendation Engine

• Resume Sharing

• Resume Analytics Dashboard

================================================================================
END OF DOCUMENT

RESUME_PAGE_CONTRACT.md

Version: 1.0

Status: Source of Truth

Module: Student Resume

================================================================================