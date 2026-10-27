# VETA-inspired Vocational Education Platform

This project is an original, VETA-inspired public website and administration portal for a Tanzanian vocational education institution. It includes a public website, searchable directory, course catalogue, course-interest workflow, and secure admin dashboard.

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
- Courses and Programmes
- Course detail
- Explore courses and upcoming short courses
- News & Announcements
- Publications & Downloads
- Contact Us
- Admin dashboard

## Database relationship overview

- Users -> roles (`UserRole`, many-to-many)
- Regions -> districts -> training centres -> centre courses -> courses
- Existing location tables are retained for data compatibility; the website offers training at VETA Kipawa ICT Centre only.
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

Visitors can open login or self-registration in a popup from the header. New self-registered accounts have no staff role or admin permissions and can only like, dislike, and comment on news. Administrators can manage accounts under **Admin → Users**, assign them custom roles, and grant staff permissions through **Admin → Roles & permissions**. Full administrators can create custom staff roles and assign any available management areas; other user managers may only assign roles within their own access. Only a full administrator can create or change roles, grant the reserved full-access Admin role, or manage administrator accounts. The Admin role always retains full access. The dashboard includes **Users**, **Courses**, **News**, **Short course enquiries**, **Bookings**, **Applications**, **Inquiries**, **Publications**, and **Site settings**; staff only see and can access areas granted by their role. The public course catalogue separates upcoming, ongoing, and all short courses from the full course offering. Course records reference database-backed categories (ICT, Electrical, Electronics, Mechatronics, and Other); a database constraint prevents duplicate course names within the same category and course type. Courses have an actual start date and an optional end date, separately from public listing dates; the homepage highlights the nearest upcoming short courses with a direct course-interest link. Visitors can review short-course fees and the TSh 5,000 registration form fee, then submit their details to express interest; the website does not collect payments or promise a confirmed place. Admins follow each enquiry through **New enquiry → Contacted → Form fee verified → Course fee verified → Start date sent**, recording payment-verification and start-date timestamps in PostgreSQL. Staff must contact learners and verify payments through the official centre process; after a staff status update, the website can send the learner an SMS using the Africa's Talking gateway. The website does not verify payments. Admins can export the selected enquiries and their follow-up/payment milestones as an Excel-compatible CSV.

The frontend uses the Express API for accounts, course-interest enquiries, contact inquiries, bookings, courses, news, and publications. VETA Kipawa ICT Centre is the single training location shown on course details and booking forms; existing training-centre records and API support remain for data compatibility. Course cover image URLs are saved in the course `imageUrl` database column, included in the course API, and displayed by the frontend. Administrators can enter an image URL or upload a JPEG, PNG, WebP, or GIF (up to 5 MB) from course management; uploaded images are stored by the backend and their paths are saved in PostgreSQL. Short-course publication dates are stored in PostgreSQL and enforced by the public catalogue, detail, enquiry, and booking endpoints. Illustrative stock photos on course guides are not photographs of verified VETA Kipawa classes; replace them with authorized centre photos before publication. Admins can add news images, MP4/WebM video uploads (up to 50 MB), or YouTube links; videos play inline on the article page. Publications accept an uploaded PDF (up to 20 MB) or an external PDF URL. Published news opens as a full article page; signed-in users can like, dislike, and comment, with reactions and comments stored per article and user in PostgreSQL. The backend persists submissions and catalogue content to PostgreSQL through Prisma rather than maintaining frontend-only copies. If database setup fails, the health check and API return an error rather than silently switching to temporary in-memory data.

Booking requests and decisions are persisted in PostgreSQL. Admins can confirm or decline each request, provide a confirmed start date and feedback, and learners can retrieve that decision in their dashboard. Confirming a booking requires an exact start date; declining one requires an explanation. Deploy committed Prisma migrations from `backend` before using schema updates, including `20261023100000_course_category_relations`, which relates courses to database categories, consolidates duplicate course rows while preserving their linked records, and adds database-level uniqueness and course-delete cascades, and `20261023110000_course_interest_campaign_attribution`, which adds optional short-course campaign labels to learner requests.

New course applications require a registered learner account with a phone number. Email and phone are stored on the learner account; phone numbers are not unique because families may share a number. Each learner may have one active course request at a time. Staff must call the registered phone and mark it confirmed in the enquiry dashboard before the API will issue a payment control number. Changing a learner's phone in user management clears its confirmation. The learner can change the course choice from their dashboard for 72 hours after requesting, unless staff issue a payment control number first; the choice is locked after either event. Course requests link to the learner and course records; registered requests use those records as their current identity and course data, while legacy standalone enquiries retain their contact snapshots. The flow is **Request course → Staff call and confirm phone → Centre issues control number → Learner pays the TSh 5,000 form fee and uploads a screenshot → Staff verify the payment → Learner completes the application → Staff review and approve with a start date (or request changes/decline)**. Learners see the progress, control number, review feedback, and confirmed start date in **Dashboard → Course application progress**. The website also sends an Africa's Talking SMS alert to the learner after each staff update when SMS credentials are configured; in-site notifications remain available. Configure `AFRICASTALKING_USERNAME`, `AFRICASTALKING_API_KEY`, and `AFRICASTALKING_ENVIRONMENT` in the server environment (`sandbox` or `production`), and optionally set `AFRICASTALKING_SENDER_ID` and `AFRICASTALKING_COUNTRY_CODE` (default `255`). The `sandbox` environment uses Africa's Talking's sandbox endpoint and test credentials. Missing or failed SMS delivery is reported to staff, while the saved course update and in-site notification remain intact. Only explicit staff rejections of a payment screenshot count toward the limit; after three rejections, the learner's account is blocked and they must contact the centre for assistance. The website does not create control numbers or collect money; staff use the official payment system and dashboard actions. Payment screenshots are stored outside public static uploads and can be viewed only by the owning learner or authorized staff.

Short-course request links can be tagged with `utm_source`, `utm_medium`, and `utm_campaign`, for example `/short-courses?utm_source=instagram&utm_medium=social&utm_campaign=october-intake`. The latest valid tagged visit in a browser tab is retained for that tab's session and saved with a submitted request; administrators can export the campaign labels with enquiry statuses and payment milestones from the course enquiries CSV. Use consistent campaign names when sharing links. This attributes completed short-course requests, not page views or external VET-MIS applications, and is not a substitute for confirming enrolments and revenue in official records.

Deploy the `20261015180000_registered_course_applications`, `20261015183000_course_interest_course_relation`, `20261015190000_single_course_choice_window`, `20261016052000_payment_proof_account_blocks`, `20261016084500_phone_verification_before_control_numbers`, and `20261020070000_payment_transaction_reconciliation` Prisma migrations and regenerate the Prisma client before enabling this workflow. Course requests are related to both the registered learner and the selected course; registered requests derive identity/contact details from the user and course records, while nullable contact/course snapshots remain for legacy enquiries and formal applicant names. A database unique index prevents concurrent duplicate active requests by the same learner. The newest active request is retained if existing data contains multiple active requests for one learner; older requests are marked superseded and kept for history. Keep the backend `uploads/payment-proofs` directory on persistent, access-controlled storage and include it in operational backup/retention procedures. Existing anonymous course-interest records remain available to staff as legacy requests; new course applications must belong to a signed-in account.
The former guest booking submission endpoint is retired; `/bookings` now directs visitors to the course catalogue, while historical booking records remain available to administrators.

Payment-proof uploads are limited to JPEG, PNG, and WebP files whose file signatures match their declared image type. Staff must verify the control number and exact TSh 5,000 amount in the official payment system, then enter the transaction reference; the server rejects other amounts and prevents a reference from being reused. This is a manual reconciliation safeguard, not automatic payment-provider verification.

Custom admin-area access is stored on each `Role.permissions` field. Deploy the `20261014000000_role_permissions` Prisma migration before using custom roles and permissions.

## Security and production deployment

The API applies Helmet security headers, restricts browser CORS to the exact origin or comma-separated origins in `CLIENT_URL`, caps JSON request bodies at 256 KB, validates contact-message lengths, and rate-limits authentication and contact submissions by client IP. Authentication attempts are limited to 10 per 15 minutes and contact submissions to 5 per 15 minutes. These rate limits use the process-local memory store; deployments with multiple API replicas must configure a shared rate-limit store at the hosting layer.

For production, set `NODE_ENV=production`, use a unique random `JWT_SECRET` of at least 32 characters, set `JWT_EXPIRES_IN` to no more than 12 hours, set `CLIENT_URL` to HTTPS frontend origins, and use `BCRYPT_ROUNDS` from 10 through 14. `SESSION_COOKIE_SAME_SITE=lax` is the default; use `none` only for a frontend and API on different sites, over HTTPS. Build the frontend with `VITE_API_BASE_URL` set to the HTTPS API base URL (including `/api`), or route `/api` and `/uploads` through the same-origin reverse proxy. Configure the frontend host or trusted reverse proxy to apply HTTPS, HSTS, and a site-appropriate Content Security Policy; Helmet headers on the API do not configure headers on a separately hosted frontend. Terminate HTTPS at a trusted reverse proxy and configure that proxy to forward traffic securely; the Express process does not terminate TLS. Keep `.env`, database credentials, uploaded payment proofs, and database backups private, and do not expose the payment-proof directory through static hosting.

The browser authenticates with an HttpOnly session cookie; authentication tokens are not returned to JavaScript or stored in local storage. Existing local-storage sessions are removed, so users must sign in again after deployment. Production cookies use the `__Host-` prefix, `Secure`, `HttpOnly`, and `SameSite=Lax` by default. All API write requests require a signed double-submit CSRF token and an allowed request origin. The frontend sends cookies with API requests, and the API enables credentialed CORS only for the exact `CLIENT_URL` origins. Use a same-origin `/api` reverse proxy when possible. If the frontend and API are on different sites, set `SESSION_COOKIE_SAME_SITE=none` and use HTTPS for both; browsers may block third-party cookies, so a same-origin proxy is more reliable. Logging out clears the browser cookie; signed sessions remain valid only until `JWT_EXPIRES_IN` and inactive users are rejected on each authenticated request. Continue to prevent cross-site scripting: HttpOnly cookies stop scripts from reading the session token, but do not prevent an injected script from making requests as the signed-in user.

## Public website information and compliance setup

The database seed uses public information listed by VETA on its [official website](https://www.veta.go.tz/): head-office phone `+255 26 2963661`, email `info@veta.go.tz`, address `12 VETA Road, 41104 Tambukareli, Dodoma`, postal address `P.O. BOX 802, Dodoma Tanzania`, and the e-Mrejesho link `https://emrejesho.gov.go.tz`. These seeded values can be reviewed or updated under **Admin → Site settings**.

Before publishing, an authorized administrator must verify those details and add any missing approved information under **Admin → Site settings**:

- `site.contactPhone`, `site.contactEmail`, and `site.officeHours` (8:00 AM - 3:30 PM, Monday to Friday)
- `site.physicalAddress`, `site.postalAddress`, and `site.mapUrl` (use an HTTPS map link)
- `site.feedbackUrl` (the institution's official HTTPS e-Mrejesho URL)
- `legal.privacy`, `legal.terms`, `legal.disclaimer`, and `legal.copyright` (institution-approved text; use blank lines between paragraphs)

The VETA website publishes the listed contact details and e-Mrejesho link, but does not publish office hours, a VETA Kipawa visitor map, or the legal text required above. The office hours shown here are 8:00 AM - 3:30 PM, Monday to Friday. The seed also supplies a Google Maps search for the published VETA Head Office address, plus draft privacy, terms, disclaimer, and copyright text. These legal texts are placeholders, not institution-approved policies or verified Kipawa visitor directions. Contact and policy pages visibly label the content as draft, and the admin dashboard lists draft values that still require review.

Authorized VETA management and legal/ICT officers must verify the office hours, map destination, and draft legal wording (including approved Kiswahili and English versions) before publication. After replacing draft placeholders with approved content in **Admin → Site settings**, set `publicInfo.reviewStatus` to `APPROVED`. The seed fills these draft settings only when they are blank, so it preserves existing non-empty approved values when run again. The site defaults to Kiswahili for first-time visitors and remembers a visitor's explicit language selection.

Application source does not establish that the live service uses a government-approved domain or hosting facility, HTTPS, tested backups, or formal accessibility/browser testing. The institution's ICT team must verify those operational requirements and arrange an official e-GA assessment.

## Notes

This implementation is intended for an officially authorized VETA site, as confirmed by the project owner. Verify deployment branding, institutional authorization, and all public information with VETA before publishing.
