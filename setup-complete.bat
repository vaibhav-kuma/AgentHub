@echo off
echo 🚀 AgentHub Complete Setup Script
echo ==================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    exit /b 1
)

echo ✅ Node.js and npm are installed

REM Install dependencies
echo.
echo 📦 Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)
echo ✅ Dependencies installed successfully

REM Create .env.local if it doesn't exist
if not exist ".env.local" (
    echo.
    echo 📝 Creating .env.local file...
    (
        echo # Clerk Authentication ^(Required^)
        echo NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
        echo CLERK_SECRET_KEY=your_clerk_secret_key_here
        echo CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret_here
        echo NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
        echo NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
        echo NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app/dashboard
        echo NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app/dashboard
        echo.
        echo # Supabase Database ^(Required^)
        echo NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
        echo NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
        echo SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
        echo DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
        echo.
        echo # Claude AI ^(Required^)
        echo ANTHROPIC_API_KEY=your_anthropic_api_key_here
        echo.
        echo # App Configuration ^(Required^)
        echo NEXT_PUBLIC_APP_URL=http://localhost:3000
        echo.
        echo # Optional: Additional API Keys ^(for full functionality^)
        echo # LinkedIn Automation
        echo LINKEDIN_EMAIL=your_linkedin_email@company.com
        echo LINKEDIN_PASSWORD=your_linkedin_password
        echo LINKEDIN_SESSION_COOKIE=li_at=your_session_cookie_here
        echo.
        echo # Email Automation ^(Resend^)
        echo RESEND_API_KEY=re_your_resend_api_key_here
        echo INSTANTLY_API_KEY=inst_your_instantly_api_key_here
        echo.
        echo # Twitter Automation
        echo TWITTER_APP_KEY=your_twitter_app_key
        echo TWITTER_APP_SECRET=your_twitter_app_secret
        echo TWITTER_ACCESS_TOKEN=your_twitter_access_token
        echo TWITTER_ACCESS_SECRET=your_twitter_access_secret
        echo.
        echo # Instagram Automation
        echo INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
        echo INSTAGRAM_ACCOUNT_ID=your_instagram_account_id
        echo.
        echo # Proxy Rotation ^(Optional^)
        echo PROXY_LIST=http://proxy1.com:8080,http://proxy2.com:8080
    ) > .env.local
    echo ✅ Created .env.local with template values
    echo ⚠️  IMPORTANT: You must fill in the required values in .env.local
    echo    See SETUP_GUIDE.md for detailed instructions
) else (
    echo ✅ .env.local already exists
)

REM Create tmp directory for file uploads
if not exist "tmp" (
    mkdir tmp
    echo ✅ Created tmp directory for file uploads
) else (
    echo ✅ tmp directory already exists
)

echo.
echo 🎯 Next Steps:
echo 1. Set up Supabase database:
echo    - Go to https://supabase.com
echo    - Create a new project
echo    - Go to SQL Editor and run the contents of supabase-schema.sql
echo.
echo 2. Configure environment variables in .env.local:
echo    - Add your Supabase URL and keys
echo    - Add your Clerk keys
echo    - Add your Anthropic API key
echo.
echo 3. Push database schema:
echo    npm run db:push
echo.
echo 4. Start the development server:
echo    npm run dev
echo.
echo 5. Open http://localhost:3000 in your browser
echo.
echo 📚 For detailed setup instructions, see SETUP_GUIDE.md
echo.
echo 🎉 Setup script completed! AgentHub is ready to be configured.
