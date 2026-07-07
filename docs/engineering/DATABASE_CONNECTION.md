# Database Connection Flow

Northwest U-Pick uses a simple local development data path:

```text
React frontend -> Express API -> Prisma Client -> PostgreSQL
```

The browser never connects directly to PostgreSQL. The frontend only calls the backend API, and the backend is the only process that reads from or writes to the database.

## Local Services

| Service | Default URL | Purpose |
| --- | --- | --- |
| Frontend | `http://localhost:5173` | React + Vite app |
| Backend API | `http://localhost:4000` | Express API server |
| PostgreSQL | `localhost:5432` | Local database |

## Frontend API Client

Frontend requests are centralized in:

```text
frontend/src/lib/api.ts
```

The frontend uses `VITE_API_URL` when present. If it is not set, it falls back to:

```text
http://localhost:4000
```

Example API path:

```text
GET http://localhost:4000/api/farms
```

## Backend API

The Express app is assembled in:

```text
backend/src/app.js
```

The backend mounts API routes such as:

```text
/api/farms
/api/crops
/api/harvest
/api/search
/api/admin
```

The backend dev server listens on port `4000` by default:

```text
backend/src/server.js
```

## Prisma Connection

Prisma Client is configured in:

```text
backend/src/db/prisma.js
```

The Prisma schema lives at:

```text
backend/prisma/schema.prisma
```

The backend reads `DATABASE_URL` from `backend/.env`.

Example local database URL:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/northwest_upick?schema=public"
```

The checked-in example lives at:

```text
backend/.env.example
```

## Local PostgreSQL

Local PostgreSQL is defined in:

```text
docker-compose.yml
```

Current local defaults:

```text
Database: northwest_upick
User: postgres
Password: postgres
Port: 5432
Image: postgres:16
```

Data is persisted in the Docker volume:

```text
postgres_data
```

## Running Locally

Start PostgreSQL:

```bash
docker compose up -d
```

Run migrations:

```bash
cd backend
npm run db:migrate
```

Generate Prisma Client:

```bash
cd backend
npm run db:generate
```

Seed local data:

```bash
cd backend
npm run db:seed
```

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend:

```bash
cd frontend
npm run dev
```

## Important Boundary

Do not put database credentials in the frontend.

Frontend code should call API functions from `frontend/src/lib/api.ts`. Backend code should access data through service/repository layers and Prisma.

Current request flow example:

```text
Farm Finder page
  -> useFarms()
  -> frontend/src/lib/api.ts
  -> GET /api/farms
  -> backend route/service/repository
  -> Prisma Client
  -> PostgreSQL
```
