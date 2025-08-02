import { Metadata } from 'next'
import BootstrapLayout from '../landing-page-2/BootstrapLayout'

export const metadata: Metadata = {
  title: '404 - Page Not Found | Gensy',
  description: 'The page you are looking for could not be found.',
}

export default function NotFoundPage() {
  return (
    <BootstrapLayout title="404 - Page Not Found | Gensy" currentPage="404">
      {/* Start Section Banner */}
      <div className="section-banner">
        <div className="container">
          <div className="section-banner-title">
            <h1>404 Error Page</h1>
            <nav style={{"--bs-breadcrumb-divider": "'/'"} as React.CSSProperties} aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/landing-page-2">Home</a></li>
                <li className="breadcrumb-item active" aria-current="page">404 Error Page</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>
      {/* End Banner Area */}

      {/* Start Not Found Area */}
      <div className="not-found-area ptb-100">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-12">
              <div className="content">
                <img src="/ainext-template/assets/img/404.png" alt="image" />
                <h3>Oops! That page can't be found</h3>
                <p>The page you are looking for might have been removed had its name changed or is temporarily unavailable.</p>
                <a href="/landing-page-2" className="default-btn">Back to Home</a>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* End Not Found Area */}

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
