# Baba Core

Baba Core is a restaurant operations platform built with Laravel, Inertia, React, and TypeScript.

It currently includes:

- authentication and 2FA support
- roles and permissions with Spatie Permission
- users and employees management
- countries, cities, branches, kitchens, and products
- orders and receipts
- inventory and vendor balances
- finance dashboards, payroll, and reports

## Tech Stack

### Backend

- PHP `^8.2`
- Laravel `^12.0`
- Inertia Laravel `^2.0`
- Laravel Fortify
- Laravel Sanctum
- Spatie Laravel Permission
- Spatie Query Builder
- Laravel Wayfinder
- DOMPDF
- PhpSpreadsheet
- Pest for testing

### Frontend

- React `^19`
- TypeScript
- Inertia React
- React Hook Form
- Zod
- TanStack React Query
- TanStack Table
- Zustand
- Tailwind CSS
- shadcn/ui + Radix UI
- Recharts
- Sonner
- Vite

## Project Structure

High-level structure:

- `app/Http/Controllers` : request handling
- `app/Services` : business logic
- `app/Models` : Eloquent models
- `resources/js/pages` : Inertia pages
- `resources/js/components` : shared UI and table components
- `resources/js/components/tables` : feature table clients, columns, row actions
- `routes/web.php` : web routes
- `tests` : feature and unit tests

The project generally follows this flow:

1. Route
2. Controller
3. Service
4. Inertia page
5. Table/client component

## Core Modules

Current main sections:

- Dashboard
- Users
- Roles and Permissions
- Employees
- Countries and Cities
- Branches
- Kitchens
- Products
- Orders
- Inventory
- Finance
- Payroll
- Reports

## Requirements

Before running the project, make sure you have:

- PHP `8.2+`
- Composer
- Node.js `18+` or newer
- npm
- SQLite, MySQL, or another Laravel-supported database

## Installation

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd baba-core
```

### 2. Install dependencies

```bash
composer install
npm install
```

### 3. Create the environment file

```bash
cp .env.example .env
php artisan key:generate
```

### 4. Configure the database

By default, `.env.example` uses SQLite:

```env
DB_CONNECTION=sqlite
```

If you want SQLite, create the database file:

```bash
touch database/database.sqlite
```

Then keep:

```env
DB_CONNECTION=sqlite
```

If you want MySQL instead, update:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=baba_core
DB_USERNAME=root
DB_PASSWORD=
```

### 5. Run migrations

```bash
php artisan migrate
```

If seeders exist and you want demo data:

```bash
php artisan db:seed
```

### 6. Start the app

In one terminal:

```bash
php artisan serve
```

In another terminal:

```bash
npm run dev
```

Or use the Composer dev script:

```bash
composer run dev
```

## Useful Commands

### Backend

```bash
php artisan serve
php artisan migrate
php artisan migrate:fresh --seed
php artisan queue:listen --tries=1
php artisan pail
php artisan test
```

### Frontend

```bash
npm run dev
npm run build
npm run build:ssr
npm run lint
npm run format
npm run format:check
npm run types
```

### Composer shortcuts

```bash
composer run setup
composer run dev
composer run test
```

## Environment Variables

The main environment file is `.env`.

Use `.env.example` as the starting point.

### Minimal required variables

```env
APP_NAME="Baba Core"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000
```

### Database

SQLite example:

```env
DB_CONNECTION=sqlite
```

MySQL example:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=baba_core
DB_USERNAME=root
DB_PASSWORD=
```

### Session / cache / queue

The example file currently uses database-backed services:

```env
SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database
```

That means you should run migrations before using the app.

### Mail

Default local example:

```env
MAIL_MAILER=log
MAIL_HOST=127.0.0.1
MAIL_PORT=2525
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"
```

### Frontend

```env
VITE_APP_NAME="${APP_NAME}"
```

## Testing

This project uses Pest and Laravel’s testing tools.

Run the test suite with:

```bash
php artisan test
```

or:

```bash
composer run test
```

### Notes

- tests may use SQLite in memory
- avoid database-specific SQL when possible
- keep logic database-agnostic where tests depend on SQLite

## Auth and Permissions

Authentication is powered by Laravel Fortify.

The app also uses:

- email verification
- password reset
- two-factor authentication
- Spatie Laravel Permission for roles and permissions

Typical permission-related locations:

- `app/Http/Controllers/Admin/RoleController.php`
- `app/Http/Controllers/Admin/PermissionController.php`
- `app/Services/Auth`
- `resources/js/pages/admin/roles`
- `resources/js/pages/admin/users`

## Frontend Patterns

Common frontend conventions used in this project:

- pages live in `resources/js/pages`
- feature tables live in `resources/js/components/tables`
- modals are usually colocated in client or row-action components
- type definitions live in `resources/js/types/index.d.ts`
- formatting helpers live in `resources/js/utils/format.ts`

## UI / Design Notes

The UI stack is based on:

- Tailwind CSS
- shadcn/ui
- Radix UI primitives
- Recharts for charts

Recent summary cards use a shared gradient-card style through:

- `resources/js/components/shared/summary-metric-card.tsx`

## Common Routes

Main sections are available under routes such as:

- `/dashboard`
- `/users`
- `/roles`
- `/branches`
- `/countries`
- `/kitchens`
- `/products`
- `/orders`
- `/inventory`
- `/finance`
- `/finance/payroll`
- `/reports`

## Deployment Notes

Before deploying:

```bash
composer install --no-dev --optimize-autoloader
npm install
npm run build
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

If queues are used in production, make sure a worker is running.

## Troubleshooting

### Vite assets are not loading

Make sure:

- `npm install` has been run
- `npm run dev` is running in local development
- `npm run build` was run for production

### App key missing

```bash
php artisan key:generate
```

### Database errors on first run

Make sure migrations are executed:

```bash
php artisan migrate
```

### Tests fail with database-specific SQL

Prefer Laravel collection grouping or database-agnostic query patterns when tests run against SQLite.

## Recommended First Run

If you are pulling this project for the first time:

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
npm install
npm run dev
php artisan serve
```

## Maintainers

If you are contributing, keep these in mind:

- put business logic in services where possible
- keep controllers thin
- prefer reusable shared UI components
- use existing table patterns for index screens
- keep formatting and labels consistent with the current admin UI

## Branch / Local Runtime Recommendations

For a branch-local deployment where the in-store PC acts as the local server, prefer Redis-backed cache and queue settings so catalog cache, projections, and sync retries stay fast even during unstable WAN connectivity:

```env
POS_CACHE_STORE=redis
CACHE_STORE=redis
QUEUE_CONNECTION=redis
```

If you want safer fallback behavior when Redis is temporarily unavailable, you can instead use:

```env
CACHE_STORE=failover
QUEUE_CONNECTION=failover
```

The failover configuration is ordered to prefer Redis first, then fall back to database-backed drivers.

Branch-local runtime health can be polled through the branch-sync endpoint:

```bash
curl -H "X-Branch-Token: <token>" \
  https://your-domain.example/api/v1/branch-sync/runtime-health
```

Recommended branch-local credential abilities:

- `health.read` for runtime health polling
- `*` only for trusted internal branch-server credentials while sync scopes are still being split into narrower abilities

---

If you need a more opinionated onboarding doc next, we can also add:

- local development workflow
- contribution guidelines
- release/deployment checklist
- module-by-module architecture notes
