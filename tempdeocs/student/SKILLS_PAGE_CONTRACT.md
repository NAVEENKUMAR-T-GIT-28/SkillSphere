# SkillSphere Skills Page Data Contract

Version: 1.0
Module: Student Skills
Status: Source of Truth
Owner: Skills Domain

---

# Purpose

This document defines the complete data contract for the Student Skills page.

It includes

- Skills Dashboard UI
- Backend API Contract
- CRUD Operations
- Verification Workflow
- Database Ownership
- StudentSearch Synchronization
- Portfolio Synchronization
- Validation Rules

The Skills page is the source of truth for a student's technical and professional skills.

---

# Route

/student/skills

---

# Authorization

Bearer JWT

Role Required

Student

---

# Architecture

                   Student Skills UI
                          │
                          ▼
                 GET /api/skills
                          │
                          ▼
                 Skills Controller
                          │
                          ▼
                  Skills Service
                          │
                          ▼
                  Skills Repository
                          │
                          ▼
                      MongoDB Skills
                          │
                          ▼
                SkillUpdated Event
                          │
                          ▼
                  StudentSearch Sync
                          │
                          ▼
                Dashboard / Portfolio

---

# Frontend Layout

Skills Page

├── Status Filter Tabs
├── Search Bar
├── Add Skill Button
├── Skills List
├── Skill Action Menu
└── Statistics Cards

---

# Complete GET API

GET

/api/skills

Authorization

Bearer JWT

Response

{
    "success": true,
    "data": [],
    "error": null,
    "meta": {
        "total": 2
    }
}

================================================================================
SECTION 1
STATUS FILTERS
================================================================================

Frontend Component

Tabs

Displays

• All
• Verified
• Pending
• Rejected

Purpose

Filters the displayed skills without changing backend data.

Backend Source

Derived from skill.status

================================================================================
SECTION 2
SEARCH BAR
================================================================================

Purpose

Search skills by name.

Placeholder

Search skills...

Suggested API

GET /api/skills?search=python

Backend Search Fields

skill_name

taxonomy.name

================================================================================
SECTION 3
ADD SKILL BUTTON
================================================================================

Button

Add Skill

Purpose

Open Add Skill Modal

API

POST /api/skills

================================================================================
SECTION 4
SKILLS LIST
================================================================================

Each card displays

• Skill Name
• Proficiency
• Years of Experience
• Verification Status
• Verification Date
• Action Menu

Frontend Needs

{
    "id": "6a4877c1b5cb0f268035c118",

    "skill_name": "JavaScript",

    "category": "programming",

    "proficiency": "intermediate",

    "years_experience": 2,

    "status": "verified",

    "verified_at": "2026-07-04",

    "is_trending": true
}

Backend Mapping

API Response

{
    "_id": "...",

    "taxonomy_id": {
        "name": "JavaScript",
        "category": "programming",
        "is_trending": true
    },

    "skill_name": "JavaScript",

    "proficiency": "intermediate",

    "years_experience": 2,

    "status": "verified",

    "verified_at": "2026-07-04T05:19:22Z"
}

================================================================================
SECTION 5
STATISTICS CARDS
================================================================================

Cards

Total Skills

Verified

Pending

Rejected

Frontend Needs

{
    "total": 2,

    "verified": 2,

    "pending": 0,

    "rejected": 0
}

Current Backend

Derived from GET /api/skills

Future Recommendation

Dedicated endpoint

GET /api/skills/stats

Response

{
    "total": 12,

    "verified": 8,

    "pending": 3,

    "rejected": 1
}

================================================================================
SECTION 6
ACTION MENU
================================================================================

Each Skill

⋮

Available Actions

Edit

Delete

View Details

Actions depend on status.

Verified skills may require re-verification after editing.

================================================================================
SECTION 7
ADD SKILL
================================================================================

POST

/api/skills

Request

{
    "taxonomy_id":"6a4743b527a8d129ceea1ed2",

    "proficiency":"intermediate",

    "years_experience":2,

    "evidence_note":"",

    "projects_using_skill":[]
}

Response

{
    "success":true,

    "message":"Skill added successfully."
}

Default Status

pending

unless auto-verification is enabled.

================================================================================
SECTION 8
EDIT SKILL
================================================================================

PATCH

/api/skills/:id

Request

{
    "proficiency":"advanced",

    "years_experience":3,

    "evidence_note":"Used in multiple production projects."
}

Response

{
    "success":true,

    "message":"Skill updated successfully."
}

Note

Updating a verified skill may change its status back to pending depending on verification policy.

================================================================================
SECTION 9
DELETE SKILL
================================================================================

DELETE

/api/skills/:id

Response

{
    "success":true,

    "message":"Skill deleted successfully."
}