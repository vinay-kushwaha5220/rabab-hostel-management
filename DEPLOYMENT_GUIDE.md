# 🚀 Rabab Stay - Deployment Guide

---

## 📋 Pre-Deployment Checklist

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] No console errors or warnings
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Comments added where needed
- [ ] No hardcoded secrets or credentials

### Security
- [ ] JWT secrets are strong and unique
- [ ] CORS configured for production domain
- [ ] HTTPS enabled
- [ ] Environment variables set correctly
- [ ] Database backups configured
- [ ] Rate limiting enabled
- [ ] Input validation in place
- [ ] Error messages don't expose sensitive data

### Performance
- [ ] Frontend build optimized
- [ ] Database indexes created
- [ ] Caching strategies implemented
- [ ] Images optimized
- [ ] API response times acceptable
- [ ] Database queries optimized

### Testing
- [ ] User flows tested
- [ ] Admin flows tested
- [ ] Payment flow tested
- [ ] Authentication tested
- [ ] Error handling tested
- [ ] Mobile responsiveness tested

---

## 🔧 Environment Setup

### Backend Environment Variables

Create `.env` file in `backend/` directory:

```env
# Database
DATABASE_URL="file:./prod.db"

# JWT Secrets (Generate strong random strings)
JWT_SECRET="your-super-secret-access-token-key-min-32-chars"
REFRESH_TOKEN_SECRET="your-super-secret-refresh-token-key-min-32-chars"

# Environment
NODE_ENV="production"

# Server
PORT=5000

# CORS
CORS_ORIGIN="https://yourdomain.com"

# Optional: Email Service
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Optional: Payment Gateway
RAZORPAY_KEY_ID="your-razorpay-key"
RAZORPAY_KEY_SECRET="your-razorpay-secret"

# Optional: AWS S3 (for image storage)
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_S3_BUCKET="your-bucket-name"
AWS_REGION="us-east-1"
```

### Frontend Environment Variables

Create `.env` file in `frontend/` directory:

```env
# API Configuration
VITE_API_URL="https://api.yourdomain.com"

# Environment
VITE_ENV="production"

# Optional: Analytics
VITE_GOOGLE_ANALYTICS_ID="your-ga-id"
```

---

## 🏗️ Build Process

### Backend Build

```bash
cd backend

# Install dependencies
npm install

# Run migrations
npx prisma migrate deploy

# Build TypeScript
npm run build

# Start production server
npm start
```

### Frontend Build

```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Output: dist/ folder ready for deployment
```

---

## 🌐 Deployment Options

### Option 1: Heroku (Easiest)

#### Backend Deployment

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Create app
heroku create rabab-stay-backend

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set JWT_SECRET="your-secret"
heroku config:set REFRESH_TOKEN_SECRET="your-secret"
heroku config:set NODE_ENV="production"

# Deploy
git push heroku main

# Run migrations
heroku run npx prisma migrate deploy
```

#### Frontend Deployment

```bash
# Build frontend
npm run build

# Deploy to Vercel (recommended for frontend)
npm install -g vercel
vercel --prod
```

---

### Option 2: AWS (Scalable)

#### Backend on AWS EC2

```bash
# 1. Create EC2 instance
# - Ubuntu 22.04 LTS
# - t3.micro (free tier eligible)
# - Security group: Allow ports 22, 80, 443, 5000

# 2. SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Install PM2 (process manager)
sudo npm install -g pm2

# 5. Clone repository
git clone https://github.com/yourusername/rabab-stay.git
cd rabab-stay/backend

# 6. Install dependencies
npm install

# 7. Create .env file
nano .env
# Add environment variables

# 8. Run migrations
npx prisma migrate deploy

# 9. Start with PM2
pm2 start npm --name "rabab-backend" -- start
pm2 save
pm2 startup

# 10. Install Nginx (reverse proxy)
sudo apt-get install nginx

# 11. Configure Nginx
sudo nano /etc/nginx/sites-available/default
# Add proxy configuration (see below)

# 12. Enable SSL with Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Frontend on AWS S3 + CloudFront

```bash
# 1. Create S3 bucket
aws s3 mb s3://rabab-stay-frontend

# 2. Build frontend
npm run build

# 3. Upload to S3
aws s3 sync dist/ s3://rabab-stay-frontend --delete

# 4. Create CloudFront distribution
# - Origin: S3 bucket
# - Default root object: index.html
# - Enable compression
# - Add SSL certificate

# 5. Update DNS to point to CloudFront
```

---

### Option 3: Railway (Simple)

```bash
# 1. Sign up at railway.app

# 2. Connect GitHub repository

# 3. Create services:
#    - Backend (Node.js)
#    - Database (PostgreSQL)

# 4. Set environment variables in Railway dashboard

# 5. Deploy automatically on push
```

---

### Option 4: Docker (Containerized)

#### Dockerfile for Backend

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 5000

# Start application
CMD ["npm", "start"]
```

#### Dockerfile for Frontend

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/rabab
      - JWT_SECRET=${JWT_SECRET}
      - REFRESH_TOKEN_SECRET=${REFRESH_TOKEN_SECRET}
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=rabab
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## 🔐 SSL/TLS Setup

### Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Verify renewal
sudo certbot renew --dry-run
```

### Update Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:5000;
        # ... rest of config
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 📊 Database Migration

### From SQLite to PostgreSQL

```bash
# 1. Install PostgreSQL locally
# 2. Create new database
createdb rabab_prod

# 3. Update DATABASE_URL in .env
DATABASE_URL="postgresql://user:password@localhost:5432/rabab_prod"

# 4. Run migrations
npx prisma migrate deploy

# 5. Seed data (if needed)
npx prisma db seed

# 6. Verify data
psql rabab_prod -c "SELECT COUNT(*) FROM \"User\";"
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies (Backend)
        run: |
          cd backend
          npm ci

      - name: Run tests (Backend)
        run: |
          cd backend
          npm run test

      - name: Build (Backend)
        run: |
          cd backend
          npm run build

      - name: Install dependencies (Frontend)
        run: |
          cd frontend
          npm ci

      - name: Build (Frontend)
        run: |
          cd frontend
          npm run build

      - name: Deploy to Heroku
        env:
          HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
        run: |
          git push https://heroku:$HEROKU_API_KEY@git.heroku.com/rabab-stay-backend.git main
```

---

## 📈 Monitoring & Logging

### Application Monitoring

```bash
# Install PM2 Plus (monitoring)
pm2 plus

# View logs
pm2 logs

# Monitor performance
pm2 monit
```

### Database Monitoring

```bash
# PostgreSQL monitoring
SELECT * FROM pg_stat_statements;

# Check slow queries
SELECT query, calls, mean_time FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;
```

### Error Tracking

```bash
# Install Sentry
npm install @sentry/node

# Initialize in backend
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
});
```

---

## 🔄 Backup & Recovery

### Database Backup

```bash
# PostgreSQL backup
pg_dump rabab_prod > backup.sql

# Restore from backup
psql rabab_prod < backup.sql

# Automated daily backup
0 2 * * * pg_dump rabab_prod > /backups/rabab_$(date +\%Y\%m\%d).sql
```

### Application Backup

```bash
# Backup entire application
tar -czf rabab-backup-$(date +%Y%m%d).tar.gz /app

# Upload to S3
aws s3 cp rabab-backup-*.tar.gz s3://your-backup-bucket/
```

---

## 🧪 Post-Deployment Testing

### Health Checks

```bash
# Backend health
curl https://api.yourdomain.com/

# Database connection
curl https://api.yourdomain.com/api/rooms

# Authentication
curl -X POST https://api.yourdomain.com/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"admin123"}'
```

### Performance Testing

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Load test
ab -n 1000 -c 10 https://api.yourdomain.com/api/rooms
```

---

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] All code committed and pushed
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] SSL certificates obtained
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Error tracking configured

### Deployment
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Database migrated
- [ ] SSL enabled
- [ ] DNS updated
- [ ] Health checks passing

### Post-Deployment
- [ ] Test all user flows
- [ ] Test all admin flows
- [ ] Verify authentication
- [ ] Check payment flow
- [ ] Monitor error logs
- [ ] Monitor performance
- [ ] Verify backups

---

## 🆘 Troubleshooting

### Backend Won't Start

```bash
# Check logs
pm2 logs

# Check port availability
lsof -i :5000

# Check environment variables
env | grep JWT

# Restart service
pm2 restart all
```

### Database Connection Error

```bash
# Test connection
psql -h localhost -U user -d rabab_prod

# Check DATABASE_URL
echo $DATABASE_URL

# Run migrations
npx prisma migrate deploy
```

### Frontend Not Loading

```bash
# Check build
npm run build

# Check S3 bucket
aws s3 ls s3://rabab-stay-frontend

# Check CloudFront cache
# Invalidate cache in CloudFront console
```

### SSL Certificate Issues

```bash
# Check certificate
openssl s_client -connect api.yourdomain.com:443

# Renew certificate
sudo certbot renew --force-renewal

# Check Nginx config
sudo nginx -t
```

---

## 📞 Support Resources

- [Heroku Documentation](https://devcenter.heroku.com/)
- [AWS Documentation](https://docs.aws.amazon.com/)
- [Railway Documentation](https://docs.railway.app/)
- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)

---

**Last Updated**: May 12, 2026
