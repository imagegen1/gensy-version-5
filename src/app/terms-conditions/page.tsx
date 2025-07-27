import { Metadata } from 'next'
import BootstrapLayout from '../landing-page-2/BootstrapLayout'

export const metadata: Metadata = {
  title: 'Terms & Conditions - AiNext',
  description: 'Terms and conditions for using AiNext AI services.',
}

export default function TermsConditionsPage() {
  return (
    <BootstrapLayout title="Terms & Conditions - AiNext" currentPage="terms">
      {/* Start Section Banner */}
      <div className="section-banner">
        <div className="container">
          <div className="section-banner-title">
            <h1>Terms & Conditions</h1>
            <nav style={{"--bs-breadcrumb-divider": "'/'"} as React.CSSProperties} aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/landing-page-2">Home</a></li>
                <li className="breadcrumb-item active" aria-current="page">Terms & Conditions</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>
      {/* End Banner Area */}

      {/* Start Terms & Conditions Area */}
      <div className="terms-conditions-area pt-100 pb-70">
        <div className="container">
          <div className="content">

            <h4>What information do we collect?</h4>
            <p>
              We collect personal information that you provide to us, such as name, contact information, email address, and any other information you choose to provide. We may also collect information about how you interact with our website and services.
            </p>

            <h4>Use of Services</h4>
            <ol type="a">
              <li>You must be at least <b>18</b> years old to access and use our services.</li>
              <li>You agree to use the services only for lawful purposes and in accordance with these Terms.</li>
              <li>You are solely responsible for any content you post, upload, or transmit through our services.</li>
            </ol>

            <h4>User Accounts</h4>
            <ol type="a">
              <li>When you create an account with us, you must provide accurate, complete, and up-to-date information.</li>
              <li>You are responsible for safeguarding the password that you use to access the services and for any activities or actions under your password.</li>
            </ol>

            <h4>Privacy</h4>
            <p>
              Your use of the services is also governed by our Privacy Policy. Please review our Privacy Policy <a href="/privacy-policy">Privacy Policy</a> for more information on how we collect, use, and share your personal information.
            </p>

            <h4>Termination</h4>
            <p>
              These Terms shall be governed and construed in accordance with the laws of [Jurisdiction], without regard to its conflict of law provisions.
            </p>

            <h4>Governing Law</h4>
            <p>
              We may terminate or suspend your account and access to the services immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms.
            </p>

            <h4>Changes</h4>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least [number] days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
          </div>
        </div>
      </div>
      {/* End Terms & Conditions Area */}

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
