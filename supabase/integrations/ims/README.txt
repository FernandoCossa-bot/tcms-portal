IMS module authorization — 2026-10-28
Install order on IMS: portal-bridge.sql (existing gateway), then authorization.sql.
Deploy the current ims-portal-bridge source as remote portal-bridge.
Portal Auth is the only login used by the integrated IMS.
New module authorization rows and business authorship use the exact Portal Auth UUID.
No secondary Auth account or password is created for approved Portal users.
Legacy IMS profiles and earlier bridge identities are preserved for existing records; the gateway no longer uses them to authorize Portal requests.

Tables:
ims_roles: Viewer, Operator, Manager, Administrator with explicit permitted operations.
ims_user_roles: Portal UUID, module role, active flag, authorizer and assignment time.
ims_access_requests: request label snapshot, reason, pending/approved/rejected/revoked state, decision author/time/reason/version.
ims_access_events: immutable application audit history of requests and authorization changes.
All four have Row Level Security enabled and no direct anon/authenticated/service_role table privileges. Server-only functions enforce access.

Workflow:
Account signs into Portal, requests IMS access; pending does not create a role mapping.
IMS administrator reviews pending request, selects role and gives a reason.
Approval creates the role mapping. Refreshing Portal opens only authorized modules.
Role changes and revocation are checked on every server operation; stale decisions are rejected.
Administrators cannot change their own authorization or the protected Owner.

Limits:
Legacy IMS sign-in remains available separately and keeps its existing behavior.
Other business modules must implement their own role approval endpoints.
Permanent deletion remains excluded by the user's decision; archive/restore only.
