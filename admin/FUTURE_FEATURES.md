# Future Features

## Site Config / Feature Toggles

### DynamoDB Structure
```
PK: "config", SK: "root"      → { watches: true, fishtank: true, albums: false }
PK: "config", SK: "fishtank"  → { timeline: true, stats: true, plants: false, fish: true }
PK: "config", SK: "watches"   → { ... sub-toggles if needed }
```

### Status Logic
- **Active** (green) - Page enabled + all sub-items enabled
- **Partial** (blue) - Page enabled + some sub-items disabled  
- **Empty** (yellow) - Page enabled + 0 content items
- **Disabled** (red) - Page disabled at root level

### API Endpoints
- `GET /api/config/{page}` - Get config for a page (cached by CloudFront)
- `PUT /api/config/{page}` - Update config (admin only, requires Cognito auth)

### Frontend Integration
- Fetch `/api/config/root` on app load
- Cache response (CloudFront TTL ~60s)
- Show "Coming Soon" or hide nav for disabled pages

---

## Analytics Dashboard (CloudFront + API Gateway Logs → Athena)

### Setup Required
1. Create S3 bucket for logs (`shendy-personal-site-logs`)
2. Enable CloudFront access logging to S3
3. Enable API Gateway access logging to S3
4. Create Athena database and tables for both log sources
5. Create admin API Lambda to query Athena and return metrics

### Metrics to Display

**From CloudFront Logs:**
- Requests per day (line chart)
- Unique IPs per day (line chart) 
- Top 10 pages by visits (bar chart)
- Error count by status code (table)
- Average response time (line chart)
- Edge location breakdown (rough geo)

**From API Gateway Logs:**
- API latency by endpoint (line chart)
- API request count over time
- API error rates (4xx, 5xx)

### Cost Estimate
- S3 storage: ~$0.02/GB/month (logs are small)
- Athena queries: $5/TB scanned (personal site = pennies/month)
- Total: < $1/month expected

### Future Enhancement: Returning Visitors
To track true returning visitors (not just IP-based):
- Add Lambda@Edge to set unique visitor cookie
- Log cookie ID with requests
- Enables "User X visited 5 times this month" tracking
