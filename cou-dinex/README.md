# CoU DineX (কুমিল্লা বিশ্ববিদ্যালয় স্মার্ট ডাইনিং ও ক্যাম্পাস ডেলিভারি সিস্টেম)

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue?logo=postgresql)](https://neon.tech/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-2D3748?logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-University%20Proprietary-teal)]()

**CoU DineX** is the official campus dining, food ordering, and smart logistics operating system engineered specifically for **Comilla University (CoU)**. It serves university students, faculty members, visiting guests, cafeteria kitchen staff, delivery couriers, and campus dining administrators.

---

## 🌟 Key Functional Highlights

1. **Student Verification & Identity Protection**:
   - Official admission database verification integration.
   - Student ID document review queue for university staff.
   - Data privacy masking (`017****89`, `ra***@cou.ac.bd`) across public interfaces.

2. **Multi-Channel Campus Ordering**:
   - **Cafeteria Pickup**: Order ahead with 4-digit counter pickup OTP verification.
   - **Table QR Dining**: Dine-in order directly to tables.
   - **Hall Delivery**: Couriers deliver to student residential halls (KNH, BSMRH, SDDH, NFCH, SHH).
   - **Department Delivery**: Desk/classroom delivery across academic buildings.

3. **Kitchen Display System (KDS)**:
   - Real-time order dispatch with audio chime alerts.
   - Preparation timers, order ticket stages (`New` → `Preparing` → `Ready`).
   - Automated stock depletion & instant sold-out triggers.

4. **Campus Delivery Fleet & Logistics**:
   - Real-time courier dispatch console.
   - Configurable campus map showing exact university pickup and delivery points.
   - **Zero Privacy Leakage**: Active GPS tracking automatically terminates immediately upon order completion.

5. **Campus Innovation Layer (Phase 13)**:
   - **Campus Food Radar**: Live dish availability and waiting times.
   - **Smart Queue**: Queue depth estimates and suggested order times.
   - **Group Ordering & Split Payments**: Share code rooms, individual subtotals, equal delivery fee splits.
   - **Class Schedule Pre-Ordering**: Smart notifications aligned with student lecture routines.
   - **Loyalty Rewards & Eco Score**: Green dining indicators and student point rewards.

6. **Comprehensive 18-Section Admin Command Center (Phase 14)**:
   - Overview, Students, Staff, Verifications, Menu, Categories, Orders, Kitchen, Delivery, Inventory, Payments, Reviews, Complaints, Rewards, Notifications, Analytics, Security, Settings.
   - Direct database analytics charts (Order volumes, Revenue trend, Peak hours, Kitchen prep duration).
   - Security audit stream tracking failed logins, suspicious IPs, and administrative interventions.
   - One-click CSV exports for accounting and inventory stock audits.

---

## 🏗️ Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Lucide Icons, Leaflet (Campus Map).
- **Styling**: Tailored design tokens, Glassmorphism, Theme context (Dark / Light modes).
- **Backend**: Next.js Server Components, API Route Handlers, Node.js.
- **Database**: PostgreSQL with Prisma ORM 6.4.
- **Authentication**: JWT session tokens signed with Jose, Bcrypt password hashing, HTTP-only secure cookies.
- **Real-Time Push**: Firebase Cloud Messaging (Web Push & Device registration).

---

## 🚀 Quick Start Guide

### 1. Requirements
- Node.js `20.x` or higher
- PostgreSQL database

### 2. Installation
```bash
git clone https://github.com/nomanabdullah04/CoU-DineX.git
cd CoU-DineX/cou-dinex
npm install
```

### 3. Environment Setup
```bash
cp .env.production.example .env
# Fill in your DATABASE_URL, JWT_SECRET, and Firebase credentials
```

### 4. Database Setup & Seed
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Default Roles & Access Paths

| Role | Accessible Portal | Default Credential Seed |
| :--- | :--- | :--- |
| **Student** | `/menu`, `/orders`, `/group-orders`, `/student/dashboard` | `01700000001` / `pass123` |
| **Visitor** | `/menu`, `/explore`, `/orders` | Self-register via `/register` |
| **Kitchen Staff** | `/kitchen` (KDS) | Seeded with role `CAFETERIA_STAFF` |
| **Delivery Rider** | `/delivery` | Seeded with role `DELIVERY_AGENT` |
| **Admin** | `/admin` (All 18 sections) | `01700000000` / `admin123` |

---

## 🔒 Security & Privacy Commitments
- **Zero Student Location Tracking**: Students are never tracked via continuous GPS.
- **Delivery Tracking Boundary**: Delivery rider GPS coordinates are published only while status is `ON_THE_WAY` and immediately wiped once `DELIVERED`.
- **Masked PII**: Phone numbers and personal emails are masked in administrative tables.
- **Immutable Audit Logging**: Failed login attempts and administrative actions are permanently logged in `audit_logs`.

---

## 📄 License
Developed for Comilla University (CoU). All rights reserved.
