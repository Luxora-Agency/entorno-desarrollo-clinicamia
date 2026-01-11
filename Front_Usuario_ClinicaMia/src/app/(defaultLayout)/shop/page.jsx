"use client"
import React from 'react';
import Section from '@/app/ui/Section';
import BannerSectionStyle5 from '@/app/ui/Section/BannerSection/BannerSectionStyle5';
import ShopSection from '@/app/ui/Section/ShopSection';

import bannerImg from '../../../../public/images/shop/banner_img.jpg';

export default function Shop() {
  return (
    <>
      <BannerSectionStyle5
        bgUrl="/images/shop/banner_bg.svg"
        imgUrl={bannerImg}
        title="Tienda ClinicaMia"
        subTitle="Encuentra productos de salud y bienestar <br />seleccionados especialmente para ti"
      />
      <Section
        topMd={200}
        topLg={150}
        topXl={110}
        bottomMd={200}
        bottomLg={150}
        bottomXl={110}
      >
        <ShopSection />
      </Section>
    </>
  );
}
