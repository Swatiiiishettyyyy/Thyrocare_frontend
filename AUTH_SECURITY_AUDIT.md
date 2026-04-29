# Auth & Session Security Audit
**Date:** 2026-04-26  
**Scope:** Backend (`Bloodtests/`) + Frontend (`src/`) auth integration  

---

## Backend Issues

### CRITICAL

#### 1. `COOKIE_SECURE` defaults to `False`
- **File:** `Bloodtests/config.py`
- **Risk:** Auth cookies (`access_token`, `refresh_token`) are sent over plain HTTP in production if this env var is not explicitly overridden. Any network observer can steal tokens.
- **Fix:** Set `COOKIE_SECURE=true` in production `.env`.

#### 2. `SECRET_KEY` has a weak default
- **File:** `Bloodtests/config.py`
- **Risk:** If production `.env` omits `SECRET_KEY`, all JWTs are signed with `"dev_secret_key_change_me"` — trivially forgeable.
- **Fix:** Require `SECRET_KEY` in production `.env`; app should refuse to start without it.

#### 3. CSRF protection is optional (not enforced)
- **File:** `Bloodtests/Login_module/Utils/csrf_middleware.py` (lines 47–55, 115–122)
- **Risk:** Middleware logs a warning but allows state-changing requests (`POST`/`PUT`/`DELETE`/`PATCH`) through even when the `X-CSRF-Token` header is missing or invalid. CSRF attacks remain possible.
- **Fix:** Make CSRF validation mandatory — reject with `403` when token is absent or invalid on non-exempt endpoints.

---

### HIGH

#### 4. Absolute session lifetime not checked in `get_current_user()`
- **File:** `Bloodtests/Login_module/Utils/auth_user.py`
- **Risk:** Session age (max 7 days) is only enforced in the `/auth/refresh` endpoint. A client that never calls refresh but keeps making API calls with a valid access token is not subject to the absolute lifetime check. Stale sessions remain active.
- **Fix:** Add the same absolute age check (`MAX_SESSION_LIFETIME_DAYS`) inside `get_current_user()`.

#### 5. `COOKIE_SAMESITE` set to `"lax"` instead of `"strict"`
- **File:** `Bloodtests/config.py`
- **Risk:** `SameSite=lax` permits cookies to be sent on top-level cross-site GET navigations, weakening CSRF protection.
- **Fix:** Set `COOKIE_SAMESITE=strict` and `REFRESH_COOKIE_SAMESITE=strict` in production.

#### 6. Inactive sessions physically deleted — no audit trail
- **File:** `Bloodtests/Login_module/Device/Device_session_crud.py` (lines 235–257)
- **Risk:** Sessions are hard-deleted after 24 hours of inactivity. There is no record of when a user logged out or which device was active, making forensic investigation of security incidents impossible.
- **Fix:** Use soft deletes (`is_deleted=True` + `deleted_at`) consistent with the rest of the codebase.

---

### MEDIUM

#### 7. OTP stored in plain text in Redis
- **File:** `Bloodtests/Login_module/OTP/otp_manager.py` (lines 115–128)
- **Risk:** If Redis is compromised, all in-flight OTPs are exposed in plain text.
- **Fix:** Store `SHA-256(otp)` and compare hashes on verification.

#### 8. CSRF token has no expiry
- **File:** `Bloodtests/Login_module/Utils/csrf.py` (lines 23–44)
- **Risk:** A CSRF token stolen mid-session (e.g., via XSS) remains valid for the entire session lifetime (up to 7 days).
- **Fix:** Include a timestamp in the HMAC message and reject tokens older than a configurable window (e.g., 1 hour).

#### 9. IP address recorded but never validated
- **Files:** `Bloodtests/Login_module/Device/Device_session_crud.py`, `Bloodtests/Login_module/Token/Auth_token_router.py`
- **Risk:** Session is created with the client IP but subsequent requests are never checked against it. Token theft from a different network goes undetected.
- **Fix:** Log and alert on IP mismatch; optionally reject on significant geographic change.

#### 10. Platform detection relies on cookie presence
- **File:** `Bloodtests/Login_module/Token/Auth_token_router.py` (lines 238–245)
- **Risk:** Whether a request is treated as web or mobile is inferred from whether a cookie exists, not from an explicit `X-Platform` header. A mobile client with cookies set could receive an unexpected response format.
- **Fix:** Require an explicit `X-Platform: web|mobile` header or use the `device_platform` claim already present in the JWT.

---

### LOW

#### 11. Webhook idempotency — duplicate invoice emails possible
- **File:** `Bloodtests/Orders_module/Order_crud.py` (lines 1369–1380)
- **Risk:** Razorpay retries webhooks on non-2xx responses. Each retry triggers a fresh invoice email to the customer for the same order.
- **Fix:** Store a `invoice_sent_at` timestamp on the order and skip sending if already set.

#### 12. No retry mechanism for failed invoice sends
- **File:** `Bloodtests/Orders_module/Order_crud.py` (lines 1383–1388)
- **Risk:** If Gmail API fails, the order confirms but the customer never receives their invoice. The error is only logged.
- **Fix:** Queue failed sends (e.g., a `pending_invoices` table) and retry via the existing APScheduler.

---

## Frontend Issues

### MEDIUM

#### 13. Refresh error silently swallowed
- **File:** `src/api/client.ts` (lines 214–216)
- **Risk:** When the refresh call fails and the error object has no `.response` property (e.g., a network timeout), the error is silently caught and the user is neither logged out nor shown an error — they may keep hitting protected endpoints that all fail with 401.
- **Fix:** Always re-throw or call `handleLogout()` when refresh fails, regardless of error shape.

```ts
// Current (problematic)
catch (refreshErr: any) {
  if (refreshErr?.response) throw refreshErr  // silent if no .response
}

// Fix
catch (refreshErr: any) {
  clearAuthData()
  throw refreshErr  // always propagate
}
```

---

## Integration — No Issues Found

| Check | Status |
|---|---|
| `credentials: 'include'` on all fetch calls | ✅ |
| CSRF token extracted from login response | ✅ |
| `X-CSRF-Token` header injected on every request | ✅ |
| Auto-refresh on 401 with request retry | ✅ |
| Proactive refresh 120s before expiry with jitter | ✅ |
| `Authorization: Bearer` header on all requests | ✅ |
| Logout clears all tokens from storage | ✅ |
| OTP endpoints match backend routes | ✅ |

---

## Priority Fix Order

| Priority | Issue | Effort |
|---|---|---|
| P0 | Set `COOKIE_SECURE=true` in prod `.env` | 1 min |
| P0 | Set strong `SECRET_KEY` in prod `.env` | 1 min |
| P0 | Enforce CSRF (return 403, not warning) | Small |
| P1 | Add absolute session age check to `get_current_user()` | Small |
| P1 | Fix silent refresh error swallow in `client.ts` | Small |
| P1 | Set `COOKIE_SAMESITE=strict` in prod `.env` | 1 min |
| P2 | Soft delete sessions for audit trail | Medium |
| P2 | Hash OTP before storing in Redis | Small |
| P2 | Add invoice idempotency check | Small |
| P3 | CSRF token expiry | Medium |
| P3 | IP mismatch logging/alerting | Medium |
