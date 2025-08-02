/**
 * Script to add MiniMax video models to the database
 * Run this script to populate the ai_models table with official MiniMax models
 */

const MINIMAX_MODELS = [
  {
    name: 'MiniMax-Hailuo-02',
    display_name: 'MiniMax Hailuo 02',
    type: 'video',
    provider: 'minimax',
    status: 'active',
    description: 'Latest MiniMax video generation model with SOTA instruction following and extreme physics mastery',
    pricing_credits: 13,
    max_duration: 10,
    supported_aspect_ratios: ['16:9', '9:16', '1:1'],
    is_featured: true,
    sort_order: 1,
    capabilities: {
      textToVideo: true,
      imageToVideo: false,
      highQuality: true,
      maxDuration: 10,
      maxResolution: '1080p'
    }
  },
  {
    name: 'T2V-01-Director',
    display_name: 'T2V-01 Director',
    type: 'video',
    provider: 'minimax',
    status: 'active',
    description: 'Advanced text-to-video model with director-level control and precision',
    pricing_credits: 9,
    max_duration: 10,
    supported_aspect_ratios: ['16:9', '9:16', '1:1'],
    is_featured: true,
    sort_order: 2,
    capabilities: {
      textToVideo: true,
      imageToVideo: false,
      directorControl: true,
      highQuality: true,
      maxDuration: 10,
      maxResolution: '1080p'
    }
  },
  {
    name: 'I2V-01-Director',
    display_name: 'I2V-01 Director',
    type: 'video',
    provider: 'minimax',
    status: 'active',
    description: 'Image-to-video model with director-level control and high-quality motion generation',
    pricing_credits: 9,
    max_duration: 10,
    supported_aspect_ratios: ['16:9', '9:16', '1:1'],
    is_featured: true,
    sort_order: 3,
    capabilities: {
      textToVideo: false,
      imageToVideo: true,
      directorControl: true,
      highQuality: true,
      maxDuration: 10,
      maxResolution: '1080p'
    }
  },
  {
    name: 'T2V-01',
    display_name: 'T2V-01',
    type: 'video',
    provider: 'minimax',
    status: 'active',
    description: 'Standard text-to-video generation model with good quality and speed',
    pricing_credits: 6,
    max_duration: 10,
    supported_aspect_ratios: ['16:9', '9:16', '1:1'],
    is_featured: false,
    sort_order: 4,
    capabilities: {
      textToVideo: true,
      imageToVideo: false,
      highQuality: true,
      maxDuration: 10,
      maxResolution: '1080p'
    }
  },
  {
    name: 'I2V-01',
    display_name: 'I2V-01',
    type: 'video',
    provider: 'minimax',
    status: 'active',
    description: 'Standard image-to-video generation model with natural motion',
    pricing_credits: 6,
    max_duration: 10,
    supported_aspect_ratios: ['16:9', '9:16', '1:1'],
    is_featured: false,
    sort_order: 5,
    capabilities: {
      textToVideo: false,
      imageToVideo: true,
      highQuality: true,
      maxDuration: 10,
      maxResolution: '1080p'
    }
  },
  {
    name: 'I2V-01-live',
    display_name: 'I2V-01 Live',
    type: 'video',
    provider: 'minimax',
    status: 'active',
    description: 'Live image-to-video generation with real-time processing capabilities',
    pricing_credits: 7,
    max_duration: 10,
    supported_aspect_ratios: ['16:9', '9:16', '1:1'],
    is_featured: false,
    sort_order: 6,
    capabilities: {
      textToVideo: false,
      imageToVideo: true,
      liveGeneration: true,
      highQuality: true,
      maxDuration: 10,
      maxResolution: '1080p'
    }
  },
  {
    name: 'S2V-01',
    display_name: 'S2V-01',
    type: 'video',
    provider: 'minimax',
    status: 'active',
    description: 'Speech-to-video generation model that creates videos from audio input',
    pricing_credits: 8,
    max_duration: 10,
    supported_aspect_ratios: ['16:9', '9:16', '1:1'],
    is_featured: false,
    sort_order: 7,
    capabilities: {
      textToVideo: false,
      imageToVideo: false,
      speechToVideo: true,
      highQuality: true,
      maxDuration: 10,
      maxResolution: '1080p'
    }
  }
];

async function addMinimaxModels() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  console.log('🤖 Adding MiniMax models to database...');
  
  for (const model of MINIMAX_MODELS) {
    try {
      console.log(`📝 Adding model: ${model.display_name}`);
      
      const response = await fetch(`${baseUrl}/api/ai-models`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(model)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Successfully added: ${model.display_name} (ID: ${result.id})`);
      } else {
        const error = await response.text();
        console.error(`❌ Failed to add ${model.display_name}:`, error);
      }
    } catch (error) {
      console.error(`❌ Error adding ${model.display_name}:`, error);
    }
  }
  
  console.log('🎉 Finished adding MiniMax models!');
}

// Run the script
if (require.main === module) {
  addMinimaxModels().catch(console.error);
}

module.exports = { addMinimaxModels, MINIMAX_MODELS };
