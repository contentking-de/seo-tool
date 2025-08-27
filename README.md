## SEO Tool

Fast, secure on-page SEO audits with a protected user area. Built with Next.js 15 (App Router), TypeScript, Tailwind, NextAuth, and Prisma.

### Features
- Password-protected dashboard (NextAuth + credentials)
- SEO audit endpoint and UI: title, meta description, H1, robots, canonical, Open Graph, html lang, image/link counts
- Refined link metrics: real links only with breakdown (internal, external, nofollow)
- Basic rate limiting on the audit API
- Security headers (X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options)
- Robots.txt route and sensible metadata

### Stack
- Next.js 15, React 19, TypeScript
- Tailwind CSS 4
- NextAuth (credentials)
- Prisma ORM
- SQLite (local dev) and Postgres/Neon (production recommended)

---

## Quickstart

### Prerequisites
- Node.js 18+ (20+ recommended)
- pnpm (or npm/yarn)

### 1) Clone and install
```bash
git clone https://github.com/contentking-de/seo-tool.git
cd seo-tool
pnpm install
```

### 2) Environment
Create a `.env` file:
```bash
cp .env.example .env  # if provided; otherwise create it with the keys below
```
Required variables (dev defaults shown):
```bash
DATABASE_URL="file:./prisma/dev.db"        # local dev uses SQLite
NEXTAUTH_URL="http://localhost:3000"      # your app URL (use https in prod)
NEXTAUTH_SECRET="replace-with-strong-random-string"

# Optional seeding convenience (POST /api/seed)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="ChangeMe123!"
```

### 3) Database (local)
```bash
pnpm dlx prisma migrate dev --name init
```

### 4) Seed admin user (optional)
```bash
pnpm dev
curl -X POST http://localhost:3000/api/seed
# Login with ADMIN_EMAIL / ADMIN_PASSWORD
```

### 5) Run the app
```bash
pnpm dev          # http://localhost:3000
```

---

## Production (Vercel + Neon)
We recommend Postgres in production. You can use Neon for a serverless Postgres.

1) Push the Postgres schema to your database once (already done for the hosted demo):
```bash
export DATABASE_URL="postgresql://<user>:<pass>@<host>/<db>?sslmode=require"
pnpm dlx prisma db push --schema=prisma/schema.pg.prisma
```

2) In Vercel Project Settings → Environment Variables set:
```
DATABASE_URL       = your Neon Postgres URI
NEXTAUTH_URL       = https://your-domain.tld (must include https scheme)
NEXTAUTH_SECRET    = long, random value
PRISMA_SCHEMA_PATH = prisma/schema.pg.prisma
```

3) Deploy. The build runs `prisma generate` using the Postgres schema via `PRISMA_SCHEMA_PATH`.

4) Seed an admin (once):
```bash
curl -X POST https://your-domain.tld/api/seed
```

---

## How the audit works
The API fetches the target URL and parses HTML using Cheerio:
- Checks: `<title>`, `<meta name="description">`, first `<h1>`, robots meta, `<link rel="canonical">`, Open Graph tags, `<html lang>`
- Counts: images, real links `a[href]` (excludes `mailto:`, `tel:`, `javascript:`, and hash-only), H1s
- Link breakdown: internal vs external vs nofollow (`rel~="nofollow"`)

You can try it from the dashboard or call directly:
```bash
GET /api/seo/audit?url=https://example.com
```

---

## Security and hardening
- NextAuth credentials with bcrypt password hashing
- Basic in-memory rate limiter on audit endpoint
- Security headers via `next.config.ts`
- Protected routes via `withAuth` middleware

For production at scale, consider:
- External rate limiting store (e.g., Redis) or an edge/WAF
- Monitoring and request timeouts
- Strong secrets management

---

## Scripts
```bash
pnpm dev              # start dev server
pnpm build            # production build
pnpm start            # start production server
pnpm lint             # run ESLint

# Prisma
pnpm dlx prisma migrate dev --name <name>
pnpm dlx prisma studio
```

Note: the build and install scripts run `prisma generate`. In production we point this at Postgres with `PRISMA_SCHEMA_PATH=prisma/schema.pg.prisma`.

---

## Troubleshooting
- Too many redirects in prod: ensure `NEXTAUTH_URL` includes `https://` and matches the domain, and clear cookies.
- Invalid email/password in prod: verify `DATABASE_URL` points to your prod DB and `PRISMA_SCHEMA_PATH=prisma/schema.pg.prisma` is set so the correct Prisma client is generated.
- Native module issues: we use `bcrypt` which works on Vercel. If needed, it’s easy to switch to `bcryptjs`.

---

## Roadmap / TODO
1. Create signup functionality (invite-based or self-serve, with email verification)
2. Implement 2FA for logins (TOTP via authenticator apps)

---

## License
MIT — see `LICENSE`.

