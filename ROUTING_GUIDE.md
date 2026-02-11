# 🗺️ AgentHub Routing Guide

## Route Structure

```
┌─────────────────────────────────────────────────────────────┐
│                     PUBLIC ROUTES                            │
└─────────────────────────────────────────────────────────────┘

/                           → Marketing Landing Page
                             ├─ Hero with waitlist
                             ├─ Feature cards
                             ├─ Social proof
                             └─ CTA section
                             
/sign-in                    → Clerk Sign In Page
                             └─ Auto-redirect to /app/dashboard after login

/sign-up                    → Clerk Sign Up Page
                             └─ Auto-redirect to /app/dashboard after signup


┌─────────────────────────────────────────────────────────────┐
│                  PROTECTED ROUTES (/app/*)                   │
│                  Requires Authentication                      │
└─────────────────────────────────────────────────────────────┘

/app/dashboard              → Main Dashboard
                             ├─ Stats cards (4)
                             ├─ Recent activity feed
                             ├─ Quick actions
                             └─ Top performing agents

/app/agents                 → Agent Templates Gallery
                             ├─ Search bar
                             ├─ Category filters
                             └─ Template cards (6)

/app/inbox                  → Unified Inbox (Superhuman style)
                             ├─ Message list
                             ├─ Message detail
                             ├─ Filters (All/Unread/Starred/Agents)
                             └─ Quick reply

/app/settings               → Settings Page
                             ├─ Profile
                             ├─ Notifications
                             ├─ Appearance
                             ├─ Security
                             ├─ Team
                             └─ Billing


┌─────────────────────────────────────────────────────────────┐
│                      API ROUTES                              │
└─────────────────────────────────────────────────────────────┘

/api/claude                 → Claude AI Integration
                             └─ POST: Send messages to Claude

/api/webhooks/clerk         → Clerk Webhook Handler
                             └─ POST: Sync user data to database
```

## Navigation Flow

### First-Time User
```
1. Visit /
   ↓
2. Click "Get Started"
   ↓
3. Redirected to /sign-up
   ↓
4. Complete signup
   ↓
5. Auto-redirect to /app/dashboard
   ↓
6. Explore app via sidebar
```

### Returning User
```
1. Visit /
   ↓
2. Already authenticated
   ↓
3. Auto-redirect to /app/dashboard
   ↓
4. Continue working
```

### Logged Out User Accessing Protected Route
```
1. Visit /app/dashboard (or any /app/* route)
   ↓
2. Middleware detects no auth
   ↓
3. Redirect to /sign-in
   ↓
4. After login → back to /app/dashboard
```

## Sidebar Navigation

```
┌─────────────────────────┐
│      AgentHub Logo      │
├─────────────────────────┤
│  📊 Dashboard           │ → /app/dashboard
│  🤖 Agents              │ → /app/agents
│  📬 Inbox          [3]  │ → /app/inbox
│  ⚙️  Settings           │ → /app/settings
├─────────────────────────┤
│  ➕ New Agent           │ → Quick action
├─────────────────────────┤
│  ⭐ Upgrade to Pro      │ → Upgrade CTA
└─────────────────────────┘
```

## Mobile Navigation

```
┌─────────────────────────┐
│  ☰  [Search]  🔔  👤   │ ← Header
└─────────────────────────┘
         ↓
    Click ☰
         ↓
┌─────────────────────────┐
│  Slide-in Sidebar       │
│  (Same as desktop)      │
│                         │
│  Tap outside to close   │
└─────────────────────────┘
```

## Authentication States

### Not Authenticated
- ✅ Can access: `/`, `/sign-in`, `/sign-up`
- ❌ Cannot access: `/app/*`
- 🔄 Redirect: `/app/*` → `/sign-in`

### Authenticated
- ✅ Can access: All routes
- 🔄 Redirect: `/` → `/app/dashboard`
- 🔄 Redirect: `/sign-in` → `/app/dashboard`
- 🔄 Redirect: `/sign-up` → `/app/dashboard`

## Page Layouts

### Marketing Layout (/)
```
┌─────────────────────────────────────┐
│  Nav: Logo | Sign In | Get Started  │
├─────────────────────────────────────┤
│                                     │
│         Hero Section                │
│         Waitlist Form               │
│                                     │
├─────────────────────────────────────┤
│         Feature Cards (3)           │
├─────────────────────────────────────┤
│         Social Proof                │
├─────────────────────────────────────┤
│         CTA Section                 │
├─────────────────────────────────────┤
│         Footer                      │
└─────────────────────────────────────┘
```

### App Layout (/app/*)
```
┌─────────────────────────────────────┐
│  Sidebar  │  Header: Search 🔔 👤  │
│           ├─────────────────────────┤
│  📊 Dash  │                         │
│  🤖 Agents│                         │
│  📬 Inbox │    Page Content         │
│  ⚙️  Set   │                         │
│           │                         │
│  ➕ New   │                         │
│           │                         │
│  ⭐ Pro   │                         │
└───────────┴─────────────────────────┘
```

## URL Parameters (Future)

```
/app/agents?category=Research       → Filter by category
/app/agents?search=email           → Search templates
/app/inbox?filter=unread           → Filter messages
/app/inbox?message=123             → Open specific message
/app/settings?tab=billing          → Open specific tab
```

## Deep Links (Future)

```
/app/agents/new                    → Create new agent
/app/agents/:id                    → View/edit agent
/app/teams/:id                     → View team
/app/inbox/:messageId              → View message
```

## Redirects Summary

| From | To | Condition |
|------|-----|-----------|
| `/` | `/app/dashboard` | If authenticated |
| `/sign-in` | `/app/dashboard` | If authenticated |
| `/sign-up` | `/app/dashboard` | If authenticated |
| `/app/*` | `/sign-in` | If not authenticated |
| `/dashboard` | `/app/dashboard` | Always (legacy) |

## Environment-Specific URLs

### Development
```
http://localhost:3000/
http://localhost:3000/app/dashboard
```

### Production
```
https://your-domain.vercel.app/
https://your-domain.vercel.app/app/dashboard
```

## SEO & Meta Tags

### Marketing Page (/)
```html
<title>AgentHub - AI Agent Team Builder</title>
<meta name="description" content="Build Your AI Agent Dream Team" />
```

### App Pages (/app/*)
```html
<title>Dashboard - AgentHub</title>
<title>Agents - AgentHub</title>
<title>Inbox - AgentHub</title>
<title>Settings - AgentHub</title>
```

---

**All routes are now live and ready to use!** 🚀
