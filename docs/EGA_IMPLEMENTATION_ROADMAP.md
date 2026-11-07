# e-GA Compliance Implementation Roadmap

**Project:** VETA Kipawa ICT Centre website  
**Prepared:** 1 November 2026  
**Scope:** Recommendations only. This file does not authorize or implement application changes.

Priorities are ordered to prevent relying on a site that has no confirmed API/database host, to close legal/security risks, and then to address core institutional presentation, accessibility, discoverability, and operational evidence. Complexity estimates cover implementation effort, not approval/hosting lead time.

## Phase 1 — Critical security and mandatory compliance issues

| Priority | Task | Acceptance evidence | Complexity |
|---|---|---|---|
| P0 | Obtain the official e-GA eGA/EXT/APA/009 v2.0 PDF and checklist pages 22–24; reconcile each exact checklist question with the audit matrix | Authorized copy, page-referenced checklist crosswalk, signed institutional/e-GA review | Low |
| P0 | Confirm domain ownership, approved naming/extension, renewal control, canonical hostname, and e-GA approval | Registrar evidence, institutional authorization, renewal owner/calendar, tested `www`/apex redirects | Medium |
| P0 | Confirm compatible approved hosting: Node.js 22+ with Passenger (or approved runtime), PostgreSQL, HTTPS, API/upload routing, and adequate resources | Written host/e-GA confirmation; production topology and TLS evidence; API `/api/health` reports database connected | High |
| P0 | Deploy backend and database separately from the public document root; keep payment proofs private and configure least-privilege DB credentials | Deployment review, private storage verification, successful auth/API smoke tests with no secrets exposed | High |
| P0 | Approve the privacy policy and map it to every real data flow, including accounts, enquiries, course requests, payment screenshots, analytics/visitor token, cookies, external services, retention, rights and contact route | Signed policy, data inventory/retention schedule, policy visibly published and reviewed | High |
| P0 | Approve Terms, Disclaimer, and Copyright wording and expose all legal pages globally | Authorized content approval; every legal route reachable from footer on desktop/mobile | Medium |
| P1 | Establish production security baseline: admin MFA, privileged password requirements, access reviews, dependency checks, log monitoring/retention, incident response, and secure upload verification | Security configuration/test evidence; access-control tests; dependency scan and remediation record; incident-response owner | High |
| P1 | Implement secured backups for source, PostgreSQL, uploads, and configuration without committing secrets; define retention/RPO/RTO and test restore | Scheduled off-site encrypted backup jobs, access controls, latest successful backup report, restore-test record | High |

## Phase 2 — Core government website features

| Priority | Task | Acceptance evidence | Complexity |
|---|---|---|---|
| P1 | Implement the official government/institution masthead and approved logo placement, linking, alternate text, size, and non-animated behavior | Approved design review and accessibility check on every route | Medium |
| P1 | Add global footer links to Privacy, Terms, Disclaimer, Copyright, and Sitemap | Automated route/link check confirms availability from every page | Low |
| P1 | Update the Sitemap page with a descriptive title and every applicable public route; keep it synchronized with the route/content registry | Route-to-sitemap test; dynamic content policy agreed; Home/current page behavior verified | Medium |
| P1 | Make Search submission work through Enter and the Search button; define supported content scope, query normalization, empty/error states, and accessibility announcements | Unit/integration tests for Enter/button, common terms, result relevance, API failures, and keyboard navigation | Medium |
| P2 | Add approved publication categories (reports, speeches, statistics, acts, regulations, tenders, budgets), and define publication archive/review lifecycle | Schema/admin UI/API/category migration plan approved; category and archive CRUD tests | High |
| P2 | Confirm official contact details, fax applicability, e-Mrejesho destination, social profile URLs, enquiry ownership and staff response workflow | Authorized contact sheet; successful test inquiry reaches the responsible queue; no fabricated details | Medium |
| P2 | Add content review date/owner and approval workflow for public pages, news, statistics, and legal text | Public date display and admin workflow tests; signed review schedule | Medium |

## Phase 3 — Accessibility, WCAG 2.1, and responsive improvements

| Priority | Task | Acceptance evidence | Complexity |
|---|---|---|---|
| P1 | Add skip-to-main link and verify all interactive controls have names, labels, focus order, visible focus, and appropriate announcements | Keyboard-only walkthrough and screen-reader testing on Home, Contact, courses, news, and admin sign-in | Medium |
| P1 | Fix contact and other form success/error announcements and associate field errors with controls | Automated accessibility scan plus keyboard/screen-reader test for invalid, pending, and success states | Medium |
| P1 | Audit color contrast, text zoom/reflow, and focus visibility against WCAG 2.1 AA | Contrast report and screenshots/results at 200% and 400% zoom with no loss of essential content | Medium |
| P2 | Add user text-size adjustment if required by the authoritative checklist; ensure it composes with browser zoom | Approved requirements decision and tests at each size setting | Medium |
| P1 | Remove nonessential auto-motion or provide persistent pause/stop controls; verify all motion honors reduced-motion preference | Motion inventory; reduced-motion and pause-control tests across tickers, announcements, and carousel/hero elements | Medium |
| P2 | Perform image-by-image alt-text review and verify headings/landmarks/table semantics | Automated inventory plus human review in Kiswahili and English | Medium |
| P2 | Test responsive layout on representative phones, tablets, desktop sizes, landscape orientation, touch and keyboard | Documented viewport/browser matrix; no clipping/overlap; all actions reachable | Medium |

## Phase 4 — Content management, SEO, and discoverability

| Priority | Task | Acceptance evidence | Complexity |
|---|---|---|---|
| P1 | Create a full indexable sitemap.xml and an intentional robots.txt; add canonical URL rules for the chosen hostname | Search-console or crawler validation; no duplicate host/path indexing | Medium |
| P2 | Provide route-specific title, description, social metadata, and structured content for public routes and dynamic course/news pages | Crawl output contains unique metadata for every public URL, including direct refresh/deep links | High |
| P2 | Decide which static pages need CMS-managed content and implement authorized create/edit/publish/archive workflows | Role-scoped CRUD tests, publication approval and rollback/history evidence | High |
| P1 | Complete bilingual content and prevent silent language gaps for required public information | Translation inventory, editor sign-off, automated check for missing required Kiswahili/English values | Medium |
| P2 | Validate publication, news and course records for accuracy, readability, accessibility, and institutional approval | Editorial checklist and signed review of all currently published records | Medium |
| P3 | Replace generic external social URLs and validate all external links | Link crawl and institution-approved profile list | Low |

## Phase 5 — Hosting, backup, documentation, and final testing

| Priority | Task | Acceptance evidence | Complexity |
|---|---|---|---|
| P0 | Complete a production deployment rehearsal without using live personal data; verify direct SPA refresh, API routing, uploads, authentication, and DB health | Repeatable deployment record, redacted logs, successful smoke-test report | High |
| P1 | Document database schema/data dictionary, environment/configuration ownership, deployment/rollback, migrations, data retention, maintenance, backup, restore, monitoring, and incident response | Reviewed operational runbooks with named owners and recovery steps | Medium |
| P1 | Verify hosting SLA, government approval, bandwidth/CPU/RAM, support, uptime monitoring, server logs, TLS, backups and data residency/transfer obligations | Provider evidence pack and institutional/e-GA approval | High |
| P1 | Run a cross-browser test matrix: Chrome, Firefox, Edge, Safari, Opera; desktop, mobile, tablet | Dated results for supported versions and documented defects/fixes | Medium |
| P1 | Run end-to-end flows for contact enquiry, course browse/request, news/publications, authentication, role boundaries, admin updates, uploads and language switching | Staging tests against a non-production DB; no unintended records/data exposure | High |
| P1 | Complete security and accessibility testing in an authorized staging environment | Approved security assessment, remediation evidence, WCAG 2.1 AA test results, no open critical/high blockers | High |
| P0 | Obtain final institutional content, legal, hosting and e-GA sign-off; re-audit against the official checklist | Signed checklist with evidence links and accepted residual risks | Medium |

## Suggested release gates

Do not announce compliance or rely on production workflows until all of these are true:

1. The authoritative checklist has been used verbatim and every question has evidence.
2. The domain, hosting provider, API, database, TLS, DNS, and `www` behavior are confirmed.
3. Legal/privacy content and contact information have named institutional approval.
4. No critical/high privacy, security, accessibility, backup, or mandatory presentation gap remains open.
5. Backup restoration, cross-browser flows, and end-to-end workflows have been tested on staging and recorded.
6. The final compliance matrix is updated from actual test evidence, with all remaining `NOT VERIFIED` items resolved or formally accepted by the responsible authority.
