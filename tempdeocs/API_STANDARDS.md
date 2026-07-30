# SkillSphere API Standards

Version: 1.0

Document: API Standards

Status: Source of Truth

Applies To

- Student Module
- Faculty Module
- Admin Module
- Placement Module
- Authentication Module
- Future Services

---

# Purpose

This document defines the common API standards followed across the SkillSphere backend.

Every REST endpoint must follow these standards to ensure:

- Consistent API responses
- Predictable frontend integration
- Easier maintenance
- Standardized error handling
- Uniform pagination
- Better developer experience

---

# REST Principles

SkillSphere follows RESTful API conventions.

| Operation | HTTP Method |
|------------|-------------|
| Read | GET |
| Create | POST |
| Update | PATCH |
| Replace | PUT (Rare) |
| Delete | DELETE |

---

# API URL Convention

Pattern

```
/api/<module>
```

Examples

```
/api/profile

/api/skills

/api/projects

/api/internships

/api/certifications

/api/achievements

/api/resumes

/api/coding-profiles

/api/dashboard

/api/notifications
```

---

# Resource URLs

Collection

```
GET /api/projects
```

Single Resource

```
GET /api/projects/:id
```

Create

```
POST /api/projects
```

Update

```
PATCH /api/projects/:id
```

Delete

```
DELETE /api/projects/:id
```

---

# Standard Response Format

Every API must return the same response structure.

Success

```json
{
    "success": true,
    "data": {},
    "error": null,
    "meta": {}
}
```

List Response

```json
{
    "success": true,
    "data": [],
    "error": null,
    "meta": {
        "total": 25,
        "page": 1,
        "limit": 20,
        "pages": 2
    }
}
```

Failure

```json
{
    "success": false,
    "data": null,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Project title is required."
    },
    "meta": null
}
```

---

# Success Response Rules

Always return

```
success

data

error

meta
```

Never omit fields.

Bad

```json
{
    "success": true,
    "data": {}
}
```

Good

```json
{
    "success": true,
    "data": {},
    "error": null,
    "meta": {}
}
```

---

# Error Object

Structure

```json
{
    "code": "RESOURCE_NOT_FOUND",
    "message": "Project not found."
}
```

Supported Codes

```
VALIDATION_ERROR

BAD_REQUEST

UNAUTHORIZED

FORBIDDEN

RESOURCE_NOT_FOUND

CONFLICT

INTERNAL_SERVER_ERROR
```

---

# HTTP Status Codes

| Status | Purpose |
|----------|----------|
| 200 | Success |
| 201 | Created |
| 204 | Deleted |
| 400 | Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Resource Not Found |
| 409 | Conflict |
| 422 | Invalid Business Rule |
| 500 | Internal Server Error |

---

# Pagination Standard

Query Parameters

```
?page=1

?limit=20
```

Example

```
GET /api/projects?page=1&limit=20
```

Meta Response

```json
{
    "total": 42,
    "page": 1,
    "limit": 20,
    "pages": 3
}
```

---

# Search Standard

Query Parameter

```
search
```

Example

```
GET /api/projects?search=skillsphere
```

Supported By

- Skills
- Projects
- Certifications
- Internships
- Achievements
- Notifications

---

# Sorting

Query Parameter

```
sort
```

Examples

```
?sort=created_at

?sort=-created_at

?sort=name

?sort=-cgpa
```

"-" means descending order.

---

# Filtering

Status

```
?status=verified
```

Category

```
?category=technical
```

Type

```
?type=award
```

Example

```
GET /api/skills?status=verified
```

---

# Date Filters

Examples

```
?from=2026-01-01

?to=2026-07-30
```

Combined

```
GET /api/notifications?from=2026-01-01&to=2026-07-30
```

---

# Resource Naming

Collections

Plural

Correct

```
projects

skills

notifications

internships
```

Incorrect

```
project

skill

notification
```

---

# JSON Naming Convention

Use

camelCase

Correct

```json
{
    "createdAt": "",
    "updatedAt": "",
    "profileScore": 90
}
```

Avoid

snake_case in API responses.

Database may continue using snake_case if required.

---

# ID Naming

Mongo

```
_id
```

Frontend DTO

```
id
```

Controllers should map

```
_id

↓

id
```

---

# Timestamp Standard

Use ISO-8601 UTC

Example

```
2026-07-30T08:15:00.000Z
```

Never return formatted strings.

Formatting belongs to frontend.

---

# Boolean Naming

Correct

```
isVerified

isFeatured

isRead

hasResume

isLinked
```

Avoid

```
verified

featured

read
```

---

# Enum Standard

Lowercase

Example

```
verified

pending

rejected

approved
```

Avoid

```
Verified

Pending

Rejected
```

---

# PATCH Standard

PATCH only updates supplied fields.

Request

```json
{
    "preferredRole": "Software Engineer"
}
```

Should not overwrite

```
phone

email

city
```

---

# DELETE Standard

Success

```
204 No Content
```

or

```json
{
    "success": true,
    "message": "Deleted successfully."
}
```

---

# Authentication

Protected APIs

```
Authorization

Bearer JWT
```

Public APIs

No Authorization Header

---

# File Upload

Content-Type

```
multipart/form-data
```

Example

```
POST /api/resumes
```

Payload

```
resume.pdf
```

---

# Validation

Always validate

- Required fields
- String length
- Enum values
- Date format
- Number range
- URL format

Validation must happen in the Service layer.

---

# Logging

Log

- Request ID
- User ID
- API
- Execution Time
- Status Code

Never log

- Password
- JWT
- Refresh Token
- OTP
- Personal Secrets

---

# CQRS Rules

Write APIs

```
POST

PATCH

DELETE
```

must update

MongoDB

↓

Publish Domain Event

↓

EventBus

↓

Projection Update

Read APIs

```
GET
```

must never publish events.

---

# Event Naming Standard

Past Tense

Examples

```
StudentUpdated

SkillVerified

ProjectReviewed

ResumeUploaded

ATSAnalysisCompleted

CodingProfileSynced

NotificationCreated

PlacementCalculated
```

Avoid

```
UpdateStudent

VerifySkill

UploadResume
```

---

# StudentSearch Rules

StudentSearch is

Read Only

Never write directly.

Correct Flow

```
MongoDB

↓

Domain Event

↓

Projection Handler

↓

StudentSearch
```

Wrong Flow

```
Controller

↓

StudentSearch
```

---

# Controller Responsibilities

Controllers should only

- Validate request format
- Call service
- Return response

Controllers must never

- Write Mongo queries
- Compute business rules
- Publish events directly

---

# Service Responsibilities

Service Layer owns

- Business logic
- Validation
- Permission checks
- Event publishing
- Transactions

---

# Repository Responsibilities

Repositories own

- MongoDB queries
- Aggregation
- Index usage
- Persistence

Repositories never contain business logic.

---

# Frontend Contract Rules

Frontend should never depend on

MongoDB field names.

Backend should return DTOs.

Correct

```json
{
    "id": "123",
    "profileScore": 92
}
```

Avoid

```json
{
    "_id": "...",
    "__v": 0
}
```

---

# Performance Guidelines

Prefer

- Pagination
- Projection
- Indexes
- StudentSearch

Avoid

- N+1 Queries
- Multiple Aggregations
- Large Payloads
- Returning entire documents

---

# API Versioning

Pattern

```
/api/v1/projects
```

Current

```
v1
```

Future

```
v2
```

Breaking changes require a new version.

---

# Documentation Rules

Every module contract should include

- Purpose
- Route
- Authorization
- Architecture
- Frontend Layout
- GET Contract
- POST
- PATCH
- DELETE
- Database Ownership
- EventBus
- StudentSearch Mapping
- Validation
- Error Responses
- Performance Notes

---

# Development Rules

✅ APIs must be RESTful.

✅ Always return the standard response format.

✅ Services contain business logic.

✅ Controllers remain thin.

✅ Repositories own persistence.

✅ StudentSearch is read-only.

✅ Every write operation publishes a domain event.

✅ Frontend consumes DTOs, not database models.

✅ All timestamps use ISO-8601 UTC.

✅ Use camelCase in API responses.

✅ Maintain backward compatibility within the same API version.

---

# End of Document

API_STANDARDS.md

Version: 1.0

Status: Source of Truth