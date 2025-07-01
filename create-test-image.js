/**
 * Create a test image for upscaling demonstration
 */

const sharp = require('sharp')
const fs = require('fs')

async function createTestImage() {
  console.log('🎨 Creating test image for upscaling demonstration...')
  
  try {
    // Create a colorful test image with text and patterns
    const testImageBuffer = await sharp({
      create: {
        width: 300,
        height: 300,
        channels: 3,
        background: { r: 45, g: 55, b: 72 }
      }
    })
    .png()
    .composite([
      {
        input: Buffer.from(`
          <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
            <!-- Background gradient -->
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
              </linearGradient>
              <radialGradient id="grad2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" style="stop-color:#f093fb;stop-opacity:0.8" />
                <stop offset="100%" style="stop-color:#f5576c;stop-opacity:0.3" />
              </radialGradient>
            </defs>
            
            <!-- Background -->
            <rect width="300" height="300" fill="url(#grad1)" />
            <circle cx="150" cy="150" r="120" fill="url(#grad2)" />
            
            <!-- Geometric patterns -->
            <polygon points="150,50 200,100 150,150 100,100" fill="rgba(255,255,255,0.3)" />
            <circle cx="80" cy="80" r="25" fill="rgba(255,255,255,0.4)" />
            <circle cx="220" cy="220" r="30" fill="rgba(255,255,255,0.4)" />
            
            <!-- Text -->
            <text x="150" y="140" font-family="Arial, sans-serif" font-size="24" font-weight="bold" 
                  fill="white" text-anchor="middle">GENSY AI</text>
            <text x="150" y="170" font-family="Arial, sans-serif" font-size="16" 
                  fill="rgba(255,255,255,0.9)" text-anchor="middle">Test Image</text>
            <text x="150" y="190" font-family="Arial, sans-serif" font-size="12" 
                  fill="rgba(255,255,255,0.8)" text-anchor="middle">300x300 → Upscale Me!</text>
            
            <!-- Fine details for upscaling test -->
            <line x1="50" y1="250" x2="250" y2="250" stroke="white" stroke-width="1" opacity="0.6"/>
            <line x1="50" y1="255" x2="250" y2="255" stroke="white" stroke-width="0.5" opacity="0.4"/>
            
            <!-- Small text to test sharpening -->
            <text x="150" y="270" font-family="Arial, sans-serif" font-size="8" 
                  fill="white" text-anchor="middle">Small text for sharpening test</text>
          </svg>
        `),
        top: 0,
        left: 0
      }
    ])
    .toBuffer()

    // Save the test image
    fs.writeFileSync('test-image-for-upscaling.png', testImageBuffer)
    
    console.log('✅ Test image created successfully!')
    console.log('📁 File: test-image-for-upscaling.png')
    console.log('📏 Size: 300x300 pixels')
    console.log('🎨 Features: Gradients, text, geometric shapes, fine details')
    console.log('💡 Perfect for testing upscaling and enhancement algorithms')
    
    // Get file stats
    const stats = fs.statSync('test-image-for-upscaling.png')
    console.log(`📊 File size: ${Math.round(stats.size / 1024)} KB`)
    
    return testImageBuffer
    
  } catch (error) {
    console.error('❌ Error creating test image:', error.message)
    throw error
  }
}

// Create the test image
createTestImage()
  .then(() => {
    console.log('\n🎉 Test image ready for upscaling!')
    console.log('\n📋 Next steps:')
    console.log('   1. Open http://localhost:3001 in your browser')
    console.log('   2. Sign up or sign in to access the upscaling feature')
    console.log('   3. Navigate to /upscale')
    console.log('   4. Upload the test-image-for-upscaling.png file')
    console.log('   5. Try different scale factors (2x, 4x, 8x)')
    console.log('   6. Test enhancement options (sharpen, denoise, colorize)')
    console.log('   7. Compare before/after results')
  })
  .catch(console.error)
