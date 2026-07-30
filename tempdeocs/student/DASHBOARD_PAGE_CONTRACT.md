# SkillSphere Dashboard Data Contract
Version: 1.0
Module: Student Dashboard
Status: Source of Truth

---

# Purpose

This document defines:

- Dashboard UI components
- Backend API contract
- Exact JSON format
- StudentSearch projection structure
- Original database source of truth
- Synchronization flow

---

# Architecture

Frontend Dashboard
        │
        ▼
GET /api/dashboard
        │
        ▼
dashboard.service.js
        │
        ▼
StudentSearch Projection
        │
        ▼
MongoDB Collections
(Event Driven Synchronization)

---

# API

GET /api/dashboard

Authorization:
Bearer JWT

Response

{
  "success": true,
  "data": {
    "hero": {},
    "profileCompletion": {},
    "ats": {},
    "coding": {},
    "portfolio": {},
    "codingActivity": {},
    "upcomingDrives": [],
    "mentor": {},
    "tasks": [],
    "timeline": [],
    "notifications": []
  }
}

================================================================================
SECTION 1
HERO CARD
================================================================================

Frontend Needs

{
  "greeting": "Good Evening",
  "quote": "Let's make today productive.",
  "student": {
    "id": "student_id",
    "name": "NAVEENKUMAR T",
    "department": "Computer Science",
    "batch": "Computer Science • Year 3 • Section A",
    "semester": 5,
    "cgpa": 8.85
  }
}

Backend Source

StudentSearch

identity
class
academic

Mongo Source

students
classes

Owner

Student Domain

================================================================================
SECTION 2
PROFILE COMPLETION
================================================================================

Frontend Needs

{
  "percentage": 83,
  "status": "Good"
}

Backend Source

StudentSearch.profile

Mongo Source

Calculated Projection

Owner

Profile Domain

================================================================================
SECTION 3
ATS CARD
================================================================================

Frontend Needs

{
  "enabled": true,
  "beta": true,
  "score": 80.55,
  "grade": "A"
}

Backend Source

StudentSearch.ats

Mongo Source

resume_analyses

Owner

Resume Domain

================================================================================
SECTION 4
CODING DNA
================================================================================

Frontend Needs

{
  "dnaScore": 0,
  "label": "Keep Practicing"
}

Backend Source

StudentSearch.coding

Mongo Source

coding_profiles

Owner

Coding Domain

================================================================================
SECTION 5
READINESS SCORE
================================================================================

Frontend Needs

{
  "enabled": false,
  "message": "Coming Soon"
}

Backend Source

Future Readiness Projection

Mongo Source

placement

Owner

Placement Domain

================================================================================
SECTION 6
PORTFOLIO OVERVIEW
================================================================================

Frontend Needs

{
  "overall": 39,

  "skills": {
    "verified": 2
  },

  "projects": {
    "verified": 0
  },

  "internships": {
    "verified": 1
  },

  "certifications": {
    "verified": 3
  },

  "achievements": {
    "verified": 0
  }
}

Backend Source

StudentSearch.portfolio

Mongo Source

projects
internships
skills
certifications
achievements

Owner

Portfolio Domain

================================================================================
SECTION 7
CODING ACTIVITY
================================================================================

Frontend Needs

{
  "leetcode": {
    "connected": true,
    "problemsSolved": 0,
    "ranking": null
  },

  "hackerrank": {
    "connected": true,
    "stars": 0
  },

  "skillrack": {
    "connected": true,
    "points": 0
  },

  "github": {
    "connected": true,
    "repositories": 0
  }
}

Backend Source

StudentSearch.coding
(or Coding Service if detailed sync required)

Mongo Source

coding_profiles

Owner

Coding Domain

================================================================================
SECTION 8
UPCOMING DRIVES
================================================================================

Frontend Needs

[
  {
    "id": "",
    "company": "",
    "role": "",
    "date": "",
    "location": ""
  }
]

Backend Source

Drive Service

Mongo Source

drives

Owner

Drive Domain

NOTE

Do NOT store inside StudentSearch.

================================================================================
SECTION 9
MENTOR
================================================================================

Frontend Needs

{
  "id": "",
  "name": "",
  "department": "",
  "avatar": ""
}

Backend Source

StudentSearch.mentor

Mongo Source

mentor_assignments

Owner

Mentor Domain

================================================================================
SECTION 10
TODAY TASKS
================================================================================

Frontend Needs

[
  {
    "id": "",
    "title": "",
    "priority": "High",
    "completed": false
  }
]

Backend Source

Task Service

Mongo Source

tasks

Owner

Task Domain

NOTE

Never store in StudentSearch.

================================================================================
SECTION 11
TIMELINE
================================================================================

Frontend Needs

[
  {
    "id": "",
    "title": "",
    "description": "",
    "date": "",
    "type": ""
  }
]

Backend Source

Timeline Service

Mongo Source

timeline_events

Owner

Timeline Domain

NOTE

Never store inside StudentSearch.

================================================================================
SECTION 12
NOTIFICATIONS
================================================================================

Frontend Needs

[
  {
    "id": "",
    "title": "",
    "message": "",
    "date": "",
    "read": false
  }
]

Backend Source

Notification Service

Mongo Source

notifications

Owner

Notification Domain

NOTE

Never store inside StudentSearch.

================================================================================
StudentSearch Projection Structure
================================================================================

{
  "identity": {},
  "class": {},
  "academic": {},
  "profile": {},
  "coding": {},
  "ats": {},
  "portfolio": {},
  "placement": {},
  "mentor": {}
}

================================================================================
Synchronization Flow
================================================================================

Students
Classes
Projects
Skills
Internships
Certifications
Resume Analysis
Coding Profile
Mentor Assignment

        │

        ▼

Domain Events

        │

        ▼

StudentSearch Projection

        │

        ▼

Dashboard API

        │

        ▼

Frontend Dashboard

================================================================================
Rules
================================================================================

✅ Dashboard NEVER queries Student collection directly.

✅ Dashboard NEVER queries Project collection directly.

✅ Dashboard NEVER queries Resume collection directly.

✅ Dashboard NEVER performs aggregation.

✅ Dashboard ONLY consumes StudentSearch for student-centric summary data.

✅ Shared modules (Drives, Timeline, Notifications, Tasks) remain in their own domains.

✅ StudentSearch is a Read Model only.

✅ Mongo Domain Collections remain the Source of Truth.

================================================================================