# VETA-inspired Vocational Education Platform

This project is an original, VETA-inspired public website and administration portal for a Tanzanian vocational education institution. It includes a public website, searchable directory, course catalogue, admissions workflow, and secure admin dashboard.

## Architecture

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Routing: React Router
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL via Prisma ORM
- Auth: JWT tokens with bcrypt password hashing
- Validation: Zod
- Testing: Vitest + React Testing Library + Supertest

## Sitemap

- Home
- About Us
- Training Centres
- Centre detail
- Courses and Programmes
- Course detail
- Admissions / Apply
- News & Announcements
- Publications & Downloads
- Contact Us
- Admin dashboard

## Database relationship overview

- Users -> roles (`UserRole`, many-to-many)
- Regions -> districts -> training centres -> centre courses -> courses
- Users -> bookings
- Public course reviews are stored independently
- Applications, news articles, publications, and audit logs are separate records

## Project structure

```text
.
├── backend/
│   ├── src/
│   ├── prisma/
│   │   └── seed.ts
│   ├── prisma.config.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docs/
│   └── architecture.md
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## Development setup

1. Install Node.js 20.19 or newer and PostgreSQL 16.
2. In pgAdmin, create a database named `veta_dev`. Keep the PostgreSQL username and password you chose during installation.
3. Update the existing root `.env` (or copy `.env.example` to `.env`) with your PostgreSQL password in `DATABASE_URL`. URL-encode any reserved characters in the password. Also replace `JWT_SECRET` and `ADMIN_PASSWORD` with private values. Never commit `.env`.
4. Install backend dependencies and initialize the database from PowerShell:

   ```powershell
   cd C:\path\to\kipawa\backend
   npm install
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

   The seed command creates the course catalogue and demo content. It creates the admin account using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the root `.env`.
5. Start the backend in one terminal:

   ```powershell
   npm run dev
   ```

6. In a second terminal, install and start the frontend:

   ```powershell
   cd C:\path\to\kipawa\frontend
   npm install
   npm run dev
   ```

7. Open `http://localhost:5173`. The API and database health check is at `http://localhost:4000/api/health`; it should report `"database":"connected"`.

The frontend uses one shared login page for all users. After login, administrators go to the administration dashboard and applicants go to their learner dashboard, where they can view their own bookings. Dashboard routes and booking data are protected by the user's role and authenticated API token. Administrators can manage user accounts and roles, courses, training centres, news, publications, site settings, bookings, applications, reviews, and contact inquiries from the database management section. Course management includes course type, start date, fee, and image URL; short-course records appear in the public catalogue with their schedule and fee. Public site content, contact details, admissions steps, and live summary counts are read from PostgreSQL.

The frontend uses the Express API for accounts, applications, contact inquiries, bookings, reviews, courses, training centres, and news. Admins can add news images, MP4/WebM video uploads (up to 50 MB), or YouTube links; videos play inline on the article page. Published news opens as a full article page; signed-in users can like, dislike, and comment, with reactions and comments stored per article and user in PostgreSQL. The backend persists submissions and catalogue content to PostgreSQL through Prisma; the centre and news listings are loaded from the database rather than maintained as frontend-only copies. If database setup fails, the health check and API return an error rather than silently switching to temporary in-memory data.

## Notes

This is an original implementation inspired by the public design and information architecture of VETA Tanzania. It does not claim official status or use protected institutional assets without authorization.
