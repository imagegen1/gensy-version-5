/**
 * Service Pricing API Endpoint for Gensy AI Creative Suite
 * Provides pricing information for different AI models and services
 */

import { NextRequest, NextResponse } from 'next/server'
import { ServicePricingManager } from '@/lib/pricing/service-pricing'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceType = searchParams.get('type') as 'image' | 'video' | 'upscale' | null
    const provider = searchParams.get('provider')
    const modelName = searchParams.get('model')
    const popular = searchParams.get('popular') === 'true'
    const premium = searchParams.get('premium') === 'true'

    // Get specific model pricing
    if (provider && modelName) {
      const pricing = await ServicePricingManager.getModelPricing(provider, modelName)
      if (!pricing) {
        return NextResponse.json(
          { error: 'Model pricing not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ success: true, pricing })
    }

    // Get popular models by service type
    if (popular && serviceType) {
      const models = await ServicePricingManager.getPopularModels(serviceType, 5)
      return NextResponse.json({ success: true, models })
    }

    // Get premium models by service type
    if (premium && serviceType) {
      const models = await ServicePricingManager.getPremiumModels(serviceType, 5)
      return NextResponse.json({ success: true, models })
    }

    // Get pricing by service type
    if (serviceType) {
      const pricing = await ServicePricingManager.getPricingByServiceType(serviceType)
      return NextResponse.json({ success: true, pricing })
    }

    // Get all service pricing
    const allPricing = await ServicePricingManager.getAllServicePricing()
    return NextResponse.json({ success: true, pricing: allPricing })

  } catch (error) {
    console.error('Error in service pricing API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service pricing' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider, model_name, service_type, api_cost_usd, api_cost_inr, storage_cost_inr, total_cost_inr, selling_price_inr, credits_required } = body

    // Validate required fields
    if (!provider || !model_name || !service_type || !credits_required) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const pricingId = await ServicePricingManager.addServicePricing({
      provider,
      model_name,
      service_type,
      api_cost_usd: api_cost_usd || 0,
      api_cost_inr: api_cost_inr || 0,
      storage_cost_inr: storage_cost_inr || 0.01,
      total_cost_inr: total_cost_inr || 0,
      selling_price_inr: selling_price_inr || 0,
      credits_required,
      is_active: true
    })

    if (!pricingId) {
      return NextResponse.json(
        { error: 'Failed to add service pricing' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Service pricing added successfully',
      id: pricingId 
    })

  } catch (error) {
    console.error('Error adding service pricing:', error)
    return NextResponse.json(
      { error: 'Failed to add service pricing' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Pricing ID is required' },
        { status: 400 }
      )
    }

    const success = await ServicePricingManager.updateServicePricing(id, updates)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update service pricing' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Service pricing updated successfully' 
    })

  } catch (error) {
    console.error('Error updating service pricing:', error)
    return NextResponse.json(
      { error: 'Failed to update service pricing' },
      { status: 500 }
    )
  }
}
