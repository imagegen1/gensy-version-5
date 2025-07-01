/**
 * Video Queue Service for Gensy AI Creative Suite
 * Handles async video generation job queuing and processing
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { GoogleVeoService, VideoGenerationOptions } from './google-veo'
import { ReplicateWanService } from './replicate-wan'
import { uploadToR2 } from '@/lib/storage/r2-client'

export interface VideoJob {
  id: string
  generationId: string
  prompt: string
  options: VideoGenerationOptions
  provider: 'google-veo' | 'replicate-wan'
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  attempts: number
  maxAttempts: number
  jobId?: string // Provider-specific job ID
  error?: string
  progress?: number
}

export class VideoQueueService {
  private static processingJobs = new Map<string, NodeJS.Timeout>()
  private static maxConcurrentJobs = 3

  /**
   * Add video generation job to queue
   */
  static async addToQueue(
    generationId: string,
    prompt: string,
    options: VideoGenerationOptions,
    provider: 'google-veo' | 'replicate-wan'
  ): Promise<VideoJob> {
    const supabase = createServiceRoleClient()

    const job: VideoJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      generationId,
      prompt,
      options,
      provider,
      status: 'queued',
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: 3
    }

    try {
      // Store job in database
      await supabase
        .from('video_jobs')
        .insert({
          id: job.id,
          generation_id: job.generationId,
          prompt: job.prompt,
          options: job.options,
          provider: job.provider,
          status: job.status,
          created_at: job.createdAt.toISOString(),
          attempts: job.attempts,
          max_attempts: job.maxAttempts
        })

      // Start processing if under concurrent limit
      if (this.processingJobs.size < this.maxConcurrentJobs) {
        this.processJob(job)
      }

      return job

    } catch (error) {
      console.error('Error adding job to queue:', error)
      throw error
    }
  }

  /**
   * Process a video generation job
   */
  static async processJob(job: VideoJob): Promise<void> {
    const supabase = createServiceRoleClient()

    try {
      // Mark job as processing
      job.status = 'processing'
      job.startedAt = new Date()
      job.attempts++

      await this.updateJobStatus(job)

      console.log(`Starting video generation job ${job.id} (attempt ${job.attempts})`)

      // Generate video based on provider
      let result
      if (job.provider === 'google-veo') {
        result = await GoogleVeoService.generateVideo(job.prompt, job.options)
      } else {
        result = await ReplicateWanService.generateVideo(job.prompt, job.options)
      }

      if (!result.success) {
        throw new Error(result.error || 'Video generation failed')
      }

      // Handle immediate completion (mock services)
      if (result.status === 'completed' && result.videoData) {
        await this.handleJobSuccess(job, result.videoData, result.metadata)
        return
      }

      // Handle async processing
      if (result.jobId) {
        job.jobId = result.jobId
        await this.updateJobStatus(job)
        
        // Start polling for completion
        this.startPolling(job)
        return
      }

      throw new Error('Unexpected generation result format')

    } catch (error) {
      console.error(`Job ${job.id} failed:`, error)
      await this.handleJobFailure(job, error instanceof Error ? error.message : 'Unknown error')
    }
  }

  /**
   * Start polling for job completion
   */
  private static startPolling(job: VideoJob): void {
    const pollInterval = setInterval(async () => {
      try {
        if (!job.jobId) {
          clearInterval(pollInterval)
          return
        }

        let statusResult
        if (job.provider === 'google-veo') {
          statusResult = await GoogleVeoService.getGenerationStatus(job.jobId)
        } else {
          statusResult = await ReplicateWanService.checkPredictionStatus(job.jobId)
        }

        // Update progress
        if (statusResult.progress !== undefined) {
          job.progress = statusResult.progress
          await this.updateJobStatus(job)
        }

        // Handle completion
        if (statusResult.status === 'completed' && statusResult.output) {
          clearInterval(pollInterval)
          this.processingJobs.delete(job.id)
          await this.handleJobSuccess(job, statusResult.output)
          return
        }

        // Handle failure
        if (statusResult.status === 'failed') {
          clearInterval(pollInterval)
          this.processingJobs.delete(job.id)
          await this.handleJobFailure(job, statusResult.error || 'Generation failed')
          return
        }

      } catch (error) {
        console.error(`Polling error for job ${job.id}:`, error)
      }
    }, 5000) // Poll every 5 seconds

    // Store polling interval
    this.processingJobs.set(job.id, pollInterval)

    // Clear interval after 10 minutes (timeout)
    setTimeout(() => {
      if (this.processingJobs.has(job.id)) {
        clearInterval(pollInterval)
        this.processingJobs.delete(job.id)
        this.handleJobFailure(job, 'Generation timeout')
      }
    }, 600000) // 10 minutes
  }

  /**
   * Handle successful job completion
   */
  private static async handleJobSuccess(
    job: VideoJob,
    videoOutput: string,
    metadata?: any
  ): Promise<void> {
    const supabase = createServiceRoleClient()

    try {
      // Get generation record to get user info
      const { data: generation } = await supabase
        .from('generations')
        .select('*, profiles!inner(clerk_user_id)')
        .eq('id', job.generationId)
        .single()

      if (!generation) {
        throw new Error('Generation record not found')
      }

      const userId = generation.profiles.clerk_user_id
      const profileId = generation.user_id

      // Upload video
      const videoUrl = await this.uploadVideo(
        job.generationId,
        videoOutput,
        userId,
        profileId,
        job
      )

      if (!videoUrl) {
        throw new Error('Failed to upload video')
      }

      // Update generation record
      await supabase
        .from('generations')
        .update({
          status: 'completed',
          result_url: videoUrl,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            ...generation.metadata,
            ...metadata,
            jobId: job.jobId,
            processingTime: job.completedAt ? 
              job.completedAt.getTime() - job.startedAt!.getTime() : 0
          }
        })
        .eq('id', job.generationId)

      // Update job status
      job.status = 'completed'
      job.completedAt = new Date()
      await this.updateJobStatus(job)

      console.log(`Job ${job.id} completed successfully`)

      // Process next job in queue
      this.processNextInQueue()

    } catch (error) {
      console.error(`Error handling job success for ${job.id}:`, error)
      await this.handleJobFailure(job, error instanceof Error ? error.message : 'Upload failed')
    }
  }

  /**
   * Handle job failure
   */
  private static async handleJobFailure(job: VideoJob, error: string): Promise<void> {
    const supabase = createServiceRoleClient()

    try {
      // Check if we should retry
      if (job.attempts < job.maxAttempts) {
        console.log(`Job ${job.id} failed, retrying (attempt ${job.attempts + 1}/${job.maxAttempts})`)
        
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, job.attempts) * 1000
        setTimeout(() => {
          this.processJob(job)
        }, delay)
        
        return
      }

      // Mark job as failed
      job.status = 'failed'
      job.error = error
      job.completedAt = new Date()
      await this.updateJobStatus(job)

      // Update generation record
      await supabase
        .from('generations')
        .update({
          status: 'failed',
          error_message: error,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.generationId)

      console.log(`Job ${job.id} failed permanently: ${error}`)

      // Remove from processing jobs
      if (this.processingJobs.has(job.id)) {
        clearInterval(this.processingJobs.get(job.id)!)
        this.processingJobs.delete(job.id)
      }

      // Process next job in queue
      this.processNextInQueue()

    } catch (updateError) {
      console.error(`Error updating failed job ${job.id}:`, updateError)
    }
  }

  /**
   * Upload video to storage
   */
  private static async uploadVideo(
    generationId: string,
    videoOutput: string,
    userId: string,
    profileId: string,
    job: VideoJob
  ): Promise<string | null> {
    try {
      let videoBuffer: Buffer
      const filename = `video-${generationId}.mp4`

      // Handle different output formats
      if (videoOutput.startsWith('http')) {
        // Download from URL
        const response = await fetch(videoOutput)
        if (!response.ok) {
          throw new Error(`Failed to download video: ${response.statusText}`)
        }
        videoBuffer = Buffer.from(await response.arrayBuffer())
      } else {
        // Assume base64 encoded
        videoBuffer = Buffer.from(videoOutput, 'base64')
      }

      // Upload to R2
      const uploadResult = await uploadToR2({
        key: `videos/${userId}/${filename}`,
        file: videoBuffer,
        contentType: 'video/mp4',
        metadata: {
          generationId,
          userId: profileId,
          type: 'generated-video',
          provider: job.provider,
          jobId: job.jobId || ''
        },
        isPublic: false
      })

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed')
      }

      // Create media file record
      const supabase = createServiceRoleClient()
      await supabase
        .from('media_files')
        .insert({
          user_id: profileId,
          generation_id: generationId,
          filename,
          original_filename: filename,
          file_path: uploadResult.url,
          file_size: videoBuffer.length,
          mime_type: 'video/mp4',
          metadata: {
            type: 'generated-video',
            provider: job.provider,
            duration: job.options.duration || 5,
            aspectRatio: job.options.aspectRatio || '16:9',
            style: job.options.style || 'realistic'
          },
          is_public: false
        })

      return uploadResult.url

    } catch (error) {
      console.error('Error uploading video:', error)
      return null
    }
  }

  /**
   * Update job status in database
   */
  private static async updateJobStatus(job: VideoJob): Promise<void> {
    const supabase = createServiceRoleClient()

    try {
      await supabase
        .from('video_jobs')
        .update({
          status: job.status,
          started_at: job.startedAt?.toISOString(),
          completed_at: job.completedAt?.toISOString(),
          attempts: job.attempts,
          job_id: job.jobId,
          error: job.error,
          progress: job.progress,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id)

    } catch (error) {
      console.error(`Error updating job status for ${job.id}:`, error)
    }
  }

  /**
   * Process next job in queue
   */
  private static async processNextInQueue(): Promise<void> {
    if (this.processingJobs.size >= this.maxConcurrentJobs) {
      return
    }

    const supabase = createServiceRoleClient()

    try {
      // Get next queued job
      const { data: nextJob } = await supabase
        .from('video_jobs')
        .select('*')
        .eq('status', 'queued')
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (nextJob) {
        const job: VideoJob = {
          id: nextJob.id,
          generationId: nextJob.generation_id,
          prompt: nextJob.prompt,
          options: nextJob.options,
          provider: nextJob.provider,
          status: nextJob.status,
          createdAt: new Date(nextJob.created_at),
          attempts: nextJob.attempts,
          maxAttempts: nextJob.max_attempts,
          jobId: nextJob.job_id,
          error: nextJob.error,
          progress: nextJob.progress
        }

        this.processJob(job)
      }

    } catch (error) {
      console.error('Error processing next job in queue:', error)
    }
  }

  /**
   * Get queue status
   */
  static async getQueueStatus(): Promise<{
    queued: number
    processing: number
    completed: number
    failed: number
  }> {
    const supabase = createServiceRoleClient()

    try {
      const { data: stats } = await supabase
        .from('video_jobs')
        .select('status')

      const statusCounts = {
        queued: 0,
        processing: 0,
        completed: 0,
        failed: 0
      }

      stats?.forEach(job => {
        if (job.status in statusCounts) {
          statusCounts[job.status as keyof typeof statusCounts]++
        }
      })

      return statusCounts

    } catch (error) {
      console.error('Error getting queue status:', error)
      return { queued: 0, processing: 0, completed: 0, failed: 0 }
    }
  }

  /**
   * Cancel a job
   */
  static async cancelJob(jobId: string): Promise<boolean> {
    const supabase = createServiceRoleClient()

    try {
      const { data: job } = await supabase
        .from('video_jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (!job || job.status !== 'processing') {
        return false
      }

      // Cancel with provider if applicable
      if (job.job_id && job.provider === 'replicate-wan') {
        await ReplicateWanService.cancelPrediction(job.job_id)
      }

      // Update job status
      await supabase
        .from('video_jobs')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)

      // Clear polling interval
      if (this.processingJobs.has(jobId)) {
        clearInterval(this.processingJobs.get(jobId)!)
        this.processingJobs.delete(jobId)
      }

      return true

    } catch (error) {
      console.error('Error canceling job:', error)
      return false
    }
  }
}
