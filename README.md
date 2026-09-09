# MR Task Review Web

Web hub for MR review tasks. Humans create tasks and decide when to allow approval. An external outbound-only review system polls and posts via API key.

## Stack

- Next.js (App Router) + TypeScript
- Prisma + SQLite
- Auth.js (credentials)
- next-intl (English / Vietnamese)

## Setup

```bash
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Default admin comes from `.env`:

- `ADMIN_USERNAME` (default `admin`)
- `ADMIN_PASSWORD` (default `change-me` in example; set a strong value)

## Deploy on Render

1. Push this repo to GitHub/GitLab.
2. Open [New Web Service](https://dashboard.render.com/web/new) and connect the repo.
3. Settings (or use Blueprint `render.yaml`):
   - **Runtime:** Node
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npx prisma migrate deploy && npx tsx prisma/seed.ts && npm start`
4. Environment variables:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | `file:./prod.db` |
| `AUTH_SECRET` | random long string (Generate) |
| `AUTH_TRUST_HOST` | `true` |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | your password |

5. Deploy. App URL: `https://<service>.onrender.com` (login at `/en/login`).

**Note:** Free plan has ephemeral disk — SQLite data resets on redeploy. Seed recreates the admin user. For persistent data, add a [persistent disk](https://render.com/docs/disks) (paid) mounted e.g. at `/var/data` and set `DATABASE_URL=file:/var/data/prod.db`.

## Human flow

1. Sign in
2. Create a task with MR URL (and optional project / IID)
3. Create an API key under **API Keys** (copy once)
4. Wait for the review system to claim and post results
5. Read the timeline; add a comment if another scan is needed (`needs_revision`)
6. When satisfied, click **Allow approve**
7. Review system approves the MR and posts `approved`

## Review system API (`X-API-Key`)

Base URL: `http://localhost:3000/api/v1`

### List tasks

```bash
curl -s -H "X-API-Key: YOUR_KEY" \
  "http://localhost:3000/api/v1/tasks?status=pending,needs_revision,allow_approve"
```

### Get task detail (comments + events)

```bash
curl -s -H "X-API-Key: YOUR_KEY" \
  "http://localhost:3000/api/v1/tasks/TASK_ID"
```

### Claim task (`pending` or `needs_revision` → `in_review`)

```bash
curl -s -X POST -H "X-API-Key: YOUR_KEY" \
  "http://localhost:3000/api/v1/tasks/TASK_ID/claim"
```

### Post review result → `reviewed`

```bash
curl -s -X POST -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"summary":"Looks good","findings":[{"severity":"info","message":"No blockers"}]}' \
  "http://localhost:3000/api/v1/tasks/TASK_ID/reviews"
```

### Mark approved (only when status is `allow_approve`)

```bash
curl -s -X POST -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"note":"Approved on GitLab"}' \
  "http://localhost:3000/api/v1/tasks/TASK_ID/approved"
```

## Suggested review-system loop

1. `GET /tasks?status=pending,needs_revision` → claim each → run review → `POST .../reviews`
2. `GET /tasks?status=allow_approve` → approve MR externally → `POST .../approved`
3. Poll periodically; on `needs_revision`, re-read comments from `GET /tasks/:id` and scan again

## Task statuses

| Status | Meaning |
|--------|---------|
| `pending` | Waiting for review pickup |
| `in_review` | Claimed by review system |
| `reviewed` | Result posted; waiting for human |
| `needs_revision` | Human commented; re-scan needed |
| `allow_approve` | Human allowed approval |
| `approved` | Review system confirmed approval |
| `cancelled` | Cancelled by human |
