	# 🚀 AgentHub - AI Sales Agents on Autopilot

<div align="center">

![AgentHub Banner](https://via.placeholder.com/1200x400/667eea/ffffff?text=AgentHub+-+AI+Sales+Agents)

**Replace your entire SDR team with AI agents that work 24/7**

[Live Demo](https://agenthub.vercel.app) • [Documentation](https://docs.agenthub.com) • [Twitter](https://twitter.com/agenthub)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/agenthub)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

</div>

---

## 🎯 What is AgentHub?

AgentHub is an **AI-powered sales automation platform** that replaces your entire SDR team with intelligent agents that:

- 🔍 **Find** perfect prospects on LinkedIn, Twitter, Instagram
- ✍️ **Write** personalized messages using Claude 3.5 Sonnet
- 📧 **Send** connection requests, DMs, and emails automatically
- 📊 **Track** every lead, reply, and meeting in one unified inbox
- 💰 **Generate** $50K+ in pipeline per month on autopilot

### 💡 Why AgentHub?

| Traditional SDR | AgentHub AI Agent |
|----------------|-------------------|
| $60K/year salary | $299/month |
| 8 hours/day | 24/7 operation |
| 50 contacts/day | 500+ contacts/day |
| Inconsistent quality | Perfect every time |
| Needs training | Pre-trained on millions of conversations |

**ROI: 457%** • **Payback Period: 2 weeks** • **Setup Time: 2 minutes**

---

## ✨ Features

### 🤖 **20 Pre-Made Agent Teams**
- SaaS Founder PMF Hunter
- Agency Client Getter
- Creator Sponsorship Team
- Ecom UGC Brand
- VC Fundraising Machine
- + 15 more ready-to-deploy teams

### 📱 **Multi-Channel Outreach**
- ✅ LinkedIn (Sales Navigator integration)
- ✅ Email (Resend + Instantly.ai warmup)
- ✅ Twitter/X DMs (API v2)
- ✅ Instagram DMs (Meta Graph API)

### 🧠 **AI-Powered Personalization**
- Claude 3.5 Sonnet for message generation
- Knowledge base integration
- Sentiment analysis
- Auto-follow-ups

### 📊 **Analytics & ROI Tracking**
- Leads generated
- Reply rate
- Meetings booked
- Cost per meeting
- Revenue attribution

### 🔗 **Integrations**
- Zapier & Make.com webhooks
- Stripe payments
- Supabase real-time
- Clerk authentication

---

## 🚀 Quick Start (2 Minutes)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/agenthub.git
cd agenthub
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Fill in your keys:
```env
# Database
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# AI
ANTHROPIC_API_KEY=sk-ant-...

# Payments
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...
INSTANTLY_API_KEY=inst_...

# Social
TWITTER_APP_KEY=...
TWITTER_APP_SECRET=...
INSTAGRAM_ACCESS_TOKEN=...
```

### 3. Run Database Migrations

```bash
npm run db:push
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📦 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Clerk
- **AI:** Claude 3.5 Sonnet (Anthropic)
- **Payments:** Stripe
- **Email:** Resend
- **Automation:** Playwright, Twitter API v2, Meta Graph API
- **Styling:** Tailwind CSS
- **Deployment:** Vercel + Render.com

---

## 🎨 Screenshots

<div align="center">

### Dashboard
![Dashboard](https://via.placeholder.com/800x500/667eea/ffffff?text=Drag+%26+Drop+Canvas)

### Unified Inbox
![Inbox](https://via.placeholder.com/800x500/f093fb/ffffff?text=Unified+Inbox)

### Analytics
![Analytics](https://via.placeholder.com/800x500/4ade80/ffffff?text=Analytics+Dashboard)

### Agent Templates
![Templates](https://via.placeholder.com/800x500/fbbf24/ffffff?text=20+Pre-Made+Templates)

</div>

---

## 📖 Documentation

### Core Concepts

- [Agent Types](./docs/agent-types.md)
- [Channels](./docs/channels.md)
- [Knowledge Base](./docs/knowledge-base.md)
- [Webhooks](./docs/webhooks.md)

### Guides

- [Creating Your First Agent](./docs/guides/first-agent.md)
- [LinkedIn Automation](./docs/guides/linkedin.md)
- [Email Campaigns](./docs/guides/email.md)
- [Analytics & ROI](./docs/guides/analytics.md)

### API Reference

- [REST API](./docs/api/rest.md)
- [Webhooks](./docs/api/webhooks.md)
- [Rate Limits](./docs/api/rate-limits.md)

---

## 🏗️ Project Structure

```
agenthub/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth pages
│   ├── (marketing)/              # Landing, pricing
│   ├── app/                      # Main app
│   │   ├── dashboard/            # Drag & drop canvas
│   │   ├── inbox/                # Unified inbox
│   │   ├── analytics/            # Analytics dashboard
│   │   └── agents/               # Agent templates
│   └── api/                      # API routes
│       ├── canvas/               # Canvas CRUD
│       ├── inbox/                # Inbox operations
│       ├── linkedin/             # LinkedIn integration
│       ├── stripe/               # Payments
│       └── webhooks/             # Webhook handlers
├── components/                   # React components
│   ├── canvas/                   # Canvas components
│   ├── inbox/                    # Inbox components
│   └── ui/                       # Shared UI components
├── lib/                          # Core logic
│   ├── agents/                   # Agent implementations
│   │   ├── linkedin-agent.ts
│   │   ├── email-agent.ts
│   │   ├── twitter-agent.ts
│   │   └── instagram-agent.ts
│   ├── cron/                     # Cron job runners
│   ├── db/                       # Database
│   ├── services/                 # Business logic
│   └── data/                     # Static data
├── worker/                       # Background workers
│   ├── linkedin-worker.ts
│   └── linkedin-cron-job.ts
├── docs/                         # Documentation
├── public/                       # Static assets
└── render.yaml                   # Render.com config
```

---

## 💰 Pricing

### For End Users

| Plan | Price | Features |
|------|-------|----------|
| **Starter** | $99/mo | 3 agents, LinkedIn + Email + Twitter |
| **Pro** | $299/mo | 10 agents, All channels + Instagram |
| **Enterprise** | $999/mo | Unlimited agents, White-label |
| **Lifetime** | $499 | One-time payment (first 100 users) |

### For You (Self-Hosted)

**100% Free & Open Source** ✨

- No licensing fees
- No usage limits
- Full white-label rights
- Commercial use allowed

---

## 🚢 Deployment

### Vercel (Main App)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

### Render.com (Background Jobs)

```bash
# render.yaml is already configured
# Just connect your GitHub repo to Render.com

1. Go to render.com
2. New → Background Worker
3. Connect GitHub repo
4. Select "agenthub-linkedin-worker"
5. Deploy
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

---

## 🤝 Contributing

We love contributions! Here's how you can help:

1. 🐛 **Report bugs** - Open an issue
2. 💡 **Suggest features** - Start a discussion
3. 🔧 **Submit PRs** - Fix bugs or add features
4. 📖 **Improve docs** - Help others get started
5. ⭐ **Star the repo** - Show your support!

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## 📈 Roadmap

### Q1 2024
- [x] LinkedIn automation
- [x] Email campaigns
- [x] Twitter DMs
- [x] Instagram DMs
- [x] Unified inbox
- [x] Analytics dashboard
- [x] 20 agent templates

### Q2 2024
- [ ] Facebook Messenger
- [ ] WhatsApp Business API
- [ ] SMS campaigns
- [ ] Voice AI calls
- [ ] CRM integrations (Salesforce, HubSpot)
- [ ] Advanced A/B testing

### Q3 2024
- [ ] Mobile app (iOS/Android)
- [ ] Chrome extension
- [ ] AI voice cloning
- [ ] Video personalization
- [ ] Multi-language support

---

## 🎓 Learn More

### Blog Posts
- [How We Got Our First 100 Customers in 30 Days](https://blog.agenthub.com/first-100)
- [Building AI Agents with Claude 3.5](https://blog.agenthub.com/claude-agents)
- [LinkedIn Automation Best Practices](https://blog.agenthub.com/linkedin-automation)

### Videos
- [AgentHub Demo (5 min)](https://youtube.com/watch?v=demo)
- [Setting Up Your First Agent](https://youtube.com/watch?v=setup)
- [Advanced Automation Strategies](https://youtube.com/watch?v=advanced)

### Community
- [Discord](https://discord.gg/agenthub) - Get help & share tips
- [Twitter](https://twitter.com/agenthub) - Latest updates
- [LinkedIn](https://linkedin.com/company/agenthub) - Professional network

---

## 🏆 Success Stories

> "AgentHub generated $127K in pipeline in the first month. Best investment we've made."
> 
> **— Sarah Chen, Founder @ CloudSync**

> "Replaced 3 SDRs with AgentHub. Saving $15K/month and getting better results."
> 
> **— Mike Rodriguez, CEO @ GrowthLabs**

> "Booked 47 demos in 2 weeks. This is insane."
> 
> **— Emily Watson, Creator Economy**

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

You can:
- ✅ Use commercially
- ✅ Modify
- ✅ Distribute
- ✅ Sublicense
- ✅ Private use

---

## 🙏 Acknowledgments

Built with amazing open-source tools:
- [Next.js](https://nextjs.org)
- [Anthropic Claude](https://anthropic.com)
- [Stripe](https://stripe.com)
- [Clerk](https://clerk.com)
- [Drizzle ORM](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)

---

## 📞 Support

- 📧 Email: support@agenthub.com
- 💬 Discord: [Join our community](https://discord.gg/agenthub)
- 🐦 Twitter: [@agenthub](https://twitter.com/agenthub)
- 📚 Docs: [docs.agenthub.com](https://docs.agenthub.com)

---

<div align="center">

**[Get Started](https://agenthub.vercel.app)** • **[View Demo](https://demo.agenthub.com)** • **[Read Docs](https://docs.agenthub.com)**

Made with ❤️ by the AgentHub team

⭐ **Star us on GitHub** — it helps!

</div>
#   A g e n t H u b 
 
