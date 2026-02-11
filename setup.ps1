# AgentHub Quick Start Script
# Run this script to set up your development environment

Write-Host "🚀 AgentHub Setup Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check if .env.local exists
Write-Host ""
Write-Host "Checking environment variables..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "✅ .env.local file found" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env.local not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item ".env.local.example" ".env.local"
    Write-Host "✅ Created .env.local from template" -ForegroundColor Green
    Write-Host "⚠️  Please edit .env.local and add your API keys!" -ForegroundColor Yellow
}

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Summary
Write-Host ""
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit .env.local and add your API keys" -ForegroundColor White
Write-Host "   - Clerk: https://clerk.com" -ForegroundColor Gray
Write-Host "   - Supabase: https://supabase.com" -ForegroundColor Gray
Write-Host "   - Claude API: https://console.anthropic.com" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Set up your database:" -ForegroundColor White
Write-Host "   npm run db:push" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Start the development server:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "   - README.md - Project overview" -ForegroundColor Gray
Write-Host "   - SETUP_GUIDE.md - Detailed setup instructions" -ForegroundColor Gray
Write-Host "   - FOLDER_STRUCTURE.md - Project structure" -ForegroundColor Gray
Write-Host "   - PROJECT_SUMMARY.md - Complete summary" -ForegroundColor Gray
Write-Host ""
Write-Host "Happy coding! 🎉" -ForegroundColor Cyan
