# TCMS Core Product Requirements Document

Version: 0.1  
Prepared: 20 October 2026  
Product owner: Fernando Graça Cossa  


## Product Summary

TCMS Core is the shared portal, identity and access-management foundation for the Tzu Chi Mozambique management platform. The first release must demonstrate a complete, protected workflow using the existing transport application as the first integrated module. Other modules must be able to join later on.

The initial environment belongs to Fernando and is separate from the future shared team environment. All demonstration identities and business records must be fictional. A working interface alone is not sufficient: approval, authorization, backend enforcement, integration and negative tests must work.

### Confirmed Decisions

- The platform name is TCMS; the common component is TCMS Core. The expanded official name Tzu Chi Mozambique System
- Public registration is required, followed by approval.
- Fernando is the initial unrestricted system administrator and initial infrastructure owner.
- The professor and four other students can access the general platform and administration interface, with limitations.
- The initial demonstration also represents two top-management users, six department heads and twelve coordinators.
- The initial population is 26 accounts: five students including Fernando, one professor and twenty Foundation-role accounts.
- Login, logout, password recovery/reset, the module catalogue, module access assignment/deactivation and change records are in scope.
- One real module integration is sufficient for the first demonstration: the existing transport system.
- The meeting requires a functional demonstration, not only a plan.

### Proposed Decisions Requiring Confirmation

- The exact limits for the professor and four students are not yet defined. This PRD proposes a Restricted Administrator role.
- Initial Foundation-role accounts may sign in after approval but receive no module or business-record access until explicitly assigned.
- Public registration does not permit selection of an effective administrative role.
- New accounts require both verified email and platform approval before entering protected platform pages.
- The public application shows aggregate module availability only; diagnostic details are restricted.
- Subsequent protected operations must enforce current account and permission state after access is revoked.

These proposals are safe initial boundaries, not confirmed organizational policy. Open items are collected in Section 10.

## 1. Problem Statement

The team is developing separate administrative, training, transport and farm applications. Without a common foundation, each application can develop different login behavior, permissions, navigation and deployment practices. Users may have access that is inconsistent with their responsibilities, while developers struggle to prove that integration is secure and reproducible.

TCMS Core addresses the shared problem: one clear entry point, a common identity model, explicit module permissions, consistent account operations and a controlled process for connecting independently developed modules.

The first users are a small demonstration group representing the development team, professor and Foundation managers. Broad organizational rollout is not the immediate objective.

## 2. Target Users and Personas

### Initial Account Groups

| Group | Count | Initial access intention |
| --- | ---: | --- |
| Fernando | 1 | Platform owner with all application capabilities and separately held infrastructure access |
| Professor | 1 | General platform and restricted administration |
| Other student developers | 4 | General platform and restricted administration |
| Top management | 2 | Approved member accounts; business access assigned explicitly |
| Department heads | 6 | Approved member accounts; department-related access requires an agreed scope |
| Coordinators | 12 | Approved member accounts; operational access requires an agreed scope |

Organizational titles and technical permissions are separate. A top-management title does not automatically grant Supabase ownership or platform administration.

### Persona 1: Platform Owner

Fernando configures the portal, approves access, manages administrative assignments and coordinates module integration. He needs a clear view of pending registrations, effective access, changes and module health. He must be able to explain and reproduce the system without depending on undocumented Dashboard changes.

### Persona 2: Department Coordinator

A fictional coordinator needs to request an account, understand whether approval is pending and enter the module needed for their work. They should not see misleading access options or gain access to unrelated departments simply because they know a URL.

The demonstration must additionally cover restricted administrators and an approved user without module assignments.

## 3. Goals and Non-Goals

### MVP Goals

1. Support public registration with controlled approval.
2. Provide working login, logout, password recovery and password reset.
3. Separate identity, account approval, administrative authority and module access.
4. Allow authorized administrators to create and modify access assignments.
5. Integrate the existing transport module with protected read, add and edit operations.
6. Provide a complete-looking but honest portal with clear loading, empty, success and failure states.
7. Record security-relevant administrative changes.
8. Demonstrate allow and deny cases, including direct access outside the portal.
9. Keep source, database changes, tests and deployment instructions reproducible.

### Non-Goals

- Building the other three business modules.
- Real Foundation personal or operational data.
- Declaring the prototype production-ready.
- An arbitrary permission-builder or user-defined role engine.
- Payroll, financial management, live vehicle tracking or organization-wide analytics.
- Sharing database-owner credentials with application users.
- A database console embedded in the website.
- Automatic privileged access based on an email domain or a user-selected job title.

### Minimum Functional Demonstration

If time becomes constrained, report unfinished requirements instead of weakening approval or authorization checks. Decorative enhancements may be deferred. A mock page must not be represented as a working module or successful health check.

## 4. User Stories

| ID | User story |
| --- | --- |
| US-01 | As an applicant, I want to register and see my approval status so that I understand whether I can enter the platform. |
| US-02 | As an approved member, I want to sign in and see my assigned modules so that I can reach my work. |
| US-03 | As a user, I want to recover and reset my password so that I can regain access safely. |
| US-04 | As an owner, I want to approve, reject or suspend accounts so that access remains controlled. |
| US-05 | As an authorized administrator, I want to grant, change or deactivate module access so that permissions follow user responsibilities. |
| US-06 | As the owner, I want to delegate limited administration without transferring ownership so that colleagues can help safely. |
| US-07 | As a transport user, I want to add and edit an authorized record through RPC so that the integrated system demonstrates a complete workflow. |
| US-08 | As a module administrator, I want consistent account and return-to-portal behavior so that my module fits the shared platform. |
| US-09 | As an owner, I want to review permission changes and failed health checks so that I can investigate problems. |
| US-10 | As another developer, I want migrations and deployment instructions so that I can reproduce the environment. |

## 5. Feature Priorities

### MVP

- Public landing page and registration.
- Email verification, login, logout, recovery and reset.
- Pending, approved, rejected and suspended account states.
- Member home page with authorized module cards.
- Administration dashboard and pending-approval queue.
- User details, account status changes and access assignments.
- Module catalogue with URLs, version and lifecycle status.
- Fixed initial roles and owner-controlled delegation.
- Security-relevant audit history.
- Transport integration with backend authorization and RPC add/edit.
- Basic health and permission checks.
- Responsive English UI, blue/green/white visual identity and light/dark mode.
- Accessible forms, useful validation and complete loading/empty/error states.
- Versioned database migrations, synthetic fixtures, tests and operating instructions.

### Version 2

- Integration of administrative, training and farm modules.
- Refined department and organizational-unit permissions after workflow interviews.
- Richer approval notifications and user-support workflows.
- More extensive module/version compatibility checks.
- Formal administrative handover and additional production-readiness controls.

### Later

- Organizational expansion, additional modules and advanced reporting.
- Longer-term operational monitoring and service-level targets.
- Broader workflow automation and SOP improvements.
- Scale and performance changes justified by actual usage.

## 6. Detailed MVP Functional Requirements

### 6.1 Registration and Account Lifecycle

- Registration collects display name, email and password. Requested organizational role or department, if collected, is informational until approved.
- Never store passwords in application profile tables, audit logs or repository fixtures.
- A newly registered account starts Pending and has no business-module access.
- The account can display its own onboarding status without access to the general user directory.
- Proposed lifecycle: Pending to Approved or Rejected; Approved to Suspended; Suspended to Approved following review.
- Approval and module assignment are distinct actions. Approval alone does not grant business access.
- Rejection and suspension require a reason visible to authorized administrators.
- Public users cannot submit an effective owner/admin role or an approved status.
- Duplicate and failed registration outcomes must not expose private account information unnecessarily.
- Public signup requires an abuse-control strategy before unrestricted deployment.

### 6.2 Authentication and Recovery

- Support valid and invalid login outcomes, logout, expired sessions, recovery requests and password reset.
- Unapproved users receive an onboarding/status screen rather than protected platform content.
- Recovery links and redirect destinations must be configured and tested for the actual demonstration host.
- Recovery responses must not unnecessarily reveal whether an email belongs to an existing user.
- Logout clears authenticated application state. It must not leave protected information visibly displayed.
- Recovery email delivery is a real dependency. A simulated success message is not completion.
- Use the configured Auth service for credentials; Core maintains approval and authorization records separately.

### 6.3 Authorization Model

The following matrix is a proposed baseline for the restrictions not yet specified by the product owner.

| Capability | Platform Owner | Restricted Administrator | Approved Member |
| --- | --- | --- | --- |
| Enter the administration interface | Yes | Yes | No |
| View ordinary user approval/access records | Yes | Yes | No |
| Approve ordinary applicants | Yes | Proposed yes | No |
| Reject/suspend ordinary accounts | Yes | Proposed yes, reason required | No |
| Grant approved non-platform module roles | Yes | Proposed yes, within delegated scope | No |
| Grant/revoke platform administration | Yes | No | No |
| Change own effective permissions | Owner-controlled procedure | No | No |
| Alter owner or peer-administrator accounts | Yes, with safeguards | No | No |
| Configure module integration URLs | Yes | Read-only initially | No |
| Review administrative audit events | Yes | Limited to delegated scope | No |
| Edit/delete audit events through the UI | No | No | No |
| Execute all application business operations | Yes, explicit owner policy | Only with module grants | Only with module grants |
| Access Supabase/GitHub administration | Separate infrastructure entitlement | Not implied | Not implied |

- The owner has full application business access as requested, but must still respect data-integrity constraints and auditable workflows.
- Prevent accidental removal or suspension of the last active owner.
- Bootstrap the first owner through a controlled administrative procedure, never through public registration.
- A restricted administrator cannot grant a role beyond their delegated authority, modify their own assignment or change owner/administrator accounts.
- Module roles initially distinguish Member and Module Admin. Each module documents the exact operations those roles permit.
- An account must be Approved and have an active module assignment, or an explicit owner entitlement, for a protected module operation.
- Every protected backend operation checks the relevant current authorization. A hidden button is not a permission check.
- An unauthenticated user cannot write protected business data.
- Revocation must block subsequent protected requests, including calls from an already-open module.
- A user of one module does not automatically obtain another module's permissions.
- Frontend code contains no raw SQL and no administrative secrets. Privileged writes use approved backend functions through RPC.

Infrastructure ownership is not an application role. Fernando's direct database access uses his separate Supabase account, not a service key or database password embedded in the browser. This PRD does not make the database owner technically subject to the same restrictions as an ordinary application user.

### 6.4 Portal and Common Interface

- Provide Home, My Modules and My Account for approved users.
- Provide administration navigation only to authorized administrators.
- Show module name, description, status and an authorized entry action.
- Users without assignments see a useful empty state, not a broken dashboard.
- Unimplemented modules may be marked Coming Soon on an appropriate catalogue screen, but must not appear operational.
- Provide consistent logout, account display and return-to-portal navigation.
- Support mobile and desktop layouts, keyboard navigation, clear labels and visible focus.
- Use blue, green and white in light mode and legible corresponding dark-mode colors.
- Counts and status indicators must reflect real data. Decorative motion must not obstruct task completion.

### 6.5 Module Catalogue

- The owner can register a module and update its metadata.
- Required metadata: stable code, name, description, environment-specific entry URL, version and lifecycle status.
- Proposed lifecycle statuses: Draft, Testing, Active, Maintenance and Disabled.
- Only approved integration URLs may be used; arbitrary redirect URLs are not accepted.
- Activating a module requires a recorded integration review.
- Catalogue presence, health and user authorization are separate concepts.
- Module administrators maintain their module's business behavior; Core maintains the shared registration and access framework.

### 6.6 Administrative Change Records

- Record account approval/rejection/suspension, module assignments, role changes and module configuration changes.
- Include actor, action, target, timestamp, outcome and an appropriate change summary/reason.
- Critical permission changes must not silently succeed without their required audit record.
- Do not log passwords, reset tokens, session tokens or administrative secrets.
- Normal application operations cannot edit or delete historical audit entries.
- Failed authorization attempts must be observable without exposing sensitive request payloads to other users.

### 6.7 Transport Integration

- Preserve the existing transport project while adapting it for the integration environment.
- Use synthetic records and explicit environment-specific configuration.
- The integrated module must recognize the shared identity and enforce Core account/module authorization on the backend.
- Define and test session behavior between portal and module. A link alone is not evidence of shared sign-in.
- Do not send credentials or session tokens through ordinary URL query parameters.
- Replace permissive anonymous business writes in the integrated environment; simply adding a login page is insufficient.
- Provide at least one working add operation and one working edit operation through RPC.
- Recommended first edit demonstration: an authorized vehicle mileage update, subject to the existing non-negative validation.
- Preserve existing vehicle/request relations and integrity rules.
- Demonstrate a related-table result, such as a transport request together with its assigned vehicle.
- An unauthorized account must fail when calling the module directly, not only when navigating through the portal.
- The original transport deployment must not be modified or disabled without a specific implementation decision.

### 6.8 Module Integration Contract and Health

Each module supplies:

1. Code, owner and backup contact.
2. Stable test URL and declared version.
3. Supported module roles and their operation matrix.
4. Ordered migrations and synthetic data.
5. RPC names, parameter contracts and error behavior.
6. RLS and permission-test cases.
7. Navigation and account-session expectations.
8. Health-check procedure and known issues.

Core must distinguish Healthy, Degraded, Unavailable and Not Checked outcomes with a last-check timestamp. A successful static-page load does not prove that backend functions or permissions are correct.

Database structure and grant/policy inspections run through authorized diagnostics or deployment checks; they must not require exposing privileged credentials in a browser. Module authors supply the checks for their own backend objects.

### 6.9 Reproducibility and Environment Separation

- Develop first in Fernando's separate sandbox.
- Preserve the existing transport project; integrate through a documented configuration/migration process.
- Store database changes as ordered migrations, including grants, RLS and RPC definitions.
- Store only a sample configuration in version control as required by the professor's planning document.
- Public project URL and public key may be delivered to the browser; administrative secrets may not.
- Document deployment-time configuration rather than assuming the host can run server-side code.
- Use issues, branches, reviewed changes and a tagged demonstration baseline.
- Record common standards in the Main SDS and Core-specific decisions in the Core SDS.
- Do not claim a shared GitHub/Supabase environment exists until it has been provisioned and tested.

## 7. Data Model Sketch

Names below are proposals, pending the shared naming standard. They describe entities, not executable SQL.

| Entity | Purpose and key fields |
| --- | --- |
| Auth identity | Managed identity identifier, email and authentication state; credentials remain with Auth |
| core_profiles | user_id PK/FK to Auth identity; display_name; requested organizational title; optional department reference; approval_status; reviewed_by; reviewed_at; review_reason; timestamps |
| core_platform_roles | id PK; user_id FK; role (owner or restricted_admin); active; assigned_by; timestamps |
| core_modules | id PK; code UQ; name; description; entry_url; version; lifecycle_status; timestamps |
| core_module_access | id PK; user_id FK to profile; module_id FK; module_role; active; assigned_by; timestamps; UQ(user_id, module_id) |
| core_audit_events | id PK; actor_id; action; target_type; target_id; outcome; change_summary; reason; occurred_at |
| core_module_health | module_id PK/FK; health_state; checked_at; checked_version; sanitized summary |

### Relationships

- One Auth identity has at most one application profile.
- A profile may have platform-role assignments.
- A user may have access to several modules; a module may have many authorized users.
- core_module_access represents that many-to-many relationship.
- A module has at most one current health summary; historical diagnostic detail may be added later.
- Audit records preserve enough actor/target information to remain understandable if an account is subsequently deactivated.

An organizational title is not a platform role. Department-scoped data access is not implied by this sketch; its rules require confirmation with module owners.

The MVP favors deactivation over deletion for users, access assignments and modules. Referential behavior and audit preservation must be specified before implementation.

## 8. Edge Cases and Failure States

| Case | Required behavior |
| --- | --- |
| Account created but profile provisioning fails | No protected access; show a recoverable onboarding error and support controlled retry |
| Email is verified but approval is pending | Show Pending; deny business access |
| Approved user has no module grants | Show No modules assigned |
| Member calls an administrator RPC directly | Deny on the backend |
| Restricted admin attempts to promote themselves | Deny and record the security-relevant attempt |
| User changes frontend code or knows a module URL | Effective backend authorization remains unchanged |
| Access is revoked while a module is open | Subsequent protected requests fail; clear or refresh protected UI state |
| Module is unavailable | Show an accurate unavailable state, not successful navigation |
| Module health was never checked | Show Not Checked rather than Healthy |
| Recovery link is expired or invalid | Explain the failure and allow a new recovery request |
| Two administrators modify the same assignment | Prevent silent stale overwrites using an agreed concurrency strategy |
| Save is submitted twice | Avoid duplicate access assignments; handle retry safely |
| Last owner is suspended/demoted | Reject the operation |
| Audit write fails during a critical permission change | Do not silently complete an unaudited change |
| Database or network is unavailable | Show failure without claiming the operation was saved |
| User requests a role/department during signup | Treat as unverified information, not an effective grant |
| Invalid or duplicate business data is submitted | Reject under the module's validation rules |
| Module configuration points to the wrong environment | Fail integration review; do not activate automatically |

## 9. Success Metrics and Acceptance Evidence

### Required Functional Evidence

- One new public registration reaches Pending.
- A privileged actor approves that account.
- The approved account can sign in but sees no module until access is granted.
- Module access can be created, changed and deactivated.
- The user opens the authorized transport module and performs a valid add and edit through RPC.
- At least one result combines related vehicle and request information.
- Revoked access is rejected on a subsequent direct backend request.
- Password recovery/reset is tested using a controlled test mailbox.
- All relevant administrative changes appear in the audit history.
- A fresh test environment can be reconstructed from the documented baseline.

### Security Acceptance

All defined deny tests must pass. At minimum:

- Unauthenticated protected read/write attempts.
- Pending/rejected/suspended accounts attempting protected operations.
- Approved member without module access attempting direct module operations.
- Member invoking owner/admin RPCs.
- Restricted administrator attempting self-promotion or owner changes.
- Cross-module access without an assignment.
- Invalid input and duplicate records.
- Frontend tampering attempting to bypass authorization.

### Demonstration Usability

- All 26 synthetic account representations can be accounted for in the fixture plan.
- Tested account states and roles are clearly distinguishable.
- Home, account, administration and module-entry pages have no dead-end primary actions.
- Light/dark modes and mobile layout remain usable.
- No unimplemented module is presented as complete.

### Evidence Format

For each test record: test ID, actor role, precondition, action, expected result, actual result, pass/fail, date and tested version. Keep screenshots free of credentials and sensitive information.

Maintain an AI collaboration record with the problem, prompt, adopted suggestion, verification and corresponding change.

The 21 October date is a target supplied by the product owner, not a guarantee of completion. Untested items remain Not Tested; unfinished items remain Not Implemented.

## 10. Open Questions and Immediate Decisions

| ID | Question | Proposed starting point |
| --- | --- | --- |
| OQ-01 | What is the official expanded name of TCMS? | Confirm with the five members and professor |
| OQ-02 | Exactly which administrative actions may the professor and other students perform? | Use the restricted-administrator matrix in Section 6.3 for review |
| OQ-03 | Does "general access" mean all four business modules or only common portal pages? | Do not infer all-module or all-record access; agree an explicit assignment matrix |
| OQ-04 | Can restricted administrators approve applicants and grant Module Admin roles? | Allow only if explicitly delegated; never permit platform-role elevation |
| OQ-05 | What may top management, department heads and coordinators see and change? | Assign no business privileges solely from their title |
| OQ-06 | Which controlled mailboxes and delivery setup support signup verification and recovery? | Use test-controlled email addresses; verify delivery before the demonstration |
| OQ-07 | What hosts/origins and session flow will the portal and transport module use? | Decide before implementing shared login |
| OQ-08 | Who owns the transport module after Fernando moves to Core? | Name a primary owner and integration backup |
| OQ-09 | What exact transport add/edit actions will be demonstrated? | Vehicle registration and mileage update, plus a request/vehicle related result |
| OQ-10 | What module names/codes and database naming conventions will the team adopt? | Record an approved standard rather than guessing a final convention |
| OQ-11 | What safeguards and deployment procedure control the public registration endpoint? | Require approval and test abuse controls before public release |
| OQ-12 | Who reviews high-risk changes and how will ownership transfer to the shared environment? | Individual accounts, named reviewer and recorded handover |

### Next Implementation Gate

Confirm OQ-02, OQ-03 and OQ-04 before implementing administrative authorization. Then settle the test environment and identity/session plan, sketch the schema and define the first migrations. Do not start by replacing or deleting the transport database.

### Recommended Build Order

1. Confirm the access matrix and record decisions.
2. Prepare the isolated Core environment and configuration procedure.
3. Implement identity, profile provisioning and pending approval.
4. Bootstrap the owner and implement restricted administrative actions.
5. Implement the module catalogue and grant/change/deactivate access workflow.
6. Integrate transport identity, RLS and RPC add/edit.
7. Add audit visibility and health reporting.
8. Complete UI states and run allow/deny tests.
9. Publish the tested baseline and prepare the demonstration record.

This order is a dependency plan, not a statement that any step has been completed.
