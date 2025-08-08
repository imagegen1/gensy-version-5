# Video Optimization Script for Instant Playback (PowerShell)
# This script optimizes MP4 and WebM files for streaming

param(
    [string]$InputDir = "public\videos",
    [string]$OutputDir = "public\videos\optimized",
    [string]$BackupDir = "public\videos\backup"
)

# Configuration
$ErrorActionPreference = "Stop"

Write-Host "🎬 ADVANCED Video Optimization Script" -ForegroundColor Blue
Write-Host "=====================================" -ForegroundColor Blue
Write-Host "Implements instant playback optimizations" -ForegroundColor Cyan

# Create directories
if (!(Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null }
if (!(Test-Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null }

# Check if ffmpeg is installed
try {
    $ffmpegVersion = & ffmpeg -version 2>$null
    Write-Host "✅ FFmpeg found" -ForegroundColor Green
} catch {
    Write-Host "❌ FFmpeg is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   Download from https://ffmpeg.org/download.html" -ForegroundColor Yellow
    Write-Host "   Or use chocolatey: choco install ffmpeg" -ForegroundColor Yellow
    exit 1
}

# Function to optimize MP4 for streaming
function Optimize-MP4 {
    param($InputFile, $OutputFile, [switch]$IsHero)

    $fileType = if ($IsHero) { "Hero MP4" } else { "MP4" }
    Write-Host "🔄 Optimizing $fileType`: $(Split-Path $InputFile -Leaf)" -ForegroundColor Yellow

    # Hero videos get more aggressive optimization for instant playback
    $crf = if ($IsHero) { "28" } else { "23" }
    $maxrate = if ($IsHero) { "1.5M" } else { "2M" }
    $bufsize = if ($IsHero) { "3M" } else { "4M" }

    $arguments = @(
        "-i", $InputFile,
        "-c:v", "libx264",
        "-crf", $crf,
        "-preset", "medium",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        "-pix_fmt", "yuv420p",
        "-profile:v", "baseline",
        "-level", "3.0",
        "-maxrate", $maxrate,
        "-bufsize", $bufsize,
        "-y",
        $OutputFile
    )
    
    & ffmpeg @arguments 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MP4 optimized: $(Split-Path $OutputFile -Leaf)" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to optimize MP4: $(Split-Path $InputFile -Leaf)" -ForegroundColor Red
    }
}

# Function to optimize WebM for streaming
function Optimize-WebM {
    param($InputFile, $OutputFile, [switch]$IsHero)

    $fileType = if ($IsHero) { "Hero WebM" } else { "WebM" }
    Write-Host "🔄 Optimizing $fileType`: $(Split-Path $InputFile -Leaf)" -ForegroundColor Yellow
    
    $arguments = @(
        "-i", $InputFile,
        "-c:v", "libvpx-vp9",
        "-crf", "30",
        "-b:v", "1M",
        "-maxrate", "1.5M",
        "-minrate", "0.5M",
        "-c:a", "libopus",
        "-b:a", "128k",
        "-cluster_size_limit", "2M",
        "-cluster_time_limit", "5100",
        "-auto-alt-ref", "1",
        "-lag-in-frames", "25",
        "-row-mt", "1",
        "-y",
        $OutputFile
    )
    
    & ffmpeg @arguments 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ WebM optimized: $(Split-Path $OutputFile -Leaf)" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to optimize WebM: $(Split-Path $InputFile -Leaf)" -ForegroundColor Red
    }
}

# Function to create ultra-compressed stub video for instant loading
function Create-StubVideo {
    param($InputFile, $OutputFile, $Format)

    Write-Host "🔄 Creating ultra-fast stub video: $(Split-Path $OutputFile -Leaf)" -ForegroundColor Magenta

    if ($Format -eq "mp4") {
        $arguments = @(
            "-i", $InputFile,
            "-t", "2",                    # Only first 2 seconds
            "-vf", "scale=240:-2",        # Tiny resolution for speed
            "-c:v", "libx264",
            "-crf", "35",                 # High compression
            "-preset", "ultrafast",
            "-c:a", "aac",
            "-b:a", "64k",
            "-movflags", "+faststart",
            "-y",
            $OutputFile
        )
    } else {
        $arguments = @(
            "-i", $InputFile,
            "-t", "2",                    # Only first 2 seconds
            "-vf", "scale=240:-2",        # Tiny resolution for speed
            "-c:v", "libvpx-vp9",
            "-crf", "40",                 # High compression
            "-b:v", "200k",               # Very low bitrate
            "-c:a", "libopus",
            "-b:a", "64k",
            "-y",
            $OutputFile
        )
    }

    & ffmpeg @arguments 2>$null

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Stub video created: $(Split-Path $OutputFile -Leaf)" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create stub video: $(Split-Path $InputFile -Leaf)" -ForegroundColor Red
    }
}

# Function to verify fast start metadata
function Test-FastStartMetadata {
    param($VideoFile)

    Write-Host "🔍 Verifying fast start metadata: $(Split-Path $VideoFile -Leaf)" -ForegroundColor Cyan

    $output = & ffmpeg -i $VideoFile -c copy -an -f null - 2>&1 | Select-String "moov"

    if ($output) {
        Write-Host "✅ Fast start metadata verified" -ForegroundColor Green
        return $true
    } else {
        Write-Host "⚠️  Fast start metadata not found - will re-optimize" -ForegroundColor Yellow
        return $false
    }
}

# Function to create backup
function Backup-File {
    param($File)
    
    $backupFile = Join-Path $BackupDir (Split-Path $File -Leaf)
    
    if (!(Test-Path $backupFile)) {
        Copy-Item $File $backupFile
        Write-Host "📦 Backed up: $(Split-Path $File -Leaf)" -ForegroundColor Blue
    }
}

# Function to format file size
function Format-FileSize {
    param($Bytes)
    
    if ($Bytes -ge 1GB) {
        return "{0:N2} GB" -f ($Bytes / 1GB)
    } elseif ($Bytes -ge 1MB) {
        return "{0:N2} MB" -f ($Bytes / 1MB)
    } elseif ($Bytes -ge 1KB) {
        return "{0:N2} KB" -f ($Bytes / 1KB)
    } else {
        return "$Bytes B"
    }
}

# Process all video files
Write-Host "`n🎬 Processing video files..." -ForegroundColor Blue

$videoFiles = Get-ChildItem -Path $InputDir -Include "*.mp4", "*.webm" -File

foreach ($file in $videoFiles) {
    # Skip already optimized files
    if ($file.Name -like "*_optimized*") {
        Write-Host "⏭️  Skipping already optimized: $($file.Name)" -ForegroundColor Yellow
        continue
    }
    
    # Create backup
    Backup-File $file.FullName
    
    # Get file info
    $extension = $file.Extension.TrimStart('.')
    $filename = $file.BaseName
    
    # Determine if this is a hero video
    $isHero = $filename -like "*hailuo-ai-video-02*"

    # Set output file path with appropriate suffix
    $suffix = if ($isHero) {
        if ($extension -eq "mp4") { "_faststart" } else { "_streamable" }
    } else {
        "_optimized"
    }
    $outputFile = Join-Path $OutputDir "${filename}${suffix}.$extension"

    # For hero videos, also create stub versions
    if ($isHero) {
        $stubFile = Join-Path $OutputDir "hero_stub.$extension"
        Create-StubVideo $file.FullName $stubFile $extension
    }

    # Optimize based on file type
    switch ($extension.ToLower()) {
        "mp4" {
            # Verify existing fast start metadata first
            if ($isHero -and (Test-Path $outputFile)) {
                if (Test-FastStartMetadata $outputFile) {
                    Write-Host "✅ Fast start already verified: $(Split-Path $outputFile -Leaf)" -ForegroundColor Green
                    continue
                }
            }
            Optimize-MP4 $file.FullName $outputFile -IsHero:$isHero
        }
        "webm" {
            Optimize-WebM $file.FullName $outputFile -IsHero:$isHero
        }
        default {
            Write-Host "⚠️  Unsupported format: $extension" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n🎉 Video optimization complete!" -ForegroundColor Green
Write-Host "📁 Optimized files are in: $OutputDir" -ForegroundColor Blue
Write-Host "📁 Backups are in: $BackupDir" -ForegroundColor Blue

# Show file sizes comparison
Write-Host "`n📊 File Size Comparison:" -ForegroundColor Blue
Write-Host "========================" -ForegroundColor Blue

foreach ($originalFile in $videoFiles) {
    if ($originalFile.Name -like "*_optimized*") { continue }
    
    $extension = $originalFile.Extension.TrimStart('.')
    $filename = $originalFile.BaseName
    $optimizedFile = Join-Path $OutputDir "${filename}_optimized.$extension"
    
    if (Test-Path $optimizedFile) {
        $originalSize = $originalFile.Length
        $optimizedSize = (Get-Item $optimizedFile).Length
        
        if ($originalSize -gt 0 -and $optimizedSize -gt 0) {
            $reduction = [math]::Round((($originalSize - $optimizedSize) * 100 / $originalSize), 1)
            
            Write-Host "$($originalFile.Name):" -ForegroundColor Yellow
            Write-Host "  Original:  $(Format-FileSize $originalSize)"
            Write-Host "  Optimized: $(Format-FileSize $optimizedSize)"
            Write-Host "  Reduction: $reduction%"
            Write-Host ""
        }
    }
}

Write-Host "🚀 Your videos are now optimized for instant streaming!" -ForegroundColor Green
Write-Host "💡 Next steps:" -ForegroundColor Blue
Write-Host "   1. Replace your original videos with the optimized versions"
Write-Host "   2. Update your video paths in the code if needed"
Write-Host "   3. Test the instant playback on your website"
