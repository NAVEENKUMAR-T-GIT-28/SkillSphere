# SkillSphere Achievements Page Data Contract

Version: 1.0
Module: Student Achievements
Status: Source of Truth
Owner: Achievement Domain

---

# Purpose

This document defines the complete data contract for the Student Achievements page.

It includes

- Achievement Dashboard
- CRUD Operations
- Category Management
- Verification Workflow
- Portfolio Synchronization
- StudentSearch Projection
- Validation Rules

Achievements represent awards, hackathons, competitions, open-source contributions and other recognitions earned by students.

---

# Route

/student/achievements

---

# Authorization

Bearer JWT

Role Required

Student

---

# Architecture

             Student Achievements UI
                      │
                      ▼
          GET /api/achievements
                      │
                      ▼
         Achievements Controller
                      │
                      ▼
          Achievements Service
                      │
                      ▼
        Achievements Repository
                      │
                      ▼
          MongoDB Achievements
                      │
                      ▼
       AchievementUpdated Event
                      │
                      ▼
       StudentSearch Projection
                      │
                      ▼
         Dashboard / Portfolio

---

# Frontend Layout

Achievements Page

├── Category Filter Tabs
├── Search Bar
├── Add Achievement Button
├── Achievement Cards
├── Achievement Action Menu
└── Statistics Cards

---

# Complete GET API

GET

/api/achievements

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
CATEGORY FILTERS
================================================================================

Frontend Component

Tabs

Displays

• All

• Awards

• Hackathons

• Open Source

• Other

Purpose

Filter achievements by category.

Mapping

Awards

category = award

------------------------

Hackathons

category = hackathon

------------------------

Open Source

category = open_source

------------------------

Other

category = other

================================================================================
SECTION 2
SEARCH
================================================================================

Placeholder

Search achievements...

Suggested API

GET

/api/achievements?search=award

Search Fields

title

issuer

description

category

================================================================================
SECTION 3
ADD ACHIEVEMENT
================================================================================

Button

Add Achievement

Purpose

Open Add Achievement Dialog

POST

/api/achievements

================================================================================
SECTION 4
ACHIEVEMENT CARD
================================================================================

Each Card Displays

• Image

• Title

• Issuer

• Date

• Category Badge

• Description

• Verification Status

• Action Menu

Frontend Needs

{
    "id":"",

    "title":"Best Project Award",

    "issuer":"IIT Madras",

    "category":"award",

    "custom_category":"",

    "date":"2026-02-02",

    "description":"Awarded for outstanding project.",

    "status":"pending",

    "image_url":"",

    "certificate_url":""
}

================================================================================
SECTION 5
STATISTICS CARDS
================================================================================

Cards

Total

Verified

Pending

Rejected

Frontend Needs

{
    "total":2,

    "verified":1,

    "pending":1,

    "rejected":0
}

Recommended Future Endpoint

GET

/api/achievements/stats

================================================================================
SECTION 6
ACHIEVEMENT DETAILS
================================================================================

Achievement Model

{
    "_id":"",

    "title":"",

    "category":"",

    "custom_category":"",

    "issuer":"",

    "date":"",

    "description":"",

    "image_url":"",

    "certificate_url":"",

    "status":"pending"
}

================================================================================
SECTION 7
ADD ACHIEVEMENT
================================================================================

POST

/api/achievements

Request

{
    "title":"",

    "category":"award",

    "custom_category":"",

    "issuer":"",

    "date":"",

    "description":"",

    "image_url":"",

    "certificate_url":""
}

Response

{
    "success":true,

    "message":"Achievement created successfully."
}

Default Status

pending

================================================================================
SECTION 8
EDIT ACHIEVEMENT
================================================================================

PATCH

/api/achievements/:id

Editable Fields

Title

Category

Custom Category

Issuer

Date

Description

Image

Certificate

================================================================================
SECTION 9
DELETE ACHIEVEMENT
================================================================================

DELETE

/api/achievements/:id

Response

{
    "success":true,

    "message":"Achievement deleted successfully."
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

Only faculty/admin can verify achievements.

================================================================================
DATABASE OWNERSHIP
================================================================================

Source of Truth

achievements

Responsible For

• Achievement Details

• Award Information

• Category

• Images

• Certificates

• Verification Status

================================================================================
STUDENTSEARCH PROJECTION
================================================================================

Projection

portfolio.achievements

Example

{
    "achievements":{

        "total":2,

        "verified":1
    }
}

StudentSearch stores only summary information.

================================================================================
FIELD OWNERSHIP
================================================================================

| UI Field | Collection | StudentSearch | Owner |
|----------|------------|---------------|-------|
| Title | achievements | No | Achievement |
| Issuer | achievements | No | Achievement |
| Category | achievements | No | Achievement |
| Custom Category | achievements | No | Achievement |
| Date | achievements | No | Achievement |
| Description | achievements | No | Achievement |
| Image | achievements | No | Achievement |
| Certificate | achievements | No | Achievement |
| Status | achievements | Yes (Summary) | Achievement |

================================================================================
EVENTBUS
================================================================================

AchievementCreated

↓

Update Portfolio Summary

------------------------

AchievementUpdated

↓

Update Portfolio Summary

------------------------

AchievementVerified

↓

Update Portfolio Summary

------------------------

AchievementDeleted

↓

Update Portfolio Summary

================================================================================
SYNCHRONIZATION
================================================================================

achievements

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

Title

Required

Maximum 200 Characters

------------------------

Category

Required

------------------------

Custom Category

Required only when category = other

------------------------

Date

Cannot be a future date

------------------------

Description

Maximum 2000 Characters

------------------------

Image URL

Valid URL

------------------------

Certificate URL

Valid URL

================================================================================
CQRS RULES
================================================================================

✔ achievements collection is the Write Model.

✔ StudentSearch stores only portfolio summary information.

✔ Dashboard never queries achievements directly.

✔ Portfolio statistics are updated asynchronously.

================================================================================
DEVELOPMENT RULES
================================================================================

✔ Achievement documents remain the source of truth.

✔ Verification belongs to the Achievement Domain.

✔ Portfolio summaries are updated only through domain events.

✔ Images and certificates are optional supporting evidence.

================================================================================
END OF DOCUMENT

ACHIEVEMENTS_PAGE_CONTRACT.md

Version: 1.0

Status: Source of Truth

Module: Student Achievements