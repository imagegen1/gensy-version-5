# CDN Range Request Support Test Script
# Tests if your video hosting supports HTTP range requests for optimal streaming

param(
    [string]$VideoUrl = "http://localhost:3001/videos/hailuo-ai-video-02.mp4",
    [string]$CDNUrl = ""
)

Write-Host "🌐 CDN Range Request Support Test" -ForegroundColor Blue
Write-Host "==================================" -ForegroundColor Blue

# Function to test range request support
function Test-RangeRequestSupport {
    param($Url)
    
    Write-Host "🔍 Testing: $Url" -ForegroundColor Cyan
    
    try {
        # Test HEAD request for Accept-Ranges header
        $response = Invoke-WebRequest -Uri $Url -Method Head -ErrorAction Stop
        
        Write-Host "📊 Response Headers:" -ForegroundColor Yellow
        Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
        
        # Check for range support
        $acceptRanges = $response.Headers['Accept-Ranges']
        if ($acceptRanges -eq 'bytes') {
            Write-Host "  ✅ Accept-Ranges: bytes (EXCELLENT - Range requests supported)" -ForegroundColor Green
        } elseif ($acceptRanges) {
            Write-Host "  ⚠️  Accept-Ranges: $acceptRanges (Limited support)" -ForegroundColor Yellow
        } else {
            Write-Host "  ❌ Accept-Ranges: Not found (No range support)" -ForegroundColor Red
        }
        
        # Check other important headers
        $contentLength = $response.Headers['Content-Length']
        if ($contentLength) {
            $sizeMB = [math]::Round([int]$contentLength / 1MB, 2)
            Write-Host "  📁 Content-Length: $contentLength bytes ($sizeMB MB)" -ForegroundColor Blue
        }
        
        $contentType = $response.Headers['Content-Type']
        if ($contentType) {
            Write-Host "  🎬 Content-Type: $contentType" -ForegroundColor Blue
        }
        
        $cacheControl = $response.Headers['Cache-Control']
        if ($cacheControl) {
            Write-Host "  🗄️  Cache-Control: $cacheControl" -ForegroundColor Blue
        }
        
        $server = $response.Headers['Server']
        if ($server) {
            Write-Host "  🖥️  Server: $server" -ForegroundColor Blue
        }
        
        # Test actual range request
        Write-Host "`n🔍 Testing partial content request..." -ForegroundColor Cyan
        
        $rangeResponse = Invoke-WebRequest -Uri $Url -Headers @{'Range'='bytes=0-1023'} -ErrorAction Stop
        
        if ($rangeResponse.StatusCode -eq 206) {
            Write-Host "  ✅ Partial Content (206): Range requests working perfectly!" -ForegroundColor Green
            Write-Host "  📊 Received: $($rangeResponse.Content.Length) bytes" -ForegroundColor Blue
        } else {
            Write-Host "  ⚠️  Status $($rangeResponse.StatusCode): Range requests may not be optimal" -ForegroundColor Yellow
        }
        
        return $true
        
    } catch {
        Write-Host "  ❌ Error testing URL: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to test HTTP/2 support
function Test-HTTP2Support {
    param($Url)
    
    Write-Host "`n🔍 Testing HTTP/2 support..." -ForegroundColor Cyan
    
    try {
        # Use curl if available for HTTP/2 testing
        if (Get-Command curl -ErrorAction SilentlyContinue) {
            $curlOutput = & curl -I --http2 $Url 2>&1
            
            if ($curlOutput -match "HTTP/2") {
                Write-Host "  ✅ HTTP/2 supported!" -ForegroundColor Green
            } elseif ($curlOutput -match "HTTP/1.1") {
                Write-Host "  ⚠️  HTTP/1.1 only (consider upgrading to HTTP/2)" -ForegroundColor Yellow
            } else {
                Write-Host "  ❓ HTTP version unclear" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  ℹ️  curl not available - cannot test HTTP/2" -ForegroundColor Blue
        }
    } catch {
        Write-Host "  ❌ Error testing HTTP/2: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Main testing
Write-Host "🎯 Testing video hosting optimization..." -ForegroundColor Blue

# Test local development server
Write-Host "`n📍 LOCAL DEVELOPMENT SERVER:" -ForegroundColor Yellow
$localResult = Test-RangeRequestSupport $VideoUrl
Test-HTTP2Support $VideoUrl

# Test CDN if provided
if ($CDNUrl) {
    Write-Host "`n📍 CDN SERVER:" -ForegroundColor Yellow
    $cdnResult = Test-RangeRequestSupport $CDNUrl
    Test-HTTP2Support $CDNUrl
}

# Summary and recommendations
Write-Host "`n📋 SUMMARY & RECOMMENDATIONS:" -ForegroundColor Blue
Write-Host "==============================" -ForegroundColor Blue

if ($localResult) {
    Write-Host "✅ Local server supports range requests" -ForegroundColor Green
} else {
    Write-Host "❌ Local server issues detected" -ForegroundColor Red
    Write-Host "💡 For production, ensure your hosting supports:" -ForegroundColor Yellow
    Write-Host "   - HTTP Range Requests (Accept-Ranges: bytes)" -ForegroundColor Yellow
    Write-Host "   - HTTP/2 or HTTP/3" -ForegroundColor Yellow
    Write-Host "   - Proper MIME types for video files" -ForegroundColor Yellow
}

Write-Host "`n🚀 NEXT STEPS FOR INSTANT VIDEO PLAYBACK:" -ForegroundColor Blue
Write-Host "1. Run video optimization scripts to create faststart files" -ForegroundColor Cyan
Write-Host "2. Test on production CDN with range request support" -ForegroundColor Cyan
Write-Host "3. Consider HLS segmented streaming for very large videos" -ForegroundColor Cyan
Write-Host "4. Monitor real-world performance with different network speeds" -ForegroundColor Cyan

Write-Host "`n🎉 CDN optimization test complete!" -ForegroundColor Green
