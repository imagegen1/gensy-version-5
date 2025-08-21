'use client'

import React from 'react'
import BootstrapLayout from '../landing-page-2/BootstrapLayout'
import { Sparkles, Crown, Building2, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PricingTable, type PricingFeature, type PricingPlan } from '@/components/pricing-table'

// Monthly pricing data with exact generation counts based on credit economics
// Credit Value: 1 credit = ₹0.02
// Monthly Credits Available: Plan Price ÷ ₹0.02
// Monthly Generations: Monthly Credits ÷ Credits per Generation
const PRICING_DATA = {
  currency: "INR",
  credit_value_inr: 0.02,
  plans: [
    { id: "starter", name: "Starter", price_inr: 360, monthly_credits: 18000 },
    { id: "pro", name: "Pro", price_inr: 937, monthly_credits: 46850 },
    { id: "business", name: "Business", price_inr: 4185, monthly_credits: 209250 },
    { id: "enterprise", name: "Enterprise", price_inr: 8850, monthly_credits: 442500 }
  ],
  models: [
    {
      model: "Imagen 4 Fast / 3 Fast",
      unit: "image",
      credits_per_unit: 197,
      per_plan: { starter: 91, pro: 237, business: 1062, enterprise: 2246 }
    },
    {
      model: "FLUX.1 [dev]",
      unit: "image",
      credits_per_unit: 246,
      per_plan: { starter: 73, pro: 190, business: 850, enterprise: 1798 }
    },
    {
      model: "SeeDream 3.0 (t2i)",
      unit: "image",
      credits_per_unit: 295,
      per_plan: { starter: 61, pro: 158, business: 709, enterprise: 1500 }
    },
    {
      model: "Imagen 4 / 3 (Standard)",
      unit: "image",
      credits_per_unit: 393,
      per_plan: { starter: 45, pro: 119, business: 532, enterprise: 1125 }
    },
    {
      model: "FLUX 1.1 [pro] / Kontext [pro]",
      unit: "image",
      credits_per_unit: 393,
      per_plan: { starter: 45, pro: 119, business: 532, enterprise: 1125 }
    },
    {
      model: "FLUX.1 [pro] / Fill / Canny / Depth",
      unit: "image",
      credits_per_unit: 490,
      per_plan: { starter: 36, pro: 95, business: 427, enterprise: 903 }
    },
    {
      model: "FLUX 1.1 [pro] Ultra",
      unit: "image",
      credits_per_unit: 588,
      per_plan: { starter: 30, pro: 79, business: 355, enterprise: 752 }
    },
    {
      model: "Imagen 4 Ultra",
      unit: "image",
      credits_per_unit: 588,
      per_plan: { starter: 30, pro: 79, business: 355, enterprise: 752 }
    },
    {
      model: "FLUX.1 Kontext [max]",
      unit: "image",
      credits_per_unit: 784,
      per_plan: { starter: 22, pro: 59, business: 266, enterprise: 564 }
    },
    {
      model: "T2V/I2V-Director & I2V-live",
      unit: "10s clip",
      credits_per_unit: 4210,
      per_plan: { starter: 4, pro: 11, business: 49, enterprise: 105 }
    },
    {
      model: "S2V-01",
      unit: "10s clip",
      credits_per_unit: 6362,
      per_plan: { starter: 2, pro: 7, business: 32, enterprise: 69 }
    },
    {
      model: "Hailuo-02",
      unit: "10s clip",
      credits_per_unit: 8024,
      per_plan: { starter: 2, pro: 5, business: 26, enterprise: 55 }
    },
    {
      model: "SeeDance Lite",
      unit: "10s clip",
      credits_per_unit: 8610,
      per_plan: { starter: 2, pro: 5, business: 24, enterprise: 51 }
    },
    {
      model: "SeeDance Pro",
      unit: "10s clip",
      credits_per_unit: 11935,
      per_plan: { starter: 1, pro: 3, business: 17, enterprise: 37 }
    },
    {
      model: "Veo 3 Fast",
      unit: "10s clip",
      credits_per_unit: 39155,
      per_plan: { starter: 0, pro: 1, business: 5, enterprise: 11 }
    },
    {
      model: "Veo 3",
      unit: "10s clip",
      credits_per_unit: 73377,
      per_plan: { starter: 0, pro: 0, business: 2, enterprise: 6 }
    }
  ]
}

// New pricing table data structure
const pricingPlans: PricingPlan[] = [
  {
    name: 'Starter',
    level: 'starter',
    price: {
      monthly: 450, // 25% higher than annual monthly rate (₹360 × 1.25)
      yearly: 360, // Monthly rate when paid yearly
    },
    popular: false,
  },
  {
    name: 'Pro',
    level: 'pro',
    price: {
      monthly: 1171, // 25% higher than annual monthly rate (₹937 × 1.25)
      yearly: 937, // Monthly rate when paid yearly
    },
    popular: true,
  },
  {
    name: 'Business',
    level: 'business',
    price: {
      monthly: 5231, // 25% higher than annual monthly rate (₹4,185 × 1.25)
      yearly: 4185, // Monthly rate when paid yearly
    },
    popular: false,
  },
  {
    name: 'Enterprise',
    level: 'enterprise',
    price: {
      monthly: 11063, // 25% higher than annual monthly rate (₹8,850 × 1.25)
      yearly: 8850, // Monthly rate when paid yearly
    },
    popular: false,
  },
]

// Features for the new pricing table - simplified to show only model names
// Both billing options show the same monthly generation counts
// The PRICING_DATA already contains correct monthly calculations based on credit economics
const pricingFeatures: PricingFeature[] = PRICING_DATA.models.map((model) => ({
  name: model.model,
  unit: model.unit,
  included: "starter", // All models are available from starter tier
  counts: {
    yearly: {
      starter: model.per_plan.starter,
      pro: model.per_plan.pro,
      business: model.per_plan.business,
      enterprise: model.per_plan.enterprise,
    },
    monthly: {
      starter: model.per_plan.starter,
      pro: model.per_plan.pro,
      business: model.per_plan.business,
      enterprise: model.per_plan.enterprise,
    }
  }
}))

function formatNumber(n: number) {
  return n.toLocaleString('en-IN')
}

export default function PricingAINextPage() {
  return (
    <BootstrapLayout title="Pricing Plans - Gensy" currentPage="pricing">
      <div className="section-banner">
        <div className="container">
          <div className="section-banner-title">
            <h1>Pricing</h1>
            <nav style={{"--bs-breadcrumb-divider": "'/'"} as React.CSSProperties} aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/landing-page-2">Home</a></li>
                <li className="breadcrumb-item active" aria-current="page">Pricing</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      {/* New Pricing Table Component */}
      <div className="bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Creative Journey</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Transparent pricing plans. Select monthly or yearly billing and see exactly what you get with each plan.
            </p>
          </div>

          <PricingTable
            features={pricingFeatures}
            plans={pricingPlans}
            defaultInterval="yearly"
            defaultPlan="pro"
            containerClassName="max-w-5xl"
          />


        </div>
      </div>
    </BootstrapLayout>
  )
}
