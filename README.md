# Madrasah Academic Academic System

Academic management for a Madrasah teaching Qur'an memorization (Hifz), Tajweed, Islamic studies, Arabic, and other subjects.

**Stack:** Next.js + Prisma + PostgreSQL (Neon)

## Authentication

- **Username-based login** – users must exist in the `User` table
- **Seed default user:** `admin` / `admin123` (run `npm run db:seed`)
- Set `NEXTAUTH_SECRET` and `NEXTAUTH_URL` in `.env`

## User Management (Users, Roles, Permissions)

- **Users** – Create users, assign roles
- **Roles** – Create roles, assign permissions (e.g. admin, teacher, viewer)
- **Permissions** – Resource + action (e.g. users.manage, memorization.read)
- Seed roles and permissions: `npm run db:seed:roles`

## Setup

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed       # Seed subjects + admin user
npm run db:seed:roles  # Seed roles, permissions, assign admin role
```

## Run

```bash
npm run dev
```

Open http://localhost:3000

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/memorization` | Create memorization record |
| GET | `/api/memorization` | Paginated history |
| GET | `/api/memorization/student/[id]/progress` | Student progress |
| POST | `/api/exams` | Create exam result |
| GET | `/api/exams` | List exam results |
| POST | `/api/students` | Create student |
| GET | `/api/students` | List students |
| POST | `/api/teachers` | Create teacher |
| GET | `/api/teachers` | List teachers |
| POST | `/api/subjects` | Create subject |
| GET | `/api/subjects` | List subjects |
| GET | `/api/users` | List users |
| POST | `/api/users` | Create user |
| PATCH | `/api/users/[id]` | Update user, assign roles |
| GET | `/api/roles` | List roles |
| POST | `/api/roles` | Create role |
| PATCH | `/api/roles/[id]` | Assign permissions |
| GET | `/api/permissions` | List permissions |
| POST | `/api/permissions` | Create permission |

## Environment

Set `DATABASE_URL` in `.env` (Neon PostgreSQL).

## Deploy on Vercel

1. Push the repo and import the project in [Vercel](https://vercel.com).
2. Set **Environment Variables** in the project settings (or in the Vercel dashboard):

   | Variable | Required | Notes |
   |----------|----------|--------|
   | `DATABASE_URL` | Yes | PostgreSQL connection string. Prefer a **pooled** URL (e.g. Neon with `?pgbouncer=true` or `?connection_limit=1`) for serverless. |
   | `NEXTAUTH_SECRET` | Yes | Random secret for session signing. |
   | `NEXTAUTH_URL` | Yes | Your app URL, e.g. `https://your-app.vercel.app`. Vercel can set this automatically if you add it once. |
   | `IMAGEKIT_PRIVATE_KEY` | If using uploads | ImageKit private API key (server-only). |
   | `IMAGEKIT_PUBLIC_KEY` | If using uploads | ImageKit public key. |
   | `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` | If using uploads | ImageKit URL endpoint (e.g. `https://ik.imagekit.io/your_id`). |
   | `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` | If using uploads | Same as `IMAGEKIT_PUBLIC_KEY` for client-side upload. |

3. Run migrations against the production DB before or after first deploy (e.g. `npx prisma migrate deploy` from your machine or a one-off script).
4. Optionally seed admin and roles once: run seed scripts locally against the production `DATABASE_URL`, or use a one-off Vercel task.

Build uses `prisma generate && next build` (see `vercel.json`). The `postinstall` script also runs `prisma generate` so the Prisma client is available during install.
