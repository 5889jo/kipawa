# Architecture and design plan

## Design direction

The website adopts a professional government/public-sector aesthetic using a white and blue palette, strong grid spacing, informational cards, and orderly typography. Public navigation focuses on Home, About Us, Courses and Programmes, News, Publications, and Contact. Course discovery separates upcoming and ongoing short courses from the full catalogue, provides quick interest links, and lets administrators assign courses to fixed subject categories.

## Page architecture

- Public landing page with hero, quick links, programme highlights, and latest news
- Course detail pages with course information and interest forms; VETA Kipawa ICT Centre is the single training location
- Course-interest guidance that directs prospective learners to contact the centre about schedules and availability
- News archive and publication files
- Contact and enquiry form
- Admin dashboard for user and role management, courses, news, enquiries, bookings, applications, inquiries, publications, organization profiles, and site settings

## Data model summary

- PostgreSQL is accessed by the Express API through Prisma; the frontend does not connect directly to the database.
- `User`, `Role`, and `UserRole` store accounts and role-based access. A user's email and phone are their canonical contact details; phone numbers may be shared and are verified by staff before issuing a course-payment control number. Changing a phone clears its verification timestamp. `Role.permissions` grants scoped access to admin areas; the reserved Admin role retains full access.
- `ApplicantProfile` stores details beyond a user's account information.
- `Region`, `District`, `TrainingCentre`, and `CentreCourse` remain in the database for existing location records and compatibility; the public website uses VETA Kipawa ICT Centre as its single training location.
- `Course` stores course offerings and references `CourseCategory` through a database-enforced category code; category options are loaded from PostgreSQL for course administration. A unique database index prevents duplicate course names within the same course type and category. Optional public listing windows control short-course visibility. `CourseMedia` stores an ordered, relational gallery of administrator-uploaded images and videos for each course; deleting a course also removes its gallery and centre links while retaining historical course-interest and publication records without a course link.
- `Booking` retains legacy booking records and their contact/course snapshots.
- `CourseInterest` links registered course requests to both `User` and `Course`. Registered requests use those related rows for current name, email, phone, course title, and course type rather than copying them into each request. Nullable snapshot columns remain for older guest enquiries and the applicant's formal name; database uniqueness permits only one active request per user.
- `CourseInterest` stores optional UTM source, medium, and campaign labels for tagged short-course request links. The latest valid labels are captured per browser tab session and included in the administrator enquiries export so staff can compare application and payment outcomes across campaigns. This records attribution only when a request is submitted; it does not count page views or external VET-MIS applications.
- `Review` stores public course feedback.
- `ContactInquiry` stores public contact form submissions. Self-registered accounts have no role or admin permissions and are limited to news interactions; administrators can assign managed roles. Online application submission is disabled.
- `NewsArticle` provides database-backed public news; `Publication` stores PDF download links and an optional related `Course` relationship; `SiteSetting` stores editable website content; `AuditLog` provides supporting audit records.
- `OrganizationMember` stores staff profiles and a self-referencing manager relationship for the About page's top-to-bottom organization chart. Authorized administrators manage profile details, Kiswahili translations, reporting order, publication status, and uploaded photos through the `organizationStructure` permission.
- `Partner` stores approved organization profiles, optional Kiswahili descriptions and website links, display order, publication status, and uploaded logos. The About page shows only published partners; authorized administrators manage records and JPEG, PNG, or WebP logos through the `partners` permission.
- `LearnerNotification` records centre updates to a learner's course request, with per-user read timestamps. The learner dashboard bell displays the unread count and lets the learner mark updates as read.
- `WebsiteDailyVisitor` stores one SHA-256 hash per random browser token and Dar es Salaam calendar day, while `WebsiteDailyVisitorCount` maintains the daily aggregate. It does not store IP addresses or raw visitor tokens. The homepage displays the resulting daily-unique browser visits alongside relational counts of short courses, long courses, active students with linked course interests, and published organization members.

The API health endpoint checks the database connection. Accounts, organization profiles, partner profiles, learner notifications, course-interest enquiries, contact inquiries, bookings, courses, training centres, news, publications, website visitor counts, and editable site settings are read or written through Prisma rather than process-local arrays. Visitor totals are approximate daily unique browser counts, not a count of distinct people; the browser token rotates daily and the database stores only its hash. The API enforces authorization server-side for each admin area. Full administrators can create roles and assign permissions; user managers may only assign roles whose permissions are within their own access. Custom roles cannot grant administrator access, and the reserved Admin role cannot be changed or removed. The dashboard prioritizes course, news, PDF publication, short-course enquiry, and booking workflows. Short courses use actual start and optional end dates to distinguish upcoming and ongoing schedules; these are independent of required public listing visibility dates. The API hides courses outside the public listing window and rejects enquiry or booking submissions while they are unavailable. Registered course enquiries require staff to call and verify the learner's phone before issuing a payment control number. The website records that staff confirmation but does not place calls. Short-course enquiries are tracked in PostgreSQL through new, contacted, form-fee-verified, course-fee-verified, and start-date-sent stages; payment verification and start-date timestamps are persisted. Staff updates create learner notifications transactionally with their course request updates; notifications are scoped to the learner and track when they are read. The backend also sends an Africa's Talking SMS after each staff update when configured; SMS failures or missing configuration are reported to staff without undoing the saved update. Payments and learner calls remain outside the website. The enquiries report exports contact details and these follow-up milestones as an Excel-compatible CSV. Admins can upload course, news, and payment images up to 5 MB each; up to 10 course-gallery files can be added per upload, with MP4/WebM videos up to 50 MB each. Organization profile photos can be up to 10 MB, partner logos up to 5 MB, and PDFs up to 20 MB. Partner logos are limited to JPEG, PNG, or WebP. File uploads are stored by the backend and managed records retain their download paths.

The relational review keeps registered learner identity and course selection authoritative in their related records; historical guest requests keep nullable snapshots for compatibility. `Application` and `ContactInquiry` remain standalone records because their current workflows accept public/offline contact details without requiring an account. The Supabase SQL file is a historical schema snapshot; the active application schema is `prisma/schema.prisma`.

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
