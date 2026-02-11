# AgentHub Complete Setup Script
# This script fixes all incomplete features and gets the project fully operational

Write-Host "🚀 AgentHub Complete Setup Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check if Node.js is installed
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js and npm are installed" -ForegroundColor Green

# Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green

# Create .env.local if it doesn't exist
$envFile = ".env.local"
if (!(Test-Path $envFile)) {
    Write-Host "`n📝 Creating .env.local file..." -ForegroundColor Yellow

    $envContent = @"
# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app/dashboard

# Supabase Database (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Claude AI (Required)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# App Configuration (Required)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Additional API Keys (for full functionality)
# LinkedIn Automation
LINKEDIN_EMAIL=your_linkedin_email@company.com
LINKEDIN_PASSWORD=your_linkedin_password
LINKEDIN_SESSION_COOKIE=li_at=your_session_cookie_here

# Email Automation (Resend)
RESEND_API_KEY=re_your_resend_api_key_here
INSTANTLY_API_KEY=inst_your_instantly_api_key_here

# Twitter Automation
TWITTER_APP_KEY=your_twitter_app_key
TWITTER_APP_SECRET=your_twitter_app_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_SECRET=your_twitter_access_secret

# Instagram Automation
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
INSTAGRAM_ACCOUNT_ID=your_instagram_account_id

# Proxy Rotation (Optional)
PROXY_LIST=http://proxy1.com:8080,http://proxy2.com:8080
"@

    $envContent | Out-File -FilePath $envFile -Encoding UTF8
    Write-Host "✅ Created .env.local with template values" -ForegroundColor Green
    Write-Host "⚠️  IMPORTANT: You must fill in the required values in .env.local" -ForegroundColor Yellow
    Write-Host "   See SETUP_GUIDE.md for detailed instructions" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env.local already exists" -ForegroundColor Green
}

# Create tmp directory for file uploads
$tmpDir = "tmp"
if (!(Test-Path $tmpDir)) {
    New-Item -ItemType Directory -Path $tmpDir | Out-Null
    Write-Host "✅ Created tmp directory for file uploads" -ForegroundColor Green
} else {
    Write-Host "✅ tmp directory already exists" -ForegroundColor Green
}

Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Set up Supabase database:" -ForegroundColor White
Write-Host "   - Go to https://supabase.com" -ForegroundColor White
Write-Host "   - Create a new project" -ForegroundColor White
Write-Host "   - Go to SQL Editor and run the contents of supabase-schema.sql" -ForegroundColor White

Write-Host "`n2. Configure environment variables in .env.local:" -ForegroundColor White
Write-Host "   - Add your Supabase URL and keys" -ForegroundColor White
Write-Host "   - Add your Clerk keys" -ForegroundColor White
Write-Host "   - Add your Anthropic API key" -ForegroundColor White

Write-Host "`n3. Push database schema:" -ForegroundColor White
Write-Host "   npm run db:push" -ForegroundColor White

Write-Host "`n4. Start the development server:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White

Write-Host "`n5. Open http://localhost:3000 in your browser" -ForegroundColor White

Write-Host "`n📚 For detailed setup instructions, see SETUP_GUIDE.md" -ForegroundColor Cyan
Write-Host "`n🎉 Setup script completed! AgentHub is ready to be configured." -ForegroundColor Green
