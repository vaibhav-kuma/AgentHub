# 🚀 Deployment Guide - Vercel + Render.com

Complete step-by-step guide to deploy AgentHub to production.

---

## 📋 Prerequisites

- GitHub account
- Vercel account (free)
- Render.com account (free)
- Domain name (optional)

---

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         VERCEL                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Next.js App (Web Service)                           │  │
│  │  - Landing page                                       │  │
│  │  - Dashboard                                          │  │
│  │  - API routes                                         │  │
│  │  - Stripe webhooks                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      RENDER.COM                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Background Worker (24/7)                            │  │
│  │  - LinkedIn automation                                │  │
│  │  - Email campaigns                                    │  │
│  │  - Twitter DMs                                        │  │
│  │  - Instagram DMs                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Cron Job (Every 6 hours)                            │  │
│  │  - Process scheduled campaigns                        │  │
│  │  - Clean up old data                                  │  │
│  │  - Send reports                                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Part 1: Vercel Deployment (Main App)

### Step 1: Push to GitHub

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Create GitHub repo and push
git remote add origin https://github.com/yourusername/agenthub.git
git branch -M main
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`

### Step 3: Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app/dashboard

# AI
ANTHROPIC_API_KEY=sk-ant-api03-...

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Email
RESEND_API_KEY=re_...
INSTANTLY_API_KEY=inst_...

# Social Media
TWITTER_APP_KEY=...
TWITTER_APP_SECRET=...
TWITTER_ACCESS_TOKEN=...
TWITTER_ACCESS_SECRET=...
INSTAGRAM_ACCESS_TOKEN=...
INSTAGRAM_ACCOUNT_ID=...

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Step 4: Deploy

```bash
# Using Vercel CLI (optional)
npm i -g vercel
vercel --prod

# Or just push to GitHub
git push origin main
# Vercel auto-deploys on push
```

### Step 5: Set Up Custom Domain (Optional)

1. Vercel Dashboard → Settings → Domains
2. Add your domain: `yourdomain.com`
3. Configure DNS:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

### Step 6: Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret
5. Add to Vercel env vars: `STRIPE_WEBHOOK_SECRET=whsec_...`

---

## 🤖 Part 2: Render.com Deployment (Background Jobs)

### Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Authorize Render to access your repos

### Step 2: Deploy Background Worker

1. Click "New +" → "Background Worker"
2. Connect your GitHub repository
3. Configure:
   - **Name:** `agenthub-linkedin-worker`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npx playwright install chromium`
   - **Start Command:** `node worker/linkedin-worker.js`
   - **Plan:** Free (or Starter for production)

### Step 3: Add Environment Variables

Add the same environment variables as Vercel, plus:

```env
# Proxies (comma-separated)
PROXY_LIST=http://user:pass@proxy1:port,http://user:pass@proxy2:port

# Worker-specific
WORKER_CONCURRENCY=5
RATE_LIMIT_PER_HOUR=20
```

### Step 4: Deploy Cron Job

1. Click "New +" → "Cron Job"
2. Connect your GitHub repository
3. Configure:
   - **Name:** `agenthub-linkedin-cron`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npx playwright install chromium`
   - **Start Command:** `node worker/linkedin-cron-job.js`
   - **Schedule:** `0 */6 * * *` (every 6 hours)
   - **Plan:** Free

### Step 5: Monitor Logs

```bash
# View worker logs
render logs -s agenthub-linkedin-worker

# View cron logs
render logs -s agenthub-linkedin-cron
```

---

## 📊 Part 3: Database Setup

### Option A: Supabase (Recommended)

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy connection string
5. Run migrations:

```bash
# Install Drizzle Kit
npm i -g drizzle-kit

# Push schema to database
npx drizzle-kit push:pg
```

### Option B: Neon

1. Go to [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string
4. Run migrations (same as above)

### Option C: Railway

1. Go to [railway.app](https://railway.app)
2. New Project → PostgreSQL
3. Copy connection string
4. Run migrations (same as above)

---

## 🔐 Part 4: Authentication Setup (Clerk)

### Step 1: Create Clerk Application

1. Go to [clerk.com](https://clerk.com)
2. Create new application
3. Choose authentication methods:
   - ✅ Email
   - ✅ Google
   - ✅ GitHub
   - ✅ LinkedIn (optional)

### Step 2: Configure Redirects

In Clerk Dashboard → Paths:

```
Sign-in URL: /sign-in
Sign-up URL: /sign-up
After sign-in: /app/dashboard
After sign-up: /app/dashboard
```

### Step 3: Copy API Keys

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Step 4: Set Up Webhooks

1. Clerk Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/clerk`
3. Select events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Copy signing secret
5. Add to env: `CLERK_WEBHOOK_SECRET=whsec_...`

---

## 💳 Part 5: Stripe Setup

### Step 1: Create Stripe Account

1. Go to [stripe.com](https://stripe.com)
2. Create account
3. Complete verification

### Step 2: Create Products

```bash
# Starter Plan
Product: Starter
Price: $99/month
Price ID: price_starter_monthly

# Pro Plan
Product: Pro
Price: $299/month
Price ID: price_pro_monthly

# Enterprise Plan
Product: Enterprise
Price: $999/month
Price ID: price_enterprise_monthly

# Lifetime Deal
Product: Lifetime Access
Price: $499 one-time
Price ID: price_lifetime_deal
```

### Step 3: Update Price IDs

In `app/pricing/page.tsx`:

```typescript
const plans = [
  {
    id: "starter",
    priceId: "price_starter_monthly", // ← Your actual price ID
    // ...
  },
  // ...
];
```

### Step 4: Test Mode

Use test cards:
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
```

### Step 5: Go Live

1. Complete Stripe verification
2. Switch to live mode
3. Update API keys in env vars
4. Test with real card

---

## 🔔 Part 6: Webhook Integrations

### Zapier Setup

1. Create Zap
2. Trigger: Webhooks by Zapier → Catch Hook
3. Copy webhook URL
4. In AgentHub: Settings → Webhooks → Add Webhook
5. Paste URL, select events
6. Test webhook
7. Add Zap actions (CRM, Slack, etc.)

### Make.com Setup

1. Create scenario
2. Add Webhooks module → Custom webhook
3. Copy webhook URL
4. In AgentHub: Settings → Webhooks → Add Webhook
5. Paste URL, select events
6. Test webhook
7. Add modules (HTTP, CRM, etc.)

---

## 📈 Part 7: Monitoring & Analytics

### Vercel Analytics

```bash
# Enable in vercel.json
{
  "analytics": {
    "enable": true
  }
}
```

### Sentry Error Tracking

```bash
npm install @sentry/nextjs

# Add to next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig({
  // your config
}, {
  silent: true,
  org: "your-org",
  project: "agenthub"
});
```

### Posthog Product Analytics

```bash
npm install posthog-js

# Add to app/layout.tsx
import posthog from 'posthog-js'

posthog.init('YOUR_API_KEY', {
  api_host: 'https://app.posthog.com'
})
```

---

## 🚨 Part 8: Troubleshooting

### Common Issues

#### 1. Build Fails on Vercel

```bash
# Check build logs
vercel logs

# Common fixes:
- Ensure all dependencies in package.json
- Check TypeScript errors
- Verify environment variables
```

#### 2. Worker Crashes on Render

```bash
# Check worker logs
render logs -s agenthub-linkedin-worker

# Common fixes:
- Increase memory limit
- Add error handling
- Check Playwright installation
```

#### 3. Database Connection Fails

```bash
# Test connection
psql $DATABASE_URL

# Common fixes:
- Check connection string format
- Verify SSL settings
- Whitelist Vercel/Render IPs
```

#### 4. Stripe Webhook Not Working

```bash
# Test locally
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Common fixes:
- Verify webhook secret
- Check endpoint URL
- Review selected events
```

---

## ✅ Part 9: Post-Deployment Checklist

### Security

- [ ] Enable HTTPS
- [ ] Set up CSP headers
- [ ] Configure CORS
- [ ] Add rate limiting
- [ ] Enable 2FA on all services

### Performance

- [ ] Enable Vercel Edge caching
- [ ] Optimize images
- [ ] Add database indexes
- [ ] Enable compression
- [ ] Set up CDN

### Monitoring

- [ ] Set up error tracking (Sentry)
- [ ] Enable analytics (Vercel/Posthog)
- [ ] Configure uptime monitoring
- [ ] Set up log aggregation
- [ ] Create status page

### Business

- [ ] Set up customer support (Intercom/Crisp)
- [ ] Configure email notifications
- [ ] Add legal pages (Terms, Privacy)
- [ ] Set up billing alerts
- [ ] Create backup strategy

---

## 🎉 You're Live!

Your AgentHub is now deployed and ready to generate leads!

### Next Steps

1. **Test Everything**
   - Create test agent
   - Run test campaign
   - Verify webhooks
   - Test payments

2. **Launch Marketing**
   - Post on Product Hunt
   - Share on Twitter
   - Write launch blog post
   - Email early access list

3. **Monitor & Optimize**
   - Watch error logs
   - Track user behavior
   - Optimize conversion funnel
   - Gather feedback

---

## 📞 Need Help?

- 📧 Email: support@agenthub.com
- 💬 Discord: [Join community](https://discord.gg/agenthub)
- 📚 Docs: [docs.agenthub.com](https://docs.agenthub.com)

---

**Happy deploying! 🚀**
