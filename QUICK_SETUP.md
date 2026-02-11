# 🚀 Quick Setup Guide - Fix Database Errors

## ⚠️ Current Issue

You're seeing these errors because the **database is not configured**:
- `Error: Failed to load messages`
- `Error: Failed to load canvas`

## ✅ Solution (Choose One)

### **Option 1: Use Supabase (Recommended - Free)**

1. **Create a Supabase Account**
   - Go to [https://supabase.com](https://supabase.com)
   - Sign up for free
   - Create a new project

2. **Get Your Database Credentials**
   - In your Supabase project dashboard:
   - Go to **Settings** → **Database**
   - Copy the **Connection String** (URI format)
   - Go to **Settings** → **API**
   - Copy the **Project URL** and **anon public** key

3. **Run the Database Schema**
   - In Supabase dashboard, go to **SQL Editor**
   - Copy the contents of `supabase-schema.sql`
   - Paste and run it

4. **Create `.env.local` File**
   ```bash
   # Copy the example file
   cp .env.local.example .env.local
   ```

5. **Update `.env.local` with Your Credentials**
   ```env
   # Supabase Database
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   
   # Clerk (for authentication)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
   CLERK_SECRET_KEY=your_clerk_secret
   
   # Claude API (for AI features)
   ANTHROPIC_API_KEY=sk-ant-your_key_here
   ```

6. **Restart the Dev Server**
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

---

### **Option 2: Use Local PostgreSQL**

1. **Install PostgreSQL**
   - Download from [https://www.postgresql.org/download/](https://www.postgresql.org/download/)
   - Install and remember your password

2. **Create Database**
   ```bash
   psql -U postgres
   CREATE DATABASE agenthub;
   \q
   ```

3. **Run Schema**
   ```bash
   psql -U postgres -d agenthub -f supabase-schema.sql
   ```

4. **Create `.env.local`**
   ```env
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/agenthub
   ```

---

### **Option 3: Work Offline (Temporary)**

The app now has **fallback support** for localStorage when the database is not configured:

- **Canvas**: Your agent configurations are saved to browser localStorage
- **Inbox**: Will show empty until database is configured

**Limitations**:
- ❌ No real-time sync
- ❌ Data only saved in your browser
- ❌ No multi-device access
- ❌ Inbox features won't work

---

## 🔑 Required Environment Variables

### **Minimum to Run** (for testing)
```env
# Just these 3 to get started
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
DATABASE_URL=postgresql://...
```

### **Full Setup** (for all features)
```env
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Database
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx

# AI
ANTHROPIC_API_KEY=sk-ant-xxxxx

# LinkedIn Agent (optional)
LINKEDIN_EMAIL=your_email
LINKEDIN_PASSWORD=your_password

# Twitter Agent (optional)
TWITTER_BEARER_TOKEN=xxxxx

# Email Agent (optional)
RESEND_API_KEY=re_xxxxx
```

---

## 🧪 Test Your Setup

1. **Restart the dev server**
   ```bash
   npm run dev
   ```

2. **Check the terminal** - You should see:
   ```
   ✓ Ready in 2.5s
   ○ Local: http://localhost:3000
   ```

3. **Open the app** - Go to http://localhost:3000

4. **Check for errors**:
   - Open browser console (F12)
   - You should NOT see "Failed to load" errors anymore

---

## 📚 Where to Get API Keys

| Service | URL | Free Tier |
|---------|-----|-----------|
| **Clerk** (Auth) | [clerk.com](https://clerk.com) | ✅ 10,000 users |
| **Supabase** (Database) | [supabase.com](https://supabase.com) | ✅ 500MB |
| **Anthropic** (Claude AI) | [console.anthropic.com](https://console.anthropic.com) | ✅ $5 credit |
| **Resend** (Email) | [resend.com](https://resend.com) | ✅ 3,000/month |

---

## 🆘 Still Having Issues?

### Error: "DATABASE_URL is not defined"
- ✅ Make sure `.env.local` exists
- ✅ Make sure `DATABASE_URL` is set
- ✅ Restart the dev server

### Error: "Unauthorized"
- ✅ Check Clerk keys are correct
- ✅ Sign in to the app
- ✅ Make sure you're using the correct Clerk environment

### Error: "Connection refused"
- ✅ Check database is running
- ✅ Check connection string is correct
- ✅ Check firewall settings

---

## ✨ Quick Start (Fastest Way)

```bash
# 1. Copy example env file
cp .env.local.example .env.local

# 2. Sign up for Supabase (free)
# Visit: https://supabase.com

# 3. Create new project, get credentials

# 4. Update .env.local with your credentials

# 5. Run the schema in Supabase SQL Editor
# Copy/paste contents of supabase-schema.sql

# 6. Restart dev server
npm run dev
```

**That's it!** Your app should now work without errors. 🎉
