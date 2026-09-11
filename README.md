# MR Task Review Web

Web hub for MR review tasks. Humans create tasks and decide when to allow approval. An external outbound-only review system polls and posts via API key.

## Stack

- Next.js (App Router) + TypeScript
- Prisma + **PostgreSQL**
- Auth.js (credentials)
- next-intl (English / Vietnamese)

## Local setup

```bash
cp .env.example .env
docker compose up -d          # Postgres on localhost:5432
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Login: `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `.env` (example: `admin` / `change-me`).

## Deploy on Railway

1. New Project → Deploy from GitHub (`TICKET_REVIEW`).
2. **Add Postgres:** New → Database → PostgreSQL.
3. Web service → **Variables** → add:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Variable Reference → `${{Postgres.DATABASE_URL}}` (name may match your DB service) |
| `DIRECT_URL` | Same as `DATABASE_URL` |
| `AUTH_SECRET` | Generate / long random string |
| `AUTH_TRUST_HOST` | `true` |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | your password |

4. Redeploy. Login: `https://<service>.up.railway.app/en/login`

If logs say `DATABASE_URL is required`, the web service is not linked to Postgres yet (step 2–3).

## Deploy on Vercel (recommended)

SQLite does **not** work on Vercel. Use Postgres (Neon is free and easy):

1. Create a free DB at [neon.tech](https://neon.tech) (or Vercel Storage → Postgres).
2. Copy **pooled** connection string → `DATABASE_URL`
3. Copy **direct / unpooled** connection string → `DIRECT_URL`
4. In Vercel project → Settings → Environment Variables:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Neon pooled URL |
| `DIRECT_URL` | Neon direct URL |
| `AUTH_SECRET` | long random string |
| `AUTH_TRUST_HOST` | `true` |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | your password |

5. Redeploy. Build runs `migrate deploy` + seed + `next build` via `vercel.json`.

App: `https://<project>.vercel.app/en/login`

## Deploy on Render

Use Blueprint `render.yaml` (web + Postgres), or set `DATABASE_URL` / `DIRECT_URL` to a Render Postgres instance (same value for both is fine). Start command: `npm start` (migrate + seed + next).

## Human flow

1. Sign in
2. Create a task with MR URL (and optional project / IID)
3. Create an API key under **API Keys** (copy once)
4. Wait for the review system to claim and post results
5. Read the timeline; add a comment if another scan is needed (`needs_revision`)
6. When satisfied, click **Allow approve**
7. Review system approves the MR and posts `approved`

## Review system API (`X-API-Key`)

Base URL: `https://<your-domain>/api/v1`

### List tasks

```bash
curl -s -H "X-API-Key: YOUR_KEY" \
  "https://<your-domain>/api/v1/tasks?status=pending,needs_revision,allow_approve"
```

Each task includes:

| Field | Meaning |
|-------|---------|
| `status` | Current status |
| `allowApprove` | Human allowed MR approval |
| `skipReview` | `true` if human chose **Approve without review** |
| `action` | Bot hint: `review` \| `approve_after_review` \| `approve_without_review` \| `null` |

Example `allow_approve` item when skipping review:

```json
{
  "id": "...",
  "status": "allow_approve",
  "allowApprove": true,
  "skipReview": true,
  "action": "approve_without_review",
  "mrUrl": "https://..."
}
```

### Get task detail (comments + events)

```bash
curl -s -H "X-API-Key: YOUR_KEY" \
  "https://<your-domain>/api/v1/tasks/TASK_ID"
```

### Claim task (`pending` or `needs_revision` → `in_review`)

```bash
curl -s -X POST -H "X-API-Key: YOUR_KEY" \
  "https://<your-domain>/api/v1/tasks/TASK_ID/claim"
```

### Post review result → `reviewed`

```bash
curl -s -X POST -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"summary":"Looks good","findings":[{"severity":"info","message":"No blockers"}]}' \
  "https://<your-domain>/api/v1/tasks/TASK_ID/reviews"
```

### Mark approved (only when status is `allow_approve`)

Works for both normal approve-after-review and **approve without review** (`skipReview: true`).

```bash
curl -s -X POST -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"note":"Approved on GitLab"}' \
  "https://<your-domain>/api/v1/tasks/TASK_ID/approved"
```

## Suggested review-system loop

1. `GET /tasks?status=pending,needs_revision` → claim → review → `POST .../reviews`  
   (skip tasks that already moved to `allow_approve`)
2. `GET /tasks?status=allow_approve`:
   - if `skipReview` / `action=approve_without_review` → approve MR immediately (no scan)
   - else → approve after human accepted the review result
   - then `POST .../approved`
3. On `needs_revision`, re-read comments from `GET /tasks/:id` and scan again

## Task statuses

| Status | Meaning |
|--------|---------|
| `pending` | Waiting for review pickup |
| `in_review` | Claimed by review system |
| `reviewed` | Result posted; waiting for human |
| `needs_revision` | Human commented; re-scan needed |
| `allow_approve` | Human allowed approval (`skipReview` may be true) |
| `approved` | Review system confirmed approval |
| `cancelled` | Cancelled by human |
