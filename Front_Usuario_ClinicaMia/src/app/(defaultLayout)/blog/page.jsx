'use client'
import React from 'react'
import Breadcrumb from '@/app/ui/Breadcrumb'
import Section from '@/app/ui/Section'
import BannerSectionStyle9 from '@/app/ui/Section/BannerSection/BannerSectionStyle9'
import BlogSectionStyle2 from '@/app/ui/Section/BlogSection/BlogSectionStyle2'

import bannerImg from '../../../../public/images/blog/banner_img_bottom.png'

export default function Blog() {
  return (
    <>
      <Section topMd={170} bottomMd={96} bottomLg={70}>
        <Breadcrumb title="Salud y Bienestar" />
      </Section>
      <Section bottomMd={200} bottomLg={150} bottomXl={110}>
        <BlogSectionStyle2 />
      </Section>
      <Section className="cs_footer_margin_0">
        <BannerSectionStyle9
          title="¡Tu Salud es <br />Nuestra Prioridad!"
          subTitle="Agenda una cita con uno de nuestros profesionales <br />médicos experimentados hoy mismo!"
          imgUrl={bannerImg}
        />
      </Section>
    </>
  )
}
