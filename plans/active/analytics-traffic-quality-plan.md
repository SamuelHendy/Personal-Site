# Feature plan: Improve analytics traffic quality

## Requirements

### Goal

Make the admin dashboard's page-view and unique-visitor counts more representative of people viewing the public site, rather than successful requests to arbitrary paths, APIs, assets, or obvious automated crawlers.

### Functional requirements

- Count page views only for successful requests to the known public SPA route families: `/`, `/albums`, `/albums/*`, `/watches`, and `/fishtank`.
- Apply the same page-route and status criteria to daily page views, daily unique visitors, and daily traffic history so those metrics have consistent meanings.
- Exclude requests with clearly identifiable crawler/bot user agents from those public page metrics, using the CloudFront `cs_user_agent` field already present in the Athena table.
- Keep `uniqueVisitors` defined as distinct source IP addresses; describe it as an estimate rather than a count of verified people.
- Keep existing API, CDN, social-click, error, and response-time metrics outside this change unless needed to avoid changing their current meaning.
- Preserve the existing metrics API response shape unless implementation review finds a necessary, backward-compatible addition.
- Compare counts before and after the filters against recent log data, including route, status, and user-agent breakdowns, to confirm which traffic caused the unexpectedly high values.

### Constraints

- Analytics remain based on CloudFront logs queried through Athena, as required by ADR-005.
- Keep public route patterns in sync with `frontend/src/App.tsx` and `aws_cloudfront_function.spa_rewrite` in `terraform/modules/app/admin.tf`.
- Do not add browser-side tracking, a new analytics vendor, or a new infrastructure dependency for this first iteration.
- CloudFront user-agent classification is heuristic: it can exclude well-known bot signatures but cannot prove that remaining requests came from humans or catch bots that impersonate browsers.
- A route-family allowlist identifies valid SPA route shapes, not necessarily an existing album record; invalid album names may still be served the SPA shell with HTTP 200.

## Design choices

### Proposed architecture

- **Backend:** Centralize the public-page route predicate and the conservative bot-user-agent predicate in `backend/personal_api_metrics/handler.py`, then use them for page views, unique visitors, and traffic history.
- **Admin:** Keep the existing summary and traffic response contracts; only adjust labels/help text if needed to clarify that unique visitors are IP-based estimates and bot-filtered.
- **Terraform:** No infrastructure change is expected because the Glue table already defines `cs_user_agent` and the CloudFront function already has the public route allowlist.
- **Docs:** Update analytics guidance and the relevant backend/architecture notes to describe the shared filters, bot heuristic, route-list synchronization, and IP-based limitations.

### User flow

The admin dashboard continues to show its current metrics. The displayed page-view and unique-visitor values will now represent successful requests to known public page routes after excluding clearly identified crawler user agents. No new controls or API calls are required.

### API / data flow

- Existing `GET /api/admin/metrics` summary continues to return `pageViews`, `uniqueVisitors`, `errors24h`, and `avgResponseMs`.
- Existing `GET /api/admin/metrics?type=traffic&days=N` continues to return daily `views` and `visitors`.
- Athena filters will use the known SPA route patterns, a successful-response condition (initial candidate: `sc_status < 400`), and a conservative `cs_user_agent` exclusion for known crawler signatures.
- `uniqueVisitors` remains `COUNT(DISTINCT c_ip)` over qualifying page requests. This is an IP-based approximation; shared networks can merge people and changing IPs can split one person.
- The exact bot signatures and treatment of empty or missing user-agent values should be decided during implementation after inspecting representative log values. Prefer excluding only positively identified bot signatures; do not treat every non-browser or missing user agent as a bot by default.

### Risks and unknowns

- CloudFront standard logs are delayed, so same-day totals may be incomplete independently of filtering. The plan should verify this against the log delivery cadence before attributing all spikes to invalid traffic.
- User-agent patterns are imperfect and can be spoofed; the result should be described as bot-filtered estimates, not human-only analytics.
- `/albums/*` is a valid route family but may include album names that do not resolve to actual content. Enforcing record existence would require a separate source of truth or a different event model and is not included in the initial scope.
- The current page-view queries include all statuses below 400, including redirects. Confirm whether to retain that behavior or narrow to final content responses without excluding valid conditional/cache responses.
- No metrics-specific backend tests currently exist; implementation should add focused tests around generated SQL/filter consistency or extract small pure query-building helpers that can be tested without AWS.

## Task list

### 1. Backend analytics filtering

#### 1.1 Establish the baseline

- Query recent CloudFront data by date, path, status, and `cs_user_agent` to identify the source of today's elevated counts and quantify the effect of proposed filters.
- Confirm the Athena representation of missing user agents and the site's deployed route patterns.

#### 1.2 Apply consistent page-view qualification

- Reuse a single public-page allowlist predicate for `get_page_views_today`, `get_unique_visitors_today`, `get_traffic_over_time`, and `get_popular_pages`.
- Add one shared, conservative crawler exclusion predicate to the public page-view queries.
- Keep API/CDN and other non-page metrics out of the changed predicate unless their existing semantics require a narrowly scoped adjustment.

#### 1.3 Add focused backend tests

- Verify all intended public route families are represented and unknown paths are excluded.
- Verify status and bot filters are consistently applied to the page-view and visitor queries.
- Verify the metrics response contract and count conversion remain unchanged.

### 2. Admin and documentation

#### 2.1 Clarify metric meaning in the admin UI

- Review dashboard labels or existing supporting copy and clarify that unique visitors are IP-based estimates with obvious crawlers excluded, without adding explanatory UI clutter.

#### 2.2 Keep analytics documentation synchronized

- Update `docs/admin/analytics.md`, `docs/backend/README.md`, and ADR-005 details to explain route filtering, crawler user-agent heuristics, route-list synchronization, and known limitations.
- Update comments near the route allowlist to keep it aligned with CloudFront SPA routing and frontend routes.

### 3. Validation

#### 3.1 Validate behavior and counts

- Run focused backend tests and the backend's available lint/syntax checks.
- Run the admin build and lint if dashboard copy/types change.
- Execute before/after Athena comparisons for the same completed date range and inspect samples of included and excluded paths/user agents.
- Confirm summary and traffic endpoints retain their expected JSON response shapes and that dashboard values still load.

## Validation

- Unit tests should exercise the shared route and bot filters or the SQL generated from them without requiring live AWS credentials.
- Run backend test/lint commands established or added for this feature; use Python compilation as a minimum syntax check if no backend test runner exists.
- Run `npm run lint` and `npm run build` in `admin/` if UI code changes.
- Use Athena queries on a completed date range to compare raw totals, route/status-filtered totals, and bot-filtered totals; same-day data alone is not sufficient because CloudFront log delivery can lag.
- No Terraform validation is required unless implementation changes the Glue schema or CloudFront configuration.

## To-be-fleshed-out

- The initial bot signatures are a conservative starting point and should be refined after reviewing aggregate `cs_user_agent` data in an AWS-enabled environment.
- Keep the existing `sc_status < 400` rule, including redirects and `304` responses, to avoid changing successful-response semantics in this implementation.
- Route-family matching is sufficient for the initial scope; verifying album existence would require a separate data source/design.
- The dashboard now labels this metric “Unique IPs”; the API field remains `uniqueVisitors` for compatibility.
- Live before/after Athena reconciliation remains pending because the implementation environment has neither the AWS CLI nor `boto3` configured.
- Admin lint/build remain pending because dependencies are not installed in `admin/` (`eslint` and `tsc` are unavailable).