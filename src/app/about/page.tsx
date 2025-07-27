import { Metadata } from 'next'
import BootstrapLayout from '../landing-page-2/BootstrapLayout'

export const metadata: Metadata = {
  title: 'About Us - AiNext',
  description: 'Learn more about AiNext and our mission to provide cutting-edge AI solutions.',
}

export default function AboutPage() {
  return (
    <BootstrapLayout title="About Us - AiNext" currentPage="about">
      {/* Start Section Banner */}
      <div className="section-banner">
        <div className="container">
          <div className="section-banner-title">
            <h1>About us</h1>
            <nav style={{"--bs-breadcrumb-divider": "'/'"} as React.CSSProperties} aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/landing-page-2">Home</a></li>
                <li className="breadcrumb-item active" aria-current="page">About us</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>
      {/* End Section Banner */}

      {/* Start About Area */}
      <div className="about-area ptb-100">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <div className="image">
                <img src="/ainext-template/assets/img/about-2.jpg" alt="image" />
              </div>
            </div>
            <div className="col-lg-6">
              <div className="content">
                <div className="sub-t">About Us</div>
                <h2>Create your own AI business easily.</h2>
                <p>Malesuada nunc vel risus commodo viverra maecenas accumsan lacus vel. Nam aliquam sem et tortor consequat. Porttitor leo a diam sollicitudin tempor id eu. Nisl pretium fusce id velit ut. At lectus urna duis convallis convallis tellus id interdum.</p>
                <div className="row">
                  <div className="col-lg-4 col-md-4 col-4">
                    <div className="sub-counter">
                      <h3>
                        <span className="odometer" data-count="5000">00</span>
                      </h3>
                      <p>Clients</p>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-4 col-4">
                    <div className="sub-counter">
                      <h3>
                        <span className="odometer" data-count="10">00</span>
                        <span className="target">K</span>
                      </h3>
                      <p>Projects</p>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-4 col-4">
                    <div className="sub-counter">
                      <h3>
                        <span className="odometer" data-count="250">00</span>
                      </h3>
                      <p>Years</p>
                    </div>
                  </div>
                </div>
                <a className="main-btn" href="/about"><span></span><i className="ri-quill-pen-line"></i> About Us</a>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* About Area */}

      {/* Start Testimonial Area */}
      <div className="testimonial-area ptb-100">
        <div className="container">
          <div className="testimonial-content owl-carousel owl-theme">
            <div className="testimonial-item">
              <ul>
                <li><i className="ri-star-s-fill"></i></li>
                <li><i className="ri-star-s-fill"></i></li>
                <li><i className="ri-star-s-fill"></i></li>
                <li><i className="ri-star-s-fill"></i></li>
                <li><i className="ri-star-s-fill"></i></li>
              </ul>
              <p>It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using</p>
              <h4>Aloin Lden</h4>
              <span>Web Developer</span>
            </div>
            <div className="testimonial-item">
              <ul>
                <li><i className="ri-star-s-fill"></i></li>
                <li><i className="ri-star-s-fill"></i></li>
                <li><i className="ri-star-s-fill"></i></li>
                <li><i className="ri-star-s-fill"></i></li>
                <li><i className="ri-star-s-fill"></i></li>
              </ul>
              <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. In aut, tempora iste quidem ipsa eos. Mollitia, illo, nisi laboriosam nostrum</p>
              <h4>Jacob Daniels</h4>
              <span>Engineer</span>
            </div>
          </div>
          <div className="user">
            <img src="/ainext-template/assets/img/user-1.jpg" alt="image" />
          </div>
          <div className="user">
            <img src="/ainext-template/assets/img/user-2.jpg" alt="image" />
          </div>
          <div className="user">
            <img src="/ainext-template/assets/img/user-3.jpg" alt="image" />
          </div>
          <div className="user">
            <img src="/ainext-template/assets/img/user-4.jpg" alt="image" />
          </div>
        </div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
      </div>
      {/* End Testimonial Area */}

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
