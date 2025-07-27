'use client'

import { useEffect } from 'react'

export default function AiNextTemplate() {
  useEffect(() => {
    // Load CSS files
    const loadCSS = (href: string) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      document.head.appendChild(link)
    }

    // Load all CSS files
    loadCSS('/ainext-template/assets/css/bootstrap.min.css')
    loadCSS('/ainext-template/assets/css/owl.carousel.min.css')
    loadCSS('/ainext-template/assets/css/owl.theme.default.min.css')
    loadCSS('/ainext-template/assets/css/remixicon.min.css')
    loadCSS('/ainext-template/assets/css/odometer.min.css')
    loadCSS('/ainext-template/assets/css/flaticon.css')
    loadCSS('/ainext-template/assets/css/aos.css')
    loadCSS('/ainext-template/assets/css/style.css')
    loadCSS('/ainext-template/assets/css/responsive.css')

    // Load external scripts after component mounts
    const loadScript = (src: string) => {
      return new Promise((resolve, reject) => {
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
      } catch (error) {
        console.error('Error loading scripts:', error)
      }
    }

    loadScripts()
  }, [])

  return (
    <div>
        {/* Start Navbar Area */}
        <nav className="navbar navbar-expand-lg mb-nav" id="navbar">
          <div className="container-fluid">
            <a className="navbar-brand" href="index.html">
              <h2>AiNext</h2>
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
                  <a href="/landing-page-2" className="nav-link active">
                    Home
                  </a>
                </li>
                <li className="nav-item">
                  <a href="javascript:void(0)" className="dropdown-toggle nav-link">
                    Pages
                  </a>
                  <ul className="dropdown-menu">
                    <li className="nav-item">
                      <a href="/about" className="nav-link">
                        About Us
                      </a>
                    </li>
                    <li className="nav-item">
                      <a href="/team-ainext" className="nav-link">
                        Team
                      </a>
                    </li>
                    <li className="nav-item">
                      <a href="/pricing-ainext" className="nav-link">
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
                      <a href="/not-found-ainext" className="nav-link">
                        404 Error Page
                      </a>
                    </li>
                  </ul>
                </li>
                <li className="nav-item">
                  <a href="/portfolio-ainext" className="nav-link">
                    Portfolio
                  </a>
                </li>
                <li className="nav-item">
                  <a href="javascript:void(0)" className="dropdown-toggle nav-link">
                    Blog
                  </a>
                  <ul className="dropdown-menu">
                    <li className="nav-item">
                      <a href="/blog-ainext" className="nav-link">
                        Blog Grid
                      </a>
                    </li>
                    <li className="nav-item">
                      <a href="/blog-ainext" className="nav-link">
                        Blog Right Sidebar
                      </a>
                    </li>
                    <li className="nav-item">
                      <a href="/blog-ainext" className="nav-link">
                        Blog Details
                      </a>
                    </li>
                  </ul>
                </li>
                <li className="nav-item">
                  <a href="/contact-ainext" className="nav-link">
                    Contact Us
                  </a>
                </li>
              </ul>
              <div className="nav-btn">
                <a href="/contact-ainext" className="default-btn">
                  Get Started
                  <i className="ri-arrow-right-line"></i>
                </a>
              </div>
            </div>
          </div>
        </nav>
        {/* End Navbar Area */}

        {/* Start Responsive Navbar Area */}
        <div className="responsive-navbar offcanvas offcanvas-end border-0" data-bs-backdrop="static" tabIndex={-1} id="navbarOffcanvas">
          <div className="offcanvas-header">
            <a href="index.html" className="logo d-inline-block">
              <h2>AiNext</h2>
            </a>
            <button type="button" className="close-btn bg-transparent position-relative lh-1 p-0 border-0" data-bs-dismiss="offcanvas" aria-label="Close">
              <i className="ri-close-line"></i>
            </button>
          </div>
          <div className="offcanvas-body">
            <ul className="responsive-menu">
              <li className="responsive-menu-list without-icon">
                <a href="/landing-page-2" className="active">Home</a>
              </li>
              <li className="responsive-menu-list"><a href="javascript:void(0);" >Pages</a>
                <ul className="responsive-menu-items">
                  <li><a href="/about">About</a></li>
                  <li><a href="/team-ainext">Team</a></li>
                  <li><a href="/pricing-ainext">Pricing</a></li>
                  <li><a href="/terms-conditions">Terms Conditions</a></li>
                  <li><a href="/privacy-policy">Privacy Policy</a></li>
                  <li><a href="/not-found-ainext">404 Error Page</a></li>
                </ul>
              </li>
              <li className="responsive-menu-list without-icon">
                <a href="/portfolio-ainext">Portfolio</a>
              </li>

              <li className="responsive-menu-list"><a href="javascript:void(0);">Blog</a>
                <ul className="responsive-menu-items">
                  <li><a href="/blog-ainext">Blog</a></li>
                  <li><a href="/blog-ainext">Blog Right Sidebar</a></li>
                  <li><a href="/blog-ainext">Blog Details</a></li>
                </ul>
              </li>
              <li className="responsive-menu-list without-icon">
                <a href="/contact-ainext">Contact</a>
              </li>
            </ul>
            <div className="others-option d-md-flex align-items-center">
              <div className="option-item">
                <a href="/contact-ainext" className="default-btn">
                  <i className="ri-arrow-right-line"></i>
                  <span>Get Started</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        {/* End Responsive Navbar Area */}

        {/* Start Banner Area */}
        <div className="banner-area">
          <div className="container-fluid">
            <div className="row align-items-center g-0">
              <div className="col-lg-6">
                <div className="content">
                  <span className="banner-top-title">Fully Dynamic</span>
                  <h1><span className="grd-color-1" >AiNext</span> Image Creating Solutions.</h1>
                  <p>Create production-quality visual assets for your projects with unprecedented quality, speed, and style-consistency.</p>
                  <div className="searchwrapper">
                    <div className="searchbox">
                      <div className="row align-items-center">
                        <div className="col-md-6">
                          <form>
                            <input type="text" className="form-control" placeholder="Search by Keywords..." />
                          </form>
                        </div>
                        <div className="col-md-3">
                          <select className="form-control category" id="provider" name="provider">
                            <option>deepai</option>
                            <option>stabilityai</option>
                            <option>replicate</option>
                          </select>
                        </div>
                        <div className="col-lg-3">
                          <form>
                            <button className="btn" type="submit">Generate</button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="popular-tag">
                    <p>Popular Tag:</p>
                    <a href="/blog-ainext">Business</a>
                    <a href="/blog-ainext">Animation</a>
                    <a href="/blog-ainext">Creative</a>
                    <a href="/blog-ainext">Realistic</a>
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="image">
                  <img src="/ainext-template/assets/img/man.png" alt="image" />
                </div>
              </div>
            </div>
            <div className="scroll-down">
              <a href="#features">
                <div className="mouse"></div>
              </a>
            </div>
          </div>
        </div>
        {/* End Banner Area */}

        {/* Start Fetuses Area */}
        <section id="features" className="fetuses-area pt-70">
          <div className="container-fluid">
            <div className="row justify-content-center g-0">
              <div className="col-lg-3 col-md-6">
                <div className="single-fetuses-box" data-aos="fade-up" data-aos-duration="1500">
                  <div className="icon">
                    <i className="fi fi-tr-file-user"></i>
                  </div>
                  <h3>We analyzing Experience</h3>
                  <p>Easy to grasp, rewarding to perfect. Be proficient in producing exquisite content quickly and efficiently.</p>
                  <a href="/about">Read More</a>
                </div>
              </div>

              <div className="col-lg-3 col-md-6">
                <div className="single-fetuses-box" data-aos="fade-up" data-aos-duration="1500">
                  <div className="icon">
                    <i className="fi fi-tr-graphic-style"></i>
                  </div>
                  <h3>From Concept To Final</h3>
                  <p>Easy to grasp, rewarding to perfect. Be proficient in producing exquisite content quickly and efficiently.</p>
                  <a href="/about">Read More</a>
                </div>
              </div>

              <div className="col-lg-3 col-md-6">
                <div className="single-fetuses-box" data-aos="fade-up" data-aos-duration="1500">
                  <div className="icon">
                    <i className="fi fi-tr-user-astronaut"></i>
                  </div>
                  <h3>New Thinking For Result</h3>
                  <p>Easy to grasp, rewarding to perfect. Be proficient in producing exquisite content quickly and efficiently.</p>
                  <a href="/about">Read More</a>
                </div>
              </div>

              <div className="col-lg-3 col-md-6">
                <div className="single-fetuses-box" data-aos="fade-up" data-aos-duration="1500">
                  <div className="icon">
                    <i className="fi fi-tr-biking-mountain"></i>
                  </div>
                  <h3>New Thinking For Result</h3>
                  <p>Easy to grasp, rewarding to perfect. Be proficient in producing exquisite content quickly and efficiently.</p>
                  <a href="/about">Read More</a>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* End Fetuses Area */}

        {/* Start About Area */}
        <div className="about-area ptb-100 section-bg">
          <div className="container">
            <div className="row align-items-center" data-aos="fade-up" data-aos-duration="1500">
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

        {/* Start Team Area */}
        <div className="team-area pt-100">
          <div className="container">
            <div className="image-courser owl-carousel owl-theme" data-aos="fade-up" data-aos-duration="1500">
              <div className="courser-item">
                <div className="image-item">
                  <img src="/ainext-template/assets/img/about-image-1.jpg" alt="image" />
                  <div className="hover-content">
                    <h4>Christian Haol</h4>
                    <p>Web Developer</p>
                    <ul>
                      <li><a href="#"><i className="ri-facebook-fill"></i></a></li>
                      <li><a href="#"><i className="ri-instagram-line"></i></a></li>
                      <li><a href="#"><i className="ri-linkedin-fill"></i></a></li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="courser-item">
                <div className="image-item">
                  <img src="/ainext-template/assets/img/about-image-2.jpg" alt="image" />
                  <div className="hover-content">
                    <h4>Christian Haol</h4>
                    <p>Web Developer</p>
                    <ul>
                      <li><a href="#"><i className="ri-facebook-fill"></i></a></li>
                      <li><a href="#"><i className="ri-instagram-line"></i></a></li>
                      <li><a href="#"><i className="ri-linkedin-fill"></i></a></li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="courser-item">
                <div className="image-item">
                  <img src="/ainext-template/assets/img/about-image-3.jpg" alt="image" />
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
                  <img src="/ainext-template/assets/img/about-image-4.jpg" alt="image" />
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
                  <img src="/ainext-template/assets/img/about-image-5.jpg" alt="image" />
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
            </div>
          </div>
        </div>
        {/* End Team Area */}

        {/* Start Gallery Area */}
        <div className="gallery-area ptb-100">
          <div className="container">
            <div className="gallery-table" data-aos="fade-up" data-aos-duration="1500">
              <div className="section-title">
                <div className="width">
                  <div className="sub-t">Image Generation</div>
                  <h2>Unveil New Creative Horizons with Models</h2>
                </div>

                <ul className="">
                  <li className="item-list play on" data-filter="All">All</li>
                  <li className="item-list play" data-filter="Brand">Brand</li>
                  <li className="item-list play" data-filter="Design">Design</li>
                  <li className="item-list play" data-filter="Motion">Motion</li>
                  <li className="item-list play" data-filter="Printing">Printing</li>
                </ul>

              </div>

              <div className="gallery">
                <div className="item-box All Brand">
                  <img src="/ainext-template/assets/img/gallery/gallery-image1.jpg" alt="image" />
                </div>
                <div className="item-box All Design">
                  <img src="/ainext-template/assets/img/gallery/gallery-image16.jpg" alt="image" />
                </div>
                <div className="item-box All Design">
                  <img src="/ainext-template/assets/img/gallery/gallery-image11.jpg" alt="image" />
                </div>
                <div className="item-box All Printing">
                  <img src="/ainext-template/assets/img/gallery/gallery-image2.jpg" alt="image" />
                </div>
                <div className="item-box All Printing">
                  <img src="/ainext-template/assets/img/gallery/gallery-image7.jpg" alt="image" />
                </div>
                <div className="item-box All Printing">
                  <img src="/ainext-template/assets/img/gallery/gallery-image3.jpg" alt="image" />
                </div>
                <div className="item-box All Printing">
                  <img src="/ainext-template/assets/img/gallery/gallery-image4.jpg" alt="image" />
                </div>
                <div className="item-box All Brand">
                  <img src="/ainext-template/assets/img/gallery/gallery-image6.jpg" alt="image" />
                </div>
                <div className="item-box All Motion">
                  <img src="/ainext-template/assets/img/gallery/gallery-image8.jpg" alt="image" />
                </div>
                <div className="item-box All Design">
                  <img src="/ainext-template/assets/img/gallery/gallery-image15.jpg" alt="image" />
                </div>
                <div className="item-box All Design">
                  <img src="/ainext-template/assets/img/gallery/gallery-image13.jpg" alt="image" />
                </div>
                <div className="item-box All Design">
                  <img src="/ainext-template/assets/img/gallery/gallery-image12.jpg" alt="image" />
                </div>
                <div className="item-box All Design">
                  <img src="/ainext-template/assets/img/gallery/gallery-image17.jpg" alt="image" />
                </div>
              </div>
              <div className="gallery-btn">
                <a className="main-btn" href="/portfolio-ainext"><span></span><i className="ri-function-line"></i> View All Images</a>
              </div>
            </div>
          </div>
        </div>
        {/* End Gallery Area */}

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

        {/* Start Pricing Area */}
        <div className="pricing-area pt-100 section-bg">
          <div className="section-title-center">
            <div className="width">
              <div className="sub-t">Best Pricing Plans</div>
              <h2>Our Pricing Plans</h2>
            </div>
          </div>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-4 col-md-6">
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
              <div className="col-lg-4 col-md-6">
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
              <div className="col-lg-4 col-md-6">
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
        {/* End Pricing Area */}

        {/* Start Article Area */}
        <div className="article-area ptb-100">
          <div className="container">
            <div className="row">
              <div className="col-lg-4">
                <div className="section-title">
                  <div className="width">
                    <div className="sub-t">Our Latest News</div>
                    <h2>Latest News & Articles</h2>
                    <a className="main-btn" href="/blog-ainext"><span></span><i className="ri-pencil-line"></i> See More</a>
                  </div>
                </div>
              </div>
              <div className="col-lg-8">
                <div className="article-content owl-carousel owl-theme">
                  <div className="item">
                    <img src="/ainext-template/assets/img/blogs/artical-1.jpg" alt="image" />
                    <div className="pop-content">
                      <h3><a href="/blog-ainext">The actual history of machine intelligence</a></h3>
                      <ul>
                        <li>March 18, 2022</li>
                        <li><span>0</span>Comments</li>
                      </ul>
                    </div>
                    <a href="/blog-ainext">
                      <div className="go-corner">
                        <div className="go-arrow">
                          <i className="ri-arrow-right-up-line"></i>
                        </div>
                      </div>
                    </a>
                  </div>
                  <div className="item">
                    <img src="/ainext-template/assets/img/blogs/artical-3.jpg" alt="image" />
                    <div className="pop-content">
                      <h3><a href="/blog-ainext">The actual history of machine intelligence</a></h3>
                      <ul>
                        <li>March 18, 2022</li>
                        <li><span>0</span>Comments</li>
                      </ul>
                    </div>
                    <a href="/blog-ainext">
                      <div className="go-corner">
                        <div className="go-arrow">
                          <i className="ri-arrow-right-up-line"></i>
                        </div>
                      </div>
                    </a>
                  </div>
                  <div className="item">
                    <img src="/ainext-template/assets/img/blogs/artical-2.jpg" alt="image" />
                    <div className="pop-content">
                      <h3><a href="/blog-ainext">The actual history of machine intelligence</a></h3>
                      <ul>
                        <li>March 18, 2022</li>
                        <li><span>0</span>Comments</li>
                      </ul>
                    </div>
                    <a href="/blog-ainext">
                      <div className="go-corner">
                        <div className="go-arrow">
                          <i className="ri-arrow-right-up-line"></i>
                        </div>
                      </div>
                    </a>
                  </div>
                  <div className="item">
                    <img src="/ainext-template/assets/img/blogs/artical-4.jpg" alt="image" />
                    <div className="pop-content">
                      <h3><a href="/blog-ainext">The actual history of machine intelligence</a></h3>
                      <ul>
                        <li>March 18, 2022</li>
                        <li><span>0</span>Comments</li>
                      </ul>
                    </div>
                    <a href="/blog-ainext">
                      <div className="go-corner">
                        <div className="go-arrow">
                          <i className="ri-arrow-right-up-line"></i>
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* End Article Area */}

        {/* Start Insta Gallery */}
        <div className="insta-gallery">
          <div className="conatiner-fluid">
            <div className="ins-gallery owl-carousel owl-theme">
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-1.jpg" alt="image" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-10.jpg" alt="image" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-2.jpg" alt="image" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-3.jpg" alt="image" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-4.jpg" alt="image" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-5.jpg" alt="image" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-6.jpg" alt="image" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-7.jpg" alt="image" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-8.jpg" alt="image" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
              <div className="items">
                <a href="https://www.instagram.com/" target="_blank" >
                  <img src="/ainext-template/assets/img/gallery/insta-9.jpg" alt="image" />
                  <i className="ri-instagram-line"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
        {/* End Insta Gallery */}

        {/* Start Footer Area */}
        <footer className="footer-area">
          <div className="container">
            <div className="footer-top-area pt-100">
              <div className="row">
                <div className="col-lg-4 col-md-6 col-sm-6">
                  <div className="single-footer-widget">
                    <a href="index.html" className="logo">
                      <h2>AiNext</h2>
                    </a>
                    <p>Lorem ipsum amet, consectetur adipiscing elit. Suspendis varius enim eros elementum tristique. Duis cursus.</p>
                    <ul className="social-links">
                      <li><a href="https://www.facebook.com/" target="_blank"><i className="ri-facebook-fill"></i></a></li>
                      <li><a href="https://www.instagram.com/" target="_blank"><i className="ri-instagram-line"></i></a></li>
                      <li><a href="https://www.linkedin.com/" target="_blank"><i className="ri-linkedin-fill"></i></a></li>
                      <li><a href="https://www.youtube.com/" target="_blank"><i className="ri-youtube-line"></i></a></li>
                    </ul>
                  </div>
                </div>
                <div className="col-lg-2 col-md-6 col-sm-6">
                  <div className="single-footer-widget pl-5">
                    <h3>Links</h3>
                    <ul className="links-list">
                      <li><a href="/landing-page-2">Home</a></li>
                      <li><a href="/about">About Us</a></li>
                      <li><a href="/pricing-ainext">Pricing</a></li>
                      <li><a href="/blog-ainext">Blog</a></li>
                      <li><a href="/contact-ainext">Contact Us</a></li>
                    </ul>
                  </div>
                </div>
                <div className="col-lg-2 col-md-6 col-sm-6">
                  <div className="single-footer-widget">
                    <h3>Legal</h3>
                    <ul className="links-list">
                      <li><a href="/terms-conditions">Legal</a></li>
                      <li><a href="/terms-conditions">Terms of Use</a></li>
                      <li><a href="/terms-conditions">Terms & Conditions</a></li>
                      <li><a href="/pricing-ainext">Payment Method</a></li>
                      <li><a href="/privacy-policy">Privacy Policy</a></li>
                    </ul>
                  </div>
                </div>
                <div className="col-lg-4 col-md-6 col-sm-6">
                  <div className="single-footer-widget">
                    <h3>Newsletter</h3>
                    <div className="footer-newsletter-info">
                      <p>Join over <span>68,000</span> people getting our emails Lorem ipsum dolor sit amet consectet </p>
                      <form className="newsletter-form" data-toggle="validator">
                        <label><i className='bx bx-envelope-open'></i></label>
                        <input type="text" className="input-newsletter" placeholder="Enter your email address" name="EMAIL" required autoComplete="off" />
                        <button type="submit" className="default-btn"><i className="ri-send-plane-line"></i> Subscribe Now</button>
                        <div id="validator-newsletter2" className="form-result"></div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="pr-line"></div>
            <div className="footer-bottom-area">
              <p>© Copyright | <a href="https://alhikmahsoft.com" target="_blank">AlHikmahSoft</a>  | All Rights Reserved is Proudly </p>
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
  )
}
