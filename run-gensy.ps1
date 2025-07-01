Write-Host "🚀 Starting Gensy AI Creative Suite..." -ForegroundColor Cyan
Write-Host ""

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🌟 Starting development server..." -ForegroundColor Yellow
    Write-Host "🔗 The app will be available at: http://localhost:3000" -ForegroundColor Magenta
    Write-Host ""
    
    npm run dev
} else {
    Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
    Write-Host "Please check your Node.js installation and try again." -ForegroundColor Red
}

Read-Host "Press Enter to exit"
