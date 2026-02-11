# 📊 Webhooks & Analytics - Complete Implementation

## ✅ Implementation Complete!

I've built a **complete webhook system, Zapier/Make integration, and analytics dashboard** with ROI calculator!

---

## 📦 What's Been Delivered

### **New Files Created (9)**

#### **Channel Agents (3 files)**
1. ✅ **`lib/agents/email-agent.ts`** - Cold email with Resend + Instantly.ai
2. ✅ **`lib/agents/twitter-agent.ts`** - Twitter/X DM automation
3. ✅ **`lib/agents/instagram-agent.ts`** - Instagram DM via Meta Graph API

#### **Webhook System (3 files)**
4. ✅ **`lib/db/webhook-schema.ts`** - Database schema for webhooks & analytics
5. ✅ **`lib/services/webhook-service.ts`** - Webhook trigger service
6. ✅ **`app/api/webhooks/route.ts`** - Webhook CRUD API

#### **Analytics (2 files)**
7. ✅ **`app/api/analytics/route.ts`** - Analytics data API
8. ✅ **`app/app/analytics/page.tsx`** - Analytics dashboard UI

#### **Documentation (1 file)**
9. ✅ **`WEBHOOKS_ANALYTICS_COMPLETE.md`** - This file

### **Updated Files (1)**
10. ✅ **`package.json`** - Added axios, resend, twitter-api-v2, recharts

---

## 🎯 Webhook System

### **Supported Events**

```typescript
type WebhookEvent = 
  | "new_lead"           // New prospect identified
  | "meeting_booked"     // Meeting scheduled
  | "positive_reply"     // Positive sentiment detected
  | "message_sent";      // Message sent successfully
```

### **Create Webhook**

```typescript
POST /api/webhooks
{
  "name": "Zapier Integration",
  "url": "https://hooks.zapier.com/hooks/catch/...",
  "events": ["new_lead", "meeting_booked", "positive_reply"],
  "integrationType": "zapier",  // or "make", "custom"
  "agentId": "agent-123"  // optional
}

Response:
{
  "success": true,
  "webhook": {
    "id": "webhook-456",
    "secret": "abc123...",  // Use for signature verification
    "url": "https://hooks.zapier.com/...",
    "events": ["new_lead", "meeting_booked", "positive_reply"]
  }
}
```

### **Webhook Payload**

```json
{
  "event": "new_lead",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "prospectName": "John Doe",
    "prospectEmail": "john@example.com",
    "prospectCompany": "Acme Corp",
    "prospectTitle": "VP of Sales",
    "channel": "linkedin",
    "message": "Hi John, saw your recent post...",
    "sentiment": "positive",
    "agentId": "agent-123",
    "agentName": "SDR Bot"
  }
}
```

### **Signature Verification**

```typescript
// Webhook includes X-AgentHub-Signature header
const signature = crypto
  .createHmac("sha256", webhookSecret)
  .update(JSON.stringify(payload))
  .digest("hex");

// Verify in your endpoint
if (req.headers["x-agenthub-signature"] !== signature) {
  return res.status(401).json({ error: "Invalid signature" });
}
```

### **Retry Logic**

- **3 automatic retries** with exponential backoff
- Delays: 2s, 4s, 8s
- All attempts logged in `webhook_logs` table

---

## 🔗 Zapier/Make Integration

### **Zapier Setup**

```
1. Create new Zap
   ↓
2. Trigger: Webhooks by Zapier
   ↓
3. Event: Catch Hook
   ↓
4. Copy webhook URL
   ↓
5. Paste into AgentHub webhook settings
   ↓
6. Test webhook
   ↓
7. Add actions:
   - Add to Google Sheets
   - Create Salesforce lead
   - Send Slack notification
   - Add to email list
   - etc.
```

### **Make.com Setup**

```
1. Create new scenario
   ↓
2. Add Webhooks module
   ↓
3. Choose "Custom webhook"
   ↓
4. Copy webhook URL
   ↓
5. Paste into AgentHub
   ↓
6. Add modules:
   - HTTP requests
   - CRM updates
   - Email notifications
   - Database inserts
```

### **Common Use Cases**

**1. New Lead → Add to CRM**
```
Trigger: new_lead
Action: Create Salesforce/HubSpot contact
```

**2. Meeting Booked → Calendar + Notification**
```
Trigger: meeting_booked
Actions:
  - Add to Google Calendar
  - Send Slack notification
  - Email team
```

**3. Positive Reply → Alert Sales Team**
```
Trigger: positive_reply
Actions:
  - Send email to sales rep
  - Create task in Asana
  - Log in Notion
```

---

## 📊 Analytics Dashboard

### **Key Metrics**

#### **Leads Generated**
- Total prospects identified
- Trend over time
- By channel breakdown

#### **Reply Rate**
```
Reply Rate = (Replies Received / Messages Sent) × 100
```

#### **Meetings Booked**
- Total meetings scheduled
- Meeting booking rate
- Cost per meeting

#### **Cost per Meeting**
```
Cost per Meeting = Monthly Agent Cost / Meetings Booked
```

### **ROI Calculator**

```typescript
// Hardcoded comparison
Human Salary: $20,000/year = $1,667/month
AgentHub Cost: $299/month

Monthly Savings: $1,667 - $299 = $1,368
ROI: ($1,368 / $299) × 100 = 457%
Annual Savings: $1,368 × 12 = $16,416
```

**Dashboard Display:**
```
┌─────────────────────────────────────┐
│  ROI Calculator                     │
├─────────────────────────────────────┤
│  Human Salary: $20,000/year         │
│  AgentHub Cost: $299/month          │
│                                     │
│  Your ROI: 457%                     │
│  Monthly Savings: $1,368            │
│  Annual Savings: $16,416            │
└─────────────────────────────────────┘
```

### **Charts**

#### **1. Activity Over Time (Line Chart)**
- Leads generated
- Replies received
- Meetings booked
- Time series data

#### **2. Channel Performance (Bar Chart)**
- LinkedIn vs Twitter vs Email vs Instagram
- Leads, replies, meetings by channel

#### **3. Additional Metrics**
- Positive reply rate
- Meeting booking rate
- Total messages sent

---

## 🎨 Analytics UI

### **Stat Cards**

```tsx
<StatCard
  title="Leads Generated"
  value={152}
  icon={Users}
  color="blue"
  change="+12%"
  trend="up"
/>
```

### **ROI Banner**

```tsx
<div className="bg-gradient-to-r from-blue-500 to-purple-600">
  <h2>ROI Calculator</h2>
  <div className="grid grid-cols-2">
    <div>
      <p>Human Salary (Annual)</p>
      <p className="text-3xl">$20,000</p>
    </div>
    <div>
      <p>AgentHub Cost</p>
      <p className="text-3xl">$299/mo</p>
    </div>
  </div>
  <div className="text-6xl">{roi}%</div>
</div>
```

### **Period Selector**

```tsx
<button onClick={() => setPeriod(7)}>7 days</button>
<button onClick={() => setPeriod(30)}>30 days</button>
<button onClick={() => setPeriod(90)}>90 days</button>
```

---

## 📧 Cold Email Agent

### **Features**

- ✅ Resend.com integration
- ✅ Instantly.ai warmup support
- ✅ Claude-powered personalization
- ✅ Random delays (30-60s between emails)
- ✅ Subject line generation
- ✅ HTML + plain text emails

### **Usage**

```typescript
import { ColdEmailAgent } from "@/lib/agents/email-agent";

const agent = new ColdEmailAgent(instantlyApiKey);

// Generate personalized email
const { subject, body } = await agent.generateEmail(
  {
    email: "john@example.com",
    name: "John Doe",
    company: "Acme Corp",
    title: "VP of Sales"
  },
  knowledgeBase,
  agentConfig
);

// Send email
const result = await agent.sendEmail(
  "john@example.com",
  subject,
  body,
  "you@company.com",
  "Your Name"
);

// Add to Instantly warmup
await agent.addToInstantlyWarmup("you@company.com");
```

---

## 🐦 Twitter/X DM Agent

### **Features**

- ✅ Twitter API v2 integration
- ✅ Find users who engaged with target accounts
- ✅ Engagement types: likes, retweets, replies
- ✅ Follower check (reduce spam risk)
- ✅ Claude-powered DM generation
- ✅ Inbox monitoring

### **Usage**

```typescript
import { TwitterDMAgent } from "@/lib/agents/twitter-agent";

const agent = new TwitterDMAgent({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET
});

// Get engaged users
const users = await agent.getEngagedUsers(
  ["@elonmusk", "@naval"],  // Target accounts
  "likes"  // or "retweets", "replies"
);

// Run campaign
const results = await agent.runCampaign(
  ["@elonmusk", "@naval"],
  knowledgeBase,
  agentConfig,
  50  // daily limit
);

// Monitor inbox
const newMessages = await agent.monitorInbox();
```

---

## 📸 Instagram DM Agent

### **Features**

- ✅ Meta Graph API integration
- ✅ Find users who engaged with posts
- ✅ Engagement types: likes, comments
- ✅ Profile fetching
- ✅ Claude-powered DM generation
- ✅ Inbox monitoring

### **Usage**

```typescript
import { InstagramDMAgent } from "@/lib/agents/instagram-agent";

const agent = new InstagramDMAgent({
  accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
  instagramBusinessAccountId: process.env.INSTAGRAM_ACCOUNT_ID
});

// Get engaged users
const users = await agent.getEngagedUsers(10);  // last 10 posts

// Run campaign
const results = await agent.runCampaign(
  knowledgeBase,
  agentConfig,
  50  // daily limit
);

// Monitor inbox
const newMessages = await agent.monitorInbox();
```

---

## 🗄️ Database Schema

### **Webhooks Table**

```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id UUID,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT,
  events TEXT[] NOT NULL,  -- ['new_lead', 'meeting_booked', ...]
  integration_type TEXT,   -- 'zapier', 'make', 'custom'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Webhook Logs Table**

```sql
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY,
  webhook_id UUID NOT NULL,
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL,  -- 'success', 'failed', 'pending'
  status_code INTEGER,
  response TEXT,
  error TEXT,
  attempt_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Analytics Events Table**

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id UUID,
  event_type TEXT NOT NULL,  -- 'lead_generated', 'reply_received', etc.
  channel TEXT NOT NULL,      -- 'linkedin', 'twitter', 'email', 'instagram'
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 API Endpoints

### **Webhooks**

```typescript
GET    /api/webhooks              // List all webhooks
POST   /api/webhooks              // Create webhook
PUT    /api/webhooks              // Update webhook
DELETE /api/webhooks?webhookId=X  // Delete webhook
```

### **Analytics**

```typescript
GET /api/analytics?period=30&agentId=X

Response:
{
  "summary": {
    "leadsGenerated": 152,
    "messagesSent": 500,
    "repliesReceived": 75,
    "positiveReplies": 45,
    "meetingsBooked": 12,
    "replyRate": "15.0",
    "positiveReplyRate": "60.0",
    "meetingBookingRate": "16.0",
    "costPerMeeting": "24.92"
  },
  "roi": {
    "monthlyAgentCost": 299,
    "humanSalaryCost": "1667",
    "monthlySavings": "1368",
    "roi": "457",
    "annualSavings": "16416"
  },
  "chartData": [...],
  "channelBreakdown": [...]
}
```

---

## 🎯 Triggering Webhooks

### **In Your Code**

```typescript
import { WebhookService } from "@/lib/services/webhook-service";

// When a new lead is generated
await WebhookService.trigger(userId, "new_lead", {
  prospectName: "John Doe",
  prospectEmail: "john@example.com",
  prospectCompany: "Acme Corp",
  channel: "linkedin",
  agentId: "agent-123",
  agentName: "SDR Bot"
});

// When a meeting is booked
await WebhookService.trigger(userId, "meeting_booked", {
  prospectName: "Jane Smith",
  prospectEmail: "jane@example.com",
  channel: "email",
  meetingTime: "2024-01-20T14:00:00Z"
});

// When a positive reply is received
await WebhookService.trigger(userId, "positive_reply", {
  prospectName: "Bob Johnson",
  channel: "twitter",
  message: "This looks great! Let's chat.",
  sentiment: "positive"
});
```

---

## 🎉 Success Criteria Met

✅ **Webhook triggers** - new_lead, meeting_booked, positive_reply  
✅ **Zapier integration** - Full webhook support with signature verification  
✅ **Make.com integration** - Compatible webhook format  
✅ **Analytics dashboard** - Complete with charts and metrics  
✅ **Leads generated** - Tracked and displayed  
✅ **Reply rate** - Calculated and visualized  
✅ **Meetings booked** - Tracked with booking rate  
✅ **Cost per meeting** - Calculated dynamically  
✅ **ROI calculator** - $20K human vs $299/month agent  
✅ **Cold email agent** - Resend + Instantly.ai integration  
✅ **Twitter DM agent** - Full Twitter API v2 support  
✅ **Instagram DM agent** - Meta Graph API integration  

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables
RESEND_API_KEY=re_...
INSTANTLY_API_KEY=inst_...
TWITTER_APP_KEY=...
TWITTER_APP_SECRET=...
TWITTER_ACCESS_TOKEN=...
TWITTER_ACCESS_SECRET=...
INSTAGRAM_ACCESS_TOKEN=...
INSTAGRAM_ACCOUNT_ID=...

# 3. Run migrations
npm run db:push

# 4. Start dev server
npm run dev

# 5. View analytics
http://localhost:3000/app/analytics

# 6. Set up webhooks
http://localhost:3000/app/settings
```

---

## 🎉 You're Ready!

The complete system is **production-ready** with:

- 📧 Cold email automation (Resend + Instantly.ai)
- 🐦 Twitter DM automation (Twitter API v2)
- 📸 Instagram DM automation (Meta Graph API)
- 🔔 Webhook triggers (3 events)
- 🔗 Zapier/Make integration
- 📊 Analytics dashboard with charts
- 💰 ROI calculator
- 📈 Performance metrics

**Connect your channels and start automating!** 🚀

---

*Built with Resend, Twitter API v2, Meta Graph API, Recharts, and Next.js 15*
