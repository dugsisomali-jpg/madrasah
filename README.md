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
