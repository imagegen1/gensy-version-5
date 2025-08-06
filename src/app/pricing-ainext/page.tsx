import { Metadata } from 'next'
import BootstrapLayout from '../landing-page-2/BootstrapLayout'

export const metadata: Metadata = {
  title: 'Pricing Plans - Gensy',
  description: 'Choose the perfect plan for your AI image generation needs.',
}

export default function PricingPage() {
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
            <h2>Our Pricing Plans</h2>
          </div>
        </div>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-duration="1500">
              <div className="card">
                <h2 className="card_title"><i className="ri-vip-crown-line"></i> Student</h2>
                <h3 className="pricing">$20<span className="small">/per month</span></h3>
                <hr />
                <ul className="features">
                  <li>One account</li>
                  <li>Unlimited Projects</li>
                  <li>Download prototypes</li>
                </ul>
                <a href="/contact-ainext" className="cta_btn">Buy Now</a>
              </div>
            </div>
            <div className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-duration="1500">
              <div className="card active">
                <h2 className="card_title"><i className="ri-vip-crown-line"></i> Personal</h2>
                <h3 className="pricing">$39<span className="small">/per month</span></h3>
                <hr />
                <ul className="features">
                  <li>One account</li>
                  <li>Unlimited Projects</li>
                  <li>Download prototypes</li>
                </ul>
                <a href="/contact-ainext" className="cta_btn">Buy Now</a>
              </div>
            </div>
            <div className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-duration="1500">
              <div className="card">
                <h2 className="card_title"><i className="ri-vip-crown-line"></i> Family</h2>
                <h3 className="pricing">$60<span className="small">/per month</span></h3>
                <hr />
                <ul className="features">
                  <li>One account</li>
                  <li>Unlimited Projects</li>
                  <li>Download prototypes</li>
                </ul>
                <a href="/contact-ainext" className="cta_btn">Buy Now</a>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* End Pricing  Area */}


    </BootstrapLayout>
  )
}
