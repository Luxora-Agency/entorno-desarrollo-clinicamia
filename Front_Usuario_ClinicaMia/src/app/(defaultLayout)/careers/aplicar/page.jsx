"use client"

import React from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import Section from '@/app/ui/Section'
import BannerSectionStyle3 from '@/app/ui/Section/BannerSection/BannerSectionStyle3'
import CareerForm from '@/app/ui/CareerForm'

import bannerImg from '../../../../../public/images/careers/banner_img.jpg'

export default function AplicarEspontaneo() {
  return (
    <>
      <BannerSectionStyle3
        bgUrl="/images/careers/banner_bg.svg"
        imgUrl={bannerImg}
        title="Postulación <br />Espontánea"
        subTitle="Envíanos tu hoja de vida completa y te contactaremos cuando surja una oportunidad"
      />

      <Section
        topMd={200}
        topLg={150}
        topXl={110}
        bottomMd={200}
        bottomLg={150}
        bottomXl={110}
      >
        <div className="container">
          {/* Breadcrumb */}
          <nav className="cs_vacante_breadcrumb mb-4">
            <Link href="/careers">
              <Icon icon="fa6-solid:arrow-left" width={14} className="me-2" />
              Ver vacantes disponibles
            </Link>
          </nav>

          <div className="row">
            <div className="col-lg-10 offset-lg-1">
              <div className="cs_section_heading cs_style_1 text-center">
                <h2 className="cs_section_title cs_fs_72 mb-0">
                  Formulario de Postulación
                </h2>
                <div className="cs_height_42 cs_height_xl_25" />
                <p className="cs_section_subtitle cs_fs_20 mb-0">
                  Complete el siguiente formulario para aplicar a una vacante médica en ClinicaMia.
                  Nuestro equipo de recursos humanos revisará su solicitud y se pondrá en contacto con usted.
                </p>
              </div>
              <div className="cs_height_72 cs_height_xl_50" />
              <CareerForm />
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}
