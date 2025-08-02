import { Metadata } from 'next'
import BootstrapLayout from '../landing-page-2/BootstrapLayout'

export const metadata: Metadata = {
  title: 'Portfolio - Gensy',
  description: 'Explore our gallery of AI-generated images and creative works.',
}

export default function PortfolioPage() {
  return (
    <BootstrapLayout title="Portfolio - Gensy" currentPage="portfolio">
      {/* Start Section Banner */}
      <div className="section-banner">
        <div className="container">
          <div className="section-banner-title">
            <h1>Portfolio</h1>
            <nav style={{"--bs-breadcrumb-divider": "'/'"} as React.CSSProperties} aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/landing-page-2">Home</a></li>
                <li className="breadcrumb-item active" aria-current="page">Portfolio</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>
      {/* End Banner Area */}

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
          </div>
        </div>
      </div>
      {/* End Gallery Area */}

      {/* Brands Area */}
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
