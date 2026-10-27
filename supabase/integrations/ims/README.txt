IMS integration — module-owned project dstzkaygqvxhzmefirdr
Remote function: portal-bridge. Portal session and context are verified on every request.
Each Portal identity maps to an approved local IMS staff profile. The Owner has the explicitly approved protected administrative mapping.

Connected functions:
- Activities: list/search, full fields, add/edit, CSV export.
- Attendance: list/add/edit, CSV export, archive/restore (administrator).
- Files: private upload up to 10 MB, validated download, archive/restore.
- Workflow: submit, verify, approve, return with reason, reopen (administrator).
- Dashboard, projects, departments, locations, IMS staff administration, audit history.
- Reversible archive and restore. Permanent deletion is not exposed through the Portal.

Browser contains no SQL or privileged keys. Server uses an explicit operation allowlist.
File upload checks module access first; storage paths are generated on the server.
File download checks active metadata and activity, then signs access for 60 seconds.
Original accounts and business records remain in IMS. No data migration into Portal.

Integration boundary:
Original IMS login remains independent; this gateway applies central access checks.
Original module security hardening is separate and has not been rolled out here.
Assigning additional Portal-to-IMS identity mappings still requires privileged setup.
No OIDC session federation is claimed. This is a server-validated Portal integration.
