# SkillSphere Architecture

SkillSphere follows a modern, decoupled client-server architecture utilizing a standard MERN stack with strict layered patterns on the backend and context-driven state on the frontend.

## 1. System Overview

SkillSphere consists of two primary applications:
1.  **Frontend (React SPA)**: Built with Vite and TailwindCSS, managing role-based workflows for Students, Faculty, HODs, and Placement Admins.
2.  **Backend (Node/Express API)**: A RESTful API built on Express and MongoDB/Mongoose.

---

## 2. Folder Structure

### Backend (`/backend`)
```text
backend/
├── config/             # Database and environment configurations
├── constants/          # Application-wide constants
├── controllers/        # Request handling and orchestration
├── middleware/         # Express middleware (Auth, Validation, Error Handling)
├── models/             # Mongoose schemas (Data Definitions)
├── repositories/       # Database access layer (Queries)
├── routes/             # Express route definitions
├── services/           # Core business logic and external integrations
└── utils/              # Helper functions (Response formatting, Security)
```

### Frontend (`/frontend`)
```text
frontend/
├── src/
│   ├── assets/         # Static assets
│   ├── components/     # Reusable UI components
│   ├── constants/      # Client-side constants (Roles, Status, Tiers)
│   ├── contexts/       # React Context API (Auth, Toast, etc.)
│   ├── layouts/        # Page wrappers and sidebars
│   ├── pages/          # Route-level components grouped by Role
│   ├── services/       # External service wrappers (API, Axios)
│   └── utils/          # Client-side helpers (Date parsing, Formatters)
```

---

## 3. Layer Responsibilities (Backend)

We strictly enforce separation of concerns across four primary layers:

### A. Routes Layer (`/routes`)
-   Registers endpoints.
-   Applies middlewares (Authentication, Authorization `requireOwnerOrRole`).
-   Defines payload validation rules using `express-validator`.
-   **Rule**: NEVER write Mongoose queries or business logic here.

### B. Controller Layer (`/controllers`)
-   Receives requests from routes.
-   Extracts and checks validation errors.
-   Calls Services (for business logic) or Repositories (for direct data operations).
-   Formats and returns HTTP responses using unified `success()` and `error()` helpers.
-   **Rule**: Controllers manage the *flow*, not the *rules* or the *queries*.

### C. Service Layer (`/services`)
-   Contains core business logic that may span multiple domains.
-   Handles cross-cutting operations like calculating readiness scores, synchronizing denormalized data (e.g., `studentSearchSync`), or sending notifications.
-   Calls repositories as needed.

### D. Repository Layer (`/repositories`)
-   The only layer allowed to import and use Mongoose models directly.
-   Encapsulates all database read/write/update operations.
-   Keeps the controllers and services completely unaware of database syntax (e.g., `$set`, `$push`).

---

## 4. Database Overview

The system uses MongoDB. The core schema design revolves around a central `User` identity and associated modular collections. 

**Key Collections:**
-   **Users / Students**: Identity and base demographic details.
-   **Portfolios**: `Skills`, `Projects`, `Internships`, `Certifications`, `Achievements`, `CodingProfiles`.
-   **System**: `Resumes`, `VerificationLogs`.
-   **Denormalized Projections**: `StudentSearch` (A flattened, read-optimized collection synced asynchronously to power high-performance HOD and Admin search).

### The Synchronization Pattern
To support rapid read queries on complex filtering fields, SkillSphere uses a **Fire-and-Forget Sync** pattern. 
When core collections are mutated (e.g., a skill is verified or a resume is uploaded), the backend triggers a background task (`syncStudentSearch`) that updates the flattened `StudentSearch` collection without blocking the initial HTTP response.

---

## 5. API Overview

The backend uses a standard JSON envelope for all responses to ensure consistent frontend parsing:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "meta": { "total": 10 }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Message describing error",
  "code": "ERROR_CODE"
}
```

On the frontend, the Axios interceptor automatically unwraps this envelope and handles authentication tokens securely.
