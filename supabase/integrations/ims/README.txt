IMS integration deployed on module-owned project dstzkaygqvxhzmefirdr.
Remote function name: portal-bridge; verify_jwt=false because handler validates Portal Auth.
SQL file applies ONLY to IMS, not Portal. Existing business tables are preserved.
Uses immutable Portal user ID -> separate local IMS profile, never email auto-linking.
System Owner mapping is explicitly authorized; ordinary users without mappings are denied.
Every request validates Portal user and core_get_my_context.can_enter, then IMS local approval.
Supported operations: access, activity list, create and edit. Other IMS features are not exposed
through this bridge yet. Original IMS application remains available separately.
No OIDC session federation is claimed: this is an authenticated server gateway integration.
Role assignment UI for cross-project accounts is pending; module mappings are privileged.
Existing local login routes are not governed by Portal checks yet; only this gateway is.
Source IMS known security issues require the separately tested hardening patch before full rollout.
