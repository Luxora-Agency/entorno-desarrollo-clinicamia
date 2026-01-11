import React from 'react';
import IconBoxStyle11 from '../../IconBox/IconBoxStyle11';
import Spacing from '../../Spacing';

export default function ContactInfoSection({ sectionTitle }) {
  return (
    <div className="container">
      <h2 className="cs_fs_72 mb-0">{sectionTitle}</h2>
      <Spacing md="70" lg="50" />
      <div className="row g-4 g-xl-3 g-xxl-5">
        <div className="col-xl-4">
          <IconBoxStyle11
            title="Teléfono"
            subTitle="324 333 8555"
            iconSrc="/images/contact/icon_1.svg"
          />
        </div>
        <div className="col-xl-4">
          <IconBoxStyle11
            title="Correo Electrónico"
            subTitle="info@clinicamiacolombia.com"
            iconSrc="/images/contact/icon_2.svg"
          />
        </div>
        <div className="col-xl-4">
          <IconBoxStyle11
            title="Ubicación"
            subTitle="Cra. 5 #28-85, Ibagué, Tolima"
            iconSrc="/images/contact/icon_3.svg"
          />
        </div>
      </div>
      <Spacing md="35" />
      {/* Start Google Map */}
      <div className="cs_map">
        <iframe
          id="map"
          title="Google Map"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3977.0869736859844!2d-75.2308795!3d4.4382815!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e38c5c0e8f8f8f1%3A0x1234567890abcdef!2sCra.%205%20%2328-85%2C%20Ibagu%C3%A9%2C%20Tolima!5e0!3m2!1ses!2sco!4v1699363200000!5m2!1ses!2sco"
          allowFullScreen
        />
      </div>
      {/* End Google Map */}
    </div>
  );
}
