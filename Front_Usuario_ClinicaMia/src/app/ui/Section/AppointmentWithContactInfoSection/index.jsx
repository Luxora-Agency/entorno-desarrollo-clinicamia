import React from 'react';
import AppointmentForm from '../../AppointmentForm';
import Image from 'next/image';

import appointmentImg from '../../../../../public/images/appointments/appointment_img.jpg'

const contactInfo = [
  { title: 'Teléfonos', subTitle: '324 333 8555 – 324 333 8686' },
  { title: 'Correo Electrónico', subTitle: 'info@clinicamiacolombia.com' },
  { title: 'Ubicación', subTitle: 'Cra. 5 #28-85, Ibagué, Tolima' },
];

export default function AppointmentWithContactInfoSection() {
  return (
    <div className="container">
      <div className="row">
        <div className="col-lg-7">
          <h2 className="cs_fs_40 cs_medium mb-0">Agenda tu Cita</h2>
          <div className="cs_height_42 cs_height_xl_25" />
          <AppointmentForm />
        </div>
        <div className="col-lg-4 offset-lg-1">
          <div className="cs_height_lg_100" />
          <h2 className="cs_fs_40 cs_medium mb-0">Información de Contacto</h2>
          <div className="cs_height_60 cs_height_xl_40" />
          <Image
            src={appointmentImg}
            alt="Appointment"
            className="cs_radius_25 w-100"
            placeholder='blur'
          />
          <div className="cs_height_100 cs_height_xl_60" />
          <ul className="cs_contact_info cs_style_1 cs_mp0">
            {contactInfo.map((item, index) => (
              <li key={index}>
                <h3 className="cs_fs_24 cs_semibold mb-0">{item.title}</h3>
                <p className="mb-0 cs_heading_color">{item.subTitle}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
