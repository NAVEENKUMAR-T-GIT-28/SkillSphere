# SkillSphere Student Module

Version: 1.0

Module: Student

Status: Source of Truth

---

# Overview

The Student Module is the primary domain responsible for managing a student's academic profile, portfolio, coding activities, resume, achievements, internships, certifications, and personalized dashboard.

This module follows **CQRS (Command Query Responsibility Segregation)** and **Event-Driven Architecture**.

The Student Module is composed of multiple independent domains that publish domain events and synchronize read models through **StudentSearch**.

---

# Module Goals

- Maintain a single source of truth for all student information.
- Separate write models from read models.
- Synchronize dashboard data using domain events.
- Avoid expensive runtime aggregations.
- Provide reusable API contracts for frontend applications.

---

# Student Module Architecture

```
                        Student UI
                             │
                             ▼
                     REST API Layer
                             │
                             ▼
              Controller → Service → Repository
                             │
                             ▼
                     MongoDB Collections
                             │
                             ▼
                     Domain Events
                             │
                             ▼
                         Event Bus
                             │
                             ▼
                  StudentSearch Projection
                             │
                             ▼
      Dashboard / Search / Analytics / Placement
```

---

# Folder Structure

```
docs/
└── students/
    │
    ├── README.md
    ├── DASHBOARD_PAGE_CONTRACT.md
    ├── PROFILE_PAGE_CONTRACT.md
    ├── SKILLS_PAGE_CONTRACT.md
    ├── PROJECTS_PAGE_CONTRACT.md
    ├── INTERNSHIPS_PAGE_CONTRACT.md
    ├── CERTIFICATIONS_PAGE_CONTRACT.md
    ├── ACHIEVEMENTS_PAGE_CONTRACT.md
    ├── RESUME_PAGE_CONTRACT.md
    ├── CODING_PROFILES_PAGE_CONTRACT.md
    └── NOTIFICATIONS_PAGE_CONTRACT.md
```

---

# Student Pages

| Page | Purpose | Write Model | Read Model |
|------|---------|------------|------------|
| Dashboard | Student overview | None | StudentSearch |
| Profile | Personal & Academic information | students | StudentSearch |
| Skills | Student skills | skills | StudentSearch Summary |
| Projects | Student projects | projects | StudentSearch Summary |
| Internships | Internship history | internships | StudentSearch Summary |
| Certifications | Certifications | certifications | StudentSearch Summary |
| Achievements | Awards & recognitions | achievements | StudentSearch Summary |
| Resume | Resume & ATS | resumes / resume_analyses | StudentSearch ATS |
| Coding Profiles | Coding platform analytics | coding_profiles | StudentSearch Coding |
| Notifications | Event feed | notifications | notifications |

---

# Student Domain Collections

```
students
classes
skills
projects
internships
certifications
achievements
resumes
resume_analyses
coding_profiles
notifications
```

---

# StudentSearch Read Model

StudentSearch is a denormalized read projection.

Purpose

- Dashboard
- Search
- Placement
- Analytics
- Fast Profile Summary

Projection Structure

```json
{
  "identity": {},
  "academic": {},
  "profile": {},
  "portfolio": {},
  "coding": {},
  "ats": {},
  "placement": {},
  "mentor": {}
}
```

StudentSearch is **not** the source of truth.

---

# Source of Truth

| Domain | Collection |
|---------|------------|
| Student | students |
| Skills | skills |
| Projects | projects |
| Internships | internships |
| Certifications | certifications |
| Achievements | achievements |
| Resume | resumes |
| ATS | resume_analyses |
| Coding | coding_profiles |
| Notifications | notifications |

---

# CQRS Architecture

## Write Model

```
students
skills
projects
internships
certifications
achievements
resumes
resume_analyses
coding_profiles
notifications
```

Responsible for

- Create
- Update
- Delete

---

## Read Model

```
StudentSearch
```

Responsible for

- Dashboard

- Student Search

- Portfolio Summary

- ATS Summary

- Coding Summary

- Placement Readiness

---

# Synchronization Flow

```
Student Update

        │

        ▼

MongoDB Collection

        │

        ▼

Domain Event

        │

        ▼

Event Bus

        │

        ▼

Projection Handler

        │

        ▼

StudentSearch

        │

        ▼

Dashboard
Profile
Placement
Analytics
```

---

# Event Flow

```
StudentUpdated

↓

Update StudentSearch.identity

----------------------------------

SkillVerified

↓

Update Portfolio Summary

----------------------------------

ProjectReviewed

↓

Update Portfolio Summary

----------------------------------

InternshipVerified

↓

Update Portfolio Summary

----------------------------------

CertificationVerified

↓

Update Portfolio Summary

----------------------------------

AchievementVerified

↓

Update Portfolio Summary

----------------------------------

ResumeUploaded

↓

Run ATS Analysis

----------------------------------

ATSAnalysisCompleted

↓

Update StudentSearch.ats

----------------------------------

CodingProfileSynced

↓

Update StudentSearch.coding

----------------------------------

ReadinessScoreCalculated

↓

Update StudentSearch.placement
```

---

# Domain Ownership

| Domain | Owns |
|---------|------|
| Student | Identity, Academic, Profile |
| Skills | Skills |
| Projects | Projects |
| Internships | Internship Records |
| Certifications | Certifications |
| Achievements | Awards |
| Resume | Resume Versions |
| ATS Engine | Resume Analysis |
| Coding | Coding Platform Data |
| Notifications | Notification Feed |

Domains never modify another domain's collection directly.

---

# Dashboard Data Sources

| Widget | Source |
|---------|--------|
| Hero | StudentSearch.identity |
| Profile Completion | StudentSearch.profile |
| ATS | StudentSearch.ats |
| Coding | StudentSearch.coding |
| Portfolio | StudentSearch.portfolio |
| Readiness | StudentSearch.placement |
| Notifications | notifications |
| Drives | drives |
| Timeline | timeline |
| Tasks | tasks |

---

# Backend Standards

All modules follow the same architecture.

```
Route

↓

Controller

↓

Service

↓

Repository

↓

MongoDB

↓

Domain Event

↓

StudentSearch
```

---

# API Standards

All APIs follow the same response format.

Success

```json
{
    "success": true,
    "data": {},
    "error": null,
    "meta": {}
}
```

Failure

```json
{
    "success": false,
    "data": null,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "..."
    }
}
```

---

# Development Rules

✅ MongoDB Collections are the Source of Truth.

✅ StudentSearch is a Read Model only.

✅ Dashboard never queries domain collections directly.

✅ Every domain publishes events after successful updates.

✅ StudentSearch is updated asynchronously.

✅ Cross-domain communication must happen through EventBus.

✅ No module should directly modify another module's collection.

✅ Controllers must remain thin.

✅ Business logic belongs in Services.

✅ Database access belongs in Repositories.

---

# Performance Guidelines

- Read from StudentSearch whenever possible.
- Avoid MongoDB aggregations for dashboard requests.
- Cache platform statistics inside coding_profiles.
- Store only summary data in StudentSearch.
- Use pagination for list-based modules.
- Run ATS analysis asynchronously.
- Synchronize coding platforms asynchronously.

---

# Future Enhancements

- Event Replay
- Audit Logs
- Profile Versioning
- Real-time Notifications
- WebSocket Dashboard Updates
- AI Resume Recommendations
- Placement Recommendation Engine
- Skill Gap Analysis
- Resume Version Comparison
- Coding Trend Analytics

---

# Related Documents

- DASHBOARD_PAGE_CONTRACT.md
- PROFILE_PAGE_CONTRACT.md
- SKILLS_PAGE_CONTRACT.md
- PROJECTS_PAGE_CONTRACT.md
- INTERNSHIPS_PAGE_CONTRACT.md
- CERTIFICATIONS_PAGE_CONTRACT.md
- ACHIEVEMENTS_PAGE_CONTRACT.md
- RESUME_PAGE_CONTRACT.md
- CODING_PROFILES_PAGE_CONTRACT.md
- NOTIFICATIONS_PAGE_CONTRACT.md

---

# Student Module Summary

The Student Module is a collection of independent domains following **CQRS**, **Repository Pattern**, and **Event-Driven Architecture**.

- MongoDB collections are the source of truth.
- StudentSearch is the centralized read projection.
- Dashboard, Profile, Placement, and Analytics consume StudentSearch.
- Each domain owns its own data and communicates through events.
- This documentation serves as the architectural specification for all student-facing functionality in SkillSphere.

---

**End of Document**

**README.md**

**Module:** Student

**Status:** Source of Truth

**Version:** 1.0