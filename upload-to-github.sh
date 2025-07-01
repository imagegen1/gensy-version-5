#!/bin/bash

echo "========================================"
echo "   Gensy v5 - GitHub Upload Script"
echo "========================================"
echo

echo "🔍 Checking if Git is initialized..."
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

echo
echo "🔗 Adding remote repository..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/imagegen1/gensy-version-5.git
echo "✅ Remote repository added"

echo
echo "📁 Adding all files to Git..."
git add .
echo "✅ Files added to staging"

echo
echo "📝 Creating commit..."
git commit -m "Initial commit: Gensy v5 with ByteDance I2V/T2V integration

Features:
- ✅ ByteDance Seedance I2V (Image-to-Video) model
- ✅ ByteDance Seedance T2V (Text-to-Video) model  
- ✅ Google Veo integration
- ✅ Cloudflare R2 storage for ByteDance videos
- ✅ Google Cloud Storage for Veo videos
- ✅ PNG/JPEG image format detection
- ✅ Real-time video generation polling
- ✅ Supabase database integration
- ✅ Clerk authentication
- ✅ Responsive UI with Tailwind CSS
- ✅ Complete end-to-end video generation workflow

Technical improvements:
- Fixed ByteDance I2V parameter generation (--ratio adaptive)
- Implemented dynamic image format detection
- Corrected database queries for Supabase
- Enhanced error handling and logging
- Optimized storage routing for different providers"

if [ $? -ne 0 ]; then
    echo "❌ Commit failed - there might be no changes to commit"
    echo "💡 This is normal if you've already committed these changes"
else
    echo "✅ Commit created successfully"
fi

echo
echo "🚀 Pushing to GitHub..."
git push -u origin main

if [ $? -ne 0 ]; then
    echo "❌ Push failed. Trying to push to 'master' branch..."
    git push -u origin master
    
    if [ $? -ne 0 ]; then
        echo "❌ Push failed. You may need to:"
        echo "   1. Check your GitHub credentials"
        echo "   2. Ensure the repository exists"
        echo "   3. Check your internet connection"
        echo
        echo "💡 Manual commands to try:"
        echo "   git remote -v"
        echo "   git status"
        echo "   git push -u origin main --force"
    else
        echo "✅ Successfully pushed to master branch!"
    fi
else
    echo "✅ Successfully pushed to main branch!"
fi

echo
echo "🎉 Upload process completed!"
echo "📱 Your repository: https://github.com/imagegen1/gensy-version-5"
echo
