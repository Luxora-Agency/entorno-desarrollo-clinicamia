"use client"
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import BreadcrumbStyle2 from '@/app/ui/Breadcrumb/BreadcrumbStyle2';
import Section from '@/app/ui/Section';
import AppointmentSectionStyle2 from '@/app/ui/Section/AppointmentSection/AppointmentSectionStyle2';
import BannerSectionStyle9 from '@/app/ui/Section/BannerSection/BannerSectionStyle9';
import DoctorDetailsSection from '@/app/ui/Section/DoctorDetailsSection';
import { Icon } from '@iconify/react';
import appointmentImg from '../../../../../public/images/home_2/appointment_img.png';
import bannerImg from '../../../../../public/images/doctors/banner_img_3.png';

const dayNames = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado'
};

export default function DoctorDetails() {
  const { doctorId } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        setIsLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const response = await fetch(`${apiUrl}/api/v1/doctors/public/${doctorId}`);

        if (!response.ok) {
          throw new Error('Doctor no encontrado');
        }

        const result = await response.json();
        setDoctor(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (doctorId) {
      fetchDoctor();
    }
  }, [doctorId]);

  // Construir URL de la foto
  const getPhotoUrl = (foto) => {
    if (!foto) return '/images/doctors/doctor_details.jpeg';
    if (foto.startsWith('http')) return foto;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return `${apiUrl}${foto}`;
  };

  // Procesar horarios del doctor
  const getSchedules = (horarios) => {
    if (!horarios || typeof horarios !== 'object') return [];

    // Si horarios es un objeto con días de la semana
    const schedules = [];
    Object.entries(horarios).forEach(([day, data]) => {
      if (data && data.activo) {
        schedules.push({
          day: day.charAt(0).toUpperCase() + day.slice(1),
          time: `${data.inicio || '08:00'} - ${data.fin || '17:00'}`
        });
      }
    });

    return schedules;
  };

  if (isLoading) {
    return (
      <>
        <BreadcrumbStyle2 />
        <Section bottomMd={190} bottomLg={150} bottomXl={110}>
          <div className="container">
            <div className="text-center py-5">
              <Icon icon="svg-spinners:ring-resize" style={{ fontSize: '64px', color: '#53B896' }} />
              <p className="mt-3">Cargando información del doctor...</p>
            </div>
          </div>
        </Section>
      </>
    );
  }

  if (error || !doctor) {
    return (
      <>
        <BreadcrumbStyle2 />
        <Section bottomMd={190} bottomLg={150} bottomXl={110}>
          <div className="container">
            <div className="text-center py-5">
              <Icon icon="mdi:alert-circle-outline" style={{ fontSize: '64px', color: '#f59e0b' }} />
              <h2 className="mt-3">Doctor no encontrado</h2>
              <p className="text-muted">{error || 'No se pudo cargar la información del doctor'}</p>
              <a href="/doctors" className="btn btn-primary mt-3">
                Ver todos los doctores
              </a>
            </div>
          </div>
        </Section>
      </>
    );
  }

  const schedules = getSchedules(doctor.horarios);

  const contactInfo = [
    { iconUrl: '/images/icons/call.svg', title: doctor.telefono || 'No disponible' },
    { iconUrl: '/images/icons/envlope.svg', title: doctor.email || 'No disponible' },
  ];

  const degrees = [
    {
      title: doctor.universidad || 'Universidad',
      subTitle: 'Título Médico'
    },
    {
      title: `Licencia Médica: ${doctor.licenciaMedica || 'N/A'}`,
      subTitle: 'Certificación Profesional'
    }
  ];

  const experiences = [];
  if (doctor.aniosExperiencia) {
    experiences.push({
      title: `${doctor.aniosExperiencia} años de experiencia en ${doctor.especialidades?.[0] || 'medicina'}`
    });
  }
  if (doctor.biografia) {
    experiences.push({
      title: doctor.biografia
    });
  }
  if (experiences.length === 0) {
    experiences.push({
      title: 'Profesional médico certificado con amplia experiencia'
    });
  }

  const awards = [
    {
      title: 'Certificado por instituciones médicas reconocidas'
    }
  ];

  const social = [
    { icon: 'fa6-brands:facebook-f', href: '#' },
    { icon: 'fa6-brands:linkedin-in', href: '#' },
    { icon: 'fa6-brands:instagram', href: '#' },
  ];

  return (
    <>
      <BreadcrumbStyle2 />
      <Section bottomMd={190} bottomLg={150} bottomXl={110}>
        <DoctorDetailsSection
          bgUrl="/images/doctors/doctor_details_bg.svg"
          imgUrl={getPhotoUrl(doctor.foto)}
          name={doctor.nombreCompleto || `Dr. ${doctor.nombre} ${doctor.apellido}`}
          department={doctor.especialidades?.[0] || 'Especialidad'}
          designation={doctor.especialidades?.join(', ') || 'Médico Especialista'}
          description={doctor.biografia || 'Profesional médico certificado con amplia experiencia'}
          social={social}
          contactInfo={contactInfo}
          contactInfoHeading="Información de Contacto"
          schedules={schedules}
          scheduleHeading="Horarios de Atención"
          degrees={degrees}
          degreesHeading="Educación"
          experiences={experiences}
          experiencesHeading="Experiencia"
          awards={awards}
          awardHeading="Certificaciones"
        />
      </Section>
      <Section bottomMd={200} bottomLg={150} bottomXl={110}>
        <AppointmentSectionStyle2
          bgUrl="/images/home_2/appointment_bg.svg"
          imgUrl={appointmentImg}
          sectionTitle="Cita"
          sectionTitleUp={`AGENDAR CITA CON ${doctor.nombreCompleto || doctor.nombre}`}
        />
      </Section>
      <Section className="cs_footer_margin_0">
        <BannerSectionStyle9
          title="¡No Dejes Tu Salud <br />en Segundo Plano!"
          subTitle="Agenda una cita con nuestros profesionales médicos <br />experimentados hoy mismo!"
          imgUrl={bannerImg}
        />
      </Section>
    </>
  );
}
