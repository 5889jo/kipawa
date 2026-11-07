# e-GA Public-Institution Website Compliance Audit

**Institution/site:** VETA Kipawa ICT Centre  
**Audit date:** 1 November 2026  
**Assessment basis:** Read-only review of the current repository working tree against the requirement list in the supplied audit brief, which identifies e-GA document **eGA/EXT/APA/009, Version 2.0, July 2022**.  
**Companion reports:** [Detailed compliance matrix](./EGA_COMPLIANCE_MATRIX.md) and [implementation roadmap](./EGA_IMPLEMENTATION_ROADMAP.md).

## 1. Executive summary

### Overall assessment

**The project is not ready to be declared compliant with the e-GA website standards.** It has a substantial React/Express/PostgreSQL application, public and administrative routes, Kiswahili-first language handling, content-management endpoints, role-based authorization, CSRF protection, security headers, and responsive styles. However, important requirements are missing or incomplete, and several critical operational claims cannot be verified from source code.

The most significant blockers are:

1. **Production hosting and data services are not confirmed.** The user reports that the current DUHosting cPanel does not show Node.js or PostgreSQL options. The hosting provider requested a domain/service ID before confirming eligibility. The frontend uploaded to `public_html` alone does not run the Express API or supply the PostgreSQL data required by account, course, news, booking, and administration features.
2. **Required institutional presentation and global information access are incomplete.** The shared header does not render the government/institution logo lockup, the sitemap is not linked in the global footer, and the footer omits Terms, Disclaimer, and Copyright links.
3. **Legal/privacy content is not publication-ready.** Seeded terms, disclaimer, and copyright are identified as drafts; the privacy text is also awaiting approval but the privacy page does not display the shared pending-approval warning.
4. **Accessibility, search, SEO, and content lifecycle gaps remain.** Search submit/Enter are no-ops; some text moves automatically; no skip link or font-size control was found; no `robots.txt`, XML sitemap, or canonical URLs were found; public pages do not show review dates; and publishing/archiving is incomplete.
5. **No production, browser, assistive-technology, hosting, database-content, or cross-device tests were possible.** Do not interpret source presence as verified production behavior.

### Checkpoint totals and score

| Status | Count |
|---|---:|
| COMPLIANT | 5 |
| PARTIALLY COMPLIANT | 51 |
| NOT IMPLEMENTED | 10 |
| NOT VERIFIED | 9 |
| NOT APPLICABLE | 0 |
| **Total matrix checkpoints** | **75** |

**Verified-applicable implementation percentage:**  
`COMPLIANT ÷ (COMPLIANT + PARTIALLY COMPLIANT + NOT IMPLEMENTED) × 100`  
`5 ÷ (5 + 51 + 10) × 100 = 7.6%`

This is a checkpoint-based **fully-compliant-only** percentage, not an official e-GA certification score. Partially compliant and missing items are counted as verified applicable checkpoints that do not yet meet the requirement. The 9 not-verified checkpoints and 0 not-applicable checkpoints are excluded. The official document’s exact pages 22–24 checklist wording was not available, so the 75 checkpoint denominator reflects the requirements supplied in the audit brief, not an independently confirmed official e-GA scoring rubric.

## 2. Scope, method, and limits

### Inspected

- React/Vite frontend routes, shared shell, navigation, search, language, forms, legal pages, sitemap, styles, SEO metadata, and public assets.
- Express API handlers, auth/session/CSRF/CORS/security middleware, upload handling, administrative authorization and audit logging.
- Prisma/PostgreSQL schema and the seed content relevant to public information and contact settings.
- Architecture and cPanel deployment documentation.
- Existing backend unit tests were run locally: **5 test files, 20 tests passed**.

### Not tested or independently confirmed

- The complete official e-GA PDF and verbatim checklist questions on pages 22–24 were not attached or confirmed. The [e-GA public website](https://www.ega.go.tz/) was reachable, but the specified standard was not found there during this audit. The supplied brief is therefore the detailed requirement source used for this assessment; formal certification requires reconciliation against the official document.
- No production URL/domain, DNS/registrar access, cPanel account, PostgreSQL connection, or approved hosting evidence was available. No live database was opened, queried, migrated, or modified.
- No contact form was submitted to a production service. No uploads, authentication attempts, admin actions, or other tests that could change data were made.
- No Chrome, Firefox, Edge, Safari, or Opera sessions; phone/tablet viewport runs; screen-reader testing; contrast scanner; WCAG checker; penetration test; dependency vulnerability scan; or hosting/network assessment was performed.
- The audit evaluates the current repository working tree. Git showed pre-existing unrelated changes and deletions before this audit; no application files were changed by this audit.

## 3. What is implemented

- **A React application with route coverage** for Home, About, Labs, Team, long/short courses, course detail, news/detail, publications, Contact, FAQ, Sitemap, and legal pages (`frontend/src/App.tsx:1541-1602`).
- **Kiswahili-first language selection** with English switching, persisted preference, and document `lang` updates (`frontend/src/LanguageProvider.tsx:1-23`; `frontend/index.html:2`).
- **Shared navigation, search component, breadcrumbs, and footer** in the application shell (`frontend/src/App.tsx:788-970`, `1350-1708`).
- **Contact information and form handling**: seeded contact phone/email/address/map settings (`backend/prisma/seed.ts:793-800`), labelled fields, API request, and success/error paths (`frontend/src/App.tsx:4752-4930`). The API validates basic input, rate-limits submissions, and stores them as `ContactInquiry` rows (`backend/src/index.ts:1979-2007`; `prisma/schema.prisma:261-269`).
- **About content** with institutional introduction, mission/purpose, vision/aspiration, and organization-profile structures (`frontend/src/App.tsx:2549-2990`).
- **CMS/API building blocks** for courses, news, publications, roles/users, site settings, organization profiles, partners, enquiries, and uploads (`backend/src/index.ts:2056-4234`; `prisma/schema.prisma`).
- **Authentication and authorization controls** including bcrypt password hashing, signed JWT session cookies, user status checks, permission checks for admin routes, CSRF validation, CORS allow-listing, API rate limits, Helmet, and admin write audit logs (`backend/src/index.ts:86-160`, `760-846`, `1003-1102`, `2030-2054`).
- **Responsive CSS and reduced-motion provisions** across multiple components, plus visible focus styles and a visited-link style (`frontend/src/App.css:687-693`, `11854-11862`).
- **Baseline SEO metadata and EducationalOrganization JSON-LD** in the static HTML (`frontend/index.html:7-28`).
- **Architecture and deployment instructions** for Node.js/Passenger, PostgreSQL, uploads, environment settings, migrations, deployment, and backup reminders (`docs/architecture.md`; `docs/cpanel-deployment.md`).

## 4. Missing features and requirements

### Frontend and global information

- A government/institution logo masthead in the shared header, with required placement, links, alt text, and non-animated behavior.
- A persistent Sitemap link and footer links for Terms, Disclaimer, and Copyright. The shared footer currently includes Privacy but not the complete required set.
- A descriptive `<h1>` on the Sitemap page; the page currently renders only its link list.
- Search submission behavior: the form prevents default and neither Enter nor the Search button executes a distinct search action. Search results are only filtered while typing.
- A skip-to-main-content link and an in-site text-size adjustment control.
- Public content review/last-modified dates.
- A complete, standardized publication category taxonomy for reports, speeches, statistics, acts, regulations, tenders, and budgets.
- Content archive lifecycle for older publications/news and general CMS-managed static pages.
- Consistent approved institutional/social URLs; several social icons currently point to generic platform homepages.

### Backend/database

- No general page-content model/workflow was found for creating and managing all public pages.
- Publication categories and archive status are absent from the `Publication` model.
- No evidence of a complete notification/monitoring path for production contact enquiries; API persistence exists, but operational staff receipt/review is unverified.
- No live database records were inspected; seed records are not proof of production data accuracy or approval.
- No file-signature verification, malware scanning, or tested upload-security procedure was evidenced. Upload allowlists rely on MIME declarations and size limits.

### Accessibility

- No skip link or font-size adjustment control.
- Contact-form feedback text has no explicit live-region role, and full error-to-field associations were not evidenced.
- Automated and manual WCAG 2.1 testing is outstanding; contrast, zoom/reflow, screen-reader use, and keyboard completion have not been verified.
- Automatic ticker/marquee and animated indicators remain in the interface. Some components pause on focus/hover or honor reduced-motion preferences, but a persistent user-controlled pause/stop facility was not evidenced for all motion.

### Security and privacy

- No multi-factor authentication or sufficiently strict admin-specific password policy was evidenced. Public registration permits passwords from 8 bytes; bcrypt and a configurable work factor are used.
- No production security monitoring/alerting, incident response, data-retention schedule, database-at-rest encryption evidence, or encrypted/offsite backup evidence was available.
- Privacy text does not yet describe all actual collection, cookies, transmission, sharing, retention, rights, and security details. Its seed explicitly says review is required.
- Dependency vulnerability scanning and server/network security verification remain unperformed.

### SEO, hosting, and operations

- No `robots.txt`, XML `sitemap.xml`, or canonical URL was found in the frontend public assets.
- Per-route title changes happen client-side; static HTML metadata is generic and is not server-rendered per route.
- Domain ownership, approved extension, renewal, apex/`www` behavior, e-GA hosting approval, TLS certificates, uptime, CPU/RAM/bandwidth, support, server logging, and uptime monitoring are unverified.
- The current DUHosting plan has not been confirmed to provide Node.js 22+/Passenger and PostgreSQL. The user reports those controls are not visible in cPanel; provider confirmation is pending domain/service ID.
- Backup instructions are advisory only; automated source/database/upload backups, schedule, offsite/offline copy, retention controls, and successful restore evidence are absent.

## 5. Partially implemented features

| Area | Evidence and incomplete behavior |
|---|---|
| Search | The shared header builds results from static aliases and loaded courses/news/publications. It does not execute on form submit/Enter, and it does not index all static page body content. Runtime relevance is not tested. |
| Sitemap/navigation | The page and route exist, but the hard-coded list omits current routes/content and is not exposed as a persistent footer link. It has no page heading. |
| Language | Swahili is the first-visit default and the preference persists. Translation lookup falls back to the source string; optional Swahili database fields mean complete translations and editorial accuracy are not assured. |
| Contact | Required fields, API validation, persistence, map, and rate limiting exist. Fax applicability, current contact accuracy, staff workflow, live submission, and accessible status announcement are unverified. |
| Legal pages | Routes and seeded content exist. Terms/disclaimer/copyright are drafts. Privacy is draft-like but the UI exempts it from the warning shown for other pending legal information. |
| CMS | Admin APIs manage several content types and uploads. Static information pages, publication category taxonomy, complete archive/review workflow, and bilingual completeness enforcement are missing. |
| Accessibility | Semantic landmarks, labels, focus styles, visited-link styling, and reduced-motion rules exist. Missing skip link/font control and untested WCAG criteria prevent a compliance claim. |
| SEO | Static metadata and JSON-LD exist; per-route metadata, canonical URLs, XML sitemap, robots policy, and crawler behavior are absent/unverified. |
| Security | Strong baseline controls are implemented in code. Production host/database settings, MFA, dependency scan, file content scanning, monitoring, and recovery posture remain unverified or incomplete. |
| Backup/deployment | Deployment guide documents a possible Node/PostgreSQL cPanel setup and advises backups. The current host plan is unconfirmed and no operational backup/restore proof exists. |

## 6. Security and accessibility findings

| Finding | Severity | Evidence | Audit conclusion and recommendation |
|---|---|---|---|
| Production backend/database are not confirmed available on current hosting | CRITICAL | `docs/cpanel-deployment.md`; user-provided DUHosting support correspondence | A static frontend alone cannot deliver the database/API-dependent service. Obtain compatible approved hosting and verify TLS, routing, database, and live health before publication. |
| Privacy policy is not approved and its pending state is hidden | HIGH | `backend/prisma/seed.ts:802`; `frontend/src/App.tsx:1044-1050` | The content defers material policy decisions, while UI suppresses the warning for Privacy. Obtain institutional/legal approval and make pending status explicit. |
| Required footer legal/sitemap links are missing | HIGH | `frontend/src/App.tsx:1620-1700` | Add persistent links to Privacy, Terms, Disclaimer, Copyright, and Sitemap. |
| Search submit is nonfunctional | HIGH | `frontend/src/App.tsx:858-881` | Implement submit/Enter behavior or remove false submit affordance and test with keyboard and assistive technology. |
| Admin MFA/password assurance is incomplete | HIGH | `backend/src/index.ts:1525-1544`, `2425-2457` | bcrypt and throttling are positive controls, but 8-byte minimum and no MFA are not sufficient evidence for privileged-access assurance. Apply an approved admin policy and MFA. |
| Automated text movement remains | MEDIUM | `frontend/src/App.css:6005-6034`, `7690-7705`, `8006-8020` | Reduced-motion handling/pause-on-focus is present for some tickers, but persistent pause/stop and complete coverage need verification. |
| Skip link and user font-size adjustment are absent | MEDIUM | Shared shell `frontend/src/App.tsx:1538-1540`; no adjustment control found | Add bypass navigation; determine and implement any applicable e-GA text-sizing control. |
| Contact form status is not explicitly announced | MEDIUM | `frontend/src/App.tsx:4910-4930` | Add status/alert semantics and test focus/field error association. |
| Uploaded file content is trusted based on MIME declaration | MEDIUM | Upload middleware `backend/src/index.ts:236-535` | Keep current size/type allowlists; add file-signature checks and scanning or document an equivalent host control. |
| CSP/headers and storage protections are not verified on the live host | HIGH | `frontend/index.html:19`; `frontend/public/.htaccess`; `backend/src/index.ts:1028-1102` | Capture deployed response headers, TLS and CORS behavior; reduce broad external-source allowances where feasible. |
| No production monitoring/backup/incident-response evidence | HIGH | `docs/cpanel-deployment.md`; no operational configuration found | Establish monitored logs/alerts, retention, backup/recovery, escalation and incident-response procedures. |
| WCAG contrast, zoom, keyboard, and screen-reader status unknown | HIGH | CSS/component source only; no test artifacts | Run automated checks plus manual WCAG 2.1 AA testing on representative routes and forms. |

These are compliance findings from source/evidence review, not a penetration test or a claim that a vulnerability was exploited.

## 7. Validation performed

- Backend unit suite: **5 test files passed; 20 tests passed** (`backend/package.json` test script, `vitest run src`).
- Source inspection confirms the frontend build had passed during the immediately preceding image/layout work; no build was run for this documentation-only audit.
- No production requests, database operations, migrations, package installations, environment changes, or application source modifications were made for this audit.

## 8. Roadmap and final answer

See [EGA_IMPLEMENTATION_ROADMAP.md](./EGA_IMPLEMENTATION_ROADMAP.md) for prioritized work and complexity.

### What is already implemented?

The application has a functioning architecture in source for a public website and admin CMS; core routes; Swahili-first language switching; contact data/form; About content; search-result UI; a sitemap route; legal-page routes; publication/news/course content; PostgreSQL persistence; authentication, permissions, CSRF/CORS/rate-limiting/security headers; responsive styling; and technical/deployment documentation.

### What is partially implemented?

Search submission, sitemap completeness/discoverability, legal/privacy content, footer links, institutional branding, publication categories/archive, CMS scope, translations, accessibility, SEO, and backup/deployment guidance are incomplete or not verified in live use.

### What has not been implemented?

The matrix identifies 10 missing checkpoints, including the header logo masthead, Search submit/Enter action, persistent sitemap access, full legal footer links, skip link, font-size control, and verified backup/recovery procedure.

### What must be done before the site can be considered compliant?

At minimum: obtain and reconcile the official e-GA PDF/checklist; secure written domain and e-GA-approved hosting confirmation; deploy the Node.js API and PostgreSQL on a compatible HTTPS host; finish and approve privacy/legal content; implement the missing branding, footer, sitemap, and search behavior; complete publication/editorial workflows; remediate and test accessibility; add crawler metadata/sitemap; establish monitored off-site backups and a tested restore; and complete cross-browser, device, security, and end-to-end testing with documented evidence. Until these are complete, compliance must be described as **not established**.
