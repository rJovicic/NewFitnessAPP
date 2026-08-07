# Apple Health sync setup (Phase 8)

This is a **periodic sync**, not live/real-time — a web app can't read HealthKit
directly, since Apple doesn't expose that to browsers. This connects the
"Health Auto Export" iOS app, which periodically POSTs your HealthKit data to
this app's webhook.

## 1. One-time server setup (already done, for reference)

Two environment variables need to exist in Vercel (Project → Settings →
Environment Variables, Production scope):

| Variable | Value |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | From the Supabase dashboard → your project → Settings → API → **service_role** secret key. This lets the webhook write data without a logged-in browser session. Never expose this in client code or a `NEXT_PUBLIC_` variable. |
| `HEALTH_WEBHOOK_TOKEN` | A random secret shared between this app and the Health Auto Export automation below. Anyone with this token can write to your health data, so treat it like a password. |

After adding both, redeploy so the running app picks them up.

## 2. Install and configure Health Auto Export

1. Install **Health Auto Export – JSON+CSV** from the App Store.
2. Open the app → **Automations** → **Create Automation** → **REST API**.
3. **Endpoint URL:** `https://new-fitness-app-lake.vercel.app/api/health-webhook`
4. **Method:** `POST`
5. **Headers:** add one header —
   - Key: `Authorization`
   - Value: `Bearer <the HEALTH_WEBHOOK_TOKEN value from step 1>`
6. **Metrics to export** — select at least:
   - Step Count
   - Sleep Analysis
   - Weight
   - (optional) Heart Rate, Resting Heart Rate, Active Energy
7. **Frequency:** hourly or daily is plenty for this app — it's not a live dashboard.
8. Save, then run the automation once manually from the app to send a test sync.

## 3. What happens with the data

- Every metric is stored in `health_metrics` (a full history, one row per
  reading).
- Steps and sleep hours additionally show up on the dashboard tiles and daily
  checklist for that day, replacing the "Not synced yet" / manual-entry state
  from Phase 7 — automatically, no action needed once synced.
- Weight readings are also written into `weight_logs` (the same table the
  Progress screen's manual weight entry uses), so a synced weigh-in shows up
  on the weight trend chart too.

## 4. Verifying it worked

- Open the app and check the Home tab — Steps should show a real number
  instead of "Not synced yet" after your first successful sync.
- If nothing shows up, re-check the Authorization header value in Health Auto
  Export exactly matches `HEALTH_WEBHOOK_TOKEN` in Vercel (case-sensitive, no
  extra spaces), and that both env vars are set for the **Production**
  environment specifically.
