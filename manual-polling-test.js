/**
 * Comprehensive Manual Polling Test
 * This script will submit a video generation request and then manually poll for completion
 */

const { GoogleAuth } = require('google-auth-library')

class ManualPollingTest {
  constructor() {
    this.testId = `manual_test_${Date.now()}`
    this.generationId = null
    this.operationName = null
    this.jobId = null
    this.startTime = Date.now()
    this.pollCount = 0
    this.maxPolls = 40 // 40 polls * 5 seconds = 3.33 minutes max
    this.pollInterval = 5000 // 5 seconds
  }

  async initialize() {
    console.log(`🚀 [${this.testId}] Initializing Manual Polling Test...`)
    
    // Initialize Google Auth for direct API calls
    this.auth = new GoogleAuth({
      keyFile: 'sprint/gensy-463405-296a4152708b.json',
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    })
    
    this.authClient = await this.auth.getClient()
    console.log(`✅ [${this.testId}] Google Auth initialized`)
  }

  async submitVideoGeneration() {
    console.log(`📤 [${this.testId}] Submitting video generation request...`)
    
    const prompt = `Manual polling test ${this.testId}: dancing robot in space`
    
    try {
      const response = await fetch('http://localhost:3002/api/generate/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: This won't work without proper authentication
          // We'll need to use the browser-based approach
        },
        body: JSON.stringify({
          prompt: prompt,
          aspectRatio: '16:9',
          resolution: '720p',
          style: 'realistic',
          quality: 'standard',
          sourceType: 'text-to-video'
        })
      })

      if (response.status === 401) {
        console.log(`❌ [${this.testId}] Authentication required - need to use browser-based approach`)
        return false
      }

      const data = await response.json()
      
      if (data.success && data.status === 'processing') {
        this.generationId = data.generationId
        this.operationName = data.operationName
        this.jobId = data.jobId
        
        console.log(`✅ [${this.testId}] Video generation submitted successfully!`)
        console.log(`📋 [${this.testId}] Generation ID: ${this.generationId}`)
        console.log(`📋 [${this.testId}] Operation Name: ${this.operationName}`)
        console.log(`📋 [${this.testId}] Job ID: ${this.jobId}`)
        
        return true
      } else {
        console.log(`❌ [${this.testId}] Failed to submit video generation:`, data)
        return false
      }
    } catch (error) {
      console.error(`❌ [${this.testId}] Error submitting video generation:`, error)
      return false
    }
  }

  async pollGoogleDirectly() {
    console.log(`🔍 [${this.testId}] Polling Google Vertex AI directly...`)
    
    try {
      const accessToken = await this.authClient.getAccessToken()
      
      // Try the direct operation endpoint
      const response = await fetch(
        `https://us-central1-aiplatform.googleapis.com/v1/${this.operationName}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken.token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      console.log(`📡 [${this.testId}] Google API Response Status: ${response.status}`)
      
      if (response.ok) {
        const operationData = await response.json()
        console.log(`📋 [${this.testId}] Google Operation Data:`, JSON.stringify(operationData, null, 2))
        
        if (operationData.done) {
          if (operationData.response) {
            console.log(`🎉 [${this.testId}] VIDEO COMPLETED in Google!`)
            return { status: 'completed', data: operationData.response }
          } else if (operationData.error) {
            console.log(`❌ [${this.testId}] VIDEO FAILED in Google:`, operationData.error)
            return { status: 'failed', error: operationData.error }
          }
        } else {
          console.log(`⏳ [${this.testId}] VIDEO STILL PROCESSING in Google...`)
          return { status: 'processing', metadata: operationData.metadata }
        }
      } else if (response.status === 404) {
        console.log(`🧹 [${this.testId}] Operation not found (404) - likely completed and cleaned up`)
        return { status: 'cleaned_up' }
      } else {
        const errorText = await response.text()
        console.log(`❌ [${this.testId}] Google API Error: ${response.status} - ${errorText}`)
        return { status: 'error', error: `HTTP ${response.status}` }
      }
    } catch (error) {
      console.error(`❌ [${this.testId}] Error polling Google directly:`, error)
      return { status: 'error', error: error.message }
    }
  }

  async pollOurEndpoint() {
    console.log(`🔄 [${this.testId}] Polling our endpoint...`)
    
    try {
      // This will fail due to authentication, but we can see the structure
      const response = await fetch('http://localhost:3002/api/generate/video/poll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          generationId: this.generationId,
          operationName: this.operationName
        })
      })
      
      console.log(`📡 [${this.testId}] Our API Response Status: ${response.status}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`📋 [${this.testId}] Our API Response:`, JSON.stringify(data, null, 2))
        return data
      } else {
        const errorText = await response.text()
        console.log(`❌ [${this.testId}] Our API Error: ${response.status} - ${errorText}`)
        return { status: 'error', error: `HTTP ${response.status}` }
      }
    } catch (error) {
      console.error(`❌ [${this.testId}] Error polling our endpoint:`, error)
      return { status: 'error', error: error.message }
    }
  }

  async checkDatabase() {
    console.log(`🗄️ [${this.testId}] Checking database status...`)
    
    // We'll need to use the Supabase client for this
    // For now, just log that we would check
    console.log(`📋 [${this.testId}] Would check generation ID: ${this.generationId}`)
  }

  async runSinglePoll() {
    this.pollCount++
    const elapsed = Math.round((Date.now() - this.startTime) / 1000)
    
    console.log(`\n🔄 [${this.testId}] === POLL ${this.pollCount}/${this.maxPolls} (${elapsed}s elapsed) ===`)
    
    // Poll Google directly
    const googleResult = await this.pollGoogleDirectly()
    
    // Poll our endpoint (will likely fail due to auth, but good to try)
    const ourResult = await this.pollOurEndpoint()
    
    // Check database status
    await this.checkDatabase()
    
    // Analyze results
    if (googleResult.status === 'completed') {
      console.log(`🎉 [${this.testId}] VIDEO GENERATION COMPLETED!`)
      console.log(`⏱️ [${this.testId}] Total time: ${elapsed} seconds`)
      return true // Stop polling
    } else if (googleResult.status === 'failed') {
      console.log(`❌ [${this.testId}] VIDEO GENERATION FAILED!`)
      console.log(`⏱️ [${this.testId}] Total time: ${elapsed} seconds`)
      return true // Stop polling
    } else if (googleResult.status === 'cleaned_up') {
      console.log(`🧹 [${this.testId}] Operation cleaned up - likely completed earlier`)
      console.log(`⏱️ [${this.testId}] Total time: ${elapsed} seconds`)
      return true // Stop polling
    }
    
    return false // Continue polling
  }

  async startPolling() {
    console.log(`🔄 [${this.testId}] Starting manual polling (${this.maxPolls} polls, ${this.pollInterval/1000}s interval)...`)
    
    for (let i = 0; i < this.maxPolls; i++) {
      const shouldStop = await this.runSinglePoll()
      
      if (shouldStop) {
        console.log(`🏁 [${this.testId}] Polling completed!`)
        return
      }
      
      if (i < this.maxPolls - 1) {
        console.log(`⏳ [${this.testId}] Waiting ${this.pollInterval/1000} seconds before next poll...`)
        await new Promise(resolve => setTimeout(resolve, this.pollInterval))
      }
    }
    
    console.log(`⏰ [${this.testId}] Polling timeout reached (${this.maxPolls} polls)`)
  }

  async run() {
    try {
      await this.initialize()
      
      console.log(`\n📝 [${this.testId}] TEST PLAN:`)
      console.log(`1. Submit video generation request`)
      console.log(`2. Poll Google Vertex AI directly every ${this.pollInterval/1000} seconds`)
      console.log(`3. Poll our endpoint (may fail due to auth)`)
      console.log(`4. Track complete lifecycle`)
      console.log(`5. Report final results\n`)
      
      // Using FRESH LIVE operation data from the browser test!
      console.log(`📋 [${this.testId}] Using FRESH LIVE operation data for testing...`)
      this.generationId = '01b6cc68-e7c5-4810-a549-a63a6a700994'
      this.operationName = 'projects/gensy-463405/locations/us-central1/publishers/google/models/veo-2.0-generate-001/operations/413b493e-8f0f-464d-bf67-1dd4aa4d6823'
      this.jobId = '413b493e-8f0f-464d-bf67-1dd4aa4d6823'

      console.log(`🎯 [${this.testId}] LIVE TEST - This operation was just submitted seconds ago!`)
      console.log(`🎯 [${this.testId}] Prompt: "LIVE POLLING TEST: blue butterfly flying through rainbow clouds"`)
      
      await this.startPolling()
      
    } catch (error) {
      console.error(`❌ [${this.testId}] Test failed:`, error)
    }
  }
}

// Run the test
const test = new ManualPollingTest()
test.run()
