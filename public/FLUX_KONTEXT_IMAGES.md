# FLUX Kontext Pro Images

This directory contains the background images used in the FLUX Kontext Pro interactive selector component.

## Current Images

The following 5 images are used in the interactive selector:

1. **flux-kontext-1.png** - Luxury Tent background
2. **flux-kontext-2.png** - Campfire Feast background  
3. **flux-kontext-3.png** - Lakeside Retreat background
4. **flux-kontext-4.png** - Mountain Spa background
5. **flux-kontext-5.png** - Guided Adventure background

## How to Update Images

### Quick Update (No Code Changes Required)
To replace any of the background images:

1. **Prepare your new image:**
   - Recommended format: PNG or JPG
   - Recommended size: 800x600 pixels or similar aspect ratio
   - Optimize for web (compress to reasonable file size)

2. **Replace the file:**
   - Simply replace the existing file in `/public/` directory
   - Keep the exact same filename (e.g., `flux-kontext-1.png`)
   - The component will automatically use the new image

3. **File naming convention:**
   ```
   /public/flux-kontext-1.png  → Option 1 (Luxury Tent)
   /public/flux-kontext-2.png  → Option 2 (Campfire Feast)
   /public/flux-kontext-3.png  → Option 3 (Lakeside Retreat)
   /public/flux-kontext-4.png  → Option 4 (Mountain Spa)
   /public/flux-kontext-5.png  → Option 5 (Guided Adventure)
   ```

### Component Location
The interactive selector component is located at:
`src/components/ui/interactive-selector.tsx`

### Image Requirements
- **Format**: PNG, JPG, or WebP
- **Aspect Ratio**: 16:9 or 4:3 recommended
- **Size**: 800x600px or larger (will be automatically scaled)
- **File Size**: Keep under 2MB for optimal loading performance

### Future-Proofing
This system is designed so that:
- ✅ Images can be updated by simply replacing files
- ✅ No code changes required for image updates
- ✅ Consistent naming convention for easy management
- ✅ Next.js automatically serves files from `/public/` directory

### Troubleshooting
If images don't appear after replacement:
1. Clear browser cache (Ctrl+F5 or Cmd+Shift+R)
2. Restart the development server
3. Check that file names match exactly (case-sensitive)
4. Verify file format is supported (PNG, JPG, WebP)
