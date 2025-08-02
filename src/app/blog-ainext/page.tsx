import { Metadata } from 'next'
import BootstrapLayout from '../landing-page-2/BootstrapLayout'

export const metadata: Metadata = {
  title: 'Blog - Gensy',
  description: 'Latest news and insights about AI technology and creative solutions.',
}

export default function BlogPage() {
  return (
    <BootstrapLayout title="Blog - Gensy" currentPage="blog">
      {/* Start Section Banner */}
      <div className="section-banner">
        <div className="container">
          <div className="section-banner-title">
            <h1>Blog Grid</h1>
            <nav style={{"--bs-breadcrumb-divider": "'/'"} as React.CSSProperties} aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/landing-page-2">Home</a></li>
                <li className="breadcrumb-item active" aria-current="page">Blog Grid</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>
      {/* End Banner Area */}

      {/* Start Blog Area */}
      <div className="blog-area article-area pt-100 pb-70">
        <div className="container">
          <div className="row">
            <div className="col-lg-4">
              <div className="item" data-aos="fade-up" data-aos-duration="1500">
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
            </div>
            <div className="col-lg-4">
              <div className="item" data-aos="fade-up" data-aos-duration="1500">
                <img src="/ainext-template/assets/img/blogs/artical-2.jpg" alt="image" />
                <div className="pop-content">
                  <h3><a href="/blog-ainext">How to create a machine learning model</a></h3>
                  <ul>
                    <li>March 20, 2022</li>
                    <li><span>2</span>Comments</li>
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
            <div className="col-lg-4">
              <div className="item" data-aos="fade-up" data-aos-duration="1500">
                <img src="/ainext-template/assets/img/blogs/artical-3.jpg" alt="image" />
                <div className="pop-content">
                  <h3><a href="/blog-ainext">Future of AI in Creative Industries</a></h3>
                  <ul>
                    <li>March 22, 2022</li>
                    <li><span>5</span>Comments</li>
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
            <div className="col-lg-4">
              <div className="item" data-aos="fade-up" data-aos-duration="1500">
                <img src="/ainext-template/assets/img/blogs/artical-4.jpg" alt="image" />
                <div className="pop-content">
                  <h3><a href="/blog-ainext">Best Practices for AI Image Generation</a></h3>
                  <ul>
                    <li>March 25, 2022</li>
                    <li><span>3</span>Comments</li>
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
            <div className="col-lg-4">
              <div className="item" data-aos="fade-up" data-aos-duration="1500">
                <img src="/ainext-template/assets/img/blogs/artical-5.jpg" alt="image" />
                <div className="pop-content">
                  <h3><a href="/blog-ainext">Understanding Neural Networks</a></h3>
                  <ul>
                    <li>March 28, 2022</li>
                    <li><span>7</span>Comments</li>
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
            <div className="col-lg-4">
              <div className="item" data-aos="fade-up" data-aos-duration="1500">
                <img src="/ainext-template/assets/img/blogs/artical-6.jpg" alt="image" />
                <div className="pop-content">
                  <h3><a href="/blog-ainext">AI Ethics and Responsible Development</a></h3>
                  <ul>
                    <li>March 30, 2022</li>
                    <li><span>12</span>Comments</li>
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
      {/* End Blog Area */}
    </BootstrapLayout>
  )
}
