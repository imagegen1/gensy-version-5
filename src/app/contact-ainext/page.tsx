import { Metadata } from 'next'
import BootstrapLayout from '../landing-page-2/BootstrapLayout'

export const metadata: Metadata = {
  title: 'Contact Us - Gensy',
  description: 'Get in touch with our team for support, partnerships, or inquiries.',
}

export default function ContactPage() {
  return (
    <BootstrapLayout title="Contact Us - Gensy" currentPage="contact">
      {/* Start Section Banner */}
      <div className="section-banner">
        <div className="container">
          <div className="section-banner-title">
            <h1>Contact Us</h1>
            <nav style={{"--bs-breadcrumb-divider": "'/'"} as React.CSSProperties} aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/landing-page-2">Home</a></li>
                <li className="breadcrumb-item active" aria-current="page">Contact Us</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>
      {/* End Banner Area */}

      {/* Start Contact Area */}
      <div className="contact-area ptb-100">
        <div className="container">
          <div className="row">
            <div className="col-lg-6">
              <div className="section-title">
                <div className="width">
                  <div className="sub-t">Contact</div>
                  <h2>Get in Touch with Gensy</h2>
                  <p>Have questions, feedback, or enterprise inquiries? Reach out directly to our team.</p>
                </div>
              </div>
              <div className="contact-form">
                <form id="contactForm">
                  <div className="row">
                    <div className="col-lg-12 col-md-12">
                      <div className="form-group">
                        <input type="text" name="name" className="form-control" id="name" required data-error="Please enter your name" placeholder="Name" />
                        <div className="help-block with-errors"></div>
                      </div>
                    </div>

                    <div className="col-lg-12 col-md-12">
                      <div className="form-group">
                        <input type="text" name="email" className="form-control" id="email" required data-error="Please enter your Email Address" placeholder="Email Address" />
                        <div className="help-block with-errors"></div>
                      </div>
                    </div>

                    <div className="col-lg-12 col-md-12">
                      <div className="form-group">
                        <input type="text" name="subject" className="form-control" id="subject" required data-error="Please enter your subject" placeholder="Subject" />
                        <div className="help-block with-errors"></div>
                      </div>
                    </div>

                    <div className="col-lg-12 col-md-12">
                      <div className="form-group">
                        <input type="text" name="phone_number" className="form-control" id="phone_number" required data-error="Please enter your phone number" placeholder="Phone Number" />
                        <div className="help-block with-errors"></div>
                      </div>
                    </div>

                    <div className="col-lg-12 col-md-12 mb-5">
                      <div className="form-group">
                        <textarea name="message" id="message" className="form-control" cols={30} rows={6} required data-error="Please enter your message" placeholder="Write your message..."></textarea>
                        <div className="help-block with-errors"></div>
                      </div>
                    </div>

                    <div className="col-lg-12 col-md-12">
                      <button type="submit" className="default-btn"><i className="ri-mail-send-line"></i> Send Message</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="contact-info-card p-4 rounded mb-4" style={{backgroundColor: '#18181b', border: '1px solid #27272a'}}>
                <h3 className="text-white mb-3" style={{fontSize: '22px'}}>Company Information</h3>
                <ul style={{listStyle: 'none', padding: 0, margin: 0, lineHeight: '2.2', color: '#d4d4d8'}}>
                  <li><strong style={{color: '#fff'}}>Company Name:</strong> Gensy Technologies</li>
                  <li><strong style={{color: '#fff'}}>Founder & CEO:</strong> Gopi U.</li>
                  <li><strong style={{color: '#fff'}}>Website:</strong> <a href="https://gensy.online" style={{color: '#a855f7'}}>Gensy.online</a></li>
                  <li><strong style={{color: '#fff'}}>Support Email:</strong> <a href="mailto:info@gensy.online" style={{color: '#a855f7'}}>info@gensy.online</a></li>
                  <li><strong style={{color: '#fff'}}>Phone:</strong> (+91) 9943764364</li>
                  <li><strong style={{color: '#fff'}}>Registered Address:</strong> 7/10 Abirami Gardens, 5th Cross, Salem, Tamil Nadu, 636302, India</li>
                </ul>
              </div>
              <div className="image">
                <img src="/ainext-template/assets/img/contact.jpg" alt="Contact Gensy" style={{borderRadius: '8px'}} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* End Contact Area */}

      {/* Start Showcase Gallery Area */}
      <div className="insta-gallery">
        <div className="conatiner-fluid">
          <div className="ins-gallery owl-carousel owl-theme">
            <div className="items">
              <a href="/generate/image">
                <img src="/ainext-template/assets/img/gallery/insta-1.jpg" alt="AI Generated Asset" />
                <i className="ri-sparkling-fill"></i>
              </a>
            </div>
            <div className="items">
              <a href="/generate/image">
                <img src="/ainext-template/assets/img/gallery/insta-10.jpg" alt="AI Generated Asset" />
                <i className="ri-sparkling-fill"></i>
              </a>
            </div>
            <div className="items">
              <a href="/generate/image">
                <img src="/ainext-template/assets/img/gallery/insta-2.jpg" alt="AI Generated Asset" />
                <i className="ri-sparkling-fill"></i>
              </a>
            </div>
            <div className="items">
              <a href="/generate/image">
                <img src="/ainext-template/assets/img/gallery/insta-3.jpg" alt="AI Generated Asset" />
                <i className="ri-sparkling-fill"></i>
              </a>
            </div>
            <div className="items">
              <a href="/generate/image">
                <img src="/ainext-template/assets/img/gallery/insta-4.jpg" alt="AI Generated Asset" />
                <i className="ri-sparkling-fill"></i>
              </a>
            </div>
            <div className="items">
              <a href="/generate/image">
                <img src="/ainext-template/assets/img/gallery/insta-5.jpg" alt="AI Generated Asset" />
                <i className="ri-sparkling-fill"></i>
              </a>
            </div>
            <div className="items">
              <a href="/generate/image">
                <img src="/ainext-template/assets/img/gallery/insta-6.jpg" alt="AI Generated Asset" />
                <i className="ri-sparkling-fill"></i>
              </a>
            </div>
            <div className="items">
              <a href="/generate/image">
                <img src="/ainext-template/assets/img/gallery/insta-7.jpg" alt="AI Generated Asset" />
                <i className="ri-sparkling-fill"></i>
              </a>
            </div>
            <div className="items">
              <a href="/generate/image">
                <img src="/ainext-template/assets/img/gallery/insta-8.jpg" alt="AI Generated Asset" />
                <i className="ri-sparkling-fill"></i>
              </a>
            </div>
            <div className="items">
              <a href="/generate/image">
                <img src="/ainext-template/assets/img/gallery/insta-9.jpg" alt="AI Generated Asset" />
                <i className="ri-sparkling-fill"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
      {/* End Showcase Gallery Area */}
    </BootstrapLayout>
  )
}
