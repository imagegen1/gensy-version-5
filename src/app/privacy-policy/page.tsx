import { Metadata } from 'next'
import BootstrapLayout from '../landing-page-2/BootstrapLayout'

export const metadata: Metadata = {
  title: 'Privacy Policy - AiNext',
  description: 'Privacy policy for AiNext AI services and data protection.',
}

export default function PrivacyPolicyPage() {
  return (
    <BootstrapLayout title="Privacy Policy - AiNext" currentPage="privacy">
      {/* Start Section Banner */}
      <div className="section-banner">
        <div className="container">
          <div className="section-banner-title">
            <h1>Privacy Policy</h1>
            <nav style={{"--bs-breadcrumb-divider": "'/'"} as React.CSSProperties} aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/landing-page-2">Home</a></li>
                <li className="breadcrumb-item active" aria-current="page">Privacy Policy</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>
      {/* End Banner Area */}

      {/* Start Privacy Policy Area */}
      <div className="privacy-policy-area pt-100 pb-70">
        <div className="container">
          <div className="content">
            <p>Last Updated On Sep 01, 2023</p>
            <p>
              Welcome to <a href="/landing-page-2">www.ainext.com</a> ("us", "we", or "our"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us at <a href="mailto:hello@ainext.com">hello@ainext.com</a>
            </p>
            <p>
              When you visit our website <a href="/landing-page-2">www.ainext.com</a> and use our services, you trust us with your personal information. We take your privacy very seriously. In this privacy policy, we describe our privacy policy. We seek to explain to you in the clearest way possible what information we collect, how we use it, and what rights you have in relation to it. We hope you take some time to read through it carefully, as it is important. If there are any terms in this privacy policy that you do not agree with, please discontinue use of our Sites and our services.
            </p>
            <h4>What information do we collect?</h4>
            <p>
              We collect personal information that you provide to us, such as name, contact information, email address, and any other information you choose to provide. We may also collect information about how you interact with our website and services.
            </p>

            <h4>How do we use your information?</h4>
            <p>
              We process your information for purposes based on legitimate business interests, the fulfillment of our contract with you, compliance with our legal obligations, and your consent. We use your personal information for:
            </p>
            <ul>
              <li>Providing, maintaining, and improving our services.</li>
              <li>Sending you marketing and promotional communications.</li>
              <li>Responding to your comments, questions, and requests.</li>
              <li>Fulfilling orders and providing customer support.</li>
            </ul>

            <h4>Will your information be shared with anyone?</h4>
            <p>
              We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We may share your information with third-party service providers who perform services on our behalf.
            </p>

            <h4>Do we use cookies and other tracking technologies?</h4>
            <p>
              We may use cookies and similar tracking technologies to track the activity on our website and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>

            <h4>How long do we keep your information?</h4>
            <p>
              We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy policy, unless a longer retention period is required or permitted by law.
            </p>

            <h4>What are your privacy rights?</h4>
            <p>
              You may review, change, or terminate your account at any time. You have the right to access, update, or delete your personal information. You can also object to our processing of your personal information.
            </p>

            <h4>Data security</h4>
            <p>
              We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process.
            </p>

            <h4>Updates to this policy</h4>
            <p>
              We may update this privacy policy from time to time. The updated version will be indicated by an updated "Last Updated" date.
            </p>
          </div>
        </div>
      </div>
      {/* End Privacy Policy Area */}

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
