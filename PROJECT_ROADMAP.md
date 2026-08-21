# AI Recruitment Platform

## Project Development Roadmap and Weekly Execution Plan

**Document version:** 1.0  
**Prepared date:** 5 August 2026  
**Estimated duration:** 12 weeks  
**Recommended effort:** 20–25 hours per week (approximately 270 hours)  
**Delivery approach:** Modular MVP followed by stabilization and deployment

---

## 1. Project Objective

Build a secure recruitment platform that connects candidates, companies, and administrators through role-based dashboards.

The first production-ready version will allow:

- Candidates to maintain profiles and resumes, receive deterministic ATS/profile scores, browse and save jobs, submit structured applications, and track application status.
- Companies to manage profiles and job posts, review incoming applications, shortlist/reject candidates, and schedule interviews.
- Administrators to approve companies, monitor users/jobs/applications, and moderate platform activity.
- The system to remain modular so AI-based resume analysis and job matching can be integrated later without redesigning the core application.

## 2. MVP Scope

### Candidate module

- Registration, login, logout, token refresh, and password security
- Candidate dashboard and navigation
- Profile create/update with transparent completion score
- Resume upload, download/view, replace, and remove
- PDF/DOCX validation and text extraction
- Rule-based ATS score with category breakdown
- Browse, search, filter, view, and save jobs
- Structured application form
- Application submission and duplicate prevention
- Application history and status tracking
- Notifications and interview details

### Company module

- Company registration and approval status
- Company profile management
- Company dashboard
- Create, edit, close, reopen, and delete job posts
- View applicants per job and across the company
- Candidate/application detail view
- Shortlist, reject, and interview status updates
- Interview scheduling and candidate notifications

### Admin module

- Admin-only authentication and dashboard
- Company approval/rejection workflow
- User, company, job, and application monitoring
- Activate/deactivate users, companies, and jobs
- Platform summary reports and audit-friendly actions

### Deferred scope

The following should not be included in the first MVP unless the core schedule remains on track:

- LLM/AI-generated resume feedback
- Semantic job matching or embeddings
- Video interviews
- Email/SMS providers
- Payment or subscription plans
- Real-time chat
- Native mobile applications

## 3. Proposed Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, React Router, Axios/Fetch, React Hook Form |
| Backend | ASP.NET Core Web API (.NET 10) |
| Database | SQL Server with Entity Framework Core |
| Authentication | JWT access token plus refresh-token rotation |
| File storage (development) | Protected local storage/static resume directory |
| File storage (production) | Azure Blob Storage or equivalent object storage |
| API documentation | OpenAPI/Swagger |
| Testing | xUnit, EF test database, Vitest, React Testing Library, Playwright |
| CI/CD | GitHub Actions or Azure DevOps |
| Hosting | Azure App Service/Container Apps and managed SQL Database |

## 4. Recommended Architecture

```text
Frontend (React)
  ├── Candidate workspace
  ├── Company workspace
  ├── Admin workspace
  ├── Shared components
  └── API/authentication layer
           │ HTTPS + JWT
Backend (ASP.NET Core)
  ├── Controllers / endpoints
  ├── Application services
  ├── DTO validation
  ├── Domain models and scoring rules
  ├── Repositories / EF Core
  └── Notifications and file storage
           │
SQL Server + Resume File Storage
```

Backend business logic should remain outside controllers. Dashboard endpoints should aggregate data but must reuse application, profile, resume, job, and scoring services. AI services can later implement dedicated interfaces without affecting the existing workflow.

## 5. Delivery Milestones

| Milestone | Target | Outcome |
|---|---:|---|
| M1: Foundation | End of Week 2 | Approved requirements, architecture, schema, and project skeleton |
| M2: Secure backend core | End of Week 4 | Authentication, profiles, company approval, jobs, and tests |
| M3: Candidate workflow | End of Week 7 | Resume scoring, candidate dashboard, save/apply flows |
| M4: Company and admin workflow | End of Week 9 | Applicant processing, company dashboard, admin controls |
| M5: Release candidate | End of Week 11 | Integrated, tested, secure, and deployment-ready application |
| M6: MVP release | End of Week 12 | Production deployment and handover documentation |

## 6. Weekly Task Schedule

### Week 1 — Discovery, requirements, and UX plan (20 hours)

**Objectives**

- Define actors, permissions, business rules, and MVP boundaries.
- Convert screens into user journeys and acceptance criteria.

**Tasks**

- Write candidate, company, and admin user stories.
- Define the complete job lifecycle and application status lifecycle.
- Define required application form fields and validation rules.
- Define the profile scoring matrix and ATS scoring matrix.
- Create a sitemap and route inventory for every dashboard page.
- Produce low-fidelity wireframes and responsive behavior notes.
- Create the product backlog and identify deferred AI features.

**Deliverables**

- Software Requirements Specification (SRS)
- User stories with acceptance criteria
- Sitemap, route matrix, and initial wireframes
- Prioritized product backlog

**Exit criteria:** No unresolved ambiguity in roles, permissions, core fields, or MVP workflows.

### Week 2 — Architecture, database, and project setup (24 hours)

**Objectives**

- Establish a maintainable codebase and database design.

**Tasks**

- Create frontend and backend projects and Git workflow.
- Define environment-based configuration and secret handling.
- Design ER diagram and relationships for users, profiles, companies, jobs, resumes, applications, saved jobs, interviews, notifications, and refresh tokens.
- Create EF Core models, configurations, initial migrations, and seed strategy.
- Establish backend layers: controllers, DTOs, services, interfaces, repositories, and dashboard aggregation.
- Establish frontend layers: pages, layouts, components, services, route guards, and role workspaces.
- Add global exception handling, CORS, Swagger, logging, and health endpoint.

**Deliverables**

- Compiling application skeleton
- ER diagram and initial database migration
- Development setup guide
- Agreed coding conventions

**Exit criteria:** A new developer can clone, configure, migrate, and run both applications.

### Week 3 — Authentication and authorization (24 hours)

**Objectives**

- Implement secure identity and refresh-safe routing.

**Tasks**

- Candidate and company registration with server-side validation.
- BCrypt password hashing.
- Login with JWT access and refresh tokens.
- Refresh-token rotation, revocation, and logout.
- Role-based endpoint authorization.
- Central frontend route guards for Candidate, Company, and Admin.
- Preserve requested route through refresh/login.
- Add authentication integration tests.

**Deliverables**

- Complete authentication APIs and screens
- Protected role routes
- Authentication tests and API documentation

**Exit criteria:** Users cannot access another role’s routes or APIs, and refresh does not change the active route.

### Week 4 — Profiles, company approval, and job management (24 hours)

**Objectives**

- Build the main data-management workflows.

**Tasks**

- Candidate profile CRUD and photo upload.
- Company profile CRUD and logo upload.
- Admin company approval/rejection workflow.
- Job create, read, update, close/reopen, and delete APIs.
- Ownership checks so companies can modify only their jobs.
- Search/filter/pagination DTOs for jobs.
- Validation and authorization tests.

**Deliverables**

- Working profile and job APIs
- Company approval workflow
- Swagger examples and automated tests

**Exit criteria:** Only approved companies can publish jobs, and ownership rules are enforced server-side.

### Week 5 — Resume management and deterministic scoring (25 hours)

**Objectives**

- Build reliable resume lifecycle and explainable scoring without AI.

**Tasks**

- Upload PDF/DOCX with extension, MIME, size, and safe-name validation.
- Extract text from supported formats.
- Add resume view/download, replace, and remove operations.
- Ensure replace/remove also handles physical file cleanup safely.
- Implement general resume-quality score.
- Implement job-specific ATS score.
- Return score category, earned points, maximum points, and improvement messages.
- Add tests for empty, weak, average, and strong resumes.

**Recommended ATS scoring (100 points)**

| Category | Points |
|---|---:|
| Required skill coverage | 35 |
| Relevant experience | 20 |
| Education relevance | 10 |
| Projects and measurable achievements | 15 |
| Contact information and essential sections | 10 |
| Formatting/readability checks | 5 |
| Certifications/extra relevant keywords | 5 |

**Important:** Display the score as a rule-based estimate, not as a hiring guarantee.

**Deliverables**

- Resume lifecycle APIs and UI
- Explainable ATS score and test suite
- File-storage security checklist

**Exit criteria:** Upload, replace, and delete remain consistent in both the database and storage.

### Week 6 — Candidate dashboard and job discovery (24 hours)

**Objectives**

- Deliver the primary candidate experience.

**Tasks**

- Build responsive candidate layout based on the approved design.
- Implement dashboard metrics and recent activity.
- Render recommended jobs as cards.
- Make “View All” open a complete card-grid job page.
- Add job search, location, type, experience, and skill filters.
- Implement save/unsave with persistent server state.
- Build profile completion visualization and improvement checklist.
- Connect resume score and resume-management actions.

**Deliverables**

- Responsive Candidate Dashboard
- Browse Jobs and Saved Jobs pages
- Fully working sidebar routes

**Exit criteria:** Every visible button/link works, browser refresh preserves the page, and no dashboard data is hard-coded.

### Week 7 — Application form and candidate tracking (25 hours)

**Objectives**

- Complete the candidate-to-company application flow.

**Tasks**

- Design application form with name, email, phone, location, experience, notice period, expected salary, cover letter, selected resume, and consent.
- Prefill verified profile data but allow application-specific edits.
- Add client and server validation.
- Prevent duplicates and applications to inactive/expired jobs.
- Calculate and snapshot job-specific ATS score at submission.
- Create candidate notification and company notification.
- Build My Applications with statuses and details.
- Add end-to-end tests for successful and rejected submissions.

**Deliverables**

- Application form/modal or dedicated route
- Persistent application records
- Candidate application tracking

**Exit criteria:** A submitted application immediately appears for both candidate and owning company with identical data.

### Week 8 — Company dashboard and applicant management (25 hours)

**Objectives**

- Deliver the complete hiring-company workflow.

**Tasks**

- Build company dashboard metrics and active-job cards.
- Build incoming application list and filters.
- Add candidate/application details and resume access.
- Add status transitions: Applied → Under Review → Shortlisted/Rejected → Interview Scheduled → Hired.
- Validate allowed transitions in the backend.
- Add notes and interview schedule fields.
- Notify candidates when status/interview details change.
- Add company ownership and privacy tests.

**Deliverables**

- Company Dashboard and Applications workspace
- Status and interview workflow
- Notifications visible to candidates

**Exit criteria:** A company can view and manage only applications for its own jobs.

### Week 9 — Admin dashboard and governance (20 hours)

**Objectives**

- Provide platform oversight and moderation.

**Tasks**

- Build admin dashboard metrics and trends.
- Company approval/rejection queue with reasons.
- User/company/job listing with search and pagination.
- Activation/deactivation and job moderation.
- Add audit fields for sensitive actions.
- Validate Admin-only authorization for every endpoint.

**Deliverables**

- Admin Dashboard
- Company moderation and platform-management pages
- Authorization test coverage

**Exit criteria:** Administrative changes are protected, validated, and attributable.

### Week 10 — Integration, UX, accessibility, and responsiveness (20 hours)

**Objectives**

- Remove inconsistencies and complete cross-module behavior.

**Tasks**

- Replace remaining placeholders and dead navigation.
- Standardize loading, empty, success, and error states.
- Verify refresh/deep-link routing for every URL.
- Test desktop, tablet, and mobile layouts.
- Add keyboard navigation, focus states, labels, and contrast checks.
- Optimize API calls and add pagination where needed.
- Verify date, currency, timezone, and status display.

**Deliverables**

- Integrated feature-complete application
- Accessibility and responsive QA report
- Closed navigation/action checklist

**Exit criteria:** Zero known dead actions, broken routes, or critical responsive defects.

### Week 11 — Security, testing, and release stabilization (22 hours)

**Objectives**

- Produce a trustworthy release candidate.

**Tasks**

- Unit tests for scoring, validation, and service rules.
- API integration tests for authorization and ownership.
- Browser tests for registration, login, resume, job, application, and approval workflows.
- Check file upload security, XSS, over-posting, IDOR, CORS, secrets, and error leakage.
- Add structured logs and health checks.
- Performance-test common dashboard/job queries.
- Fix high/critical defects and complete regression testing.

**Deliverables**

- Automated test suite and test report
- Security checklist
- Release candidate build

**Exit criteria:** No open critical/high defects; critical workflows pass automatically.

### Week 12 — Deployment, documentation, and handover (17 hours)

**Objectives**

- Release the MVP and make it maintainable.

**Tasks**

- Configure production database, storage, CORS, HTTPS, secrets, and backups.
- Create CI/CD pipeline with build, lint, test, migration, and deployment stages.
- Deploy staging, run smoke/UAT tests, then deploy production.
- Prepare API documentation, setup guide, operations runbook, and user guide.
- Record known limitations and post-MVP backlog.
- Create rollback and recovery instructions.

**Deliverables**

- Deployed MVP
- CI/CD pipeline
- Technical and user documentation
- Handover and post-release backlog

**Exit criteria:** Production smoke test passes and the application can be operated without undocumented manual steps.

## 7. Profile Completion Scoring

Profile scores must be calculated by the backend so all screens show the same value.

| Profile area | Points | Completion rule |
|---|---:|---|
| Basic identity | 10 | Name and email present |
| Contact details | 10 | Valid phone, city, and country |
| Professional headline and bio | 15 | Both fields meet minimum length |
| Experience | 20 | Years plus company/internship details |
| Education | 15 | Degree, institution, and graduation year |
| Skills | 15 | At least three normalized skills |
| LinkedIn | 5 | Valid HTTPS LinkedIn URL |
| Portfolio | 5 | Valid HTTPS portfolio URL |
| Profile photo | 5 | Valid uploaded image |

Every profile update response should return the total score, itemized breakdown, missing fields, and next recommended improvement.

## 8. Core Application Status Rules

```text
Applied
  → Under Review
      → Shortlisted
          → Interview Scheduled
              → Hired
              → Rejected
      → Rejected
```

- Candidate submits an application only once per job.
- Company can update only applications belonging to its jobs.
- Candidate cannot manually update application status.
- Every status change records timestamp and responsible user.
- Candidate receives an in-app notification after significant changes.

## 9. Definition of Done

A feature is complete only when:

- Acceptance criteria are satisfied.
- Backend authorization and validation are implemented.
- Loading, empty, success, and error states exist.
- Desktop and mobile behavior is verified.
- Unit/integration tests cover important business rules.
- No lint or build errors exist.
- API documentation is updated.
- No secrets or sensitive data are committed.
- A reviewer can reproduce the feature using documented steps.

## 10. Weekly Working Rhythm

| Activity | Suggested allocation |
|---|---:|
| Planning and design | 10% |
| Backend/database implementation | 35% |
| Frontend implementation | 30% |
| Automated/manual testing | 20% |
| Documentation and review | 5% |

Recommended weekly cadence:

- **Monday:** Refine scope, acceptance criteria, API contract, and UI behavior.
- **Tuesday–Thursday:** Implement vertical slices and test continuously.
- **Friday:** Integration testing, regression checks, documentation, demo, and backlog update.

## 11. Risk and Contingency Plan

| Risk | Mitigation |
|---|---|
| Requirements expand during development | Freeze MVP after Week 1; move additions to post-MVP backlog |
| Resume parsing differs across file formats | Define supported formats clearly and keep manual fallback fields |
| ATS score appears arbitrary | Publish a fixed weighted breakdown and improvement reasons |
| Authorization/data leakage | Enforce ownership in backend queries; never trust frontend role checks |
| Refresh causes route loss | Configure SPA fallback in hosting and use centralized route guards |
| File storage becomes unsafe/unmanageable | Abstract storage and use object storage in production |
| Database migration fails during release | Back up, test migrations in staging, and document rollback |
| Single-developer schedule slips | Protect core Candidate → Apply → Company workflow; defer optional modules |

## 12. Time Estimate Summary

| Phase | Weeks | Estimated effort |
|---|---:|---:|
| Requirements and foundation | 1–2 | 44 hours |
| Core backend and security | 3–5 | 73 hours |
| Candidate experience | 6–7 | 49 hours |
| Company and admin experience | 8–9 | 45 hours |
| Quality and release | 10–12 | 59 hours |
| **Total** | **12 weeks** | **Approximately 270 hours** |

For a full-time developer at 35–40 productive hours per week, the same MVP may be completed in approximately 8–9 weeks. For a beginner working 10–12 hours per week, allow approximately 20–24 weeks. A 10–15% contingency should be retained for integration and deployment issues.

## 13. Post-MVP Roadmap

After stable MVP release:

1. AI resume feedback with consent, privacy controls, and explainable output.
2. Semantic job-to-candidate matching.
3. AI-assisted job descriptions and candidate summaries.
4. Email/SMS notifications and calendar integration.
5. Real-time messaging.
6. Recruiter team accounts and permissions.
7. Analytics, exports, and scheduled reports.
8. Subscription billing and plan limits.

---

## Final Recommendation

Develop the platform as end-to-end vertical workflows instead of completing the entire backend before starting the frontend. The most important MVP journey is:

```text
Company approval → Job published → Candidate discovers job
→ Candidate uploads resume → Application submitted
→ Company receives application → Status updated
→ Candidate receives status notification
```

This workflow should be demonstrably working by the end of Week 8. Everything else should support, secure, or improve this core journey.
