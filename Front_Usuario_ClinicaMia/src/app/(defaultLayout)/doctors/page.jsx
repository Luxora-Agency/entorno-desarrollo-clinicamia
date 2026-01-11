"use client"
import React from 'react';
import Section from '@/app/ui/Section';
import BannerSectionStyle4 from '@/app/ui/Section/BannerSection/BannerSectionStyle4';
import BannerSectionStyle5 from '@/app/ui/Section/BannerSection/BannerSectionStyle5';
import TeamSectionStyle2 from '@/app/ui/Section/TeamSection/TeamSectionStyle2';

import bannerImg from '../../../../public/images/doctors/banner_img.jpg';

export default function Doctors() {
  return (
    <>
      <BannerSectionStyle5
        bgUrl="/images/doctors/banner_bg.svg"
        imgUrl={bannerImg}
        title="Conoce a Nuestros <br />Especialistas Médicos"
        subTitle="Equipo médico certificado con años de <br />experiencia profesional en ClinicaMia"
      />
      <Section topMd={65} bottomMd={200} bottomLg={150} bottomXl={110}>
        <TeamSectionStyle2 />
      </Section>
      <Section className="cs_footer_margin_0">
        <BannerSectionStyle4
          bgUrl="/images/doctors/banner_bg_2_new.jpg"
          title="¡Tu Salud es <br />Nuestra Prioridad!"
          subTitle="Agenda una cita con nuestros especialistas <br />médicos certificados hoy mismo!"
        />
      </Section>
    </>
  );
}
