'use client'
import React from 'react'
import Slider from 'react-slick'
import parse from 'html-react-parser'
import VideoModal from '../VideoModal'
import Link from 'next/link'
import Image from 'next/image'

export default function HeroSlider({ slides, infoList, btnText, btnUrl }) {
  // Slider Settings
  const SlickArrowLeft = ({ currentSlide, slideCount, ...props }) => (
    <div
      {...props}
      className={
        'cs_slider_prev cs_hero_arrow cs_center' +
        (currentSlide === 0 ? ' slick-disabled' : '')
      }
      aria-hidden="true"
      aria-disabled={currentSlide === 0 ? true : false}
    >
      <Image
        src="/images/icons/left_arrow_blue.svg"
        alt="Previous"
        height={24}
        width={35}
      />
    </div>
  )

  const SlickArrowRight = ({ currentSlide, slideCount, ...props }) => (
    <div
      {...props}
      className={
        'cs_slider_next cs_hero_arrow cs_center' +
        (currentSlide === slideCount - 1 ? ' slick-disabled' : '')
      }
      aria-hidden="true"
      aria-disabled={currentSlide === slideCount - 1 ? true : false}
    >
      <Image
        src="/images/icons/right_arrow_blue.svg"
        alt="Next"
        height={24}
        width={35}
      />
    </div>
  )

  const settings = {
    dots: true,
    prevArrow: <SlickArrowLeft />,
    nextArrow: <SlickArrowRight />,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 5000,
    speed: 1000,
    slidesToShow: 1,
    slidesToScroll: 1,
    fade: true,
    cssEase: 'linear'
  }

  return (
    <section className="cs_hero cs_style_1 cs_hero_slider">
      <div className="cs_hero_wrap_slider">
        <Slider {...settings} className="cs_hero_slider_wrapper">
          {slides?.map((slide, index) => (
            <div key={index} className="cs_hero_slide_item">
              <div
                className="cs_hero_wrap cs_bg_filed"
                style={{ backgroundImage: `url(${slide.bgUrl})` }}
              >
                <div className="container">
                  <div className="cs_hero_text">
                    <h1 className="cs_hero_title cs_fs_94">{parse(slide.title)}</h1>
                    <p className="cs_hero_subtitle cs_fs_20 cs_heading_color">
                      {parse(slide.subTitle)}
                    </p>
                    {slide.videoBtnText && slide.videoUrl && (
                      <div className="cs_hero_btn_wrap">
                        <VideoModal
                          videoUrl={slide.videoUrl}
                          videoBtnText={slide.videoBtnText}
                          variant="cs_heading_color"
                        />
                      </div>
                    )}
                  </div>
                  <div className="cs_hero_img">
                    <Image
                      src={slide.imgUrl}
                      alt={slide.title}
                      placeholder="blur"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>

      {/* Info Bar - Same structure as original Hero */}
      <div className="container cs_hero_info_container">
        <div className="cs_hero_info_wrap cs_shadow_1 cs_white_bg cs_radius_15">
          {infoList?.map((item, index) => (
            <div className="cs_hero_info_col" key={index}>
              <div className="cs_hero_info d-flex align-items-center">
                <div className="cs_hero_info_icon cs_center rounded-circle cs_accent_bg">
                  <Image src={item.iconUrl} alt="Icon" height={33} width={33} />
                </div>
                <div className="cs_hero_info_right">
                  <h3 className="cs_hero_info_title cs_semibold">
                    {item.title}
                  </h3>
                  <p className="cs_hero_info_subtitle cs_fs_20">
                    {item.subTitle}
                  </p>
                </div>
              </div>
            </div>
          ))}
          <div className="cs_hero_info_col">
            <Link href={btnUrl} className="cs_btn cs_style_1">
              <span>{btnText}</span>
              <i>
                <Image
                  src="/images/icons/arrow_white.svg"
                  alt="Icon"
                  height={11}
                  width={16}
                />
                <Image
                  src="/images/icons/arrow_white.svg"
                  alt="Icon"
                  height={11}
                  width={16}
                />
              </i>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
