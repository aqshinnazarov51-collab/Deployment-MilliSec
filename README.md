# Lumio Learning

Lumio is a full-stack learning platform built with Next.js App Router, TypeScript, Prisma, and SQLite. Students can discover courses, enroll with a clearly labeled mock checkout, study lessons, save favorites, review courses, and earn completion certificates. Instructors can author and publish their own courses and see enrollment, review, and sales data.

## Technology

- Next.js 15 App Router and React 19
- TypeScript and Tailwind CSS 4
- Prisma ORM with SQLite (schema can be switched to PostgreSQL)
- Zod validation and bcrypt password hashing
- Random, database-backed sessions in secure HTTP-only cookies
- Local profile image uploads

## Run locally

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
```

Copy `.env.example` to `.env` and set a private `AUTH_SECRET` (32 or more random characters). The demo uses a local SQLite file by default:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="replace-with-a-long-random-secret-at-least-32-characters"
UPLOAD_DIR="./public/uploads"
```

Start the site:

```bash
npm run dev
```

Before the first development start, Lumio automatically generates the Prisma client and applies database migrations. When Prisma creates a new database, its configured seed script adds the starter courses and demo accounts. Later starts apply pending migrations and keep the local data. The SQLite database file is intentionally excluded from Git; each collaborator gets a separate local database. `npm run db:seed` resets the demo data, so do not run it if you need to keep that database's data.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful commands:

```bash
npm run typecheck
npm run lint
npm run build
npm run db:setup
npm start
```

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Student | `student@example.com` | `Student123!` |
| Instructor | `instructor@example.com` | `Instructor123!` |
| Admin | `admin@example.com` | `Admin123!` |

The seed creates 10 published courses, nine categories, three instructors, lessons, reviews, a student enrollment, a completed demo order, and notifications. Seed accounts are for local development only. Re-running the seed resets the demo records.

## Demo checkout

Checkout is a local simulation. No real payment provider is connected. Card values are validated in the mock service and are never sent to a payment provider or stored in the database.

- Success: `4111 1111 1111 1111`
- Simulated decline: `4000 0000 0000 0002`
- Use any future month/year, a 3-digit security code, and a cardholder name.

Every checkout page states “Test payment only — no real charge”. The database records the mock order, payment status, transaction ID, and enrollment, but no card data.

## Database and migrations

The Prisma schema lives in `prisma/schema.prisma`; the initial SQLite migration is in `prisma/migrations`. The schema keeps role, course level, and order status as validated strings so it can be migrated to PostgreSQL without depending on SQLite enum support.

To create a migration after changing the schema:

```bash
npx prisma migrate dev --name describe-your-change
npx prisma generate
```

To use PostgreSQL, change the datasource provider to `postgresql`, set a PostgreSQL `DATABASE_URL`, then create a fresh migration for that provider. Do not reuse the SQLite migration history for a new PostgreSQL database.

## Main routes

- `/` — landing page
- `/catalog` — searchable, filterable course catalog
- `/courses/[slug]` — course details, curriculum, reviews, and enrollment
- `/register`, `/login` — account creation and login
- `/checkout/[courseId]` — mock checkout
- `/student` — learner dashboard
- `/student/courses` — enrolled courses and learning progress
- `/student/courses/[courseId]/learn/[lessonId]` — course player
- `/student/wishlist`, `/student/orders`, `/student/certificates`
- `/student/profile`, `/student/settings`
- `/instructor` — instructor overview and real course metrics
- `/instructor/courses`, `/instructor/courses/new`, `/instructor/courses/[courseId]/edit`
- `/instructor/students`, `/instructor/sales`, `/instructor/reviews`, `/instructor/profile`, `/instructor/settings`
- `/admin` — account, catalog, order, payment, and review overview

## Server actions and API routes

Server actions in `actions/` handle registration, login/logout, course CRUD, wishlist changes, mock purchases, progress completion, reviews, account/profile changes, settings, and admin moderation. Every protected action reads the database session and checks the current user's role; instructor edits also check course ownership.

- `GET /api/search?q=...` — public course autocomplete
- `POST /api/upload/avatar` — authenticated image upload (PNG, JPEG, WebP, or GIF; maximum 2 MB)
- `DELETE /api/upload/avatar` — remove the signed-in user's image

## Project structure

```text
app/          App Router pages and API routes
actions/      Authenticated server actions
components/   Shared interface components
lib/          Database, session auth, validation, and mock payment service
prisma/       Relational schema, initial migration, and seed script
public/       Static assets and local user image uploads
```

The mock checkout, local disk uploads, and demo credentials are intended for learning and local development, not production deployment.
