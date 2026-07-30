# SkillSphere Projects Page Data Contract

Version: 1.0
Module: Student Projects
Status: Source of Truth
Owner: Projects Domain

---

# Purpose

This document defines the complete data contract for the Student Projects page.

It includes

- Project Dashboard
- CRUD Operations
- Faculty Review Workflow
- Featured Projects
- Portfolio Synchronization
- StudentSearch Projection
- Validation Rules

Projects are one of the primary portfolio assets used to evaluate a student's practical skills.

---

# Route

/student/projects

---

# Authorization

Bearer JWT

Role Required

Student

---

# Architecture

                 Student Projects UI
                         │
                         ▼
               GET /api/projects
                         │
                         ▼
               Projects Controller
                         │
                         ▼
                Projects Service
                         │
                         ▼
              Projects Repository
                         │
                         ▼
                 MongoDB Projects
                         │
                         ▼
              ProjectUpdated Event
                         │
                         ▼
               StudentSearch Sync
                         │
                         ▼
             Dashboard / Portfolio

---

# Frontend Layout

Projects Page

├── Status Filter Tabs
├── Search Bar
├── Add Project Button
├── Project Cards
├── Project Action Menu
└── Statistics Cards

---

# Complete GET API

GET

/api/projects

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

• In Progress

• Featured

Purpose

Filter projects by completion status and featured flag.

Mapping

Completed

completion_status = completed

----------------------------

In Progress

completion_status = in_progress

----------------------------

Featured

is_featured = true

================================================================================
SECTION 2
SEARCH
================================================================================

Placeholder

Search projects...

Suggested API

GET

/api/projects?search=skillsphere

Search Fields

title

description

tech_stack

================================================================================
SECTION 3
ADD PROJECT
================================================================================

Button

Add Project

Purpose

Open Add Project Dialog

POST

/api/projects

================================================================================
SECTION 4
PROJECT CARD
================================================================================

Each Card Displays

• Thumbnail

• Title

• Description

• Faculty Review Status

• Completion Status

• Featured Badge

• Technology Stack

• GitHub

• Live Demo

• Action Menu

Frontend Needs

{
    "id":"",

    "title":"Skillsphere",

    "description":"Skillsphere is a students skill tracking platform",

    "tech_stack":[
        "React",
        "Node",
        "MongoDB"
    ],

    "completion_status":"completed",

    "status":"reviewed",

    "is_featured":true,

    "github_url":"https://...",

    "live_demo_url":"https://..."
}

================================================================================
SECTION 5
STATISTICS CARDS
================================================================================

Cards

Total Projects

Completed

In Progress

Featured

Frontend Needs

{
    "total":2,

    "completed":2,

    "in_progress":0,

    "featured":2
}

Recommended Future Endpoint

GET

/api/projects/stats

================================================================================
SECTION 6
PROJECT DETAILS
================================================================================

Project Model

{
    "_id":"",

    "title":"",

    "description":"",

    "tech_stack":[],

    "completion_status":"completed",

    "complexity_tier":"intermediate",

    "status":"reviewed",

    "is_featured":true,

    "github_url":"",

    "live_demo_url":"",

    "student_ids":[],

    "faculty_rating":{}
}

================================================================================
SECTION 7
FACULTY REVIEW
================================================================================

Faculty Rating

{
    "functionality":3,

    "code_quality":3,

    "documentation":3,

    "innovation":3,

    "complexity":3,

    "average":3,

    "feedback":""
}

Review Status

pending

↓

under_review

↓

reviewed

↓

approved

or

↓

rejected

Only faculty can modify review information.

================================================================================
SECTION 8
ADD PROJECT
================================================================================

POST

/api/projects

Request

{
    "title":"",

    "description":"",

    "tech_stack":[],

    "github_url":"",

    "live_demo_url":"",

    "completion_status":"completed",

    "complexity_tier":"intermediate",

    "is_featured":false
}

Response

{
    "success":true,

    "message":"Project created successfully."
}

Default Status

pending

================================================================================
SECTION 9
EDIT PROJECT
================================================================================

PATCH

/api/projects/:id

Editable Fields

Title

Description

Tech Stack

GitHub URL

Demo URL

Completion Status

Complexity

Featured

================================================================================
SECTION 10
DELETE PROJECT
================================================================================

DELETE

/api/projects/:id

Response

{
    "success":true,

    "message":"Project deleted successfully."
}

================================================================================
DATABASE OWNERSHIP
================================================================================

Source of Truth

projects

Responsible For

• Project Details

• Team Members

• Tech Stack

• GitHub

• Live Demo

• Review Status

• Faculty Rating

• Featured Status

================================================================================
STUDENTSEARCH PROJECTION
================================================================================

Projection

portfolio.projects

Example

{
    "projects":{

        "total":2,

        "verified":2,

        "featured":2
    }
}

StudentSearch stores only summary information.

Full project documents remain in the projects collection.

================================================================================
FIELD OWNERSHIP
================================================================================

| UI Field | Collection | StudentSearch | Owner |
|----------|------------|---------------|-------|
| Title | projects | No | Projects |
| Description | projects | No | Projects |
| Tech Stack | projects | No | Projects |
| GitHub URL | projects | No | Projects |
| Demo URL | projects | No | Projects |
| Completion Status | projects | No | Projects |
| Review Status | projects | No | Projects |
| Faculty Rating | projects | No | Projects |
| Featured | projects | Yes (Count) | Projects |

================================================================================
EVENTBUS
================================================================================

ProjectCreated

↓

Update Portfolio Summary

------------------------

ProjectUpdated

↓

Update Portfolio Summary

------------------------

ProjectReviewed

↓

Update Portfolio Summary

------------------------

ProjectDeleted

↓

Update Portfolio Summary

================================================================================
SYNCHRONIZATION
================================================================================

projects

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

Description

Required

Maximum 5000 Characters

------------------------

Tech Stack

Minimum 1 Technology

------------------------

GitHub URL

Valid URL

------------------------

Live Demo URL

Valid URL

------------------------

Complexity

beginner

intermediate

advanced

================================================================================
CQRS RULES
================================================================================

✔ projects collection is the Write Model.

✔ StudentSearch stores only portfolio summaries.

✔ Dashboard never queries projects directly.

✔ Faculty review updates propagate asynchronously.

================================================================================
DEVELOPMENT RULES
================================================================================

✔ Project documents remain the source of truth.

✔ Faculty ratings are immutable by students.

✔ Featured projects contribute to portfolio statistics.

✔ Portfolio summary must be updated through domain events.

================================================================================
END OF DOCUMENT

PROJECTS_PAGE_CONTRACT.md

Version: 1.0

Status: Source of Truth

Module: Student Projects