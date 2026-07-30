# SkillSphere Internships Page Data Contract

Version: 1.0
Module: Student Internships
Status: Source of Truth
Owner: Internship Domain

---

# Purpose

This document defines the complete data contract for the Student Internships page.

It includes

- Internship Dashboard
- CRUD Operations
- Verification Workflow
- Offer Letter & Certificate Management
- Portfolio Synchronization
- StudentSearch Projection
- Validation Rules

Internships represent a student's professional work experience and contribute to portfolio evaluation.

---

# Route

/student/internships

---

# Authorization

Bearer JWT

Role Required

Student

---

# Architecture

              Student Internships UI
                       │
                       ▼
           GET /api/internships
                       │
                       ▼
          Internships Controller
                       │
                       ▼
           Internships Service
                       │
                       ▼
         Internships Repository
                       │
                       ▼
           MongoDB Internships
                       │
                       ▼
        InternshipUpdated Event
                       │
                       ▼
        StudentSearch Projection
                       │
                       ▼
         Dashboard / Portfolio

---

# Frontend Layout

Internships Page

├── Status Filter Tabs
├── Search Bar
├── Add Internship Button
├── Internship Cards
├── Internship Action Menu
└── Statistics Cards

---

# Complete GET API

GET

/api/internships

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

• Completed

• Current

• Offers

Purpose

Filter internship records.

Mapping

Completed

end_date < today

----------------------------

Current

Current Date between start_date and end_date

----------------------------

Offers

offer_letter_url exists

================================================================================
SECTION 2
SEARCH
================================================================================

Placeholder

Search internships...

Suggested API

GET

/api/internships?search=Precision

Search Fields

company

role

location

description

================================================================================
SECTION 3
ADD INTERNSHIP
================================================================================

Button

Add Internship

Purpose

Open Add Internship Dialog

POST

/api/internships

================================================================================
SECTION 4
INTERNSHIP CARD
================================================================================

Each Card Displays

• Company Logo

• Company Name

• Role

• Internship Type

• Location

• Duration

• Description

• Verification Status

• Offer Letter Button

• Certificate Button

• Action Menu

Frontend Needs

{
    "id":"",

    "company":"Precision Biometric India Private Limited",

    "role":"R&D Intern",

    "internship_type":"Full-time",

    "location":"Chennai",

    "description":"Worked as a research intern.",

    "start_date":"2026-06-10",

    "end_date":"2026-07-01",

    "duration_months":1,

    "status":"verified",

    "company_logo_url":"",

    "certificate_url":"",

    "offer_letter_url":""
}

================================================================================
SECTION 5
STATISTICS CARDS
================================================================================

Cards

Total

Completed

Current

Offers

Frontend Needs

{
    "total":2,

    "completed":2,

    "current":0,

    "offers":1
}

Recommended Future Endpoint

GET

/api/internships/stats

================================================================================
SECTION 6
INTERNSHIP DETAILS
================================================================================

Internship Model

{
    "_id":"",

    "company":"",

    "role":"",

    "internship_type":"",

    "location":"",

    "description":"",

    "company_logo_url":"",

    "start_date":"",

    "end_date":"",

    "duration_months":0,

    "certificate_url":"",

    "offer_letter_url":"",

    "status":"verified"
}

================================================================================
SECTION 7
ADD INTERNSHIP
================================================================================

POST

/api/internships

Request

{
    "company":"",

    "role":"",

    "internship_type":"",

    "location":"",

    "description":"",

    "company_logo_url":"",

    "start_date":"",

    "end_date":"",

    "certificate_url":"",

    "offer_letter_url":""
}

Response

{
    "success":true,

    "message":"Internship added successfully."
}

Default Status

pending

================================================================================
SECTION 8
EDIT INTERNSHIP
================================================================================

PATCH

/api/internships/:id

Editable Fields

Company

Role

Internship Type

Location

Description

Company Logo

Start Date

End Date

Certificate URL

Offer Letter URL

================================================================================
SECTION 9
DELETE INTERNSHIP
================================================================================

DELETE

/api/internships/:id

Response

{
    "success":true,

    "message":"Internship deleted successfully."
}

================================================================================
SECTION 10
VERIFICATION WORKFLOW
================================================================================

Student

↓

Pending

↓

Faculty Review

↓

Verified

or

↓

Rejected

Only faculty/admin can change verification status.

================================================================================
DATABASE OWNERSHIP
================================================================================

Source of Truth

internships

Responsible For

• Company Details

• Internship Details

• Offer Letter

• Certificate

• Duration

• Verification Status

================================================================================
STUDENTSEARCH PROJECTION
================================================================================

Projection

portfolio.internships

Example

{
    "internships":{

        "total":2,

        "verified":2
    }
}

Only summary information should exist in StudentSearch.

================================================================================
FIELD OWNERSHIP
================================================================================

| UI Field | Collection | StudentSearch | Owner |
|----------|------------|---------------|-------|
| Company | internships | No | Internship |
| Role | internships | No | Internship |
| Internship Type | internships | No | Internship |
| Location | internships | No | Internship |
| Description | internships | No | Internship |
| Company Logo | internships | No | Internship |
| Offer Letter | internships | No | Internship |
| Certificate | internships | No | Internship |
| Status | internships | Yes (Summary) | Internship |

================================================================================
EVENTBUS
================================================================================

InternshipCreated

↓

Update Portfolio Summary

-------------------------

InternshipUpdated

↓

Update Portfolio Summary

-------------------------

InternshipVerified

↓

Update Portfolio Summary

-------------------------

InternshipDeleted

↓

Update Portfolio Summary

================================================================================
SYNCHRONIZATION
================================================================================

internships

      │

      ▼

Domain Events

      │

      ▼

Event Bus

      │

      ▼

StudentSearch.portfolio

      │

      ▼

Dashboard Portfolio Card

================================================================================
VALIDATION
================================================================================

Company

Required

Maximum 200 Characters

-------------------------

Role

Required

Maximum 200 Characters

-------------------------

Internship Type

Required

-------------------------

Start Date

Required

-------------------------

End Date

Must be greater than Start Date

-------------------------

Certificate URL

Valid URL

-------------------------

Offer Letter URL

Valid URL

================================================================================
CQRS RULES
================================================================================

✔ internships collection is the Write Model.

✔ StudentSearch stores only internship summary data.

✔ Dashboard never queries internships directly.

✔ Portfolio statistics are updated asynchronously.

================================================================================
DEVELOPMENT RULES
================================================================================

✔ Internship documents remain the source of truth.

✔ Verification belongs to the Internship Domain.

✔ Portfolio summaries are updated only through domain events.

✔ Offer Letter and Certificate are optional attachments.

================================================================================
END OF DOCUMENT

INTERNSHIPS_PAGE_CONTRACT.md

Version: 1.0

Status: Source of Truth

Module: Student Internships