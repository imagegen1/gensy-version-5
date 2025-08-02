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
                  <h2>Join Our Network</h2>
                  <p>We'd love to have you! Join our 100% remote network of creators & freelancers.</p>
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
              <div className="image">
                <img src="/ainext-template/assets/img/contact.jpg" alt="image" />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* End Contact Area */}

      {/* Start Insta Gallery Area */}
      <div className="insta-gallery">
        <div className="conatiner-fluid">
          <div className="ins-gallery owl-carousel owl-theme">
            <div className="items">
              <a href="https://www.instagram.com/" target="_blank">
                <img src="/ainext-template/assets/img/gallery/insta-1.jpg" alt="image" />
                <i className="ri-instagram-line"></i>
              </a>
            </div>
            <div className="items">
              <a href="https://www.instagram.com/" target="_blank">
                <img src="/ainext-template/assets/img/gallery/insta-10.jpg" alt="image" />
                <i className="ri-instagram-line"></i>
              </a>
            </div>
            <div className="items">
              <a href="https://www.instagram.com/" target="_blank">
                <img src="/ainext-template/assets/img/gallery/insta-2.jpg" alt="image" />
                <i className="ri-instagram-line"></i>
              </a>
            </div>
            <div className="items">
              <a href="https://www.instagram.com/" target="_blank">
                <img src="/ainext-template/assets/img/gallery/insta-3.jpg" alt="image" />
                <i className="ri-instagram-line"></i>
              </a>
            </div>
            <div className="items">
              <a href="https://www.instagram.com/" target="_blank">
                <img src="/ainext-template/assets/img/gallery/insta-4.jpg" alt="image" />
                <i className="ri-instagram-line"></i>
              </a>
            </div>
            <div className="items">
              <a href="https://www.instagram.com/" target="_blank">
                <img src="/ainext-template/assets/img/gallery/insta-5.jpg" alt="image" />
                <i className="ri-instagram-line"></i>
              </a>
            </div>
            <div className="items">
              <a href="https://www.instagram.com/" target="_blank">
                <img src="/ainext-template/assets/img/gallery/insta-6.jpg" alt="image" />
                <i className="ri-instagram-line"></i>
              </a>
            </div>
            <div className="items">
              <a href="https://www.instagram.com/" target="_blank">
                <img src="/ainext-template/assets/img/gallery/insta-7.jpg" alt="image" />
                <i className="ri-instagram-line"></i>
              </a>
            </div>
            <div className="items">
              <a href="https://www.instagram.com/" target="_blank">
                <img src="/ainext-template/assets/img/gallery/insta-8.jpg" alt="image" />
                <i className="ri-instagram-line"></i>
              </a>
            </div>
            <div className="items">
              <a href="https://www.instagram.com/" target="_blank">
                <img src="/ainext-template/assets/img/gallery/insta-9.jpg" alt="image" />
                <i className="ri-instagram-line"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
      {/* End Insta Gallery Area */}
    </BootstrapLayout>
  )
}
