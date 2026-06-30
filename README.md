# Northwest U-Pick

An app for seeing what local U-pick farms are open and what is available today.

## Local Database Setup

The backend uses PostgreSQL and Prisma.

### 1. Start PostgreSQL

From the repository root:

```bash
docker compose up -d
```

This starts PostgreSQL 16 on port `5432` with:

- Database: `northwest_upick`
- Username: `postgres`
- Password: `postgres`

### 2. Configure Backend Environment

Create `backend/.env` from the example:

```bash
cp backend/.env.example backend/.env
```

The local database URL is:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/northwest_upick?schema=public"
```

### 3. Run Prisma Commands

From `backend/`:

```bash
npm run db:generate
npm run db:migrate
```

Optional tools:

```bash
npm run db:studio
npm run db:reset
```
