# 🚀 GitHub Upload Instructions

## Quick Upload (Recommended)

### For Windows:
```bash
# Double-click this file or run in Command Prompt:
upload-to-github.bat
```

### For Mac/Linux:
```bash
# Run in Terminal:
./upload-to-github.sh
```

## Manual Upload Steps

If the automated scripts don't work, follow these manual steps:

### 1. Initialize Git (if needed)
```bash
git init
```

### 2. Add Remote Repository
```bash
git remote add origin https://github.com/imagegen1/gensy-version-5.git
```

### 3. Add All Files
```bash
git add .
```

### 4. Create Commit
```bash
git commit -m "Initial commit: Gensy v5 with ByteDance I2V/T2V integration"
```

### 5. Push to GitHub
```bash
git push -u origin main
```

If that fails, try:
```bash
git push -u origin master
```

## 📋 What Will Be Uploaded

### ✅ Included Files:
- All source code (`src/` directory)
- Configuration files (`package.json`, `next.config.js`, etc.)
- Documentation (`README.md`, this file)
- Environment template (`.env.example`)

### ❌ Excluded Files (via .gitignore):
- `node_modules/` - Dependencies (will be installed via npm)
- `.env.local` - Your API keys and secrets
- `.next/` - Build files
- Test files (`test-*.js`, `analyze-*.js`, etc.)
- Logs and temporary files

## 🔒 Security Notes

- ✅ Your API keys in `.env.local` are NOT uploaded
- ✅ Sensitive files are excluded via `.gitignore`
- ✅ Only safe, public code is uploaded

## 🎯 After Upload

Once uploaded, others can:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/imagegen1/gensy-version-5.git
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment:**
   ```bash
   cp .env.example .env.local
   # Then edit .env.local with actual API keys
   ```

4. **Run the application:**
   ```bash
   npm run dev
   ```

## 🚨 Troubleshooting

### If upload fails:

1. **Check repository exists:**
   - Visit: https://github.com/imagegen1/gensy-version-5
   - Make sure the repository is created

2. **Check credentials:**
   - Ensure you're logged into GitHub
   - May need to use personal access token instead of password

3. **Force push (if needed):**
   ```bash
   git push -u origin main --force
   ```

4. **Check remote URL:**
   ```bash
   git remote -v
   ```

## 📱 Repository URL

After successful upload, your code will be available at:
**https://github.com/imagegen1/gensy-version-5**

## 🎉 Features Included

Your uploaded Gensy v5 includes:

- ✅ **ByteDance I2V/T2V Integration** - Fully working
- ✅ **Google Veo Integration** - Complete
- ✅ **Image Format Detection** - PNG/JPEG support
- ✅ **Cloudflare R2 Storage** - For ByteDance videos
- ✅ **Google Cloud Storage** - For Veo videos
- ✅ **Supabase Database** - User data and generations
- ✅ **Clerk Authentication** - User management
- ✅ **Real-time Polling** - Live generation status
- ✅ **Responsive UI** - Works on all devices

## 💡 Next Steps

After upload, you can:
1. Set up GitHub Actions for CI/CD
2. Deploy to Vercel/Netlify
3. Add collaborators to the repository
4. Create issues and project boards
5. Set up branch protection rules

---

**Ready to upload? Run the upload script and your Gensy v5 will be on GitHub!** 🚀
