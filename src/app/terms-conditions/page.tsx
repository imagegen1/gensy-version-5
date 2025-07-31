import { Metadata } from 'next'
import BootstrapLayout from '../landing-page-2/BootstrapLayout'
import '@/styles/legal-pages.css'

export const metadata: Metadata = {
  title: 'Terms & Conditions - Gensy',
  description: 'Terms and conditions for using Gensy AI services.',
}

export default function TermsConditionsPage() {
  return (
    <BootstrapLayout title="Terms & Conditions - Gensy" currentPage="terms">
      {/* Start Terms & Conditions Area */}
      <div className="legal-page">
        <div className="legal-container">
          <h1>TERMS AND CONDITIONS</h1>
          <p className="lead-text"><strong>Last updated July 31, 2025</strong></p>

          <h2><i className="ri-file-text-line legal-icon"></i>AGREEMENT TO OUR LEGAL TERMS</h2>

          <div className="legal-section">
            <p className="intro-text">We are <strong>Gensy</strong> ('Company', 'we', 'us', or 'our'), a company registered in India at 7/10 abirami gardens 5th cross, salem, tamil nadu 636302.</p>

            <p>We operate the website <a href="https://www.gensy.io">https://www.gensy.io</a> (the 'Site'), as well as any other related products and services that refer or link to these legal terms (the 'Legal Terms') (collectively, the 'Services').</p>

            <div className="legal-info-box">
              <p><i className="ri-robot-line legal-icon"></i>The Gensy platform ("the Service") offers a suite of creative AI tools accessible via our website. The Service enables users to create original visual content, such as videos and images, by providing text-based descriptions ("Prompts"). Additional features include, but are not limited to, image upscaling and enhancement.</p>
            </div>

            <div className="legal-card">
              <h6><i className="ri-contacts-line legal-icon"></i>Contact Information</h6>
              <p>
                <i className="ri-phone-line legal-icon-success"></i>Phone: (+91)9943764364<br />
                <i className="ri-mail-line legal-icon-success"></i>Email: <a href="mailto:info@gensy.io">info@gensy.io</a><br />
                <i className="ri-map-pin-line legal-icon-success"></i>Address: 7/10 abirami gardens 5th cross salem, tamil nadu 636302, India
              </p>
            </div>
          </div>

          <div className="legal-warning-box">
            <p className="lh-lg">These Legal Terms constitute a legally binding agreement made between you, whether personally or on behalf of an entity ('you'), and Gensy, concerning your access to and use of the Services. You agree that by accessing the Services, you have read, understood, and agreed to be bound by all of these Legal Terms.</p>
            <div className="legal-warning-box">
              <p className="fw-bold"><i className="ri-alert-line legal-icon-danger"></i>IF YOU DO NOT AGREE WITH ALL OF THESE LEGAL TERMS, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE USE IMMEDIATELY.</p>
            </div>
          </div>

          <div className="legal-section">
            <p>We will provide you with prior notice of any scheduled changes to the Services you are using. The modified Legal Terms will become effective upon posting or notifying you by <a href="mailto:info@gensy.io">info@gensy.io</a>, as stated in the email message. By continuing to use the Services after the effective date of any changes, you agree to be bound by the modified terms.</p>

            <div className="row g-3 mt-2">
              <div className="col-md-6">
                <div className="legal-card">
                  <h6><i className="ri-user-line legal-icon"></i>Age Requirement</h6>
                  <p>The Services are intended for users who are at least 18 years old. Persons under the age of 18 are not permitted to use or register for the Services.</p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="legal-card">
                  <h6><i className="ri-printer-line legal-icon"></i>Record Keeping</h6>
                  <p>We recommend that you print a copy of these Legal Terms for your records.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="legal-toc">
            <h2><i className="ri-list-check legal-icon"></i>TABLE OF CONTENTS</h2>
            <div className="legal-toc-grid">
              <a href="#section-1" className="legal-toc-item">
                <span className="legal-toc-number">1</span>
                OUR SERVICES
              </a>
              <a href="#section-2" className="legal-toc-item">
                <span className="legal-toc-number">2</span>
                INTELLECTUAL PROPERTY RIGHTS
              </a>
              <a href="#section-3" className="legal-toc-item">
                <span className="legal-toc-number">3</span>
                USER REPRESENTATIONS
              </a>
              <a href="#section-4" className="legal-toc-item">
                <span className="legal-toc-number">4</span>
                USER REGISTRATION
              </a>
              <a href="#section-5" className="legal-toc-item">
                <span className="legal-toc-number">5</span>
                PURCHASES AND PAYMENT
              </a>
              <a href="#section-6" className="legal-toc-item">
                <span className="legal-toc-number">6</span>
                SUBSCRIPTIONS
              </a>
              <a href="#section-7" className="legal-toc-item">
                <span className="legal-toc-number">7</span>
                PROHIBITED ACTIVITIES
              </a>
              <a href="#section-8" className="legal-toc-item">
                <span className="legal-toc-number">8</span>
                USER GENERATED CONTRIBUTIONS
              </a>
              <a href="#section-9" className="legal-toc-item">
                <span className="legal-toc-number">9</span>
                CONTRIBUTION LICENCE
              </a>
              <a href="#section-10" className="legal-toc-item">
                <span className="legal-toc-number">10</span>
                GUIDELINES FOR REVIEWS
              </a>
              <a href="#section-11" className="legal-toc-item">
                <span className="legal-toc-number">11</span>
                SERVICES MANAGEMENT
              </a>
              <a href="#section-12" className="legal-toc-item">
                <span className="legal-toc-number">12</span>
                PRIVACY POLICY
              </a>
              <a href="#section-13" className="legal-toc-item">
                <span className="legal-toc-number">13</span>
                TERM AND TERMINATION
              </a>
              <a href="#section-14" className="legal-toc-item">
                <span className="legal-toc-number">14</span>
                MODIFICATIONS AND INTERRUPTIONS
              </a>
              <a href="#section-15" className="legal-toc-item">
                <span className="legal-toc-number">15</span>
                GOVERNING LAW
              </a>
              <a href="#section-16" className="legal-toc-item">
                <span className="legal-toc-number">16</span>
                DISPUTE RESOLUTION
              </a>
              <a href="#section-17" className="legal-toc-item">
                <span className="legal-toc-number">17</span>
                CORRECTIONS
              </a>
              <a href="#section-18" className="legal-toc-item">
                <span className="legal-toc-number">18</span>
                DISCLAIMER
              </a>
              <a href="#section-19" className="legal-toc-item">
                <span className="legal-toc-number">19</span>
                LIMITATIONS OF LIABILITY
              </a>
              <a href="#section-20" className="legal-toc-item">
                <span className="legal-toc-number">20</span>
                INDEMNIFICATION
              </a>
              <a href="#section-21" className="legal-toc-item">
                <span className="legal-toc-number">21</span>
                USER DATA
              </a>
              <a href="#section-22" className="legal-toc-item">
                <span className="legal-toc-number">22</span>
                ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES
              </a>
              <a href="#section-23" className="legal-toc-item">
                <span className="legal-toc-number">23</span>
                MISCELLANEOUS
              </a>
              <a href="#section-24" className="legal-toc-item">
                <span className="legal-toc-number">24</span>
                CONTACT US
              </a>
            </div>
          </div>

          <h2 id="section-1"><span className="legal-toc-number">1</span>OUR SERVICES</h2>
          <div className="legal-warning-box">
            <p><i className="ri-global-line legal-icon-warning"></i>The information provided when using the Services is not intended for distribution to or use by any person or entity in any jurisdiction or country where such distribution or use would be contrary to law or regulation or which would subject us to any registration requirement within such jurisdiction or country. Accordingly, those persons who choose to access the Services from other locations do so on their own initiative and are solely responsible for compliance with local laws, if and to the extent local laws are applicable.</p>
          </div>

          <h2 id="section-2"><span className="legal-toc-number">2</span>INTELLECTUAL PROPERTY RIGHTS</h2>
            <h3>Our intellectual property</h3>
            <p>We are the owner or the licensee of all intellectual property rights in our Services, including all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics in the Services (collectively, the 'Content'), as well as the trademarks, service marks, and logos contained therein (the 'Marks').</p>

            <p>Our Content and Marks are protected by copyright and trademark laws (and various other intellectual property rights and unfair competition laws) and treaties around the world.</p>

            <p>The Content and Marks are provided in or through the Services 'AS IS' for your personal, non-commercial use only.</p>

            <h3>Your use of our Services</h3>
            <p>Subject to your compliance with these Legal Terms, including the 'PROHIBITED ACTIVITIES' section below, we grant you a non-exclusive, non-transferable, revocable licence to:</p>
            <ul>
              <li>access the Services; and</li>
              <li>download or print a copy of any portion of the Content to which you have properly gained access,</li>
            </ul>
            <p>solely for your personal, non-commercial use.</p>

            <p>Except as set out in this section or elsewhere in our Legal Terms, no part of the Services and no Content or Marks may be copied, reproduced, aggregated, republished, uploaded, posted, publicly displayed, encoded, translated, transmitted, distributed, sold, licensed, or otherwise exploited for any commercial purpose whatsoever, without our express prior written permission.</p>

            <p>If you wish to make any use of the Services, Content, or Marks other than as set out in this section or elsewhere in our Legal Terms, please address your request to: <a href="mailto:info@gensy.io">info@gensy.io</a>. If we ever grant you the permission to post, reproduce, or publicly display any part of our Services or Content, you must identify us as the owners or licensors of the Services, Content, or Marks and ensure that any copyright or proprietary notice appears or is visible on posting, reproducing, or displaying our Content.</p>

            <p>We reserve all rights not expressly granted to you in and to the Services, Content, and Marks.</p>

            <p>Any breach of these Intellectual Property Rights will constitute a material breach of our Legal Terms and your right to use our Services will terminate immediately.</p>

            <h3>Your submissions and contributions</h3>
            <p>Please review this section and the 'PROHIBITED ACTIVITIES' section carefully prior to using our Services to understand the (a) rights you give us and (b) obligations you have when you post or upload any content through the Services.</p>

            <p><strong>Submissions:</strong> By directly sending us any question, comment, suggestion, idea, feedback, or other information about the Services ('Submissions'), you agree to assign to us all intellectual property rights in such Submission. You agree that we shall own this Submission and be entitled to its unrestricted use and dissemination for any lawful purpose, commercial or otherwise, without acknowledgment or compensation to you.</p>

            <p><strong>Contributions:</strong> The Services may invite you to chat, contribute to, or participate in blogs, message boards, online forums, and other functionality during which you may create, submit, post, display, transmit, publish, distribute, or broadcast content and materials to us or through the Services, including but not limited to text, writings, video, audio, photographs, music, graphics, comments, reviews, rating suggestions, personal information, or other material ('Contributions'). Any Submission that is publicly posted shall also be treated as a Contribution.</p>

            <p>You understand that Contributions may be viewable by other users of the Services.</p>

            <h2>3. USER REPRESENTATIONS</h2>
            <p>By using the Services, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary; (3) you have the legal capacity and you agree to comply with these Legal Terms; (4) you are not a minor in the jurisdiction in which you reside; (5) you will not access the Services through automated or non-human means, whether through a bot, script or otherwise; (6) you will not use the Services for any illegal or unauthorised purpose; and (7) your use of the Services will not violate any applicable law or regulation.</p>

            <p>If you provide any information that is untrue, inaccurate, not current, or incomplete, we have the right to suspend or terminate your account and refuse any and all current or future use of the Services (or any portion thereof).</p>

            <h2>4. USER REGISTRATION</h2>
            <p>You may be required to register to use the Services. You agree to keep your password confidential and will be responsible for all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.</p>

          <h2 id="section-5"><span className="legal-toc-number">5</span>PURCHASES AND PAYMENT</h2>
          <div className="legal-card">
            <h6><i className="ri-bank-card-line legal-icon"></i>Accepted Payment Methods</h6>
            <div className="legal-payment-grid">
              <div className="legal-payment-item">
                <i className="ri-bank-card-line legal-icon"></i>
                Visa
              </div>
              <div className="legal-payment-item">
                <i className="ri-bank-card-line legal-icon"></i>
                Mastercard
              </div>
              <div className="legal-payment-item">
                <i className="ri-bank-card-line legal-icon"></i>
                American Express
              </div>
              <div className="legal-payment-item">
                <i className="ri-bank-card-line legal-icon"></i>
                Discover
              </div>
              <div className="legal-payment-item">
                <i className="ri-smartphone-line legal-icon"></i>
                UPI
              </div>
              <div className="legal-payment-item">
                <i className="ri-bank-card-line legal-icon"></i>
                Rupay
              </div>
            </div>
          </div>

            <p>You agree to provide current, complete, and accurate purchase and account information for all purchases made via the Services. You further agree to promptly update account and payment information, including email address, payment method, and payment card expiration date, so that we can complete your transactions and contact you as needed. Sales tax will be added to the price of purchases as deemed required by us. We may change prices at any time. All payments shall be in Rupees.</p>

            <p>You agree to pay all charges at the prices then in effect for your purchases and any applicable shipping fees, and you authorise us to charge your chosen payment provider for any such amounts upon placing your order. We reserve the right to correct any errors or mistakes in pricing, even if we have already requested or received payment.</p>

            <p>We reserve the right to refuse any order placed through the Services. We may, in our sole discretion, limit or cancel quantities purchased per person, per household, or per order. These restrictions may include orders placed by or under the same customer account, the same payment method, and/or orders that use the same billing or shipping address. We reserve the right to limit or prohibit orders that, in our sole judgement, appear to be placed by dealers, resellers, or distributors.</p>

            <h2>6. SUBSCRIPTIONS</h2>
            <h3>Billing and Renewal</h3>
            <p>Your subscription will continue and automatically renew unless cancelled. You consent to our charging your payment method on a recurring basis without requiring your prior approval for each recurring charge, until such time as you cancel the applicable order. The length of your billing cycle will depend on the type of subscription plan you choose when you subscribed to the Services.</p>

            <h3>Cancellation</h3>
            <p>All purchases are non-refundable. You can cancel your subscription at any time by logging into your account. Your cancellation will take effect at the end of the current paid term. If you have any questions or are unsatisfied with our Services, please email us at <a href="mailto:info@gensy.io">info@gensy.io</a>.</p>

            <h3>Fee Changes</h3>
            <p>We may, from time to time, make changes to the subscription fee and will communicate any price changes to you in accordance with applicable law.</p>

            <h2>7. PROHIBITED ACTIVITIES</h2>
            <p>You may not access or use the Services for any purpose other than that for which we make the Services available. The Services may not be used in connection with any commercial endeavours except those that are specifically endorsed or approved by us.</p>

            <p>As a user of the Services, you agree not to:</p>
            <ul>
              <li>Systematically retrieve data or other content from the Services to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.</li>
              <li>Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords.</li>
              <li>Circumvent, disable, or otherwise interfere with security-related features of the Services, including features that prevent or restrict the use or copying of any Content or enforce limitations on the use of the Services and/or the Content contained therein.</li>
              <li>Disparage, tarnish, or otherwise harm, in our opinion, us and/or the Services.</li>
              <li>Use any information obtained from the Services in order to harass, abuse, or harm another person.</li>
              <li>Make improper use of our support services or submit false reports of abuse or misconduct.</li>
              <li>Use the Services in a manner inconsistent with any applicable laws or regulations.</li>
              <li>Engage in unauthorised framing of or linking to the Services.</li>
              <li>Upload or transmit (or attempt to upload or to transmit) viruses, Trojan horses, or other material, including excessive use of capital letters and spamming (continuous posting of repetitive text), that interferes with any party's uninterrupted use and enjoyment of the Services or modifies, impairs, disrupts, alters, or interferes with the use, features, functions, operation, or maintenance of the Services.</li>
              <li>Engage in any automated use of the system, such as using scripts to send comments or messages, or using any data mining, robots, or similar data gathering and extraction tools.</li>
              <li>Delete the copyright or other proprietary rights notice from any Content.</li>
              <li>Attempt to impersonate another user or person or use the username of another user.</li>
              <li>Upload or transmit (or attempt to upload or to transmit) any material that acts as a passive or active information collection or transmission mechanism, including without limitation, clear graphics interchange formats ('gifs'), 1×1 pixels, web bugs, cookies, or other similar devices (sometimes referred to as 'spyware' or 'passive collection mechanisms' or 'pcms').</li>
              <li>Interfere with, disrupt, or create an undue burden on the Services or the networks or services connected to the Services.</li>
              <li>Harass, annoy, intimidate, or threaten any of our employees or agents engaged in providing any portion of the Services to you.</li>
              <li>Attempt to bypass any measures of the Services designed to prevent or restrict access to the Services, or any portion of the Services.</li>
              <li>Copy or adapt the Services' software, including but not limited to Flash, PHP, HTML, JavaScript, or other code.</li>
              <li>Except as permitted by applicable law, decipher, decompile, disassemble, or reverse engineer any of the software comprising or in any way making up a part of the Services.</li>
              <li>Except as may be the result of standard search engine or Internet browser usage, use, launch, develop, or distribute any automated system, including without limitation, any spider, robot, cheat utility, scraper, or offline reader that accesses the Services, or use or launch any unauthorised script or other software.</li>
              <li>Use a buying agent or purchasing agent to make purchases on the Services.</li>
              <li>Make any unauthorised use of the Services, including collecting usernames and/or email addresses of users by electronic or other means for the purpose of sending unsolicited email, or creating user accounts by automated means or under false pretences.</li>
              <li>Use the Services as part of any effort to compete with us or otherwise use the Services and/or the Content for any revenue-generating endeavour or commercial enterprise.</li>
              <li>Use the Services to advertise or offer to sell goods and services.</li>
              <li>Sell or otherwise transfer your profile.</li>
            </ul>

          <h2 id="section-24"><span className="legal-toc-number">24</span>CONTACT US</h2>
          <p>In order to resolve a complaint regarding the Services or to receive further information regarding use of the Services, please contact us at:</p>

          <div className="legal-contact-card">
            <h6><i className="ri-contacts-line legal-icon"></i>Contact Information</h6>
            <p>
              <strong>Gensy</strong><br />
              <i className="ri-map-pin-line legal-icon-success"></i>7/10 abirami gardens 5th cross<br />
              salem, tamil nadu 636302<br />
              India<br />
              <i className="ri-phone-line legal-icon-success"></i>Phone: (+91)9943764364<br />
              <i className="ri-mail-line legal-icon-success"></i><a href="mailto:info@gensy.io">info@gensy.io</a>
            </p>
          </div>
        </div>
      </div>
      {/* End Terms & Conditions Area */}
    </BootstrapLayout>
  )
}
