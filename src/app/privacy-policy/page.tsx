import { Metadata } from 'next'
import BootstrapLayout from '../landing-page-2/BootstrapLayout'
import '@/styles/legal-pages.css'

export const metadata: Metadata = {
  title: 'Privacy Policy - Gensy',
  description: 'Privacy policy for Gensy AI services and data protection.',
}

export default function PrivacyPolicyPage() {
  return (
    <BootstrapLayout title="Privacy Policy - Gensy" currentPage="privacy">
      {/* Start Privacy Policy Area */}
      <div className="legal-page">
        <div className="legal-container">
          <h1>PRIVACY POLICY</h1>
          <p className="lead-text"><strong>Last updated July 16, 2025</strong></p>

          <div className="legal-section">
            <p className="intro-text">This Privacy Notice for AbiriCh Vaithiyalingam ('we', 'us', or 'our'), describes how and why we might access, collect, store, use, and/or share ('process') your personal information when you use our services ('Services'), including when you:</p>
            <ul>
              <li>Visit our website at <a href="https://www.gensy.io">https://www.gensy.io</a> or any website of ours that links to this Privacy Notice</li>
              <li>Use Gensy.io, AI image and video generating platform</li>
              <li>Engage with us in other related ways, including any sales, marketing, or events</li>
            </ul>

            <div className="legal-info-box">
              <p><strong><i className="ri-question-line legal-icon"></i>Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. We are responsible for making decisions about how your personal information is processed. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at <a href="mailto:info@gensy.io">info@gensy.io</a>.</p>
            </div>
          </div>

          <h2><i className="ri-key-2-line legal-icon"></i>SUMMARY OF KEY POINTS</h2>

          <div className="legal-section">
            <p>This summary provides key points from our Privacy Notice, but you can find out more details about any of these topics by clicking the link following each key point or by using our table of contents below to find the section you are looking for.</p>

            <div className="legal-highlight-box">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="legal-card">
                    <h6><i className="ri-user-line legal-icon"></i>What personal information do we process?</h6>
                    <p>When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use.</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="legal-card">
                    <h6><i className="ri-shield-line legal-icon"></i>Do we process sensitive information?</h6>
                    <p>Some information may be considered 'special' or 'sensitive' in certain jurisdictions. We do not process sensitive personal information.</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="legal-card">
                    <h6><i className="ri-group-line legal-icon"></i>Do we collect from third parties?</h6>
                    <p>We do not collect any information from third parties.</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="legal-card">
                    <h6><i className="ri-settings-line legal-icon"></i>How do we process your information?</h6>
                    <p>We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="legal-toc">
            <h2><i className="ri-list-check legal-icon"></i>TABLE OF CONTENTS</h2>
            <div className="legal-toc-grid">
              <a href="#section-1" className="legal-toc-item">
                <span className="legal-toc-number">1</span>
                WHAT INFORMATION DO WE COLLECT?
              </a>
              <a href="#section-2" className="legal-toc-item">
                <span className="legal-toc-number">2</span>
                HOW DO WE PROCESS YOUR INFORMATION?
              </a>
              <a href="#section-3" className="legal-toc-item">
                <span className="legal-toc-number">3</span>
                WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?
              </a>
              <a href="#section-4" className="legal-toc-item">
                <span className="legal-toc-number">4</span>
                DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?
              </a>
              <a href="#section-5" className="legal-toc-item">
                <span className="legal-toc-number">5</span>
                DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?
              </a>
              <a href="#section-6" className="legal-toc-item">
                <span className="legal-toc-number">6</span>
                HOW DO WE HANDLE YOUR SOCIAL LOGINS?
              </a>
              <a href="#section-7" className="legal-toc-item">
                <span className="legal-toc-number">7</span>
                HOW LONG DO WE KEEP YOUR INFORMATION?
              </a>
              <a href="#section-8" className="legal-toc-item">
                <span className="legal-toc-number">8</span>
                HOW DO WE KEEP YOUR INFORMATION SAFE?
              </a>
              <a href="#section-9" className="legal-toc-item">
                <span className="legal-toc-number">9</span>
                DO WE COLLECT INFORMATION FROM MINORS?
              </a>
              <a href="#section-10" className="legal-toc-item">
                <span className="legal-toc-number">10</span>
                WHAT ARE YOUR PRIVACY RIGHTS?
              </a>
              <a href="#section-11" className="legal-toc-item">
                <span className="legal-toc-number">11</span>
                CONTROLS FOR DO-NOT-TRACK FEATURES
              </a>
              <a href="#section-12" className="legal-toc-item">
                <span className="legal-toc-number">12</span>
                DO WE MAKE UPDATES TO THIS NOTICE?
              </a>
              <a href="#section-13" className="legal-toc-item">
                <span className="legal-toc-number">13</span>
                HOW CAN YOU CONTACT US ABOUT THIS NOTICE?
              </a>
              <a href="#section-14" className="legal-toc-item">
                <span className="legal-toc-number">14</span>
                HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?
              </a>
            </div>
          </div>

          <h2 id="section-1"><span className="legal-toc-number">1</span>WHAT INFORMATION DO WE COLLECT?</h2>
          <h3><i className="ri-user-settings-line legal-icon"></i>Personal information you disclose to us</h3>
          <div className="legal-highlight-box">
            <p><strong><i className="ri-information-line legal-icon"></i>In Short:</strong> We collect personal information that you provide to us.</p>
          </div>

          <p>We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.</p>

          <div className="legal-subsection">
            <p><strong><i className="ri-file-user-line legal-icon"></i>Personal Information Provided by You.</strong> The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:</p>
            <div className="row g-3">
              <div className="col-md-6">
                <ul>
                  <li>names</li>
                  <li>email addresses</li>
                  <li>usernames</li>
                  <li>passwords</li>
                </ul>
              </div>
              <div className="col-md-6">
                <ul>
                  <li>contact or authentication data</li>
                  <li>billing addresses</li>
                  <li>debit/credit card numbers</li>
                </ul>
              </div>
            </div>
          </div>

            <p><strong>Sensitive Information.</strong> We do not process sensitive information.</p>

            <p><strong>Payment Data.</strong> We may collect data necessary to process your payment if you choose to make purchases, such as your payment instrument number, and the security code associated with your payment instrument. All payment data is handled and stored by Phonepe and Razorpay. You may find their privacy notice link(s) here: <a href="https://www.phonepe.com/privacy-policy">https://www.phonepe.com/privacy-policy</a> and <a href="https://razorpay.com/privacy/">https://razorpay.com/privacy/</a>.</p>

            <p><strong>Social Media Login Data.</strong> We may provide you with the option to register with us using your existing social media account details, like your Facebook, X, or other social media account. If you choose to register in this way, we will collect certain profile information about you from the social media provider, as described in the section called 'HOW DO WE HANDLE YOUR SOCIAL LOGINS?' below.</p>

            <p>All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.</p>

            <h3>Google API</h3>
            <p>Our use of information received from Google APIs will adhere to Google API Services User Data Policy, including the Limited Use requirements.</p>

            <h2>2. HOW DO WE PROCESS YOUR INFORMATION?</h2>
            <p><strong>In Short:</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.</p>

            <p>We process your personal information for a variety of reasons, depending on how you interact with our Services, including:</p>
            <ul>
              <li>To facilitate account creation and authentication and otherwise manage user accounts. We may process your information so you can create and log in to your account, as well as keep your account in working order.</li>
              <li>To deliver and facilitate delivery of services to the user. We may process your information to provide you with the requested service.</li>
            </ul>

            <h2>3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h2>
            <p><strong>In Short:</strong> We may share information in specific situations described in this section and/or with the following third parties.</p>

            <p>We may need to share your personal information in the following situations:</p>
            <ul>
              <li><strong>Business Transfers.</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
            </ul>

            <h2>4. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</h2>
            <p><strong>In Short:</strong> We may use cookies and other tracking technologies to collect and store your information.</p>

            <p>We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information when you interact with our Services. Some online tracking technologies help us maintain the security of our Services and your account, prevent crashes, fix bugs, save your preferences, and assist with basic Site functions.</p>

            <p>We also permit third parties and service providers to use online tracking technologies on our Services for analytics and advertising, including to help manage and display advertisements, to tailor advertisements to your interests, or to send abandoned shopping cart reminders (depending on your communication preferences). The third parties and service providers use their technology to provide advertising about products and services tailored to your interests which may appear either on our Services or on other websites.</p>

            <p>Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Notice.</p>

            <h3>Google Analytics</h3>
            <p>We may share your information with Google Analytics to track and analyse the use of the Services. The Google Analytics Advertising Features that we may use include: Google Analytics Demographics and Interests Reporting. To opt out of being tracked by Google Analytics across the Services, visit <a href="https://tools.google.com/dlpage/gaoptout">https://tools.google.com/dlpage/gaoptout</a>. You can opt out of Google Analytics Advertising Features through Ads Settings and Ad Settings for mobile apps. Other opt out means include <a href="http://optout.networkadvertising.org/">http://optout.networkadvertising.org/</a> and <a href="http://www.networkadvertising.org/mobile-choice">http://www.networkadvertising.org/mobile-choice</a>. For more information on the privacy practices of Google, please visit the Google Privacy & Terms page.</p>

            <h2>5. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?</h2>
            <p><strong>In Short:</strong> We offer products, features, or tools powered by artificial intelligence, machine learning, or similar technologies.</p>

            <p>As part of our Services, we offer products, features, or tools powered by artificial intelligence, machine learning, or similar technologies (collectively, 'AI Products'). These tools are designed to enhance your experience and provide you with innovative solutions. The terms in this Privacy Notice govern your use of the AI Products within our Services.</p>

            <h3>Use of AI Technologies</h3>
            <p>We provide the AI Products through third-party service providers ('AI Service Providers'), including Google Cloud AI. As outlined in this Privacy Notice, your input, output, and personal information will be shared with and processed by these AI Service Providers to enable your use of our AI Products for purposes outlined in 'WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?' You must not use the AI Products in any way that violates the terms or policies of any AI Service Provider.</p>

            <h3>Our AI Products</h3>
            <p>Our AI Products are designed for the following functions:</p>
            <ul>
              <li>Image generation</li>
              <li>Video generation</li>
              <li>Image analysis</li>
            </ul>

            <h3>How We Process Your Data using AI</h3>
            <p>All personal information processed using our AI Products is handled in line with our Privacy Notice and our agreement with third parties. This ensures high security and safeguards your personal information throughout the process, giving you peace of mind about your data's safety.</p>

            <h3>How to Opt Out</h3>
            <p>We believe in giving you the power to decide how your data is used. To opt out, you can: Log in to your account settings and update your user account.</p>

            <h2>6. HOW DO WE HANDLE YOUR SOCIAL LOGINS?</h2>
            <p><strong>In Short:</strong> If you choose to register or log in to our Services using a social media account, we may have access to certain information about you.</p>

            <p>Our Services offer you the ability to register and log in using your third-party social media account details (like your Facebook or X logins). Where you choose to do this, we will receive certain profile information about you from your social media provider. The profile information we receive may vary depending on the social media provider concerned, but will often include your name, email address, friends list, and profile picture, as well as other information you choose to make public on such a social media platform.</p>

            <p>We will use the information we receive only for the purposes that are described in this Privacy Notice or that are otherwise made clear to you on the relevant Services. Please note that we do not control, and are not responsible for, other uses of your personal information by your third-party social media provider. We recommend that you review their privacy notice to understand how they collect, use, and share your personal information, and how you can set your privacy preferences on their Sites and apps.</p>

            <h2>7. HOW LONG DO WE KEEP YOUR INFORMATION?</h2>
            <p><strong>In Short:</strong> We keep your information for as long as necessary to fulfil the purposes outlined in this Privacy Notice unless otherwise required by law.</p>

            <p>We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements). No purpose in this notice will require us keeping your personal information for longer than the period of time in which users have an account with us.</p>

            <p>When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymise such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.</p>

            <h2>8. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2>
            <p><strong>In Short:</strong> We aim to protect your personal information through a system of organisational and technical security measures.</p>

            <p>We have implemented appropriate and reasonable technical and organisational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorised third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Although we will do our best to protect your personal information, transmission of personal information to and from our Services is at your own risk. You should only access the Services within a secure environment.</p>

            <h2>9. DO WE COLLECT INFORMATION FROM MINORS?</h2>
            <p><strong>In Short:</strong> We do not knowingly collect data from or market to children under 18 years of age.</p>

            <p>We do not knowingly collect, solicit data from, or market to children under 18 years of age, nor do we knowingly sell such personal information. By using the Services, you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent to such minor dependent's use of the Services. If we learn that personal information from users less than 18 years of age has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records. If you become aware of any data we may have collected from children under age 18, please contact us at <a href="mailto:info@gensy.io">info@gensy.io</a>.</p>

            <h2>10. WHAT ARE YOUR PRIVACY RIGHTS?</h2>
            <p><strong>In Short:</strong> You may review, change, or terminate your account at any time, depending on your country, province, or state of residence.</p>

            <p><strong>Withdrawing your consent:</strong> If we are relying on your consent to process your personal information, which may be express and/or implied consent depending on the applicable law, you have the right to withdraw your consent at any time. You can withdraw your consent at any time by contacting us by using the contact details provided in the section 'HOW CAN YOU CONTACT US ABOUT THIS NOTICE?' below.</p>

            <p>However, please note that this will not affect the lawfulness of the processing before its withdrawal nor, when applicable law allows, will it affect the processing of your personal information conducted in reliance on lawful processing grounds other than consent.</p>

            <h3>Account Information</h3>
            <p>If you would at any time like to review or change the information in your account or terminate your account, you can: Log in to your account settings and update your user account.</p>

            <p>Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements.</p>

            <p><strong>Cookies and similar technologies:</strong> Most Web browsers are set to accept cookies by default. If you prefer, you can usually choose to set your browser to remove cookies and to reject cookies. If you choose to remove cookies or reject cookies, this could affect certain features or services of our Services. For further information, please see our Cookie Notice.</p>

            <p>If you have questions or comments about your privacy rights, you may email us at <a href="mailto:info@gensy.io">info@gensy.io</a>.</p>

            <h2>11. CONTROLS FOR DO-NOT-TRACK FEATURES</h2>
            <p>Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track ('DNT') feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognising and implementing DNT signals has been finalised. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about that practice in a revised version of this Privacy Notice.</p>

            <h2>12. DO WE MAKE UPDATES TO THIS NOTICE?</h2>
            <p><strong>In Short:</strong> Yes, we will update this notice as necessary to stay compliant with relevant laws.</p>

            <p>We may update this Privacy Notice from time to time. The updated version will be indicated by an updated 'Revised' date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.</p>

          <h2 id="section-13"><span className="legal-toc-number">13</span>HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2>
          <p>If you have questions or comments about this notice, you may email us at <a href="mailto:info@gensy.io">info@gensy.io</a> or contact us by post at:</p>

          <div className="legal-contact-card">
            <h6><i className="ri-contacts-line legal-icon"></i>Contact Information</h6>
            <p><strong>Gensy</strong><br />India</p>
          </div>

          <h2 id="section-14"><span className="legal-toc-number">14</span>HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h2>
          <p>You have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. To request to review, update, or delete your personal information, please fill out and submit a data subject access request.</p>
        </div>
      </div>
      {/* End Privacy Policy Area */}
    </BootstrapLayout>
  )
}
