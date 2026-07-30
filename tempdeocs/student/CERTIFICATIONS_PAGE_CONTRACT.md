# SkillSphere Certifications Page Data Contract

Version: 1.0
Module: Student Certifications
Status: Source of Truth
Owner: Certification Domain

---

# Purpose

This document defines the complete data contract for the Student Certifications page.

It includes

- Certification Dashboard
- CRUD APIs
- Verification Workflow
- Database Ownership
- StudentSearch Synchronization
- Portfolio Synchronization
- Validation Rules

The Certifications page is the source of truth for all student certifications.

---

# Route

/student/certifications

---

# Authorization

Bearer JWT

Role Required

Student

---

# Architecture

              Student Certifications UI
                        │
                        ▼
           GET /api/certifications
                        │
                        ▼
           Certifications Controller
                        │
                        ▼
            Certifications Service
                        │
                        ▼
          Certifications Repository
                        │
                        ▼
             MongoDB Certifications
                        │
                        ▼
      CertificationUpdated Event
                        │
                        ▼
           StudentSearch Projection
                        │
                        ▼
          Dashboard / Portfolio

---

# Frontend Layout

Certifications Page

├── Status Filter Tabs
├── Search Bar
├── Add Certification Button
├── Certification List
├── Certification Action Menu
└── Statistics Cards

---

# Complete GET API

GET

/api/certifications

Authorization

Bearer JWT

Response

{
    "success": true,
    "data": [],
    "error": null,
    "meta": {
        "total": 1
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

• Expired

Purpose

Filters certifications by status.

Backend Source

Derived from certification.status

================================================================================
SECTION 2
SEARCH
================================================================================

Placeholder

Search certifications...

Suggested API

GET /api/certifications?search=RHCSA

Search Fields

title

issuer

category

credential_id

================================================================================
SECTION 3
ADD CERTIFICATION
================================================================================

Button

Add Certification

Purpose

Open Add Certification Dialog

POST

/api/certifications

================================================================================
SECTION 4
CERTIFICATION CARD
================================================================================

Each Card Displays

• Title

• Issuer

• Verification Status

• Issue Date

• Action Menu

Frontend Needs

{
    "id":"6a363f71e0a3c33582e59605",

    "title":"RHCSA",

    "issuer":"Redhat",

    "category":"technical",

    "status":"verified",

    "issue_date":"2026-02-26",

    "expiry_date":"2029-02-26"
}

Backend Mapping

{
    "_id":"",

    "title":"RHCSA",

    "issuer":"Redhat",

    "category":"technical",

    "issue_date":"2026-02-26",

    "expiry_date":"2029-02-26",

    "credential_id":"",

    "drive_link":"",

    "status":"verified",

    "verified_at":"2026-06-20T07:39:04Z"
}

================================================================================
SECTION 5
STATISTICS CARDS
================================================================================

Cards

Total

Verified

Pending

Expired

Frontend Needs

{
    "total":1,

    "verified":1,

    "pending":0,

    "expired":0
}

Current Backend

Derived from GET response.

Recommended Future API

GET

/api/certifications/stats

Response

{
    "total":1,

    "verified":1,

    "pending":0,

    "expired":0
}

================================================================================
SECTION 6
ACTION MENU
================================================================================

Available Actions

View

Edit

Delete

Download

Open Credential

================================================================================
SECTION 7
ADD CERTIFICATION
================================================================================

POST

/api/certifications

Request

{
    "title":"RHCSA",

    "issuer":"Redhat",

    "category":"technical",

    "issue_date":"2026-02-26",

    "expiry_date":"2029-02-26",

    "credential_id":"",

    "drive_link":"https://..."
}

Response

{
    "success":true,

    "message":"Certification added successfully."
}

Default Status

pending

================================================================================
SECTION 8
EDIT CERTIFICATION
================================================================================

PATCH

/api/certifications/:id

Request

{
    "title":"RHCSA",

    "issuer":"Redhat",

    "category":"technical",

    "expiry_date":"2029-02-26",

    "credential_id":"",

    "drive_link":"https://..."
}

Response

{
    "success":true,

    "message":"Certification updated successfully."
}

Note

Editing a verified certification may reset verification status according to institutional verification policy.

================================================================================
SECTION 9
DELETE CERTIFICATION
================================================================================

DELETE

/api/certifications/:id

Response

{
    "success":true,

    "message":"Certification deleted successfully."
}

================================================================================
DATABASE OWNERSHIP
================================================================================

Source of Truth

certifications

Responsible For

• Certification Details

• Verification Status

• Credential Information

• Certificate Link

• Expiry Information

================================================================================
STUDENTSEARCH PROJECTION
================================================================================

Projection

portfolio.certifications

Example

{
    "certifications": {

        "total": 1,

        "verified": 1
    }
}

Only summary information should be stored.

Full certification records remain in the certifications collection.

================================================================================
FIELD OWNERSHIP
================================================================================

| UI Field | Collection | StudentSearch | Owner |
|----------|------------|---------------|-------|
| Title | certifications | No | Certification |
| Issuer | certifications | No | Certification |
| Category | certifications | No | Certification |
| Issue Date | certifications | No | Certification |
| Expiry Date | certifications | No | Certification |
| Credential ID | certifications | No | Certification |
| Drive Link | certifications | No | Certification |
| Status | certifications | Yes (Summary) | Certification |

================================================================================
EVENTBUS
================================================================================

CertificationCreated

↓

Update Portfolio Summary

----------------------------

CertificationUpdated

↓

Update Portfolio Summary

----------------------------

CertificationVerified

↓

Update Portfolio Summary

----------------------------

CertificationDeleted

↓

Update Portfolio Summary

================================================================================
SYNCHRONIZATION
================================================================================

certifications

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

Maximum 200 characters

----------------------------

Issuer

Required

Maximum 200 characters

----------------------------

Issue Date

Required

----------------------------

Expiry Date

Must be after Issue Date

----------------------------

Drive Link

Must be valid URL

----------------------------

Category

Required

================================================================================
CQRS RULES
================================================================================

✔ certifications collection is the Write Model.

✔ StudentSearch stores only summary information.

✔ Dashboard must never query certifications directly.

✔ Portfolio summary is updated asynchronously.

================================================================================
DEVELOPMENT RULES
================================================================================

✔ Certification documents remain the source of truth.

✔ Verification updates are handled by the Certification Domain.

✔ StudentSearch contains only aggregate counts.

✔ Expired certifications should be reflected in summary counts.

================================================================================
END OF DOCUMENT

CERTIFICATIONS_PAGE_CONTRACT.md

Version: 1.0

Status: Source of Truth

Module: Student Certifications