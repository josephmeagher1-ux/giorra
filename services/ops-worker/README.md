# @giorra/ops-worker

Long-running Node service for jobs that don't fit Supabase Edge Functions
(weekly fuel scraping, compliance summaries, recurring-trip materialization).

Designed to run on one of the GitHub Student Developer Pack hosts:

- DigitalOcean droplet (Pack offer: $200/yr platform credit)
- Microsoft Azure App Service (Pack offer: $100 credit + free services)
- Heroku Eco dyno (Pack offer: $13/mo credit for 24 months)

Local dev:

```bash
cd services/ops-worker
npm install
npm run dev
```

Run once and exit (useful for cron / GitHub Actions schedule):

```bash
OPS_RUN_ONCE=true npm run start
```
