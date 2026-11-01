# CoU DineX — Smart Campus Dining Platform

Comilla University's all-in-one food ordering, delivery, and cafeteria management system.

## Features

- **Multi-role System** — Student, Visitor, Kitchen Staff, Delivery Agent, Admin
- **4 Order Types** — Dine In (QR), Counter Pickup, Hall Delivery, Department Delivery
- **Kitchen Display System** — Real-time order management with sound alerts
- **Delivery Tracking** — Live OTP-verified delivery with GPS tracking
- **Admin Command Center** — 18-section dashboard with analytics
- **Smart Features** — Campus Food Radar, Smart Queue, Group Ordering, Class Schedule Pre-order
- **Rewards & Eco Score** — Loyalty points and environmental impact tracking
- **Payment Integration** — bKash, Nagad, Rocket, Card, DineX Wallet (demo mode)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4, CSS Variables |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT (jose) + bcrypt, HTTP-only Cookies |
| Icons | Lucide React |
| Maps | Leaflet.js |
| Push | Firebase Cloud Messaging |

## Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- npm or yarn

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env.local

# 3. Update DATABASE_URL in .env.local with your PostgreSQL connection string

# 4. Generate Prisma Client
npm run db:generate

# 5. Push schema to database
npm run db:push

# 6. Seed initial data (departments, halls, cafeteria, admin account)
npm run db:seed

# 7. Start development server
npm run dev
```

Visit `http://localhost:3000`

## Project Structure

```
src/
├── app/
│   ├── (main)/          # Authenticated user pages (home, cart, orders, etc.)
│   ├── admin/           # Admin dashboard
│   ├── api/             # API routes
│   │   ├── auth/        # Login, Register, Verify Email, Reset Password
│   │   ├── orders/      # Order CRUD + status transitions
│   │   ├── kitchen/     # Kitchen Display System API
│   │   ├── delivery/    # Delivery agent actions
│   │   ├── admin/       # Admin analytics, management
│   │   ├── payments/    # Payment verification
│   │   └── innovation/  # Radar, Smart Queue, Class Schedule
│   ├── kitchen/         # Kitchen Display page
│   ├── delivery/        # Delivery Agent portal
│   ├── login/           # Login page
│   └── register/        # Registration (Student/Visitor)
├── components/
│   ├── admin/           # Admin dashboard components
│   ├── layout/          # AppShell, Header, Sidebar, BottomNav
│   └── ui/              # Shared UI components
├── contexts/            # CartContext, ThemeContext
├── hooks/               # Custom hooks (useKitchenOrders)
├── lib/
│   ├── auth.ts          # JWT auth utilities
│   ├── prisma.ts        # Prisma client singleton
│   ├── rate-limit.ts    # API rate limiting
│   ├── validations/     # Zod schemas
│   └── notifications/   # Notification service
├── middleware.ts         # Route protection & role-based access
└── types/               # TypeScript type definitions
```

## User Roles

| Role | Access |
|------|--------|
| STUDENT | Browse menu, order, track, rewards |
| VISITOR | Browse menu, order, track |
| CAFETERIA_STAFF | Kitchen Display, accept/prepare/ready orders |
| DELIVERY_AGENT | Accept deliveries, pickup, OTP handover |
| CAFETERIA_ADMIN | Full admin dashboard |
| SUPER_ADMIN | Full admin + system settings |

## Database

Schema uses Prisma ORM with 24 models. Key commands:

```bash
npm run db:generate    # Generate Prisma Client
npm run db:push        # Push schema changes
npm run db:migrate     # Run migrations (production)
npm run db:seed        # Seed initial data
npm run db:studio      # Open Prisma Studio
```

## Environment Variables

See `.env.example` for development and `.env.production.example` for production configuration.

**Required variables:**
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Secret key for JWT signing (generate: `openssl rand -base64 32`)

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables (DATABASE_URL, JWT_SECRET)
4. Deploy

### VPS / Docker

```bash
# Build
npm run build

# Start production server
npm start
```

### Database Migration (Production)

```bash
npx prisma migrate deploy
```

## Security

- JWT tokens in HTTP-only cookies (secure in production)
- bcrypt password hashing (10 salt rounds)
- Zod input validation on all API endpoints
- Rate limiting on auth endpoints (10 req/15min per IP)
- Role-based middleware protection
- SQL injection protection via Prisma ORM
- XSS protection via React auto-escaping
- CSRF protection via SameSite=lax cookies
- Audit logging for admin actions and login attempts

## Backup Strategy

- **Database**: Use `pg_dump` for regular PostgreSQL backups
- **Schedule**: Daily automated backups recommended
- **Retention**: Keep 7 daily + 4 weekly backups

```bash
# Manual backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20261026.sql
```

## License

Private — Comilla University
