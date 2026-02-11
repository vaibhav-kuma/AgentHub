# AgentHub Setup Guide

## Step-by-Step Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Clerk Authentication

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Choose your authentication methods (Email, Google, GitHub, etc.)
4. Copy your API keys from the dashboard
5. Add to `.env.local`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
   CLERK_SECRET_KEY=sk_test_xxxxx
   ```

### 3. Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Wait for the database to be provisioned
4. Go to Settings > API and copy:
   - Project URL
   - Anon/Public key
   - Service Role key (keep this secret!)
5. Go to Settings > Database and copy the connection string
6. Add to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
   SUPABASE_SERVICE_ROLE_KEY=xxxxx
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### 4. Run Database Schema

Option A: Using Supabase SQL Editor
1. Open your Supabase project
2. Go to SQL Editor
3. Copy the contents of `supabase-schema.sql`
4. Paste and run the SQL

Option B: Using Drizzle Push
```bash
npm run db:push
```

### 5. Set Up Claude API

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account or sign in
3. Go to API Keys
4. Create a new API key
5. Add to `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-xxxxx
   ```

### 6. Configure Clerk Webhooks

1. In Clerk Dashboard, go to Webhooks
2. Click "Add Endpoint"
3. For local development, use a tool like [ngrok](https://ngrok.com):
   ```bash
   ngrok http 3000
   ```
4. Add endpoint URL: `https://your-ngrok-url.ngrok.io/api/webhooks/clerk`
5. Subscribe to events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
6. Copy the signing secret
7. Add to `.env.local`:
   ```
   CLERK_WEBHOOK_SECRET=whsec_xxxxx
   ```

### 7. Configure Clerk URLs

Add these to your `.env.local`:
```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### 8. Set App URL

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 9. Install shadcn/ui Components (Optional)

Install components as needed:
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add tabs
npx shadcn@latest add toast
```

### 10. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Production Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Add all environment variables from `.env.local`
6. Click "Deploy"

### Update Clerk Webhook for Production

1. After deployment, get your production URL
2. In Clerk Dashboard, add a new webhook endpoint
3. Use: `https://your-domain.vercel.app/api/webhooks/clerk`
4. Subscribe to the same events
5. Update `CLERK_WEBHOOK_SECRET` in Vercel environment variables

## Troubleshooting

### Database Connection Issues
- Ensure your DATABASE_URL is correct
- Check if your IP is allowed in Supabase (Settings > Database > Connection Pooling)
- Verify the password in the connection string

### Clerk Authentication Not Working
- Verify all Clerk environment variables are set
- Check that middleware.ts is properly configured
- Ensure your domain is added in Clerk Dashboard

### Claude API Errors
- Verify your ANTHROPIC_API_KEY is valid
- Check your API usage limits
- Ensure you have billing set up if required

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run lint`

## Next Steps

After setup, you can:
1. Create your first team
2. Add AI agents to your team
3. Configure agent personalities and roles
4. Start chatting with your agent team
5. Add knowledge bases
6. Set up integrations

## Support

For issues or questions:
- Check the README.md
- Review the FOLDER_STRUCTURE.md
- Open an issue on GitHub
