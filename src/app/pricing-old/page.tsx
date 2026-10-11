'use client'

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Crown, Building2, Rocket } from 'lucide-react';
import {
	type FeatureItem,
	PricingTable,
	PricingTableBody,
	PricingTableHeader,
	PricingTableHead,
	PricingTableRow,
	PricingTableCell,
	PricingTablePlan,
} from '@/components/ui/pricing-table-new';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import PayAsYouGo from '@/components/pay-as-you-go';

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
      credits_per_unit: 4181,
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

function formatNumber(n: number) {
  return n.toLocaleString('en-IN')
}

export default function PricingNewPage() {
  const [isYearly, setIsYearly] = useState(true);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Load JavaScript assets for this component instance
    if (assetsLoaded) return

    // Load JavaScript files
    const loadScript = (src: string) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve(true)
          return
        }

        const script = document.createElement('script')
        script.src = src
        script.onload = resolve
        script.onerror = reject
        document.body.appendChild(script)
      })
    }

    const loadScripts = async () => {
      try {
        await loadScript('/ainext-template/assets/js/jquery.min.js')
        await loadScript('/ainext-template/assets/js/bootstrap.bundle.min.js')
        await loadScript('/ainext-template/assets/js/aos.js')
        await loadScript('/ainext-template/assets/js/appear.min.js')
        await loadScript('/ainext-template/assets/js/odometer.min.js')
        await loadScript('/ainext-template/assets/js/owl.carousel.min.js')
        await loadScript('/ainext-template/assets/js/ainext.js')

        setAssetsLoaded(true)
      } catch (error) {
        console.error('Error loading scripts:', error)
      }
    }

    loadScripts()
  }, [])

  // Calculate pricing based on billing period
  const getPlanPrice = (monthlyPrice: number) => {
    if (isYearly) {
      return `₹${formatNumber(monthlyPrice)}`; // Monthly rate when paid yearly
    } else {
      return `₹${formatNumber(Math.floor(monthlyPrice * 1.25))}`; // 25% higher for monthly billing
    }
  };

  const getComparePrice = (monthlyPrice: number) => {
    if (isYearly) {
      return `₹${formatNumber(Math.floor(monthlyPrice * 1.25))}`; // Show monthly billing price as comparison
    } else {
      return undefined; // No comparison for monthly billing
    }
  };

  // Convert model data to features format with section headers
  const FEATURES: FeatureItem[] = [];

  // Add Images section header
  FEATURES.push({
    label: "Images",
    values: ["", "", "", ""],
    isHeader: true
  });

  // Add image models
  PRICING_DATA.models
    .filter(model => model.unit === "image")
    .forEach(model => {
      FEATURES.push({
        label: model.model,
        values: [
          model.per_plan.starter,
          model.per_plan.pro,
          model.per_plan.business,
          model.per_plan.enterprise,
        ],
        isHeader: false
      });
    });

  // Add Video Models section header
  FEATURES.push({
    label: "Video Models",
    values: ["", "", "", ""],
    isHeader: true
  });

  // Add video models
  PRICING_DATA.models
    .filter(model => model.unit === "10s clip")
    .forEach(model => {
      FEATURES.push({
        label: model.model,
        values: [
          model.per_plan.starter,
          model.per_plan.pro,
          model.per_plan.business,
          model.per_plan.enterprise,
        ],
        isHeader: false
      });
    });

  // Fixed function with proper null checking - Fixes JAVASCRIPT-NEXTJS-3
  const safeFunction = () => {
    const potentiallyNullObject: any = null;

    // Proper null checking to prevent TypeError
    if (potentiallyNullObject && potentiallyNullObject.someProperty) {
      return potentiallyNullObject.someProperty.nestedProperty;
    }

    // Return a safe default value
    return 'Safe default value';
  };

  // Demonstrate the fix when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('test-fix')) {
      try {
        const result = safeFunction();
        console.log('Safe function result:', result);
      } catch (error) {
        console.error('This should not happen with the fix:', error);
      }
    }
  }, []);

  return (
    <div>
      {/* Layout Fix CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* LAYOUT FIX - Resolve horizontal overflow and right-side whitespace */
          html, body {
            overflow-x: hidden !important;
            max-width: 100vw !important;
          }

          /* Remove problematic max-width constraint */
          @media only screen and (min-width: 992px) and (max-width: 1199px) {
            .container-fluid {
              max-width: none !important;
              width: 100% !important;
              padding-left: 15px !important;
              padding-right: 15px !important;
            }
          }

          /* Reduce excessive padding for large screens */
          @media only screen and (min-width: 1750px) {
            .container-fluid {
              max-width: 100% !important;
              padding-left: 50px !important;
              padding-right: 50px !important;
            }
          }

          /* Ensure container-fluid always uses full width */
          .container-fluid {
            width: 100% !important;
            max-width: 100vw !important;
          }

          /* Section fixes */
          section {
            width: 100% !important;
            max-width: 100vw !important;
            overflow-x: hidden !important;
          }

          /* Bootstrap grid fixes */
          .row {
            margin-left: 0 !important;
            margin-right: 0 !important;
            max-width: 100% !important;
          }

          /* Pricing page specific styles */
          .gradient-text {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .pricing-toggle-wrap {
            display: inline-block;
            position: relative;
          }

          .pricing-toggle {
            position: relative;
            display: inline-block;
          }

          .pricing-toggle input[type="checkbox"] {
            display: none;
          }

          .pricing-toggle-label {
            display: flex;
            align-items: center;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50px;
            padding: 8px;
            cursor: pointer;
            position: relative;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .pricing-toggle-label .left-text,
          .pricing-toggle-label .right-text {
            padding: 8px 20px;
            font-size: 14px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.7);
            transition: all 0.3s ease;
            position: relative;
            z-index: 2;
          }

          .pricing-toggle-label::before {
            content: '';
            position: absolute;
            top: 8px;
            left: 8px;
            width: calc(50% - 8px);
            height: calc(100% - 16px);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50px;
            transition: all 0.3s ease;
            z-index: 1;
          }

          .pricing-toggle input[type="checkbox"]:checked + .pricing-toggle-label::before {
            transform: translateX(100%);
          }

          .pricing-toggle input[type="checkbox"]:checked + .pricing-toggle-label .right-text {
            color: white;
          }

          .pricing-toggle input[type="checkbox"]:not(:checked) + .pricing-toggle-label .left-text {
            color: white;
          }
        `
      }} />

      {/* Start Navbar Area */}
      <nav className="navbar navbar-expand-lg" id="navbar">
        <div className="container-fluid">
          <a className="navbar-brand" href="/landing-page-2">
            <img src="/ainext-template/assets/img/main logo.svg" alt="Gensy Logo" style={{width: '226.66px', height: '170px'}} />
          </a>
          <a className="navbar-toggler text-decoration-none" data-bs-toggle="offcanvas" href="#navbarOffcanvas" role="button" aria-controls="navbarOffcanvas">
            <span className="burger-menu">
              <span className="top-bar"></span>
              <span className="middle-bar"></span>
              <span className="bottom-bar"></span>
            </span>
          </a>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav">
              <li className="nav-item">
                <a href="/landing-page-2" className="nav-link">
                  Home
                </a>
              </li>
              <li className="nav-item">
                <a href="javascript:void(0)" className="dropdown-toggle nav-link active">
                  Pages
                </a>
                <ul className="dropdown-menu">
                  <li className="nav-item">
                    <a href="/about" className="nav-link">
                      About Us
                    </a>
                  </li>
                  <li className="nav-item">
                    <a href="/team" className="nav-link">
                      Team
                    </a>
                  </li>
                  <li className="nav-item">
                    <a href="/pricing" className="nav-link active">
                      Pricing
                    </a>
                  </li>
                  <li className="nav-item">
                    <a href="/terms-conditions" className="nav-link">
                      Terms & Conditions
                    </a>
                  </li>
                  <li className="nav-item">
                    <a href="/privacy-policy" className="nav-link">
                      Privacy Policy
                    </a>
                  </li>
                  <li className="nav-item">
                    <a href="/not-found" className="nav-link">
                      404 Error Page
                    </a>
                  </li>
                </ul>
              </li>
              <li className="nav-item">
                <a href="/portfolio" className="nav-link">
                  Portfolio
                </a>
              </li>
              <li className="nav-item">
                <a href="javascript:void(0)" className="dropdown-toggle nav-link">
                  Blog
                </a>
                <ul className="dropdown-menu">
                  <li className="nav-item">
                    <a href="/blog" className="nav-link">
                      Blog Grid
                    </a>
                  </li>
                  <li className="nav-item">
                    <a href="/blog" className="nav-link">
                      Blog Right Sidebar
                    </a>
                  </li>
                  <li className="nav-item">
                    <a href="/blog" className="nav-link">
                      Blog Details
                    </a>
                  </li>
                </ul>
              </li>
              <li className="nav-item">
                <a href="/contact" className="nav-link">
                  Contact Us
                </a>
              </li>
            </ul>
            <div className="nav-btn">
              {isSignedIn ? (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="default-btn"
                >
                  Dashboard
                  <i className="ri-arrow-right-line"></i>
                </button>
              ) : (
                <div className="d-flex gap-3">
                  <button
                    onClick={() => router.push('/auth/sign-in')}
                    className="btn btn-outline-light px-4 py-2"
                    style={{
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      color: 'white',
                      backgroundColor: 'transparent',
                      borderRadius: '25px',
                      fontWeight: '500',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => router.push('/auth/sign-up')}
                    className="default-btn"
                  >
                    Sign Up
                    <i className="ri-arrow-right-line"></i>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      {/* End Navbar Area */}

      {/* Start Responsive Navbar Area */}
      <div className="responsive-navbar offcanvas offcanvas-end border-0" data-bs-backdrop="static" tabIndex={-1} id="navbarOffcanvas">
        <div className="offcanvas-header">
          <a href="/landing-page-2" className="logo d-inline-block">
            <img src="/ainext-template/assets/img/main logo.svg" alt="Gensy Logo" style={{width: '226.66px', height: '170px'}} />
          </a>
          <button type="button" className="close-btn bg-transparent position-relative lh-1 p-0 border-0" data-bs-dismiss="offcanvas" aria-label="Close">
            <i className="ri-close-line"></i>
          </button>
        </div>
        <div className="offcanvas-body">
          <ul className="responsive-menu">
            <li className="responsive-menu-list without-icon">
              <a href="/landing-page-2">Home</a>
            </li>
            <li className="responsive-menu-list">
              <a href="javascript:void(0);">Pages</a>
              <ul className="responsive-menu-items">
                <li><a href="/about">About</a></li>
                <li><a href="/team">Team</a></li>
                <li><a href="/pricing">Pricing</a></li>
                <li><a href="/terms-conditions">Terms Conditions</a></li>
                <li><a href="/privacy-policy">Privacy Policy</a></li>
                <li><a href="/not-found">404 Error Page</a></li>
              </ul>
            </li>
            <li className="responsive-menu-list without-icon">
              <a href="/portfolio">Portfolio</a>
            </li>
            <li className="responsive-menu-list">
              <a href="javascript:void(0);">Blog</a>
              <ul className="responsive-menu-items">
                <li><a href="/blog">Blog</a></li>
                <li><a href="/blog">Blog Right Sidebar</a></li>
                <li><a href="/blog">Blog Details</a></li>
              </ul>
            </li>
            <li className="responsive-menu-list without-icon">
              <a href="/contact">Contact</a>
            </li>
          </ul>
          <div className="others-option d-md-flex align-items-center">
            <div className="option-item">
              {isSignedIn ? (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="default-btn"
                >
                  <i className="ri-arrow-right-line"></i>
                  <span>Dashboard</span>
                </button>
              ) : (
                <div className="d-flex flex-column gap-2">
                  <button
                    onClick={() => router.push('/auth/sign-in')}
                    className="btn btn-outline-light w-100"
                    style={{
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      color: 'white',
                      backgroundColor: 'transparent',
                      borderRadius: '25px',
                      fontWeight: '500',
                      padding: '10px 20px'
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => router.push('/auth/sign-up')}
                    className="default-btn w-100"
                  >
                    <i className="ri-arrow-right-line"></i>
                    <span>Sign Up</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* End Responsive Navbar Area */}

      {/* Main Content */}
      <section className="pricing-area pt-100 pb-70">
        <div className="container">
          <div className="section-title text-center">
            <h2>
              Choose Your{' '}
              <span className="gradient-text">AI Generation</span>{' '}
              Plan
            </h2>
            <p>
              Generate stunning images and videos with our AI models. Choose the plan that fits your creative needs.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="text-center mb-5">
            <div className="pricing-toggle-wrap">
              <div className="pricing-toggle">
                <input
                  type="checkbox"
                  id="pricing-toggle"
                  checked={isYearly}
                  onChange={(e) => setIsYearly(e.target.checked)}
                />
                <label htmlFor="pricing-toggle" className="pricing-toggle-label">
                  <span className="left-text">Monthly billing</span>
                  <span className="right-text">Annual billing</span>
                </label>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-center">
            <PricingTableComponent
              isYearly={isYearly}
              getPlanPrice={getPlanPrice}
              getComparePrice={getComparePrice}
              features={FEATURES}
            />
          </div>
        </div>
      </section>

      {/* Pay-As-You-Go Section */}
      <PayAsYouGo />

      {/* Start Footer Area */}
      <footer className="footer-area">
        <div className="container">
          <div className="footer-top-area pt-100">
            <div className="row align-items-start">
              <div className="col-lg-4 col-md-6 col-sm-12">
                <div className="single-footer-widget">
                  <a href="/landing-page-2" className="logo">
                    <img src="/ainext-template/assets/img/main logo.svg" alt="Gensy Logo" style={{width: '226.66px', height: '170px'}} />
                  </a>
                  <p>The platform for transforming your creative ideas into breathtaking AI-generated videos, art, and images in seconds.</p>
                </div>
              </div>
              <div className="col-lg-2 col-md-3 col-sm-6">
                <div className="single-footer-widget pl-5">
                  <h3>Platform</h3>
                  <ul className="links-list">
                    <li><a href="/">Home</a></li>
                    <li><a href="/pricing">Pricing</a></li>
                    <li><a href="/generate/image">Images</a></li>
                    <li><a href="/video">Videos</a></li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-2 col-md-3 col-sm-6">
                <div className="single-footer-widget">
                  <h3>Legal</h3>
                  <ul className="links-list">
                    <li><a href="/terms-conditions">Terms & Conditions</a></li>
                    <li><a href="/privacy-policy">Privacy Policy</a></li>
                    <li><a href="/pricing">Payment Method</a></li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-4 col-md-6 col-sm-12">
                <div className="single-footer-widget">
                  <h3>Company & Contact</h3>
                  <ul className="links-list" style={{lineHeight: '1.9'}}>
                    <li><span style={{color: '#aaa'}}>Company:</span> <strong>Gensy Technologies</strong></li>
                    <li><span style={{color: '#aaa'}}>Founder:</span> <strong>Gopi U.</strong></li>
                    <li><span style={{color: '#aaa'}}>Website:</span> <a href="https://gensy.online" style={{color: '#9333ea'}}>Gensy.online</a></li>
                    <li><span style={{color: '#aaa'}}>Email:</span> <a href="mailto:info@gensy.online" style={{color: '#9333ea'}}>info@gensy.online</a></li>
                    <li><span style={{color: '#aaa'}}>Location:</span> 7/10 Abirami Gardens, Salem, Tamil Nadu, India</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="pr-line"></div>
          <div className="footer-bottom-area text-center py-3">
            <p style={{margin: 0}}>© {new Date().getFullYear()} Gensy. All Rights Reserved.</p>
          </div>
        </div>
        <div className="lines">
          <div className="line"></div>
          <div className="line"></div>
          <div className="line"></div>
        </div>
      </footer>
      {/* End Footer Area */}

      {/* Start Top to Bottom */}
      <div id="progress">
        <span id="progress-value"><i className="ri-arrow-up-line"></i></span>
      </div>
      {/* End Top to Bottom */}
    </div>
  );
}

function PricingTableComponent({
  isYearly,
  getPlanPrice,
  getComparePrice,
  features
}: {
  isYearly: boolean;
  getPlanPrice: (price: number) => string;
  getComparePrice: (price: number) => string | undefined;
  features: FeatureItem[];
}) {
  return (
    <div className="w-100">
      <PricingTable className="bg-card rounded-lg overflow-hidden border border-border shadow-2xl mx-auto" style={{maxWidth: '1200px'}}>
        <PricingTableHeader>
          <PricingTableRow>
            <th className="bg-card" />
            <th className="p-2">
              <PricingTablePlan
                name="Starter"
                badge="For Individuals"
                price={getPlanPrice(360)}
                compareAt={getComparePrice(360)}
                icon={Sparkles}
              >
                <Button
                  variant="outline"
                  className="w-full rounded-lg bg-transparent border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  size="sm"
                >
                  Get Started
                </Button>
              </PricingTablePlan>
            </th>
            <th className="p-2">
              <PricingTablePlan
                name="Pro"
                badge="Most Popular"
                price={getPlanPrice(937)}
                compareAt={getComparePrice(937)}
                icon={Crown}
                isPopular={true}
              >
                <Button
                  className="w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 border-0"
                  size="sm"
                >
                  Get Started
                </Button>
              </PricingTablePlan>
            </th>
            <th className="p-2">
              <PricingTablePlan
                name="Business"
                badge="For Teams"
                price={getPlanPrice(4185)}
                compareAt={getComparePrice(4185)}
                icon={Building2}
              >
                <Button
                  variant="outline"
                  className="w-full rounded-lg bg-transparent border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  size="sm"
                >
                  Get Started
                </Button>
              </PricingTablePlan>
            </th>
            <th className="p-2">
              <PricingTablePlan
                name="Enterprise"
                badge="For Organizations"
                price={getPlanPrice(8850)}
                compareAt={getComparePrice(8850)}
                icon={Rocket}
              >
                <Button
                  variant="outline"
                  className="w-full rounded-lg bg-transparent border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  size="sm"
                >
                  Contact Sales
                </Button>
              </PricingTablePlan>
            </th>
          </PricingTableRow>
        </PricingTableHeader>
        <PricingTableBody>
          {features.map((feature, index) => (
            <PricingTableRow key={index}>
              <PricingTableHead className="min-w-[250px]">
                {feature.isHeader ? (
                  <div className="py-3">
                    <span className="font-bold text-lg text-foreground bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                      {feature.label}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{feature.label}</span>
                  </div>
                )}
              </PricingTableHead>
              {feature.values.map((value, index) => (
                <PricingTableCell key={index}>
                  {feature.isHeader ? "" : value}
                </PricingTableCell>
              ))}
            </PricingTableRow>
          ))}
        </PricingTableBody>
      </PricingTable>
    </div>
  );
}
