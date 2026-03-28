# 🛒 Markopen — Production Deployment Guide
**Domain:** markopen.in | **Stack:** Go + React + Supabase + Render + Vercel

---

## 📁 Project Structure

```
deploy/
├── backend/          ← Go API (deploy to Render)
│   ├── Dockerfile    ← ✅ Optimized for Render free tier
│   ├── render.yaml   ← Render config reference
│   ├── .env.example  ← All env vars documented
│   └── internal/
│       ├── config/config.go  ← ✅ Supports DATABASE_URL (Supabase)
│       └── tracing/tracer.go ← ✅ Graceful skip if no Jaeger
└── frontend/         ← React app (deploy to Vercel)
    ├── vercel.json   ← ✅ SPA rewrites + security headers
    ├── src/api/client.ts ← ✅ Uses VITE_API_URL env var
    └── public/
        ├── robots.txt
        └── site.webmanifest
```

---

## 🗄️ STEP 1 — Supabase (Database)

1. Go to **[supabase.com](https://supabase.com)** → Sign up → **New Project**
2. Name: `markopen` | Region: **Mumbai (ap-south-1)** | Set a strong DB password
3. Wait ~2 min for provisioning
4. Go to **Settings → Database → Connection string**
5. Select **"Transaction" mode** (not Session) → Copy the URL

It looks like:
```
postgres://postgres.YOURREF:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

> ⚠️ Save this URL — you'll need it in Step 2

---

## 🚀 STEP 2 — Render (Backend)

### 2a. Push backend to GitHub
```bash
cd deploy/backend
git init
git add .
git commit -m "Initial backend deployment"
git remote add origin https://github.com/YOURUSERNAME/markopen-backend.git
git push -u origin main
```

### 2b. Deploy on Render
1. Go to **[render.com](https://render.com)** → New → **Web Service**
2. Connect your GitHub repo → Select `markopen-backend`
3. Settings:
   - **Runtime:** Docker
   - **Branch:** main
   - **Plan:** Free

### 2c. Environment Variables (Render Dashboard → Environment)

| Variable | Value |
|----------|-------|
| `ENV` | `production` |
| `DATABASE_URL` | Your Supabase pooler URL from Step 1 |
| `DB_SSLMODE` | `require` |
| `JWT_SECRET` | Run: `openssl rand -hex 32` in terminal |
| `JWT_EXPIRY_HOURS` | `24` |
| `USER_JWT_EXPIRY_HOURS` | `72` |
| `ADMIN_SEED_USER` | `admin` (or your username) |
| `ADMIN_SEED_PASS` | A strong password (save it!) |
| `ALLOWED_ORIGINS` | `https://markopen.in,https://www.markopen.in` |

> Leave `REDIS_URL` and `JAEGER_ENDPOINT` empty — they degrade gracefully

4. Click **Deploy** — wait ~3-5 min
5. Note your URL: `https://markopen-api-XXXX.onrender.com`
6. Test: Visit `https://markopen-api-XXXX.onrender.com/api/health` → should return `{"status":"ok"}`

---

## ⚡ STEP 3 — Vercel (Frontend)

### 3a. Push frontend to GitHub
```bash
cd deploy/frontend
git init
git add .
git commit -m "Initial frontend deployment"
git remote add origin https://github.com/YOURUSERNAME/markopen-frontend.git
git push -u origin main
```

### 3b. Deploy on Vercel
1. Go to **[vercel.com](https://vercel.com)** → New Project
2. Import `markopen-frontend` GitHub repo
3. Framework: **Vite** (auto-detected)
4. Add **Environment Variable**:
   - `VITE_API_URL` = `https://markopen-api-XXXX.onrender.com`
5. Click **Deploy**

---

## 🌐 STEP 4 — Domain Setup (GoDaddy → markopen.in)

### Frontend (markopen.in → Vercel)
In GoDaddy DNS Management:

| Type | Name | Value |
|------|------|-------|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

Then in Vercel → Project → Settings → Domains:
- Add `markopen.in`
- Add `www.markopen.in`

### Backend API (api.markopen.in → Render)
| Type | Name | Value |
|------|------|-------|
| `CNAME` | `api` | `markopen-api-XXXX.onrender.com` |

Then in Render → Settings → Custom Domains:
- Add `api.markopen.in`

### After domain setup, update Render env:
- `ALLOWED_ORIGINS` → `https://markopen.in,https://www.markopen.in`

And update Vercel env:
- `VITE_API_URL` → `https://api.markopen.in`

> ⏳ DNS propagation takes 5-30 minutes

---

## ⏰ STEP 5 — Prevent Render Sleep (Free Tier)

Render free tier sleeps after 15 min of inactivity. Fix:

1. Go to **[cron-job.org](https://cron-job.org)** → Sign up → **Create Cronjob**
2. URL: `https://api.markopen.in/api/health`
3. Schedule: Every **10 minutes**
4. Save → Enable

---

## 🔐 Admin Access

After deployment, access admin panel at:
```
https://markopen.in/#admin
```
Or press `Ctrl + Shift + A` on the site.

Login with your `ADMIN_SEED_USER` and `ADMIN_SEED_PASS`.

---

## 🧪 Verify Everything Works

```bash
# 1. Backend health
curl https://api.markopen.in/api/health

# 2. Shops list (public)
curl https://api.markopen.in/api/shops

# 3. Admin login
curl -X POST https://api.markopen.in/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YOUR_ADMIN_PASS"}'
```

---

## 🐛 Fixes Applied (vs Original Code)

| File | Issue | Fix |
|------|-------|-----|
| `src/api/client.ts` | Hardcoded `localhost:8080` | Uses `VITE_API_URL` env var |
| `internal/config/config.go` | No `DATABASE_URL` support | Added Supabase-style URL support |
| `internal/tracing/tracer.go` | Crash if Jaeger missing | Graceful skip with log |
| `index.html` | Wrong domain `markopen.app` | Fixed to `markopen.in` |
| `Dockerfile` | Missing `wget` for healthcheck | Added |
| `vite.config.ts` | sourcemap in production | Disabled (smaller build) |
| `public/robots.txt` | Wrong path (in components/) | Moved to `public/` |
| `public/site.webmanifest` | Wrong path + old domain | Fixed both |

---

## 💡 Free Tier Limitations

| Service | Limitation | Impact |
|---------|-----------|--------|
| Render | Sleeps after 15min | ~30s cold start (fixed by Step 5) |
| Render | 512MB RAM | Fine for this app |
| Supabase | 500MB DB, 2 projects | Fine for MVP |
| Vercel | 100GB bandwidth | Fine for MVP |

---

## 🔄 Redeployment

**Backend change:**
```bash
git add . && git commit -m "fix: your message" && git push
# Render auto-deploys on push
```

**Frontend change:**
```bash
git add . && git commit -m "fix: your message" && git push
# Vercel auto-deploys on push
```

