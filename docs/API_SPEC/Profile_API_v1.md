# Module 02 — Student Profile API Specification v1.0

## High Level Goal
Move the Profile module from a database-driven implementation to an API Contract driven implementation.
The frontend must NEVER depend on MongoDB models. The backend owns all business logic, while the frontend only renders a stable DTO.

## Core Principles
1. **Backend owns business logic**: Frontend should NEVER calculate Profile Completion, Missing Fields, Project Counts, Skill Counts, Resume Status, or Statistics.
2. **Stable DTO**: The API contract is permanent. If Mongo schema changes later, the frontend never changes.
3. **Layered Architecture**: Route -> Controller -> Service -> Repository -> MongoDB. No shortcuts.

## API Endpoints

### `GET /api/v1/student/profile`
Returns the entire Profile DTO. This is the single source of truth for the Profile page.

### `PATCH /api/v1/student/profile/basic`
Updates Basic Information only (Name, Phone, DOB, Address, Languages).

### `PATCH /api/v1/student/profile/academic`
Updates Academic Information only (Department, Section, Semester, CGPA).

### `PATCH /api/v1/student/profile/career`
Updates Career Information only (Career Objective, Preferred Job Role, Preferred Work Locations).

### `PATCH /api/v1/student/profile/social`
Updates Social Links only (GitHub, LinkedIn, Portfolio, Coding Profiles).

### `POST /api/v1/student/profile/photo`
Upload profile image.

### `POST /api/v1/student/profile/resume`
Upload Resume.

## DTO Standard
Every endpoint returns the global API contract:
```json
{
    "success": true,
    "message": "...",
    "data": { ... },
    "meta": {},
    "errors": null
}
```

The `GET /api/v1/student/profile` `data` payload:
```json
{
  "basic_information": { ... },
  "academic_information": { ... },
  "career_information": { ... },
  "social_links": { ... },
  "resume": { ... },
  "statistics": { ... },
  "profile_completion": { ... }
}
```

## Profile Completion Rules
Calculated dynamically by `ProfileCompletionService` using configurations in `config/profileCompletion.config.js`.

| Section | Weight |
|----------|--------|
| Basic Information | 20% |
| Academic Information | 15% |
| Career Information | 15% |
| Social Links | 10% |
| Resume Uploaded | 30% |
| Alternate Phone | 10% |
