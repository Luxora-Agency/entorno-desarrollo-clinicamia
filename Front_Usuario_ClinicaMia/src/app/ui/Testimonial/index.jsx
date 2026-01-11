"use client"
import React, { useState } from 'react';
import Rating from '../Rating';
import Image from 'next/image';
import { Icon } from '@iconify/react';

export default function Testimonial() {
  const [activeTab, setActiveTab] = useState(2);
  const handleTabClick = tabNumber => {
    setActiveTab(tabNumber);
  };
  return (
    <div className="cs_tabs cs_style1">
      <ul className="cs_tab_links">
        <li className={activeTab === 1 ? 'active' : ''}>
          <div className="cs_tab_link_in" onClick={() => handleTabClick(1)}>
            <div className="cs_testimonial_1_avatar">
              <div className="cs_user_icon_wrapper">
                <Icon icon="iconamoon:profile-circle-fill" style={{ fontSize: '63px', color: '#144F79' }} />
              </div>
              <div className="cs_testimonial_1_avatar_right">
                <h3 className="cs_fs_24 cs_semibold mb-0">MARÍA FERNÁNDEZ</h3>
                <p className="cs_heading_color mb-0">Ibagué, Tolima</p>
              </div>
            </div>
          </div>
        </li>
        <li className={activeTab === 2 ? 'active' : ''}>
          <div className="cs_tab_link_in" onClick={() => handleTabClick(2)}>
            <div className="cs_testimonial_1_avatar">
              <div className="cs_user_icon_wrapper">
                <Icon icon="iconamoon:profile-circle-fill" style={{ fontSize: '63px', color: '#144F79' }} />
              </div>
              <div className="cs_testimonial_1_avatar_right">
                <h3 className="cs_fs_24 cs_semibold mb-0">CARLOS RAMÍREZ</h3>
                <p className="cs_heading_color mb-0">Ibagué, Tolima</p>
              </div>
            </div>
          </div>
        </li>
        <li className={activeTab === 3 ? 'active' : ''}>
          <div className="cs_tab_link_in" onClick={() => handleTabClick(3)}>
            <div className="cs_testimonial_1_avatar">
              <div className="cs_user_icon_wrapper">
                <Icon icon="iconamoon:profile-circle-fill" style={{ fontSize: '63px', color: '#144F79' }} />
              </div>
              <div className="cs_testimonial_1_avatar_right">
                <h3 className="cs_fs_24 cs_semibold mb-0">ANA LÓPEZ</h3>
                <p className="cs_heading_color mb-0">Ibagué, Tolima</p>
              </div>
            </div>
          </div>
        </li>
      </ul>
      <div className="cs_tab_body">
        {activeTab === 1 && (
          <div className="cs_testimonial cs_style_1">
            <Image src="/images/icons/quote.svg" alt="Icon" height={38} width={50} />
            <p>
              El tratamiento para mi problema de tiroides en ClinicaMia fue excepcional.
              Los endocrinólogos son verdaderos expertos y me explicaron todo con mucha claridad.
              Las instalaciones son modernas y el personal siempre fue muy amable y profesional.
              Recomiendo ClinicaMia totalmente.
            </p>
            <Rating ratingNumber={5} />
          </div>
        )}
        {activeTab === 2 && (
          <div className="cs_testimonial cs_style_1">
            <Image src="/images/icons/quote.svg" alt="Icon" height={38} width={50} />
            <p>
              Mi experiencia con el servicio de cirugía plástica en ClinicaMia superó todas mis expectativas.
              Los cirujanos son altamente calificados y me hicieron sentir seguro en todo momento.
              El seguimiento postoperatorio fue excelente. Estoy muy satisfecho con los resultados.
            </p>
            <Rating ratingNumber={4.5} />
          </div>
        )}
        {activeTab === 3 && (
          <div className="cs_testimonial cs_style_1">
            <Image src="/images/icons/quote.svg" alt="Icon" height={38} width={50} />
            <p>
              El equipo de Apollo Diagnóstico en ClinicaMia es extraordinario.
              Los exámenes fueron rápidos y precisos, y los resultados me los entregaron a tiempo.
              La tecnología que utilizan es de última generación. Sin duda, la mejor clínica de Ibagué.
            </p>
            <Rating ratingNumber={4.5} />
          </div>
        )}
      </div>
    </div>
  );
}
