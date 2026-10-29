# cPanel deployment

This application has two parts:

- `public_html`: the built React frontend (static files).
- a cPanel **Setup Node.js App**: the Express/Prisma API and persistent uploads.

The API also needs a PostgreSQL database. The frontend alone cannot provide
login, applications, bookings, admin pages, uploads, or database-backed data.

## Before uploading

1. Create a PostgreSQL database and database user in Meridian/cPanel. Record the
   complete connection string supplied by the host.
2. Decide the API URL. The most reliable layout is `https://api.example.com`
   for the API and `https://example.com` for the frontend. A same-domain `/api`
   reverse proxy is also supported if Meridian enables it.
3. Install Node.js locally (Node 20.19+), then from the repository root run:

   ```powershell
   .\deployment\cpanel\build-package.ps1 -ApiUrl "https://api.example.com"
   ```

   The script creates `deployment/cpanel/package/` with `public_html/` and
   `backend/` ready to upload. It does not include secrets or the local
   database/uploads.

## Upload the frontend

Upload the *contents* of `deployment/cpanel/package/public_html/` into the
domain's `public_html/` directory. Do not upload the `public_html` directory as
an extra nested folder. The included `.htaccess` keeps direct links such as
`/news/...` and `/admin/...` working after refresh.

## Create the Node.js application

In cPanel → **Setup Node.js App**:

1. Create an application with Node 20 or newer and production mode.
2. Choose an application root outside `public_html`, for example
   `kipawa-api`.
3. Upload the contents of `deployment/cpanel/package/backend/` into that root.
4. Set the startup file to `passenger.js`.
5. Add the environment variables below, using the exact values for this domain.
6. Run `npm install --omit=dev` from the cPanel terminal or the app's package
   manager, then restart the application.

Required API environment variables:

```text
NODE_ENV=production
CLIENT_URL=https://example.com
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public
JWT_SECRET=<unique random value of at least 32 characters>
JWT_EXPIRES_IN=12h
SESSION_COOKIE_SAME_SITE=lax
BCRYPT_ROUNDS=12
ADMIN_EMAIL=<approved admin email>
ADMIN_PASSWORD=<strong temporary admin password>
```

Add `AFRICASTALKING_USERNAME`, `AFRICASTALKING_API_KEY`,
`AFRICASTALKING_ENVIRONMENT`, and optional sender/country settings only when
SMS is configured. Keep `DATABASE_URL`, `JWT_SECRET`, and `ADMIN_PASSWORD`
private; never put them in `public_html`.

## Database and first start

From the backend application root, run the committed migrations before using
the site. The cPanel terminal must have the Prisma CLI available; if the host
does not install dev dependencies, run migrations from a temporary environment
with Prisma available and then restart the app.

```bash
npx prisma migrate deploy --schema=../prisma/schema.prisma
npm run prisma:generate
```

If the packaged backend includes the repository `prisma/` directory, use the
same relative layout as the generated package. Check:

```text
https://api.example.com/api/health
```

The response should report `"status":"ok"` and
`"database":"connected"`. Then sign in and change the seeded admin password.

## Same-domain API option

If Meridian supports a reverse proxy, route `/api/*` and `/uploads/*` from the
main domain to the Node.js app. Keep `VITE_API_BASE_URL=/api` and set
`CLIENT_URL=https://example.com`. This avoids cross-site cookies and is the
recommended production arrangement. If reverse proxying is unavailable, use
the API subdomain and build with `-ApiUrl "https://api.example.com"`.

## Operational requirements

- Enable SSL for both the frontend and API before production use.
- Keep `backend/uploads/payment-proofs` outside public static hosting and back
  it up with the database.
- Configure cPanel/Passenger restart monitoring and database backups.
- Replace draft contact/legal content in Admin → Site settings before launch.
- Do not upload `.env`, local database files, `node_modules`, or development
  source maps to `public_html`.
