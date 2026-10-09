# CoU DineX — Production Deployment & Operations Guide

## 1. Overview
CoU DineX is the smart dining and campus delivery management system built specifically for **Comilla University (CoU)**. It integrates student admissions verification, multi-channel food ordering (Counter Pickup, Table QR, Hall Delivery, Department Delivery), live Kitchen Display System (KDS), campus courier dispatch with secure OTP handover, digital split payments, and an administrative control center.

---

## 2. System Architecture & Prerequisites
- **Runtime**: Node.js v20.x+ (LTS)
- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL 15+ (Hosted on Neon, AWS RDS, or DigitalOcean Managed DB) with PgBouncer connection pooling
- **Push Notification Service**: Firebase Cloud Messaging (Web Push & Device registration)
- **Container / Host**: Docker, Vercel, Railway, or Linux VM (Ubuntu 24.04 LTS / Nginx reverse proxy / PM2)

---

## 3. Database Migration Instructions

### Initial Setup
1. Clone the repository and install dependencies:
   ```bash
   cd cou-dinex
   npm ci
   ```

2. Configure environment variables by copying `.env.production.example`:
   ```bash
   cp .env.production.example .env.production
   # Populate DATABASE_URL, JWT_SECRET, and Firebase credentials
   ```

3. Generate the Prisma client:
   ```bash
   npm run db:generate
   ```

4. Apply migrations to the production database:
   ```bash
   npx prisma migrate deploy
   ```

5. (Optional) Seed official university halls, departments, cafeteria menus, and system administrator:
   ```bash
   npm run db:seed
   ```

---

## 4. Production Build & Deployment

### Option A: Standard Linux Server (PM2 + Nginx)
1. Build the Next.js production bundle:
   ```bash
   npm run build
   ```

2. Launch via PM2:
   ```bash
   pm2 start npm --name "cou-dinex" -- start
   pm2 save
   pm2 startup
   ```

3. Nginx Reverse Proxy Configuration (`/etc/nginx/sites-available/cou-dinex`):
   ```nginx
   server {
       listen 80;
       server_name dinex.cou.ac.bd;
       return 301 https://$host$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name dinex.cou.ac.bd;

       ssl_certificate /etc/letsencrypt/live/dinex.cou.ac.bd/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/dinex.cou.ac.bd/privkey.pem;

       # Security Headers
       add_header X-Frame-Options "SAMEORIGIN";
       add_header X-XSS-Protection "1; mode=block";
       add_header X-Content-Type-Options "nosniff";
       add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Option B: Docker Container Deployment
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 5. Automated Backup & Disaster Recovery Strategy

### Automated PostgreSQL Backup Script (`/opt/backups/db-backup.sh`)
```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/postgres"
DATE=$(date +"%Y%m%d_%H%M%S")
FILENAME="cou_dinex_backup_${DATE}.sql.gz"

mkdir -p $BACKUP_DIR
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_DIR/$FILENAME"

# Retain backups for 30 days
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -exec rm {} \;

# Sync to encrypted offsite S3 / university backup server
aws s3 cp "$BACKUP_DIR/$FILENAME" s3://cou-dinex-backups/database/ --storage-class STANDARD_IA
```
Add to crontab to execute every 6 hours:
```cron
0 */6 * * * /opt/backups/db-backup.sh > /dev/null 2>&1
```

---

## 6. Logging, Security Auditing & Monitoring

1. **Security Audit Log**:
   - Stored in the `audit_logs` database table.
   - All logins, failed authentication attempts, staff modifications, student approvals/rejections, and complaint resolutions are automatically persisted with timestamp, actor ID, and IP address.
2. **Access Control**:
   - `SUPER_ADMIN` and `CAFETERIA_ADMIN` are the only roles permitted to access `/admin`.
   - `CAFETERIA_STAFF` has access restricted to the Kitchen Display System (`/kitchen`).
   - `DELIVERY_AGENT` has access restricted to rider dispatch (`/delivery`).
3. **Application Healthcheck Endpoint**:
   - Healthcheck ping: `GET /api/health` or `GET /api/menu`
4. **Log Aggregation**:
   - Use Winston/Pino or stream stdout to CloudWatch / Datadog / Grafana Loki.
