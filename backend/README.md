# Shopen Backend

Production-grade Go + PostgreSQL REST API for the **Shopen** local shop directory platform.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Go 1.22 |
| Database | PostgreSQL 16 |
| Auth | JWT (HS256) via `golang-jwt/jwt` |
| Password hashing | `bcrypt` (cost 12) |
| DB driver | `lib/pq` |
| HTTP router | Go 1.22 stdlib `net/http` (pattern routing) |
| Containerisation | Docker + Docker Compose |

---

## Quick Start

### Option A — Docker Compose (recommended)

```bash
cd backend
docker compose up --build
```

The backend will be available at `http://localhost:8080`.
The default admin credentials are `admin / admin123`.

### Option B — Local development

**Prerequisites:** Go 1.22+, PostgreSQL 16 running locally.

```bash
# 1. Clone and enter the backend directory
cd backend

# 2. Copy env file and edit as needed
cp .env.example .env

# 3. Create the database
createdb shopen_db

# 4. Download dependencies
go mod download

# 5. Run the server (auto-migrates + seeds admin on first boot)
go run ./cmd/server
```

---

## Project Structure

```
backend/
├── cmd/
│   └── server/
│       └── main.go            ← Entry point: wires config, DB, router, server
├── internal/
│   ├── config/
│   │   └── config.go          ← Env-based configuration
│   ├── db/
│   │   └── db.go              ← Connect, Migrate (schema DDL), SeedAdmin
│   ├── handlers/
│   │   ├── auth.go            ← POST /api/auth/login
│   │   ├── shops.go           ← Public + Admin shop CRUD + stats
│   │   ├── users.go           ← User signup/login/me
│   │   ├── shopkeepers.go     ← Shopkeeper auth + requests + messages
│   │   ├── favorites.go       ← Per-user favorites
│   │   ├── feedback.go        ← Feedback submit + admin list
│   │   └── image_requests.go  ← Image upload requests + admin review
│   ├── middleware/
│   │   └── middleware.go      ← CORS, Logger, Recovery, JWT auth
│   ├── models/
│   │   └── models.go          ← All domain structs and payload types
│   └── router/
│       └── router.go          ← Route registration
├── Dockerfile
├── docker-compose.yml
├── Makefile
├── go.mod
└── .env.example
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8080` | HTTP server port |
| `DB_HOST` | `localhost` | Postgres host |
| `DB_PORT` | `5432` | Postgres port |
| `DB_USER` | `shopen` | Postgres user |
| `DB_PASSWORD` | `shopen_secret` | Postgres password |
| `DB_NAME` | `shopen_db` | Database name |
| `DB_SSLMODE` | `disable` | SSL mode (`disable`/`require`) |
| `JWT_SECRET` | *(insecure default)* | **Change in production!** |
| `JWT_EXPIRY_HOURS` | `24` | Admin JWT TTL |
| `USER_JWT_EXPIRY_HOURS` | `72` | User/Shopkeeper JWT TTL |
| `ADMIN_SEED_USER` | `admin` | First-boot admin username |
| `ADMIN_SEED_PASS` | `admin123` | First-boot admin password |
| `ALLOWED_ORIGINS` | `http://localhost:5173,...` | Comma-separated CORS origins |

---

## API Reference

All responses use the envelope:
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "message" }
```

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | — | Liveness check |

---

### Auth (Admin)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | — | Admin login → JWT |

**Body:** `{ "username": "admin", "password": "admin123" }`

---

### Public Users

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/users/signup` | — | Create user account |
| `POST` | `/api/users/login` | — | Login → JWT |
| `GET` | `/api/users/me` | Bearer (user) | Get own profile |

---

### Shopkeepers

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/shopkeepers/signup` | — | Register (requires phone) |
| `POST` | `/api/shopkeepers/login` | — | Login → JWT |
| `POST` | `/api/shopkeepers/requests` | — | Submit a request to admin |
| `GET` | `/api/shopkeepers/requests?phone=xxx` | — | List own requests |

---

### Public Shops

| Method | Path | Query Params | Description |
|---|---|---|---|
| `GET` | `/api/shops` | `category`, `subcat`, `status`, `search` | List active shops |
| `GET` | `/api/shops/{id}` | — | Get single shop |

---

### Favorites

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/favorites?username=xxx` | Optional | List favorited shops |
| `POST` | `/api/favorites/toggle` | Optional | Toggle favorite |
| `GET` | `/api/favorites/check?username=xxx&shop_id=yyy` | Optional | Check if favorited |

---

### Feedback

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/feedback` | — | Submit feedback |

---

### Image Requests

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/image-requests` | — | Submit shop image request |

---

### Messages (SK ↔ Admin)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/sk-requests/{id}/messages` | — | List messages for request |
| `POST` | `/api/sk-requests/{id}/messages` | Bearer | Send message |
| `PATCH` | `/api/sk-requests/{id}/messages/read` | Bearer | Mark messages read |

---

### Admin Endpoints (require Admin JWT)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/shops` | List all shops (includes inactive) |
| `POST` | `/api/admin/shops` | Create shop |
| `PUT` | `/api/admin/shops/{id}` | Update shop |
| `DELETE` | `/api/admin/shops/{id}` | Delete shop |
| `PATCH` | `/api/admin/shops/{id}/toggle` | Toggle active/inactive |
| `GET` | `/api/admin/stats` | Dashboard stats |
| `GET` | `/api/admin/feedback` | List all feedback |
| `GET` | `/api/admin/image-requests?status=pending` | List image requests |
| `PATCH` | `/api/admin/image-requests/{id}/review` | Approve/reject image request |
| `GET` | `/api/admin/sk-requests?status=pending` | List shopkeeper requests |
| `PATCH` | `/api/admin/sk-requests/{id}/review` | Approve/reject SK request |
| `POST` | `/api/admin/sk-requests/{id}/messages` | Admin sends message |

---

## Database Schema

Nine tables, all created automatically on first boot:

- `admin_users` — admin credentials
- `users` — public user accounts
- `shopkeepers` — shopkeeper accounts (require phone)
- `shops` — core shop listings
- `favorites` — user ↔ shop many-to-many
- `feedback` — user feedback submissions
- `image_requests` — shopkeeper image upload requests
- `sk_requests` — general shopkeeper-to-admin requests
- `sk_messages` — bidirectional chat per SK request

---

## Makefile Commands

```bash
make run          # go run ./cmd/server
make build        # compile to bin/server
make test         # go test ./... -race
make tidy         # go mod tidy
make docker-up    # docker compose up --build -d
make docker-down  # docker compose down
make docker-logs  # tail backend logs
make db-shell     # open psql
make migrate-reset # drop + recreate schema (dev only)
```

---

## Security Notes

- Passwords hashed with `bcrypt` (cost 12)
- JWTs signed with HS256; secret loaded from env
- CORS restricted to configured origins
- Admin routes protected by role-checked JWT middleware
- SQL uses `$N` parameterised queries — no raw string interpolation
- **Change `JWT_SECRET` and `ADMIN_SEED_PASS` before going to production**


backend
 go run cmd/server/main.go
<!--  -->
http://localhost:5173/#admin