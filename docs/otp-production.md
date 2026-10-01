# Production OTP deployment

The web app sends FTM API requests to same-origin `/api/ftm/*` routes. Vercel forwards those requests to Render using `FTM_API_BASE_URL`; the Render origin and mail credentials are not compiled into the browser. Configure `FTM_API_BASE_URL` in Vercel's server environment for Production, Preview, and Development as appropriate. Do not define `NEXT_PUBLIC_FTM_API_BASE_URL` or `NEXT_PUBLIC_API_BASE_URL`.

## Render environment

Set these values on the Node.js Render service. Use a Gmail **App Password** (with 2-Step Verification enabled), not the regular Gmail password. Keep all values in Render's environment settings or secret files; do not commit them or copy them to Vercel.

| Variable | Value |
| --- | --- |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` |
| `SMTP_USER` | Gmail sending account |
| `SMTP_PASS` | Gmail App Password |
| `SMTP_FROM` | Verified sender, usually the Gmail account |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM` | Sender authorized for the Resend account/domain |
| `OTP_TTL_SECONDS` | `300` |
| `OTP_RESEND_COOLDOWN_SECONDS` | `60` |
| `OTP_MAX_ATTEMPTS` | `5` |

Configure the backend's CORS allowlist with the exact production Vercel origin (for example, `https://your-app.vercel.app`) and any explicitly used custom domain. The browser-facing auth calls use the same-origin Vercel proxy, so direct cross-origin access is unnecessary for this flow. Render should still reject unknown origins for any other direct API consumers.

## Backend behavior required

The Render source is not part of this checkout. Its `/api/auth/request-otp` handler must generate a cryptographically random six-digit code, store only a keyed hash with the normalized email and server-side expiry, enforce resend cooldown and attempt limits, and invalidate prior codes after resend or successful verification. Verification must check format, expiry, attempt limit, and hash using a timing-safe comparison. Never accept an expiry supplied by the browser.

Send with Gmail SMTP first using connection and command timeouts. On connection refusal, blocked SMTP, unavailable service, timeout, or authentication failure, send the same code through Resend. Do not create or store a different code during fallback. Return success only if one provider accepted delivery, and do not return the code, provider credentials, or provider errors containing secrets. Keep provider selection and fallback entirely in the Render process.

After OTP verification, preserve the current Supabase Auth flow: the login endpoint returns the same Supabase session shape, the frontend calls `supabase.auth.setSession`, checks `getUser`, and then performs its existing Supabase Passkey step. OTP email verification must not issue a second or unrelated session.

## Deployment verification

After deploying the Render backend and setting its secrets, exercise registration and login with a real test account; check Gmail delivery and then temporarily make SMTP unavailable in a staging Render service to confirm Resend fallback. Verify correct, incorrect, expired, resent, and rate-limited codes; confirm the returned Supabase session is accepted by the configured frontend project; then load an authenticated route and complete the existing passkey step. This requires the Render backend source, valid provider credentials, a Supabase test account, and the deployed Vercel/Render environments.
