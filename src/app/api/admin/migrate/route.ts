/**
 * Database Migration API Route for Gensy AI Creative Suite
 * Handles database schema creation and updates
 * WARNING: This should be protected in production!
 */

import { NextRequest, NextResponse } from 'next/server'
import { runMigrations, validateSchema, seedDatabase } from '@/lib/database/migrations'

export async function POST(request: NextRequest) {
  try {
    // In production, add proper authentication here
    if (process.env.NODE_ENV === 'production') {
      const authHeader = request.headers.get('authorization')
      if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    const { action } = await request.json()

    switch (action) {
      case 'migrate':
        await runMigrations()
        return NextResponse.json({
          success: true,
          message: 'Database migrations completed successfully',
          timestamp: new Date().toISOString()
        })

      case 'validate':
        const validation = await validateSchema()
        return NextResponse.json({
          success: validation.isValid,
          validation,
          timestamp: new Date().toISOString()
        })

      case 'seed':
        await seedDatabase()
        return NextResponse.json({
          success: true,
          message: 'Database seeded successfully',
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: migrate, validate, or seed' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Migration API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Quick validation check
    const validation = await validateSchema()
    
    return NextResponse.json({
      service: 'Gensy AI Creative Suite',
      component: 'Database Schema',
      status: validation.isValid ? 'healthy' : 'unhealthy',
      validation,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      {
        service: 'Gensy AI Creative Suite',
        component: 'Database Schema',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}
