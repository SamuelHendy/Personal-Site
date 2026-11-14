# Admin Analytics

This page explains how the admin metrics are derived and where the logic lives.

## Source of truth

The analytics logic is implemented in `backend/personal_api_metrics/handler.py`.

## Unique visitors

The `uniqueVisitors` value is an estimate based on distinct source IP addresses for successful requests to known public page routes. Daily page views, unique IPs, traffic history, and popular pages use the same route, status, and bot-user-agent filters in `backend/personal_api_metrics/handler.py`.

The public route allowlist is `/`, `/albums`, `/albums/*`, `/watches`, and `/fishtank`. It must stay in sync with routes in `frontend/src/App.tsx` and the SPA rewrite allowlist in `terraform/modules/app/admin.tf`.

Only records with `sc_status < 400` count, preserving the existing treatment of redirects and `304` responses. Requests whose lowercased `cs_user_agent` matches a known bot/crawler signature are excluded. The initial signatures include generic `bot`, `crawler`, and `spider` markers and selected common crawler identifiers. Empty user-agent values are retained rather than assumed to be bots.

This remains an IP-based estimate, not a count of verified people: multiple people behind one IP may count as one, and one person using multiple IPs may count more than once. User-agent matching is heuristic and can be spoofed, so some bots may remain and some automated requests may be excluded.

The `/albums/*` rule validates the route family, not whether an album record exists. CloudFront can serve the SPA shell for an unknown album name with a successful status, so those requests may still count.

## Related metrics

The same handler also computes:

- total page views
- traffic over time
- popular pages
- social click counts
- API performance
- error counts

## Route filters

Public page metrics use an allowlist rather than excluding only `/api/*` and `/cdn/*`; this excludes arbitrary successful paths as well as API and CDN traffic. The filter applies to daily summary counts, traffic history, and popular pages. API performance/errors, social clicks, server errors, and response-time metrics retain their separate filters and meanings.

CloudFront standard logs can arrive with a delay, so same-day totals may be incomplete. Compare completed date ranges when evaluating the impact of filter changes.

## Why this matters

This is the core architecture for admin analytics and should be treated as a required contract when changing site routing or analytics behavior.
