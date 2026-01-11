'use client'
import React from 'react'
import ContactInfoWidget from '../Widget/ContactInfoWidget'
import MenuWidget from '../Widget/MenuWidget'
import SocialWidget from '../Widget/SocialWidget'
import Newsletter from '../Widget/Newsletter'
import TextWidget from '../Widget/TextWidget'
import Image from 'next/image'
const menuDataOne = [
  { title: 'Nosotros', href: '/about' },
  { title: 'Departamentos', href: '/departments' },
  { title: 'Médicos', href: '/doctors' },
  { title: 'Trabaja con Nosotros', href: '/careers' }
]
const menuDataTwo = [
  { title: 'Blog', href: '/blog' },
  { title: 'Contáctanos', href: '/contact' },
  { title: 'Agendar Consulta', href: '/appointments' }
]

export default function Footer() {
  return (
    <footer className="cs_footer cs_style_1 cs_heading_color">
      <div
        className="cs_footer_logo_wrap"
        style={{ backgroundImage: 'url(/images/footer_bg_1.svg)' }}
      >
        <div
          className="cs_footer_brand"
          style={{ backgroundImage: 'url(/images/footer_logo_bg.svg)' }}
        >
          <Image
            src="/images/logo.png"
            alt="Logo Icon"
            className="cs_footer_brand_icon"
            height={200}
            width={200}
          />
        </div>
      </div>
      <div className="cs_footer_main">
        <div className="container">
          <div className="row">
            <div className="col-lg-4">
              <div className="cs_footer_item">
                <TextWidget text="ClinicaMia <br />Centro Médico Especializado" />
                <ContactInfoWidget />
              </div>
            </div>
            <div className="col-lg-2">
              <div className="cs_footer_item">
                <MenuWidget data={menuDataOne} />
              </div>
            </div>
            <div className="col-lg-2">
              <div className="cs_footer_item">
                <MenuWidget data={menuDataTwo} />
              </div>
            </div>
            <div className="col-lg-4">
              <div className="cs_footer_item">
                <Newsletter
                  title="Suscríbete a Nuestro Boletín"
                  subTitle="Recibe las últimas noticias sobre salud de nuestros especialistas"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="cs_footer_bottom cs_accent_bg">
        <div className="container">
          <div className="cs_footer_bottom_in">
            <SocialWidget />
            <div className="cs_copyright">
              Copyright © 2025 ClinicaMia. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
