"use client"
import React, { useRef } from 'react';
import Slider from 'react-slick';
import TestimonialStyle4 from '../Testimonial/TestimonialStyle4';
import Image from 'next/image';

export default function TestimonialCarouselStyle3({ data }) {
  const sliderRef = useRef(null);

  const next = () => {
    sliderRef.current.slickNext();
  };

  const previous = () => {
    sliderRef.current.slickPrev();
  };

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    swipeToSlide: true,
    variableWidth: true,
  };
  return (
    <div className="cs_testimonial_carousel_2 cs_gap_20">
      <div className="cs_slider_navigation cs_style_1">
        <div
          className="cs_slider_prev cs_center cs_shadow_2"
          onClick={previous}
        >
          <Image src="/images/icons/left_arrow_blue.svg" alt="Prev" height={14} width={20} />
        </div>
        <div className="cs_slider_next cs_center cs_shadow_2" onClick={next}>
          <Image src="/images/icons/right_arrow_blue.svg" alt="Prev" height={14} width={20} />
        </div>
      </div>
      <div className="cs_height_140 cs_height_lg_60" />
      <Slider ref={sliderRef} {...settings} className="cs_slider_activate">
        {data?.map((item, index) => (
          <div className="cs_slide" key={index}>
            <TestimonialStyle4 {...item} />
          </div>
        ))}
      </Slider>
    </div>
  );
}
