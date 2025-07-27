import { Metadata } from 'next'
import BootstrapLayout from '../landing-page-2/BootstrapLayout'

export const metadata: Metadata = {
  title: 'Our Team - AiNext',
  description: 'Meet the talented team behind AiNext AI solutions.',
}

export default function TeamPage() {
  return (
    <BootstrapLayout title="Our Team - AiNext" currentPage="team">
      {/* Start Section Banner */}
      <div className="section-banner">
        <div className="container">
          <div className="section-banner-title">
            <h1>Team</h1>
            <nav style={{"--bs-breadcrumb-divider": "'/'"} as React.CSSProperties} aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/landing-page-2">Home</a></li>
                <li className="breadcrumb-item active" aria-current="page">Team</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>
      {/* End Banner Area */}

      {/* Start Team Area */}
      <div className="team-area ptb-100">
        <div className="container">
          <div className="image-courser owl-carousel owl-theme" data-aos="fade-up" data-aos-duration="1500">
            <div className="courser-item">
              <div className="image-item">
                <img src="/ainext-template/assets/img/about-image-1.jpg" alt="image" />
                <div className="hover-content">
                  <h4>Christian Haol</h4>
                  <p>Web Developer</p>
                  <ul>
                    <li><a href="https://www.facebook.com/"><i className="ri-facebook-fill"></i></a></li>
                    <li><a href="https://www.instagram.com/"><i className="ri-instagram-line"></i></a></li>
                    <li><a href="https://www.linkedin.com/"><i className="ri-linkedin-fill"></i></a></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="courser-item">
              <div className="image-item">
                <img src="/ainext-template/assets/img/about-image-2.jpg" alt="image" />
                <div className="hover-content">
                  <h4>Sarah Johnson</h4>
                  <p>CTO</p>
                  <ul>
                    <li><a href="https://www.facebook.com/"><i className="ri-facebook-fill"></i></a></li>
                    <li><a href="https://www.instagram.com/"><i className="ri-instagram-line"></i></a></li>
                    <li><a href="https://www.linkedin.com/"><i className="ri-linkedin-fill"></i></a></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="courser-item">
              <div className="image-item">
                <img src="/ainext-template/assets/img/about-image-3.jpg" alt="image" />
                <div className="hover-content">
                  <h4>Michael Chen</h4>
                  <p>Lead AI Engineer</p>
                  <ul>
                    <li><a href="https://www.facebook.com/"><i className="ri-facebook-fill"></i></a></li>
                    <li><a href="https://www.instagram.com/"><i className="ri-instagram-line"></i></a></li>
                    <li><a href="https://www.linkedin.com/"><i className="ri-linkedin-fill"></i></a></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="courser-item">
              <div className="image-item">
                <img src="/ainext-template/assets/img/about-image-4.jpg" alt="image" />
                <div className="hover-content">
                  <h4>Emily Rodriguez</h4>
                  <p>Product Manager</p>
                  <ul>
                    <li><a href="https://www.facebook.com/"><i className="ri-facebook-fill"></i></a></li>
                    <li><a href="https://www.instagram.com/"><i className="ri-instagram-line"></i></a></li>
                    <li><a href="https://www.linkedin.com/"><i className="ri-linkedin-fill"></i></a></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="courser-item">
              <div className="image-item">
                <img src="/ainext-template/assets/img/about-image-5.jpg" alt="image" />
                <div className="hover-content">
                  <h4>David Kim</h4>
                  <p>UI/UX Designer</p>
                  <ul>
                    <li><a href="https://www.facebook.com/"><i className="ri-facebook-fill"></i></a></li>
                    <li><a href="https://www.instagram.com/"><i className="ri-instagram-line"></i></a></li>
                    <li><a href="https://www.linkedin.com/"><i className="ri-linkedin-fill"></i></a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* End Team Area */}

      {/* Start Brands Area */}
      <div className="brands-area pt-70 pb-70">
        <div className="container">
          <div className="row justify-content-between align-items-center">
            <div className="col-lg-2 col-md-2 col-6" data-aos="fade-up" data-aos-duration="1000">
              <div className="image">
                <img src="/ainext-template/assets/img/01.png" alt="image" />
              </div>
            </div>
            <div className="col-lg-2 col-md-2 col-6" data-aos="fade-up" data-aos-duration="1000">
              <div className="image">
                <img src="/ainext-template/assets/img/02.png" alt="image" />
              </div>
            </div>
            <div className="col-lg-2 col-md-2 col-6" data-aos="fade-up" data-aos-duration="1000">
              <div className="image">
                <img src="/ainext-template/assets/img/03.png" alt="image" />
              </div>
            </div>
            <div className="col-lg-2 col-md-2 col-6" data-aos="fade-up" data-aos-duration="1000">
              <div className="image">
                <img src="/ainext-template/assets/img/04.png" alt="image" />
              </div>
            </div>
            <div className="col-lg-2 col-md-2 col-6" data-aos="fade-up" data-aos-duration="1000">
              <div className="image">
                <img src="/ainext-template/assets/img/05.png" alt="image" />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* End Brands Area */}
    </BootstrapLayout>
  )
}
