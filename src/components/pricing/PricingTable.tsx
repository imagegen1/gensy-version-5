'use client'

import React, { useState, useEffect } from 'react'
import { SubscriptionService, PricingTier, CreditPackage } from '@/lib/services/subscription'

interface PricingTableProps {
  showPayAsYouGo?: boolean
  showYearlyPlans?: boolean
  className?: string
}

export default function PricingTable({ 
  showPayAsYouGo = true, 
  showYearlyPlans = true,
  className = ''
}: PricingTableProps) {
  const [activeTab, setActiveTab] = useState<'yearly' | 'payasyougo'>('yearly')
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([])
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPricingData = async () => {
      try {
        // Load pricing tiers and credit packages
        const tiers = SubscriptionService.getPricingTiers()
        const packages = SubscriptionService.getCreditPackages()
        
        setPricingTiers(tiers)
        setCreditPackages(packages)
      } catch (error) {
        console.error('Error loading pricing data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPricingData()
  }, [])

  if (loading) {
    return (
      <div className={`pricing-table-container ${className}`}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading pricing...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`pricing-table-container ${className}`}>
      {/* Pricing Toggle */}
      {showPayAsYouGo && showYearlyPlans && (
        <div className="pricing-toggle">
          <div className="toggle-buttons">
            <button 
              className={`toggle-btn ${activeTab === 'yearly' ? 'active' : ''}`}
              onClick={() => setActiveTab('yearly')}
            >
              Yearly Plans
              <span className="badge">Best Value</span>
            </button>
            <button 
              className={`toggle-btn ${activeTab === 'payasyougo' ? 'active' : ''}`}
              onClick={() => setActiveTab('payasyougo')}
            >
              Pay as You Go
            </button>
          </div>
        </div>
      )}

      {/* Yearly Plans */}
      {(activeTab === 'yearly' || !showPayAsYouGo) && showYearlyPlans && (
        <div className="pricing-plans yearly-plans">
          <div className="plans-grid">
            {pricingTiers.map((tier, index) => (
              <div 
                key={tier.id} 
                className={`pricing-card ${tier.popular ? 'popular' : ''}`}
                data-aos="fade-up" 
                data-aos-duration={1200 + (index * 300)}
              >
                {tier.popular && <div className="popular-badge">Most Popular</div>}
                
                <div className="card-header">
                  <h3 className="plan-name">{tier.name}</h3>
                  <div className="price">
                    <span className="currency">₹</span>
                    <span className="amount">{tier.price_yearly.toLocaleString()}</span>
                    <span className="period">/year</span>
                  </div>
                  <div className="credits-info">
                    <p className="total-credits">{tier.credits_total.toLocaleString()} Credits/Year</p>
                    <p className="monthly-avg">~{tier.credits_per_month.toLocaleString()} Credits/Month</p>
                  </div>
                  <p className="description">{tier.description}</p>
                </div>

                <div className="card-body">
                  <ul className="features-list">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="feature-item">
                        <i className="ri-check-line"></i>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="card-footer">
                  <button className="cta-button">
                    {tier.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pay as You Go */}
      {(activeTab === 'payasyougo' || !showYearlyPlans) && showPayAsYouGo && (
        <div className="pricing-plans payasyougo-plans">
          <div className="plans-grid">
            {creditPackages.map((pkg, index) => (
              <div 
                key={pkg.id} 
                className="pricing-card credit-package"
                data-aos="fade-up" 
                data-aos-duration={1200 + (index * 300)}
              >
                <div className="card-header">
                  <h3 className="plan-name">{pkg.name}</h3>
                  <div className="price">
                    <span className="currency">₹</span>
                    <span className="amount">{pkg.price}</span>
                  </div>
                  <div className="credits-info">
                    <p className="total-credits">{pkg.credits.toLocaleString()} Credits</p>
                    {pkg.bonus_percentage > 0 && (
                      <p className="bonus">+{pkg.bonus_percentage}% Bonus Credits</p>
                    )}
                  </div>
                  <p className="description">{pkg.description}</p>
                </div>

                <div className="card-body">
                  <div className="value-breakdown">
                    <div className="value-item">
                      <span className="label">Base Credits:</span>
                      <span className="value">{Math.round(pkg.credits / (1 + pkg.bonus_percentage / 100)).toLocaleString()}</span>
                    </div>
                    {pkg.bonus_percentage > 0 && (
                      <div className="value-item bonus">
                        <span className="label">Bonus Credits:</span>
                        <span className="value">+{(pkg.credits - Math.round(pkg.credits / (1 + pkg.bonus_percentage / 100))).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="value-item total">
                      <span className="label">Total Credits:</span>
                      <span className="value">{pkg.credits.toLocaleString()}</span>
                    </div>
                    <div className="value-item rate">
                      <span className="label">Rate:</span>
                      <span className="value">₹{(pkg.price / pkg.credits).toFixed(4)}/credit</span>
                    </div>
                  </div>
                </div>

                <div className="card-footer">
                  <button className="cta-button">
                    Purchase Credits
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Table Styles */}
      <style jsx>{`
        .pricing-table-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .loading-spinner {
          text-align: center;
          padding: 60px 20px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #4f46e5;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .pricing-toggle {
          text-align: center;
          margin-bottom: 40px;
        }

        .toggle-buttons {
          display: inline-flex;
          background: #f3f4f6;
          border-radius: 12px;
          padding: 4px;
          position: relative;
        }

        .toggle-btn {
          padding: 12px 24px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .toggle-btn.active {
          background: white;
          color: #4f46e5;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .badge {
          background: #10b981;
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 30px;
          margin-top: 40px;
        }

        .pricing-card {
          background: white;
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          position: relative;
          border: 2px solid transparent;
        }

        .pricing-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }

        .pricing-card.popular {
          border-color: #4f46e5;
          transform: scale(1.05);
        }

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
        }

        .card-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .plan-name {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 16px;
        }

        .price {
          display: flex;
          align-items: baseline;
          justify-content: center;
          margin-bottom: 16px;
        }

        .currency {
          font-size: 20px;
          font-weight: 600;
          color: #4f46e5;
        }

        .amount {
          font-size: 48px;
          font-weight: 800;
          color: #4f46e5;
          margin: 0 4px;
        }

        .period {
          font-size: 16px;
          color: #6b7280;
        }

        .credits-info {
          margin: 16px 0;
        }

        .total-credits {
          font-size: 18px;
          font-weight: 600;
          color: #4f46e5;
          margin: 4px 0;
        }

        .monthly-avg {
          font-size: 14px;
          color: #6b7280;
          margin: 4px 0;
        }

        .bonus {
          font-size: 14px;
          color: #10b981;
          font-weight: 600;
          margin: 4px 0;
        }

        .description {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.5;
        }

        .features-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .feature-item {
          display: flex;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
          font-size: 14px;
          color: #374151;
        }

        .feature-item:last-child {
          border-bottom: none;
        }

        .feature-item i {
          color: #10b981;
          margin-right: 12px;
          font-size: 16px;
        }

        .value-breakdown {
          space-y: 12px;
        }

        .value-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          font-size: 14px;
        }

        .value-item.bonus {
          color: #10b981;
        }

        .value-item.total {
          border-top: 1px solid #f3f4f6;
          font-weight: 600;
          color: #1f2937;
        }

        .value-item.rate {
          font-size: 12px;
          color: #6b7280;
        }

        .card-footer {
          margin-top: 30px;
        }

        .cta-button {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(79, 70, 229, 0.4);
        }

        @media (max-width: 768px) {
          .plans-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .pricing-card.popular {
            transform: none;
          }
          
          .amount {
            font-size: 36px;
          }
        }
      `}</style>
    </div>
  )
}
