# HLS Segmented Streaming Script for Ultra-Fast Video Loading
# Creates HLS segments for instant video playback

param(
    [string]$InputDir = "public\videos",
    [string]$OutputDir = "public\videos\hls",
    [string]$VideoFile = "hailuo-ai-video-02.mp4"
)

$ErrorActionPreference = "Stop"

Write-Host "🎬 HLS Segmented Streaming Script" -ForegroundColor Blue
Write-Host "=================================" -ForegroundColor Blue

# Create output directory
if (!(Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null }

# Check if ffmpeg is installed
try {
    $ffmpegVersion = & ffmpeg -version 2>$null
    Write-Host "✅ FFmpeg found" -ForegroundColor Green
} catch {
    Write-Host "❌ FFmpeg is not installed" -ForegroundColor Red
    exit 1
}

# Function to create HLS segments
function Create-HLSSegments {
    param($InputFile, $OutputDir)
    
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($InputFile)
    $playlistFile = Join-Path $OutputDir "$baseName.m3u8"
    $segmentPattern = Join-Path $OutputDir "${baseName}_%03d.ts"
    
    Write-Host "🔄 Creating HLS segments for: $(Split-Path $InputFile -Leaf)" -ForegroundColor Yellow
    
    $arguments = @(
        "-i", $InputFile,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "28",
        "-c:a", "aac",
        "-b:a", "128k",
        "-hls_time", "2",                    # 2-second segments for fast start
        "-hls_playlist_type", "vod",
        "-hls_segment_filename", $segmentPattern,
        "-hls_flags", "independent_segments",
        "-y",
        $playlistFile
    )
    
    & ffmpeg @arguments 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ HLS segments created: $playlistFile" -ForegroundColor Green
        
        # Show segment info
        $segments = Get-ChildItem -Path $OutputDir -Filter "*.ts"
        Write-Host "📊 Created $($segments.Count) segments" -ForegroundColor Blue
        
        return $playlistFile
    } else {
        Write-Host "❌ Failed to create HLS segments" -ForegroundColor Red
        return $null
    }
}

# Function to create multi-bitrate HLS for adaptive streaming
function Create-AdaptiveHLS {
    param($InputFile, $OutputDir)
    
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($InputFile)
    $masterPlaylist = Join-Path $OutputDir "master.m3u8"
    
    Write-Host "🔄 Creating adaptive HLS streams..." -ForegroundColor Yellow
    
    # Create different quality levels
    $qualities = @(
        @{ name="low"; resolution="640x360"; bitrate="500k"; crf="32" },
        @{ name="medium"; resolution="1280x720"; bitrate="1500k"; crf="28" },
        @{ name="high"; resolution="1920x1080"; bitrate="3000k"; crf="23" }
    )
    
    $playlists = @()
    
    foreach ($quality in $qualities) {
        $qualityDir = Join-Path $OutputDir $quality.name
        if (!(Test-Path $qualityDir)) { New-Item -ItemType Directory -Path $qualityDir -Force | Out-Null }
        
        $playlistFile = Join-Path $qualityDir "$baseName.m3u8"
        $segmentPattern = Join-Path $qualityDir "${baseName}_%03d.ts"
        
        Write-Host "  Creating $($quality.name) quality ($($quality.resolution))..." -ForegroundColor Cyan
        
        $arguments = @(
            "-i", $InputFile,
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-crf", $quality.crf,
            "-vf", "scale=$($quality.resolution)",
            "-maxrate", $quality.bitrate,
            "-bufsize", "$(([int]($quality.bitrate -replace 'k','')) * 2)k",
            "-c:a", "aac",
            "-b:a", "128k",
            "-hls_time", "2",
            "-hls_playlist_type", "vod",
            "-hls_segment_filename", $segmentPattern,
            "-hls_flags", "independent_segments",
            "-y",
            $playlistFile
        )
        
        & ffmpeg @arguments 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            $playlists += @{
                quality = $quality.name
                resolution = $quality.resolution
                bitrate = $quality.bitrate
                playlist = $playlistFile
            }
        }
    }
    
    # Create master playlist
    $masterContent = "#EXTM3U`n#EXT-X-VERSION:3`n"
    
    foreach ($playlist in $playlists) {
        $relativePath = "$($playlist.quality)/$baseName.m3u8"
        $bandwidth = [int]($playlist.bitrate -replace 'k','') * 1000
        $resolution = $playlist.resolution
        
        $masterContent += "#EXT-X-STREAM-INF:BANDWIDTH=$bandwidth,RESOLUTION=$resolution`n"
        $masterContent += "$relativePath`n"
    }
    
    Set-Content -Path $masterPlaylist -Value $masterContent
    
    Write-Host "✅ Adaptive HLS created: $masterPlaylist" -ForegroundColor Green
    return $masterPlaylist
}
