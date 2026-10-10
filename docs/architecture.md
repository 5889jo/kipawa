# Architecture and design plan

## Design direction

The website adopts a professional government/public-sector aesthetic using a white and blue palette, strong grid spacing, informational cards, and orderly typography. Navigation mirrors the public institutional flow: Home, About Us, Training Centres, Courses and Programmes, Admissions, News, Publications, and Contact.

## Page architecture

- Public landing page with hero, quick links, programme highlights, centre directory preview, and latest news
- Detail pages for centres and courses
- Admissions page and application form
- News archive and publication files
- Contact and enquiry form
- Admin dashboard with management tables and audit activities

## Data model summary

- PostgreSQL is accessed by the Express API through Prisma; the frontend does not connect directly to the database.
- `User`, `Role`, and `UserRole` store accounts and role-based access.
- `ApplicantProfile` stores details beyond a user's account information.
- `Region`, `District`, and `TrainingCentre` model training centre locations.
- `Course` and `CentreCourse` model course offerings at centres.
- `Booking` stores authenticated users' course requests.
- `Review` stores public course feedback.
- `Application` and `ContactInquiry` store public form submissions.
- `NewsArticle` and `TrainingCentre` provide database-backed public listings; `Publication` and `SiteSetting` store download links and editable website content; `AuditLog` provides supporting audit records.

The API health endpoint checks the database connection. Accounts, applications, contact inquiries, bookings, reviews, courses, training centres, news, publications, and editable site settings are read or written through Prisma rather than process-local arrays. Admin-only APIs enforce administrator authorization for management operations. The admin dashboard includes recent records and CRUD controls for user accounts, catalogue/content, submissions, publications, and site settings.

## Security notes

- Passwords are hashed with bcrypt.
- JWTs are used for secure access tokens.
- Protected routes enforce authorization checks server-side.
- Public submissions are rate limited to reduce abuse.
- File validation and environment-based configuration reduce operational risk.

## Implementation phases

1. Foundation and documentation
2. Database schema and seed plan
3. REST API and security controls
4. Public website pages and filtering
5. Applicant workflow and admin dashboard
6. Validation, testing, and deployment documentation
