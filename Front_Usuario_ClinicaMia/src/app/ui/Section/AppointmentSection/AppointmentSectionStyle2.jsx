import React from 'react';
import AppointmentForm from '../../AppointmentForm';
import SectionHeading from '../../SectionHeading';
import Spacing from '../../Spacing';
import Image from 'next/image';

export default function AppointmentSectionStyle2({
  bgUrl,
  imgUrl,
  sectionTitle,
  sectionTitleUp,
}) {
  return (
    <section
      className="cs_appointment_section_1 cs_bg_filed"
      style={{
        backgroundImage: `url(${bgUrl})`,
      }}
    >
      <div className="container">
        <div className="cs_height_132" />
        <div className="cs_appointment_img">
          <Image src={imgUrl} alt="Appointment" placeholder='blur' />
        </div>
        <div className="row">
          <div className="offset-lg-6 col-lg-6">
            <SectionHeading title={sectionTitle} titleUp={sectionTitleUp} />
            <Spacing md="57" />
            <AppointmentForm />
          </div>
        </div>
        <div className="cs_height_120" />
      </div>
    </section>
  );
}
