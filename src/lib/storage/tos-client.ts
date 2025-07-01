/**
 * TOS (Torch Object Storage) Client for Gensy AI Creative Suite
 * S3-compatible storage client for ByteDance video files
 */

import axios, { AxiosResponse } from 'axios'
import { createHash, createHmac } from 'crypto'
import { config } from '../env'

export interface TOSUploadOptions {
  key: string
  file: File | Buffer
  contentType?: string
  metadata?: Record<string, string>
  isPublic?: boolean
}

export interface TOSUploadResult {
  success: boolean
  key?: string
  url?: string
  error?: string
  size?: number
  contentType?: string
}

export interface TOSDownloadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * TOS Storage Client Class
 */
export class TOSClient {
  private accessKeyId: string
  private secretAccessKey: string
  private bucketName: string
  private endpoint: string
  private region: string

  constructor() {
    this.accessKeyId = config.tos.accessKeyId || ''
    this.secretAccessKey = config.tos.secretAccessKey || ''
    this.bucketName = config.tos.bucketName || ''
    this.endpoint = config.tos.endpoint || ''
    this.region = this.mapRegionToCode(config.tos.region || '')
  }

  /**
   * Map human-readable region names to AWS-style region codes
   */
  private mapRegionToCode(region: string): string {
    const regionMap: Record<string, string> = {
      'Asia Pacific (Johor)': 'ap-southeast-1',
      'Asia Pacific (Singapore)': 'ap-southeast-1',
      'US East (Virginia)': 'us-east-1',
      'US West (Oregon)': 'us-west-2',
      'Europe (Frankfurt)': 'eu-central-1',
      'Asia Pacific (Tokyo)': 'ap-northeast-1',
      'Asia Pacific (Seoul)': 'ap-northeast-2',
      'Asia Pacific (Mumbai)': 'ap-south-1'
    }

    return regionMap[region] || region.toLowerCase().replace(/\s+/g, '-')
  }

  /**
   * Check if TOS is properly configured
   */
  isConfigured(): boolean {
    return !!(this.accessKeyId && this.secretAccessKey && this.bucketName && this.endpoint)
  }

  /**
   * Generate AWS Signature Version 4
   */
  private generateSignature(
    method: string,
    path: string,
    queryParams: Record<string, string>,
    headers: Record<string, string>,
    payload: string
  ): string {
    const date = new Date()
    const dateStamp = date.toISOString().slice(0, 10).replace(/-/g, '')
    const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, '')

    // Add required headers for virtual host style
    const virtualHost = `${this.bucketName}.${new URL(this.endpoint).host}`
    headers['host'] = virtualHost
    headers['x-amz-date'] = amzDate
    headers['x-amz-content-sha256'] = createHash('sha256').update(payload).digest('hex')

    // Create canonical request
    const canonicalUri = path
    const canonicalQueryString = Object.keys(queryParams)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
      .join('&')
    
    const canonicalHeaders = Object.keys(headers)
      .sort()
      .map(key => `${key.toLowerCase()}:${headers[key]}`)
      .join('\n') + '\n'
    
    const signedHeaders = Object.keys(headers)
      .sort()
      .map(key => key.toLowerCase())
      .join(';')

    const canonicalRequest = [
      method,
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      headers['x-amz-content-sha256']
    ].join('\n')

    // Create string to sign
    const algorithm = 'AWS4-HMAC-SHA256'
    const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      createHash('sha256').update(canonicalRequest).digest('hex')
    ].join('\n')

    // Calculate signature
    const kDate = createHmac('sha256', `AWS4${this.secretAccessKey}`).update(dateStamp).digest()
    const kRegion = createHmac('sha256', kDate).update(this.region).digest()
    const kService = createHmac('sha256', kRegion).update('s3').digest()
    const kSigning = createHmac('sha256', kService).update('aws4_request').digest()
    const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex')

    // Create authorization header
    const authorizationHeader = `${algorithm} Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

    return authorizationHeader
  }

  /**
   * Upload a file to TOS
   */
  async uploadFile(options: TOSUploadOptions): Promise<TOSUploadResult> {
    const tosRequestId = `tos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log(`🔥 [${tosRequestId}] TOS STORAGE: Starting file upload`)

    try {
      if (!this.isConfigured()) {
        console.error(`❌ [${tosRequestId}] TOS STORAGE: TOS not configured`)
        return {
          success: false,
          error: 'TOS storage is not properly configured'
        }
      }

      const { key, file, contentType, metadata = {}, isPublic = false } = options

      // Convert file to buffer
      let buffer: Buffer
      let size: number
      let finalContentType: string

      if (file instanceof File) {
        buffer = Buffer.from(await file.arrayBuffer())
        size = file.size
        finalContentType = contentType || file.type || 'application/octet-stream'
      } else {
        buffer = file
        size = buffer.length
        finalContentType = contentType || 'application/octet-stream'
      }

      console.log(`🔥 [${tosRequestId}] TOS STORAGE: Upload details:`, {
        key,
        size,
        contentType: finalContentType,
        isPublic,
        metadataCount: Object.keys(metadata).length
      })

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': finalContentType,
        'Content-Length': size.toString(),
      }

      // Add metadata headers
      Object.entries(metadata).forEach(([key, value]) => {
        headers[`x-amz-meta-${key}`] = value
      })

      // Add public read ACL if specified
      if (isPublic) {
        headers['x-amz-acl'] = 'public-read'
      }

      // Generate signature for virtual host style
      const path = `/${key}`
      const authorization = this.generateSignature('PUT', path, {}, headers, buffer.toString('base64'))
      headers['Authorization'] = authorization

      // Make upload request using virtual host style
      // TOS requires virtual host style: https://bucket.endpoint/key
      const virtualHostEndpoint = this.endpoint.replace('://', `://${this.bucketName}.`)
      console.log(`🔥 [${tosRequestId}] TOS STORAGE: Sending upload request...`)
      const uploadStartTime = Date.now()

      const response: AxiosResponse = await axios.put(`${virtualHostEndpoint}${path}`, buffer, {
        headers,
        timeout: 60000, // 60 seconds timeout
      })

      const uploadEndTime = Date.now()
      console.log(`🔥 [${tosRequestId}] TOS STORAGE: Upload completed in ${uploadEndTime - uploadStartTime}ms`)

      if (response.status === 200 || response.status === 201) {
        // Generate access URL
        const url = isPublic 
          ? `${this.endpoint}/${this.bucketName}/${key}`
          : await this.getSignedDownloadUrl(key)

        console.log(`✅ [${tosRequestId}] TOS STORAGE: Upload successful`)
        return {
          success: true,
          key,
          url,
          size,
          contentType: finalContentType
        }
      } else {
        console.error(`❌ [${tosRequestId}] TOS STORAGE: Upload failed with status ${response.status}`)
        return {
          success: false,
          error: `Upload failed with status ${response.status}`
        }
      }

    } catch (error) {
      console.error(`❌ [${tosRequestId}] TOS STORAGE: Upload error:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      }
    }
  }

  /**
   * Get a signed download URL for a file
   */
  async getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const path = `/${this.bucketName}/${key}`
      const expires = Math.floor(Date.now() / 1000) + expiresIn
      
      const queryParams = {
        'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
        'X-Amz-Credential': `${this.accessKeyId}/${new Date().toISOString().slice(0, 10).replace(/-/g, '')}/${this.region}/s3/aws4_request`,
        'X-Amz-Date': new Date().toISOString().replace(/[:-]|\.\d{3}/g, ''),
        'X-Amz-Expires': expiresIn.toString(),
        'X-Amz-SignedHeaders': 'host'
      }

      const authorization = this.generateSignature('GET', path, queryParams, {}, '')
      queryParams['X-Amz-Signature'] = authorization.split('Signature=')[1]

      const queryString = Object.entries(queryParams)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&')

      return `${this.endpoint}${path}?${queryString}`
    } catch (error) {
      console.error('Error generating signed download URL:', error)
      throw error
    }
  }

  /**
   * Delete a file from TOS
   */
  async deleteFile(key: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'TOS storage is not properly configured'
        }
      }

      const path = `/${this.bucketName}/${key}`
      const headers: Record<string, string> = {}
      const authorization = this.generateSignature('DELETE', path, {}, headers, '')
      headers['Authorization'] = authorization

      const response = await axios.delete(`${this.endpoint}${path}`, { headers })

      return {
        success: response.status === 204 || response.status === 200
      }
    } catch (error) {
      console.error('Error deleting file from TOS:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown delete error'
      }
    }
  }

  /**
   * Check if a file exists in TOS
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        return false
      }

      const path = `/${this.bucketName}/${key}`
      const headers: Record<string, string> = {}
      const authorization = this.generateSignature('HEAD', path, {}, headers, '')
      headers['Authorization'] = authorization

      const response = await axios.head(`${this.endpoint}${path}`, { headers })
      return response.status === 200
    } catch (error) {
      return false
    }
  }
}

// Export singleton instance
export const tosClient = new TOSClient()

// Export utility functions
export async function uploadFileToTOS(options: TOSUploadOptions): Promise<TOSUploadResult> {
  return tosClient.uploadFile(options)
}

export async function getSignedTOSUrl(key: string, expiresIn?: number): Promise<string> {
  return tosClient.getSignedDownloadUrl(key, expiresIn)
}

export async function deleteFileFromTOS(key: string): Promise<{ success: boolean; error?: string }> {
  return tosClient.deleteFile(key)
}

export async function tosFileExists(key: string): Promise<boolean> {
  return tosClient.fileExists(key)
}
