import { Metadata } from 'next'
import BootstrapLayout from '../landing-page-2/BootstrapLayout'

export const metadata: Metadata = {
  title: 'Pricing Plans - Gensy',
  description: 'Choose the perfect plan for your AI image generation needs.',
}

// Mock data for pricing plans (in production, this would come from your API)
const mockPricingPlans = [
  {
    id: 'free',
    name: 'Free',
    price_yearly: 0,
    credits_per_month: 100,
    credits_total_yearly: 1200,
    is_popular: false,
    features: {
      image_generation: true,
      basic_upscaling: true,
      video_generation: false,
      batch_processing: false,
      priority_support: false,
      max_generations_per_day: 5
    }
  },
  {
    id: 'starter',
    name: 'Starter',
    price_yearly: 360,
    credits_per_month: 1500,
    credits_total_yearly: 18000,
    is_popular: false,
    features: {
      image_generation: true,
      advanced_upscaling: true,
      video_generation: true,
      batch_processing: true,
      priority_support: false,
      email_support: true,
      community_access: true
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    price_yearly: 937,
    credits_per_month: 3904,
    credits_total_yearly: 46848,
    is_popular: true,
    features: {
      image_generation: true,
      advanced_upscaling: true,
      video_generation: true,
      batch_processing: true,
      priority_support: true,
      api_access: false,
      advanced_analytics: true,
      priority_processing: true
    }
  },
  {
    id: 'business',
    name: 'Business',
    price_yearly: 4185,
    credits_per_month: 17437,
    credits_total_yearly: 209244,
    is_popular: false,
    features: {
      image_generation: true,
      advanced_upscaling: true,
      video_generation: true,
      batch_processing: true,
      priority_support: true,
      api_access: true,
      custom_branding: true,
      team_collaboration: true,
      dedicated_support: true
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price_yearly: 8850,
    credits_per_month: 36875,
    credits_total_yearly: 442500,
    is_popular: false,
    features: {
      image_generation: true,
      advanced_upscaling: true,
      video_generation: true,
      batch_processing: true,
      priority_support: true,
      api_access: true,
      custom_models: true,
      white_label: true,
      custom_integrations: true,
      sla_guarantee: true,
      phone_support: true,
      custom_training: true
    }
  }
];

// Helper functions
const getIconForPlan = (planName: string) => {
  switch (planName) {
    case 'Free': return 'ri-gift-line';
    case 'Starter': return 'ri-seedling-line';
    case 'Pro': return 'ri-vip-crown-line';
    case 'Business': return 'ri-building-line';
    case 'Enterprise': return 'ri-rocket-line';
    default: return 'ri-star-line';
  }
};

const getFeatures = (planName: string) => {
  switch (planName) {
    case 'Free':
      return [
        'Basic Image Generation',
        'Basic Upscaling',
        '5 Generations/Day',
        'Community Support'
      ];
    case 'Starter':
      return [
        'Image Generation (Basic Models)',
        'Video Generation (Basic Models)',
        'Image Upscaling',
        'Email Support',
        'Community Access'
      ];
    case 'Pro':
      return [
        'All Starter Features',
        'Advanced Image Models',
        'Advanced Video Models',
        'Priority Processing',
        'Priority Support',
        'Advanced Analytics'
      ];
    case 'Business':
      return [
        'All Pro Features',
        'Premium Models Access',
        'API Access',
        'Team Collaboration',
        'Custom Branding',
        'Dedicated Support'
      ];
    case 'Enterprise':
      return [
        'All Business Features',
        'Unlimited Premium Models',
        'White Label Solution',
        'Custom Integrations',
        'SLA Guarantee',
        '24/7 Phone Support',
        'Custom Training'
      ];
    default:
      return [];
  }
};

export default function PricingPage() {
  const pricingPlans = mockPricingPlans;
  return (
    <BootstrapLayout title="Pricing Plans - Gensy" currentPage="pricing">
      {/* Start Section Banner */}
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
      {/* End Banner Area */}

      {/* Start Pricing Area */}
      <div className="pricing-area ptb-100 section-bg">
        <div className="section-title-center">
          <div className="width">
            <div className="sub-t">Best Pricing Plans</div>
            <h2>Choose Your Creative Journey</h2>
            <p>Transparent pricing with no hidden fees. All plans include yearly billing for maximum value.</p>
          </div>
        </div>

        {/* Pricing Page Styles */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Container and Grid Fixes */
            .container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 0 15px;
            }

            .row {
              display: flex;
              flex-wrap: wrap;
              margin: 0 -15px;
              justify-content: center;
              align-items: stretch;
            }

            .col-lg-3 {
              flex: 0 0 25%;
              max-width: 25%;
              padding: 0 15px;
              margin-bottom: 30px;
            }

            @media (max-width: 1199px) {
              .col-lg-3 {
                flex: 0 0 50%;
                max-width: 50%;
              }
            }

            @media (max-width: 767px) {
              .col-lg-3 {
                flex: 0 0 100%;
                max-width: 100%;
              }
            }

            /* Card Styling */
            .card {
              position: relative;
              background: white;
              border-radius: 16px;
              padding: 30px 20px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
              transition: all 0.3s ease;
              border: 2px solid transparent;
              height: 100%;
              display: flex;
              flex-direction: column;
              text-align: center;
              overflow: visible;
            }

            .card:hover {
              transform: translateY(-8px);
              box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
            }

            .card.active {
              transform: scale(1.05);
              box-shadow: 0 20px 40px rgba(79, 70, 229, 0.2);
              border: 2px solid #4f46e5;
            }

            /* Popular Badge */
            .popular-badge {
              position: absolute;
              top: -12px;
              left: 50%;
              transform: translateX(-50%);
              background: linear-gradient(135deg, #4f46e5, #7c3aed);
              color: white;
              padding: 6px 20px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              z-index: 10;
            }

            /* Card Title */
            .card_title {
              font-size: 24px;
              font-weight: 700;
              color: #1f2937;
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
            }

            .card_title i {
              font-size: 28px;
              color: #4f46e5;
            }

            /* Pricing Display */
            .pricing {
              font-size: 48px;
              font-weight: 800;
              color: #4f46e5 !important;
              margin-bottom: 10px;
              line-height: 1;
              display: flex;
              align-items: baseline;
              justify-content: center;
              gap: 4px;
            }

            .pricing .small {
              font-size: 16px;
              font-weight: 500;
              color: #6b7280;
            }

            /* Credits Info */
            .credits-info {
              text-align: center;
              margin: 20px 0;
              padding: 15px;
              background: #f8fafc;
              border-radius: 12px;
            }

            .credits-info .credits {
              font-size: 18px;
              font-weight: 600;
              color: #4f46e5;
              margin: 5px 0;
            }

            .credits-info .monthly-avg {
              font-size: 14px;
              color: #6b7280;
              margin: 5px 0;
            }

            /* Features List */
            .features {
              list-style: none;
              padding: 0;
              margin: 20px 0;
              flex-grow: 1;
            }

            .features li {
              padding: 12px 0;
              border-bottom: 1px solid #f3f4f6;
              font-size: 14px;
              color: #374151;
              text-align: left;
              display: flex;
              align-items: center;
            }

            .features li:last-child {
              border-bottom: none;
            }

            .features li:before {
              content: "✓";
              color: #10b981;
              font-weight: bold;
              margin-right: 12px;
              font-size: 16px;
            }

            /* CTA Button */
            .cta_btn {
              background: linear-gradient(135deg, #4f46e5, #7c3aed);
              color: white;
              border: none;
              border-radius: 12px;
              padding: 16px 24px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
              text-decoration: none;
              display: inline-block;
              margin-top: auto;
              width: 100%;
              text-align: center;
            }

            .cta_btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 10px 20px rgba(79, 70, 229, 0.3);
              color: white;
              text-decoration: none;
            }

            /* Responsive Adjustments */
            @media (max-width: 1199px) {
              .card.active {
                transform: none;
              }

              .pricing {
                font-size: 40px;
              }
            }

            @media (max-width: 767px) {
              .card {
                padding: 25px 20px;
              }

              .pricing {
                font-size: 36px;
              }

              .card_title {
                font-size: 20px;
              }
            }
          `
        }} />
        <div className="container">
          <div className="row justify-content-center">
            {pricingPlans.map((plan, index) => (
              <div key={plan.id} className="col-lg-3 col-md-6" data-aos="fade-up" data-aos-duration={1200 + (index * 300)}>
                <div className={`card ${plan.is_popular ? 'active' : ''}`}>
                  {plan.is_popular && (
                    <div className="popular-badge">Most Popular</div>
                  )}

                  <h2 className="card_title">
                    <i className={getIconForPlan(plan.name)}></i>
                    <span>{plan.name}</span>
                  </h2>

                  <h3 className="pricing">
                    ₹{plan.price_yearly.toLocaleString('en-IN')}
                    <span className="small">/per year</span>
                  </h3>

                  <div className="credits-info">
                    <p className="credits">
                      {plan.credits_total_yearly.toLocaleString('en-IN')} Credits/Year
                    </p>
                    <p className="monthly-avg">
                      ~{plan.credits_per_month.toLocaleString('en-IN')} Credits/Month
                    </p>
                  </div>

                  <hr />

                  <ul className="features">
                    {getFeatures(plan.name).map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>

                  <a href="/pricing" className="cta_btn">
                    {plan.name === 'Free' ? 'Get Started' :
                     plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* End Pricing  Area */}


    </BootstrapLayout>
  )
}
