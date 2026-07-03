# Gloford

White-label NGO platform — dynamic public site, admin dashboard, donations, newsletter, email automation, projects, and visitor analytics. Replaces the static gloford.org with a scalable, enterprise-ready foundation.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, RSC, Server Actions) |
| Language | TypeScript 5.7 |
| DB | PostgreSQL (single-tenant, defense-in-depth RLS) |
| ORM | Prisma 6 |
| Auth | Auth.js v5 (credentials + Google) |
| Jobs | Inngest (sequences, retries, audit/version fan-out) |
| Email | Resend + React Email (or self-hosted SMTP) |
| Payments | Configurable per deployment (Stripe, Flutterwave, etc.) |
| Storage | Cloudflare R2 |
| Styling | Tailwind CSS 4 (CSS-variable theme tokens) |
| i18n | next-intl |

---

## Quick Start

```bash
pnpm install
cp .env.example .env.local   # fill in secrets
pnpm db:migrate              # applies schema + RLS policies
pnpm db:seed                 # creates org + admin user
pnpm dev                     # http://localhost:3000
pnpm inngest:dev             # in another terminal
```

Default admin credentials come from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env.local`.

### Seed Safety

The seed script accepts admin credentials only through env vars — never via flags or files that could land in shell history. For any environment that is not a throwaway dev loop:

1. **Always set `SEED_ADMIN_PASSWORD`** to a unique strong value before running `pnpm db:seed`. The seed prints a warning if you run with the built-in default (`change-me-on-first-login`).
2. **Generate `ENCRYPTION_KEY` once per environment** with `openssl rand -base64 32`. This key encrypts payment-provider secrets at rest in `PaymentConfiguration.encryptedSecrets`. If lost, stored provider API keys cannot be decrypted and must be re-entered manually in the admin.
3. **Generate `AUTH_SECRET`** similarly and keep it out of the repo. Rotating it signs out every active session — plan accordingly.
4. After the first successful sign-in, **delete** `SEED_ADMIN_PASSWORD` from your runtime env. The seed is idempotent; it only creates the admin if one doesn't exist. It does not reset an existing admin's password.

---

## Architecture

Key invariants:

- **Multi-tenancy:** every tenant-scoped row has `organizationId`; Postgres RLS enforced via session GUCs (`app.current_org`, `app.current_user`, `app.current_role`).
- **Service layer:** UI/API never touch Prisma. All writes go through `lib/services/<module>/*` via the `createService()` wrapper: validate -> authorize -> transact -> version -> audit -> emit.
- **Module communication:** event-first via Inngest for cross-module side-effects (donations -> segments -> emails). Direct calls only for content/media.
- **Consistency:** strong for payments/users/RBAC; eventual for audit, versions, emails, activity.

---

## Phases

1. **Foundation** — Next.js + Prisma schema + RLS + Auth.js + Inngest + theme + shells + seed
2. **Content** — Pages, Programs, Posts, Media, BlockEditor, versioning
3. **Donations** — providers, campaigns, webhooks, widget
4. **Newsletter + email automation** — subscribers, segments, campaigns, sequences
5. **Events** — event CRUD, announcements, reminders
6. **Observability** — audit viewer, versions UI, dead-letter retry, feature flags, health
7. **Polish** — a11y audit, E2E, CI/CD, Neon branches

---

## Recent Changes (May 2026)

- **Projects module** — full admin CRUD (create, edit, status control, delete) + public listing/detail pages with ISR, SEO meta, and JSON-LD structured data. Zod-validated via `createService` factory with audit trail and versioning.
- **Visitor analytics** — middleware tracks page visits (path, referrer, device, geo) into `SiteVisit` model. Dashboard shows today/week/month/total counts and top pages. IP derived server-side only (never from client body).
- **Purple brand theme** — default palette is purple (#7B2DBB). CSS fallbacks, service DEFAULTS, seed, and dark mode all aligned.
- **Admin UI overhaul** — redesigned sidebar (primary-colored, scrollable), topbar (profile dropdown, backdrop blur), dashboard (visitor stats cards), and theme editor.
- **i18n** — `public.projects` namespace added to all four languages (en, fr, sw, ar).
- **Theme caching** — `getActiveThemeTokens()` uses `unstable_cache` with `revalidateTag("theme")` instead of `force-dynamic`, eliminating per-request DB hits.
- **Security hardening** — analytics endpoint validates/clamps all inputs, derives IP server-side, seed default color corrected.

### Local Audit — 2026-05-20

Current local WSL/Docker audit status:

- Fixed fresh-database seed failure by creating `ThemePreset` rows before the singleton `Theme` references `gloford-purple`.
- Fixed Dockerfile Prisma generation retries so a failed `pnpm prisma generate` now fails the image build instead of silently continuing with a stale client.
- Pinned the local Inngest dev-server image to `inngest/inngest:v1.17.2` and exposed ports `8288`/`8289`.
- Cleaned lint warnings in the admin sidebar and media uploader.
- Verified `pnpm typecheck`, `pnpm lint`, `pnpm test` (24 files / 284 tests), `pnpm build`, WSL `docker compose build`, WSL `docker compose up -d --force-recreate`, and Playwright smoke tests against the live Docker app.

Known follow-up gaps:

- Several admin/public forms still use native `<textarea>` and a few native `<select>` elements. This is functional, but it does not fully satisfy the project UI standard in `CLAUDE.md`; replace them with the design-system controls during the next UI hardening pass.
- `SENTRY_DSN` is optional. If it is set locally without installing `@sentry/nextjs`, the app logs a warning and falls back to the structured logger.

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Dev server with Turbopack |
| `pnpm build` | Production build |
| `pnpm typecheck` | TS without emit |
| `pnpm lint` | ESLint (includes boundaries + a11y) |
| `pnpm db:migrate` | Apply Prisma migrations locally |
| `pnpm db:deploy` | Apply migrations in CI/prod |
| `pnpm db:seed` | Seed roles, permissions, org, default theme |
| `pnpm db:studio` | Prisma Studio |
| `pnpm inngest:dev` | Local Inngest dev server |
| `pnpm test` | Run Vitest unit tests once |
| `pnpm test:watch` | Watch-mode tests |
| `pnpm test:e2e` | Playwright E2E tests |

---

## Docker

A multi-stage Dockerfile + a three-service compose stack live in the repo:

```bash
docker compose up -d db                # start Postgres
docker compose run --rm migrate        # apply migrations + seed
docker compose up --build app inngest  # build image and bring up app + Inngest dev server
```

- App: <http://localhost:3000>
- Inngest dev UI: <http://localhost:8288>
- Postgres: `localhost:5433` (mapped from 5432 in the container)
- Mailpit UI: <http://localhost:8025>

The compose file lives at [`docker-compose.yaml`](./docker-compose.yaml).

### Local Access

When the root Docker stack is running:

| Service | URL |
|---|---|
| Public site | <http://localhost:3000> |
| Admin login | <http://localhost:3000/login> |
| Admin dashboard | <http://localhost:3000/admin> |
| Inngest dev UI | <http://localhost:8288> |
| Mailpit UI | <http://localhost:8025> |

The local admin account is seeded from `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `.env`. Do not copy the password into committed docs; rotate it when moving beyond local testing.

Useful local checks:

```bash
docker compose ps
curl http://localhost:3000/api/health
PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm exec playwright test --workers=1
```

---

## White-Label / Single-Tenant Model

This codebase is a **white-label NGO platform**. Every deployment serves one client. Each client gets their own database, own domain, own branding. The code stays a single shared asset that you can fork or re-clone for each engagement.

### Current State (what works in our favor)

- **One Organization per deployment is already the common path.** The seed creates exactly one org. In production you'd do the same: seed one org on first migrate, then never add another.
- **Branding already lives in data.** `SiteSettings` (site name, logo, contact, socials, SEO) and `Theme` (colors, typography, radii, shadows) are editable at runtime from the admin UI. No code change needed to rebrand.
- **No org picker in URLs.** The public site has no `/org/<slug>/` prefix; it's all root-relative.
- **Payment secrets are per-org and encrypted at rest.** Already client-portable.
- **i18n is already locale-per-deployment.** Each client can pick any subset of `en / fr / sw` in `lib/i18n/config.ts`.

### Soft Single-Tenant Approach

The runtime still has `organizationId` columns (23 tables) and RLS policies, but they operate as defense-in-depth with a single org. This preserves the ability to go multi-tenant later while avoiding a costly migration.

| Concern | Current | Target |
|---|---|---|
| `organizationId` column | present on 23 tables | keep, set to a fixed value per deploy |
| RLS policies | enforce per-tenant | keep as defense-in-depth; they trivially pass |
| Org resolution | every request resolves from session | resolved once at boot from env |
| Branding | editable at runtime | editable at runtime, seeded from env at first migrate |
| Payment providers | enabled per org | enabled for THE org |
| Seed | creates org from env | reads `APP_ORG_NAME` / `APP_ORG_SLUG` env |

---

## Client Setup

To launch for a new client:

### 1. Clone the template

```bash
git clone git@github.com:yourco/ngo-platform.git client-acme
cd client-acme
git remote rename origin upstream
git remote add origin git@github.com:yourco/client-acme.git
git push -u origin main
```

Keeping `upstream` lets you pull platform improvements with `git fetch upstream && git merge upstream/main`.

### 2. Configure `.env`

Copy `.env.example` and fill in the client's values. The minimum required to boot is:

```bash
# Identity + branding
BRAND_NAME="Acme Foundation"
BRAND_PRIMARY_COLOR="#2563eb"
NEXT_PUBLIC_APP_URL="https://give.acme.org"

# Admin credentials (change password after first login)
SEED_ADMIN_EMAIL="admin@acme.org"
SEED_ADMIN_PASSWORD="generate-a-strong-one"

# Database (own Neon project per client)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Auth / encryption secrets — generate fresh per client
AUTH_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
AUTH_URL="https://give.acme.org"
```

See `.env.example` for the full list with comments.

### 3. Provision Infrastructure

Per client you need:

- **Postgres** — separate Neon project (or your managed provider). Create the database + user before setting `DATABASE_URL`.
- **Hosting** — Vercel / Fly / Render. Point it at the new fork.
- **R2 / S3 bucket** (optional, for media uploads) — one bucket per client.
- **Resend** (optional, for email) — new API key + verified sending domain.
- **Sentry** (optional) — new project for clean error segregation.
- **Payment provider accounts** — Stripe, Flutterwave, Pesapal, MTN MoMo, Airtel Money as relevant for the client's markets.

### 4. Run Migrations + Seed

```bash
pnpm install
pnpm prisma migrate deploy
pnpm db:seed
```

The seed reads `BRAND_NAME`, `BRAND_LOGO_URL`, `BRAND_PRIMARY_COLOR`, and `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` to bootstrap:

- Single `SiteSettings` row with the client's name
- Single `Theme` row with their primary color token
- All `Role` + `Permission` rows wired to the `ROLE_MATRIX`
- First admin user (SUPER_ADMIN)
- Default nav items (Programs, Blog, Events, Donate, About, Contact)
- System segments (Donors, Volunteers)

Re-running the seed is idempotent.

### 5. Deploy

```bash
git push
```

On Vercel, trigger the deploy and wait for the first build. On Fly:

```bash
fly launch
fly secrets import < .env.production
fly deploy
```

### 6. First Login and Rebrand

Go to `https://<your-url>/login` and sign in with `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD`. Immediately:

1. **Change the admin password** — profile -> change password.
2. **Upload the client's logo** via admin -> Settings -> Site.
3. **Tweak theme tokens** in admin -> Theme (colors, typography, radii).
4. **Configure payment providers** in admin -> Settings -> Payments (paste API keys — they're encrypted with `ENCRYPTION_KEY`).
5. **Invite other admins** via admin -> Users.

### 7. Point DNS

Configure the client's domain to point at your hosting provider. Set `NEXT_PUBLIC_APP_URL` and `AUTH_URL` to the production domain and redeploy.

### Updating from Upstream

When the platform template ships a bugfix or new feature:

```bash
git fetch upstream
git merge upstream/main
# Resolve any conflicts (usually none if you only customized env values)
git push
```

Client-specific customization lives in:

- `.env` / `.env.production` — env values only, never committed.
- `prisma/seed.ts` — only if you added client-specific seed data.
- `config/brand.ts` — env-driven, should rarely need edits.

Avoid forking service logic. If a client needs a module others don't, prefer a **feature flag** (admin -> Feature flags) over a code fork.

### Common Troubleshooting

| Problem | Fix |
|---|---|
| Seed fails with `Organization not found` | Schema no longer has Organizations. Merge from upstream. |
| Admin login 401 loops | Check `AUTH_URL` matches your deployed URL and `AUTH_SECRET` is set. |
| Emails don't send | Check `RESEND_API_KEY` + `MAIL_FROM` domain is verified in Resend. |
| Theme doesn't apply after edit | Theme tokens are cached via `unstable_cache` with tag `"theme"` (1h TTL). The admin save action calls `revalidateTag("theme")` automatically; if stale, redeploy or wait up to 1h. |

---

## Backup & Restore

This project persists all non-media state in a single Postgres database. The authoritative backup artifact is a `pg_dump`. Media (R2) is backed up separately by Cloudflare.

### What to Back Up

| Component | Backup method | Frequency |
|---|---|---|
| Postgres (all tables) | `pg_dump` -> offsite storage | Hourly incremental, daily full |
| Payment secrets | Encrypted in `PaymentConfiguration`; the DB backup covers them | -- |
| Cloudflare R2 media | R2 object versioning + cross-region replication | Continuous |
| Application code | Git (origin = source of truth) | On push |
| Env vars / secrets | Vaulted in deployment platform (Vercel / Fly / Render) | -- |

Do **not** back up `node_modules`, `.next/`, or Docker volumes directly — they are regenerable.

### Daily Full Backup (Production)

The production Postgres is run as a managed service (Neon in this project). Neon takes point-in-time backups automatically. Still, an operator-controlled dump gives you a portable artifact:

```bash
# From anywhere with DIRECT_URL set to the production URL.
pg_dump \
  --format=custom \
  --no-owner --no-acl \
  --file="gloford-$(date +%Y%m%d-%H%M).dump" \
  "$DIRECT_URL"
```

Upload the resulting `.dump` file to your offsite storage (S3/R2/GCS). Keep at least 30 daily, 12 monthly, and 7 yearly snapshots.

### Local Dev Backup

The local stack's DB volume is called `gloford_db-data`. To snapshot it:

```bash
docker compose exec -T db pg_dump \
  --format=custom --no-owner --no-acl \
  -U gloford -d gloford \
  > gloford-local-$(date +%Y%m%d).dump
```

### Restore into a Fresh Postgres

```bash
# Create the target DB if it doesn't exist.
createdb -h <host> -U <user> gloford

# Restore.
pg_restore \
  --no-owner --no-acl \
  --clean --if-exists \
  --dbname="$DIRECT_URL" \
  gloford-YYYYMMDD-HHMM.dump
```

### Restore into the Local Docker Stack

```bash
docker compose up -d db
docker compose exec -T db pg_restore \
  --no-owner --no-acl --clean --if-exists \
  -U gloford -d gloford \
  < gloford-local-YYYYMMDD.dump
```

### Post-Restore Checks

After any restore, run:

```bash
pnpm prisma migrate deploy      # apply any migrations the dump didn't cover
pnpm db:seed                    # idempotent — will no-op if data already exists
```

Then spot-check:

- `/admin/system/health` should report green on the Database card.
- `/admin/system/audit` should show an entry for `system.restore` if you recorded one manually.
- A donation on the donate page should succeed end-to-end (uses a test card against Stripe test mode).

### Encryption Key Handling

`ENCRYPTION_KEY` encrypts the `PaymentConfiguration.encryptedSecrets` column. If the key is lost, **payment secrets cannot be recovered** — operators must re-enter provider API keys in the admin. Treat this key like a root credential:

- Store in your secrets manager (1Password, AWS Secrets Manager, Vault).
- Rotate only during a planned maintenance window (re-encrypts every row).
- Never commit to the repo or pass via `docker run -e ...` where it may be captured in shell history.

### Disaster Recovery Drill

Run at least quarterly:

1. Spin up a clean Postgres (fresh Docker container, isolated DB).
2. Restore yesterday's production dump.
3. Point a dev build at it, run `pnpm db:seed`, boot the app.
4. Confirm `/admin/dashboard` shows non-zero KPIs.
5. Document the wall-clock recovery time in your runbook log.

If step 4 fails, the backup is corrupt or missing data — investigate before the next production incident.

---

## Secret Rotation Runbook

Rotate on a fixed cadence (quarterly) and immediately after any suspected compromise. Each section lists what, where, and how to roll without downtime.

### General Principles

- **Never** rotate provider live keys and test keys in the same change — roll one environment at a time.
- Use your deployment platform's env-var "draft" mechanism (Vercel's preview env, Fly's `set --stage`, etc.) to stage the new value before activating it.
- After rotating, smoke-test the end-to-end flow for that provider in production (one real test donation / one real test email).
- Log the rotation in your internal runbook: date, who, reason, provider, env tier.

### `AUTH_SECRET` (Auth.js)

Rotating this invalidates every active session — users have to sign in again.

```bash
# Generate
openssl rand -base64 32
```

Update `AUTH_SECRET` in your deployment platform, redeploy, then **clear the cookies on at least one test account** and verify login still works.

### `ENCRYPTION_KEY` (payment-provider secrets at rest)

This key is symmetric and encrypts rows in `PaymentConfiguration.encryptedSecrets`. Rotating it requires **re-encrypting existing rows** in the same change.

Zero-downtime recipe:

1. Generate the new key: `openssl rand -base64 32`.
2. In a one-off script (not committed), load current rows, decrypt with the old key, re-encrypt with the new, write back. Do it transactionally.
3. Deploy the new `ENCRYPTION_KEY` value.
4. Purge the old key from every vault you use.

If the key was **already compromised**, consider the payment secrets also compromised — rotate provider keys before bringing the new ENCRYPTION_KEY live.

### Payment Provider Keys

Rotate these in the **provider's dashboard**, then paste into the admin UI at `/admin/settings/payments/<provider>`. The admin form re-encrypts the value with the current ENCRYPTION_KEY before persisting.

| Provider | Dashboard | What to rotate |
|---|---|---|
| Stripe | Developers -> API keys | Secret key + webhook signing secret |
| Flutterwave | Settings -> API | Secret key + webhook hash |
| Pesapal | Console -> Merchant Settings | Consumer key + consumer secret |
| MTN MoMo | Developer portal | Subscription key + API user/API key pair |
| Airtel Money | Developer portal | Client ID + client secret |

**Webhook signing secrets** (`STRIPE_WEBHOOK_SECRET`, `RESEND_WEBHOOK_SECRET`, `FLUTTERWAVE_WEBHOOK_HASH`, `MTN_MOMO_CALLBACK_SECRET`, `AIRTEL_MONEY_CALLBACK_SECRET`) live as env vars, not in the DB. Roll them separately:

1. Generate the new secret in the provider's dashboard.
2. Update the corresponding env var in your deployment platform.
3. Redeploy.
4. Send a test webhook from the provider's dashboard and verify `/admin/system/audit` shows `WebhookEvent.processedAt` filled in.
5. Revoke the old secret.

### `RESEND_API_KEY`

1. Create a new restricted key in the Resend dashboard (scope: "Send only").
2. Set `RESEND_API_KEY` in the deployment platform, redeploy.
3. Trigger a test newsletter from admin -> verify it reaches a test inbox.
4. Revoke the old key in the Resend dashboard.

### Database Credentials (`DATABASE_URL` / `DIRECT_URL`)

Two-role setup: `gloford` (superuser) runs migrations, `gloford_app` (NOSUPERUSER NOBYPASSRLS) runs the app. Rotate each independently.

**Rotating `gloford_app`** (no downtime if pooled):

```sql
ALTER ROLE gloford_app WITH PASSWORD '<new>';
```

Update `DATABASE_URL` in your deployment platform, redeploy. Active connections in the pool will fail over to the new password at their next reconnect.

**Rotating `gloford`** is a maintenance event — migrations are the only thing that uses it and they run at deploy time:

1. Schedule a maintenance window (even if short).
2. `ALTER ROLE gloford WITH PASSWORD '<new>';`
3. Update `DIRECT_URL`.
4. Verify the next deploy's `prisma migrate deploy` step succeeds.

### `AUTH_GOOGLE_SECRET` (or any OAuth app)

Rotate the OAuth client secret in Google Cloud Console. Google keeps the old secret working for ~6 hours after you create a new one — long enough to deploy the new env var without a gap.

### After Rotation

- Grep audit logs for `login.failed` / `webhook.verify_failed` spikes in the hour after rollout — it catches consumers you forgot to update.
- Update the "last rotated" column in your runbook.
- If the rotation was in response to a suspected compromise, also rotate: `AUTH_SECRET`, `ENCRYPTION_KEY`, every provider key, and any Personal Access Tokens in GitHub / deploy platform / monitoring.

---

## Mail Server

### Local Dev Setup

**Folder structure:**

```
gloford-mail-dev/
├── docker-compose.yml          <- local dev container
├── config/
│   ├── postfix-main.cf         <- transport_maps config
│   └── postfix-transport       <- discard rule for no-reply
├── nginx-proxy/
│   └── local-mail.conf         <- Nginx placeholder proxy
└── test_send_email.py          <- Python test script
```

**1. Add hosts file entry:**

Make `mail.gloford.org` resolve to localhost on your machine.

Windows — open Notepad as Administrator, edit `C:\Windows\System32\drivers\etc\hosts`:
```
127.0.0.1  mail.gloford.org
```

Mac / Linux:
```bash
sudo sh -c 'echo "127.0.0.1  mail.gloford.org" >> /etc/hosts'
```

**2. Start the containers:**

```bash
cd gloford-mail-dev
docker compose up -d
```

Wait ~30 seconds for Postfix to initialise, then check: `docker compose logs -f mailserver`

**3. Create the no-reply account:**

```bash
docker exec mailserver-dev setup email add no-reply@gloford.org localdevpassword123
```

**4. Run the Python test:**

```bash
python test_send_email.py --to your@email.com
```

The script tries port 587 first, then falls back to port 25. In local dev, port 25 works without auth because `PERMIT_DOCKER=connected-networks`.

**5. Check mail logs:**

```bash
docker exec mailserver-dev tail -f /var/log/mail/mail.log
```

**6. Nginx proxy:**

Available at http://localhost:8025. Returns a placeholder until you add a webmail container (Roundcube etc.).

### Production Mail Setup

**Folder structure:**

```
mail/
├── docker-compose.yml
├── docker-data/dms/
│   ├── config/
│   │   ├── postfix-main.cf
│   │   └── postfix-transport
│   ├── mail-data/
│   ├── mail-state/
│   └── mail-logs/
├── nginx-proxy/
│   └── mail.gloford.org.conf
├── DNS-RECORDS.txt
└── SETUP.md
```

**Step 1 — DNS records:**

Add all records from `mail/DNS-RECORDS.txt` to your DNS provider. A and MX records must propagate before certbot can issue a cert. Check propagation: https://dnschecker.org/#A/mail.gloford.org

**Step 2 — Open firewall ports on the VPS:**

```bash
sudo ufw allow 25/tcp
sudo ufw allow 465/tcp
sudo ufw allow 587/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

**Step 3 — Issue TLS certificate with certbot:**

```bash
sudo apt update && sudo apt install -y certbot
sudo mkdir -p /var/www/certbot
```

Start Nginx in HTTP-only mode first (comment out the HTTPS server block in `nginx-proxy/mail.gloford.org.conf` temporarily), then:

```bash
cd mail/
docker compose up -d nginx

sudo certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  -d mail.gloford.org \
  --email admin@gloford.org \
  --agree-tos \
  --no-eff-email
```

Cert is written to `/etc/letsencrypt/live/mail.gloford.org/`. Uncomment the HTTPS server block, then reload: `docker compose exec nginx nginx -s reload`

**Step 4 — Start the mail server:**

```bash
cd mail/
docker compose up -d
```

Wait ~30 seconds, then check logs: `docker compose logs -f mailserver`

**Step 5 — Create the no-reply account:**

```bash
docker exec mailserver setup email add no-reply@gloford.org $(openssl rand -base64 24)
```

Save the generated password — you need it in Step 7.

**Step 6 — Get the DKIM public key and add to DNS:**

```bash
docker exec mailserver cat /tmp/docker-mailserver/opendkim/keys/gloford.org/mail.txt
```

Copy the `p=` value and add it as the DKIM TXT record:
- Name: `mail._domainkey.gloford.org`
- Value: `"v=DKIM1; k=rsa; p=<YOUR_KEY>"`

**Step 7 — Wire the app to use self-hosted mail:**

Update `.env` in the main app:

```bash
MAIL_SMTP_HOST=mail.gloford.org
MAIL_SMTP_PORT=587
MAIL_SMTP_USER=no-reply@gloford.org
MAIL_SMTP_PASS=<password from step 5>
MAIL_FROM="Gloford Foundation <no-reply@gloford.org>"
RESEND_API_KEY=
```

**Step 8 — Test deliverability:**

```bash
docker exec mailserver sendmail -v test@gmail.com <<EOF
Subject: Test from Gloford
From: no-reply@gloford.org
To: test@gmail.com

Test email from self-hosted mail server.
EOF
```

- https://mail-tester.com — aim for 10/10
- https://mxtoolbox.com/SuperTool.aspx — verify SPF, DKIM, DMARC

**Step 9 — Tighten DMARC after 2 weeks:**

Monitor reports at `dmarc-reports@gloford.org`. Once clean, update DNS:
```
"v=DMARC1; p=reject; rua=mailto:dmarc-reports@gloford.org; ..."
```

**Cert auto-renewal:**

The certbot container in `docker-compose.yml` runs `certbot renew` every 12 hours automatically. After renewal, reload Nginx and the mail server:

```bash
docker compose exec nginx nginx -s reload
docker compose restart mailserver
```

Add this to crontab for fully automatic renewal:
```bash
sudo crontab -e
# Add:
0 3 * * * cd /path/to/mail && docker compose exec nginx nginx -s reload && docker compose restart mailserver
```

**Port 25 outbound blocked?**

Many VPS providers block outbound port 25. Test: `telnet smtp.gmail.com 25`. If it hangs, uncomment the `RELAY_*` vars in `docker-compose.yml` and use SendGrid or Mailgun as a relay.

### Mail Troubleshooting

| Problem | Fix |
|---|---|
| `Connection refused` on port 25/587 | Container not started — run `docker compose up -d` |
| `mail.gloford.org` doesn't resolve | Hosts file entry missing (local) or DNS not propagated (prod) |
| `Authentication failed` on 587 | Use port 25 for local dev, or create account first |
| Logs show `postmap` errors | Check `config/postfix-transport` has no Windows line endings |

---

## Security Audit

Audit date: 2026-05-18. All categories pass.

| Category | Finding | Status |
|---|---|---|
| **organizationId trust** | No server action accepts client-supplied orgId; all resolve from session | PASS |
| **Sensitive field masking** | Payment config uses `type="password"`; `MaskedField` component available | PASS |
| **Double-submit prevention** | All 60+ forms use `useTransition` + `disabled={pending}` | PASS |
| **Error message leakage** | Typed `AppError` system with `safeMessage`; `toSafeError()` wrapper for unknowns | PASS |
| **Destructive action confirmation** | 19 `confirm()`/`alert()` calls replaced with `useConfirmAction` (Radix AlertDialog) | FIXED |
| **CSRF / revalidation** | All mutations call `revalidateTag`/`revalidatePath`; Next.js CSRF built-in | PASS |

---

## Design System Components

Components created or enhanced during the platform audit:

| Component | Location | Built on |
|---|---|---|
| `Select` | `components/ui/Select.tsx` | `@radix-ui/react-select` |
| `DatePicker` | `components/ui/DatePicker.tsx` | `react-day-picker` + `@radix-ui/react-popover` |
| `Toast` / `Toaster` / `useToast` | `components/ui/Toast.tsx` | `@radix-ui/react-toast` |
| `useConfirmAction` / `ConfirmActionProvider` | `components/ui/useConfirmAction.tsx` | `@radix-ui/react-alert-dialog` |
| `MaskedField` | `components/ui/MaskedField.tsx` | Native (eye toggle, copy-to-clipboard) |
| `RichTextDisplay` | `components/ui/RichTextDisplay.tsx` | `dompurify` |

### CKEditor 5

Rich-text editor at `components/ui/RichTextEditor.tsx` — CKEditor 5 v48 with 39+ plugins including SourceEditing, WordCount, PageBreak, TodoList, HtmlEmbed, Autoformat, ListProperties, TableColumnResize, and LinkImage. Media uploads route through the R2 presign API via a custom `MediaUploadAdapter`.

---

## Testing

| Command | Description |
|---|---|
| `pnpm test` | Vitest unit + integration tests |
| `pnpm test:watch` | Watch mode |
| `pnpm test:e2e` | Playwright E2E (requires running dev server) |
| `pnpm test:all` | Vitest + Playwright sequentially |
| `pnpm audit:ui` | Grep for remaining browser-native patterns |

**Coverage:** 24 test files, 284 tests across unit (validators, services, components), integration (donations, webhooks, revalidation, auth), and E2E (smoke).
