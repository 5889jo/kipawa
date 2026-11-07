# cPanel deployment

This project is a static React site plus a Node.js/Express API and a PostgreSQL
database. The API is required for sign-in, course and news data, applications,
bookings, administration, and uploads. A cPanel account that only supports PHP
or MySQL cannot host the complete application; confirm Node.js Passenger and
PostgreSQL support with the hosting provider first.

## 1. Prepare hosting

1. In cPanel, create a PostgreSQL database and user, and grant the user access.
   Use the provider's full PostgreSQL connection string and URL-encode reserved
   characters in its username or password. This app does not use MySQL.
2. Decide the public website URL (for example `https://example.com`) and an API
   URL (for example `https://api.example.com`). Use HTTPS on both. The public
   website origin is also used to generate canonical URLs and `sitemap.xml`.
3. If the provider supports a same-origin reverse proxy for both `/api` and
   `/uploads`, prefer it and use the default `/api` setting below. Otherwise,
   use an API subdomain and the full API URL. The public domain's web-server
   configuration must forward `/api` and `/uploads` to the Node application;
   the frontend `.htaccess` only handles HTTPS and React routes and cannot
   start or proxy to Passenger by itself.

Before deploying the frontend, verify that
`https://<site-host>/api/health` returns JSON with
`"database":"connected"`. A response containing the website's `index.html`,
even with HTTP 200, means the request is falling through to the static frontend
and the API is not connected. For an API subdomain, check
`https://<api-host>/api/health` instead, and ensure the API host also serves
`/uploads`.

### Current `kict.makachuzanzibar.co.tz` diagnosis

The public website is reachable, and the hosting account has a running Node
application and PostgreSQL database, but API routing has not been configured.
At present, requests to
`https://kict.makachuzanzibar.co.tz/api/health` return the frontend HTML with
HTTP 200 rather than the backend's JSON health response. The database therefore
cannot be reached by the live frontend yet.

Ask the hosting provider to either:

- route `/api` and `/uploads` on `kict.makachuzanzibar.co.tz` to the Passenger
  app; or
- provision an API subdomain, such as `api.kict.makachuzanzibar.co.tz`, with
  HTTPS and point it to the Passenger app.

For the API-subdomain option, first confirm that the chosen API hostname resolves
and has a valid certificate. Then build the frontend for that exact host, for
example:

```powershell
.\scripts\build-cpanel-package.ps1 `
  -SiteUrl "https://kict.makachuzanzibar.co.tz" `
  -ApiUrl "https://api.kict.makachuzanzibar.co.tz/api"
```

Set the backend's `CLIENT_URL` to
`https://kict.makachuzanzibar.co.tz`. Do not upload this API-subdomain build
until `https://api.kict.makachuzanzibar.co.tz/api/health` returns JSON with
`"database":"connected"` and the API host also serves `/uploads`.

## 2. Build the upload package

Use Node.js 22.12 or newer locally. From the repository root in PowerShell:

```powershell
.\scripts\build-cpanel-package.ps1
```

For production SEO assets, provide the confirmed public HTTPS origin:

```powershell
.\scripts\build-cpanel-package.ps1 -SiteUrl "https://www.example.go.tz"
```

The build writes `robots.txt` and `sitemap.xml` into `public_html`. If no site
URL is configured, the sitemap is intentionally omitted rather than generated
with a placeholder domain. The frontend sets route-specific titles,
descriptions, canonical links and social metadata at runtime; `VITE_SITE_URL`
ensures canonicals use the chosen hostname consistently.

For an API subdomain, set its URL explicitly:

```powershell
.\scripts\build-cpanel-package.ps1 `
  -SiteUrl "https://example.com" `
  -ApiUrl "https://api.example.com/api"
```

The API host must have HTTPS, point to the running Passenger application, and
allow credentialed CORS from the exact website origin configured as
`CLIENT_URL`. Do not build with `/api` unless the hosting provider has confirmed
that same-origin requests are routed to Node.

The script builds both apps and creates `deployment/cpanel-package/` with this
layout:

```text
public_html/   Built frontend and its SPA/HTTPS .htaccess rules
backend/       Node app, Passenger entry point, runtime dependencies, and seed
prisma/        Prisma schema and committed database migrations
```

It refuses to overwrite an existing output directory. Choose another path with
`-OutputDirectory` or move the old package before rebuilding. The package does
not include `.env`, local uploads, or database contents.

## 3. Upload files

- Copy the **contents** of `public_html/` to the domain's actual document root.
- Upload `backend/` and `prisma/` together to a private directory outside
  `public_html` (for example `/home/ACCOUNT/kipawa-deploy/`). Keep `prisma/` as a
  sibling of `backend/`.
- In **Setup Node.js App**, set the application root to the uploaded `backend`
  directory and the startup file to `passenger.js`. Select Node.js 22 or newer
  and production mode.
- Ensure the app can write to `backend/uploads/`. Keep this directory outside
  `public_html`, back it up, and check the host's storage and request-size
  limits; course/news video uploads can be as large as 50 MB.

## 4. Set Node.js application environment

Add these values in the cPanel Node.js application's environment-variable
settings. Use real values supplied by the host; do not commit them or place
them under `public_html`.

```text
NODE_ENV=production
CLIENT_URL=https://example.com
DATABASE_URL=<provider PostgreSQL connection string>
JWT_SECRET=<unique random secret, at least 32 characters>
JWT_EXPIRES_IN=12h
SESSION_COOKIE_SAME_SITE=lax
BCRYPT_ROUNDS=12
ADMIN_EMAIL=<initial administrator email>
ADMIN_PASSWORD=<strong unique initial password>
```

`CLIENT_URL` must be the exact HTTPS website origin, without a path. If the
site is served on both the apex and `www` hostnames, either redirect to one
canonical hostname or list both origins separated by a comma. The cPanel app
provides `PORT`; do not set it manually. Keep `SESSION_COOKIE_SAME_SITE=lax`
when the website and API use the same site, including sibling subdomains. Only
use `none` when they are on different sites and both are HTTPS.

Generate a secret locally, for example:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Add `AFRICASTALKING_USERNAME`, `AFRICASTALKING_API_KEY`, and
`AFRICASTALKING_ENVIRONMENT` only if SMS delivery is configured. Never share
the database URL, JWT secret, or administrator password.

## 5. Install, migrate, and seed

Use the cPanel application terminal with the Node version selected for the app,
from the `backend/` application root:

```bash
npm ci --include=dev
npx prisma migrate deploy --config prisma.config.ts
npm run prisma:seed
npm prune --omit=dev
```

The migration command must be able to read `DATABASE_URL`; the seed also needs
`ADMIN_EMAIL` and `ADMIN_PASSWORD`. If the terminal doesn't inherit the cPanel
app's environment variables, make them available securely to that terminal
rather than putting them in a public file or shell script. Run the seed once
for a new, empty production database, with the administrator credentials set
above. Review seeded/demo content before making the site public. Do not seed an
existing live database as a routine deployment step.

Restart the Node.js application after installation. Check
`https://api.example.com/api/health` (or the configured API host); it should
report a connected database. Then test the public site, direct page refreshes,
sign-in, admin access, and an upload. Configure cPanel SSL/AutoSSL for both
hosts before using production credentials.

## Ongoing operations

- Back up PostgreSQL and `backend/uploads/` together. Treat
  `uploads/payment-proofs/` as private, sensitive data; it must never be copied
  into the public document root.
- For each release, rebuild the package, upload the updated `backend/` and
  `prisma/`, install dependencies if the lockfile changed, run
  `prisma migrate deploy`, and restart Passenger. Preserve existing uploads.
- Verify the cPanel provider's backup, disk quota, process, and request-size
  limits. This API is designed to run as one Node application instance on
  typical shared hosting.
