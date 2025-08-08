#!/bin/bash

# Video Optimization Script for Instant Playback
# This script optimizes MP4 and WebM files for streaming

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INPUT_DIR="public/videos"
OUTPUT_DIR="public/videos/optimized"
BACKUP_DIR="public/videos/backup"

# Create directories
mkdir -p "$OUTPUT_DIR"
mkdir -p "$BACKUP_DIR"

echo -e "${BLUE}🎬 Video Optimization Script${NC}"
echo -e "${BLUE}==============================${NC}"

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}❌ FFmpeg is not installed. Please install it first:${NC}"
    echo -e "${YELLOW}   Windows: Download from https://ffmpeg.org/download.html${NC}"
    echo -e "${YELLOW}   macOS: brew install ffmpeg${NC}"
    echo -e "${YELLOW}   Linux: sudo apt install ffmpeg${NC}"
    exit 1
fi

echo -e "${GREEN}✅ FFmpeg found${NC}"

# Function to optimize MP4 for streaming
optimize_mp4() {
    local input_file="$1"
    local output_file="$2"
    
    echo -e "${YELLOW}🔄 Optimizing MP4: $(basename "$input_file")${NC}"
    
    ffmpeg -i "$input_file" \
        -c:v libx264 \
        -crf 23 \
        -preset medium \
        -c:a aac \
        -b:a 128k \
        -movflags +faststart \
        -pix_fmt yuv420p \
        -profile:v baseline \
        -level 3.0 \
        -maxrate 2M \
        -bufsize 4M \
        -y \
        "$output_file"
    
    echo -e "${GREEN}✅ MP4 optimized: $(basename "$output_file")${NC}"
}

# Function to optimize WebM for streaming
optimize_webm() {
    local input_file="$1"
    local output_file="$2"
    
    echo -e "${YELLOW}🔄 Optimizing WebM: $(basename "$input_file")${NC}"
    
    ffmpeg -i "$input_file" \
        -c:v libvpx-vp9 \
        -crf 30 \
        -b:v 1M \
        -maxrate 1.5M \
        -minrate 0.5M \
        -c:a libopus \
        -b:a 128k \
        -cluster_size_limit 2M \
        -cluster_time_limit 5100 \
        -auto-alt-ref 1 \
        -lag-in-frames 25 \
        -row-mt 1 \
        -y \
        "$output_file"
    
    echo -e "${GREEN}✅ WebM optimized: $(basename "$output_file")${NC}"
}

# Function to create backup
backup_file() {
    local file="$1"
    local backup_file="$BACKUP_DIR/$(basename "$file")"
    
    if [ ! -f "$backup_file" ]; then
        cp "$file" "$backup_file"
        echo -e "${BLUE}📦 Backed up: $(basename "$file")${NC}"
    fi
}

# Process all video files
echo -e "\n${BLUE}Processing video files...${NC}"

for file in "$INPUT_DIR"/*.{mp4,webm}; do
    # Skip if file doesn't exist (glob didn't match)
    [ ! -f "$file" ] && continue
    
    # Skip already optimized files
    if [[ "$(basename "$file")" == *"_optimized"* ]]; then
        echo -e "${YELLOW}⏭️  Skipping already optimized: $(basename "$file")${NC}"
        continue
    fi
    
    # Create backup
    backup_file "$file"
    
    # Get file extension
    extension="${file##*.}"
    filename=$(basename "$file" ".$extension")
    
    # Set output file path
    output_file="$OUTPUT_DIR/${filename}_optimized.$extension"
    
    # Optimize based on file type
    case "$extension" in
        mp4)
            optimize_mp4 "$file" "$output_file"
            ;;
        webm)
            optimize_webm "$file" "$output_file"
            ;;
        *)
            echo -e "${YELLOW}⚠️  Unsupported format: $extension${NC}"
            ;;
    esac
done

echo -e "\n${GREEN}🎉 Video optimization complete!${NC}"
echo -e "${BLUE}📁 Optimized files are in: $OUTPUT_DIR${NC}"
echo -e "${BLUE}📁 Backups are in: $BACKUP_DIR${NC}"

# Show file sizes comparison
echo -e "\n${BLUE}📊 File Size Comparison:${NC}"
echo -e "${BLUE}========================${NC}"

for original in "$INPUT_DIR"/*.{mp4,webm}; do
    [ ! -f "$original" ] && continue
    
    extension="${original##*.}"
    filename=$(basename "$original" ".$extension")
    optimized="$OUTPUT_DIR/${filename}_optimized.$extension"
    
    if [ -f "$optimized" ]; then
        original_size=$(stat -f%z "$original" 2>/dev/null || stat -c%s "$original" 2>/dev/null || echo "0")
        optimized_size=$(stat -f%z "$optimized" 2>/dev/null || stat -c%s "$optimized" 2>/dev/null || echo "0")
        
        if [ "$original_size" -gt 0 ] && [ "$optimized_size" -gt 0 ]; then
            reduction=$(( (original_size - optimized_size) * 100 / original_size ))
            
            echo -e "${YELLOW}$(basename "$original"):${NC}"
            echo -e "  Original:  $(numfmt --to=iec-i --suffix=B $original_size)"
            echo -e "  Optimized: $(numfmt --to=iec-i --suffix=B $optimized_size)"
            echo -e "  Reduction: ${reduction}%"
            echo ""
        fi
    fi
done

echo -e "${GREEN}🚀 Your videos are now optimized for instant streaming!${NC}"
echo -e "${BLUE}💡 Next steps:${NC}"
echo -e "   1. Replace your original videos with the optimized versions"
echo -e "   2. Update your video paths in the code if needed"
echo -e "   3. Test the instant playback on your website"
