# ⚠️ Database Setup Required

## You're seeing errors because the database is not configured yet!

### 🎯 Quick Fix (5 minutes)

1. **Create a free Supabase account**: https://supabase.com
2. **Create a new project** (choose any name)
3. **Get your credentials**:
   - Go to Settings → Database → Copy "Connection string" (URI mode)
   - Go to Settings → API → Copy "Project URL" and "anon public" key
4. **Create `.env.local` file** in the project root:
   ```bash
   cp .env.local.example .env.local
   ```
5. **Edit `.env.local`** and add your credentials:
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```
6. **Run the database schema**:
   - In Supabase dashboard → SQL Editor
   - Copy contents of `supabase-schema.sql`
   - Paste and click "Run"
7. **Restart the dev server**:
   ```bash
   # Press Ctrl+C to stop
   npm run dev
   ```

### ✅ That's it! The errors will be gone.

---

## 📖 Detailed Guide

See **QUICK_SETUP.md** for complete instructions including:
- Alternative database options (local PostgreSQL)
- How to get Clerk authentication keys
- How to get Claude API key
- Troubleshooting tips

---

## 🔧 Current Status

Without database configuration:
- ✅ App runs (with warnings)
- ✅ Canvas works (saved to browser localStorage)
- ❌ Inbox doesn't work
- ❌ Real-time sync disabled
- ❌ Multi-device sync disabled

With database configured:
- ✅ Everything works
- ✅ Data persisted to cloud
- ✅ Real-time updates
- ✅ Multi-device sync
