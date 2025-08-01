#!/usr/bin/env node

/**
 * Hero Video Changer Script
 * 
 * This script helps you quickly change the hero video on the landing page.
 * 
 * Usage:
 * node scripts/change-hero-video.js "new-video.mp4" "New Title" "New subtitle text"
 * 
 * Or run interactively:
 * node scripts/change-hero-video.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CONFIG_PATH = path.join(__dirname, '../src/config/hero-video.ts');

// Get command line arguments
const args = process.argv.slice(2);

async function updateHeroVideo(videoSrc, title, subtitle) {
  try {
    // Read the current config file
    const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
    
    // Update the configuration
    let updatedConfig = configContent
      .replace(/videoSrc: ".*?"/, `videoSrc: "/videos/${videoSrc}"`)
      .replace(/title: ".*?"/, `title: "${title}"`)
      .replace(/subtitle: ".*?"/, `subtitle: "${subtitle}"`);
    
    // Write the updated config
    fs.writeFileSync(CONFIG_PATH, updatedConfig);
    
    console.log('✅ Hero video configuration updated successfully!');
    console.log(`📹 Video: /videos/${videoSrc}`);
    console.log(`📝 Title: ${title}`);
    console.log(`📄 Subtitle: ${subtitle}`);
    console.log('\n🚀 Visit http://localhost:3000/landing-page-2 to see the changes');
    
  } catch (error) {
    console.error('❌ Error updating hero video configuration:', error.message);
  }
}

async function promptUser() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise((resolve) => {
    rl.question(prompt, resolve);
  });

  try {
    console.log('🎬 Hero Video Configuration Tool\n');
    
    const videoSrc = await question('Enter video filename (e.g., my-video.mp4): ');
    const title = await question('Enter hero title (e.g., AiNext Video Generation): ');
    const subtitle = await question('Enter hero subtitle: ');
    
    rl.close();
    
    if (videoSrc && title && subtitle) {
      await updateHeroVideo(videoSrc, title, subtitle);
    } else {
      console.log('❌ All fields are required');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
  }
}

// Main execution
if (args.length === 3) {
  // Command line arguments provided
  const [videoSrc, title, subtitle] = args;
  updateHeroVideo(videoSrc, title, subtitle);
} else if (args.length === 0) {
  // Interactive mode
  promptUser();
} else {
  console.log('Usage:');
  console.log('  node scripts/change-hero-video.js "video.mp4" "Title" "Subtitle"');
  console.log('  or run without arguments for interactive mode');
}
