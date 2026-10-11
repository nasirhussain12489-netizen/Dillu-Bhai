# Security Specification — Gausiya Madarsa Portal

## 1. Data Invariants
1. **Default Deny**: All paths not explicitly matched in `/portal_users/{userId}` or `/portal_state/{docId}` are unconditionally denied.
2. **Path Variable Hardening**: Every single-document path variable (`userId`, `docId`) is validated with `isValidId()` (`size() <= 128` and `matches('^[a-zA-Z0-9_\\-]+$')`).
3. **Strict Key & Size Enforcement**:
   - `PortalUser` documents must contain only `['uid', 'name', 'email', 'role', 'updatedAt']` with bounded string lengths and valid role enum values (`Super Admin`, `Admin`, `Teacher`, `Student`, `Parent`).
   - `PortalStateDoc` documents must contain only `['ownerId', 'payloadJson', 'updatedAt']` with bounded string lengths.
4. **Privilege Escalation Prevention**: Self-registration only permits non-admin roles unless the authenticated user is the bootstrapped Super Admin (`nasirhussain12489@gmail.com` or `gausiyamadarsa92@gmail.com`) with `email_verified == true`.

## 2. Dirty Dozen Adversarial Payloads
1. **Unauthenticated Write**: `auth = null` attempting to create `/portal_users/u1` -> `PERMISSION_DENIED`.
2. **Shadow Field Injection**: Adding `isSuperAdmin: true` to `/portal_users/u1` -> `PERMISSION_DENIED` via `hasOnly()`.
3. **ID Poisoning**: Creating `/portal_users/` with a 500-char ID -> `PERMISSION_DENIED` via `isValidId()`.
4. **Role Enum Bypass**: Setting `role: "RootHacker"` -> `PERMISSION_DENIED`.
5. **Oversized Name DoW**: Setting `name` to a 10,000-character string -> `PERMISSION_DENIED`.
6. **Unverified Admin Email Spoof**: Using `email: "nasirhussain12489@gmail.com"` with `email_verified: false` -> `PERMISSION_DENIED`.
7. **Privilege Escalation on Create**: Non-admin user creating their own profile with `role: "Super Admin"` -> `PERMISSION_DENIED`.
8. **Privilege Escalation on Update**: Non-admin user updating their own `role` field -> `PERMISSION_DENIED`.
9. **Cross-User Profile Overwrite**: Non-admin user `u1` attempting to update `/portal_users/u2` -> `PERMISSION_DENIED`.
10. **Blanket PII Read by Stranger**: Non-admin user `u1` attempting to `get` `/portal_users/u2` -> `PERMISSION_DENIED`.
11. **Malformed State Doc Keys**: Writing extra keys to `/portal_state/main` -> `PERMISSION_DENIED`.
12. **Identity Mismatch on State Write**: Writing `ownerId` different from `request.auth.uid` -> `PERMISSION_DENIED`.
