"use client"
import React from 'react';
import BreadcrumbStyle2 from '@/app/ui/Breadcrumb/BreadcrumbStyle2';
import Section from '@/app/ui/Section';
import AboutSectionStyle2 from '@/app/ui/Section/AboutSection/AboutSectionStyle2';
import AppointmentSection from '@/app/ui/Section/AppointmentSection';
import BannerSectionStyle7 from '@/app/ui/Section/BannerSection/BannerSectionStyle7';
import FeaturesSectionStyle3 from '@/app/ui/Section/FeaturesSection/FeaturesSectionStyle3';
import TeamStyle3 from '@/app/ui/Team/TeamStyle3';
import Spacing from '@/app/ui/Spacing';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import Image from 'next/image';

import appointmentImg from '../../../../../public/images/home_1/appointment.jpeg'
import aboutImg from '../../../../../public/images/departments/department_img_1.png'
import bannerImg from '../../../../../public/images/departments/banner_img_3.png'
import { $api } from '@/utils/openapi-client';
import { useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function DepartmentDetails() {
  const { departmentId } = useParams();

  // Fetch department details including specialties and doctors
  const { data, isLoading, error } = $api.useQuery("get", `/departments/public/${departmentId}`);

  // Get photo URL helper
  const getPhotoUrl = (foto) => {
    if (!foto) return '/images/departments/related_doctor_1.jpeg';
    if (foto.startsWith('http')) return foto;
    return `${API_URL}${foto}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <BreadcrumbStyle2 />
        <Section topMd={135} topLg={100} topXl={100}>
          <div className="container">
            <div className="text-center py-5">
              <Icon icon="svg-spinners:ring-resize" style={{ fontSize: '48px', color: '#53B896' }} />
              <p className="mt-3 text-muted">Cargando información del departamento...</p>
            </div>
          </div>
        </Section>
      </>
    );
  }

  // Error state
  if (error || !data?.data) {
    return (
      <>
        <BreadcrumbStyle2 />
        <Section topMd={135} topLg={100} topXl={100}>
          <div className="container">
            <div className="text-center py-5" style={{ maxWidth: '500px', margin: '0 auto' }}>
              <div style={{
                width: '120px',
                height: '120px',
                margin: '0 auto 30px',
                backgroundColor: '#fef3c7',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon icon="mdi:hospital-building" style={{ fontSize: '60px', color: '#f59e0b' }} />
              </div>
              <h2 className="cs_fs_40 cs_semibold mb-3">Departamento no encontrado</h2>
              <p className="text-muted mb-4">
                El departamento que buscas no existe o no está disponible.
                Explora otros departamentos de nuestra clínica.
              </p>
              <Link href="/departments" className="cs_btn cs_style_1">
                <span>Ver Departamentos</span>
                <Icon icon="mdi:arrow-right" style={{ marginLeft: '8px' }} />
              </Link>
            </div>
          </div>
        </Section>
      </>
    );
  }

  const department = data.data;
  const doctors = department.doctors || [];
  const specialties = department.especialidades || [];

  // Build features data from specialties or use default
  const departmentFeatures = specialties.length > 0
    ? specialties.slice(0, 4).map((specialty, index) => ({
        title: specialty.titulo,
        subTitle: specialty.descripcion || `Servicio especializado en ${specialty.titulo.toLowerCase()}`,
        iconUrl: `/images/departments/icon_${9 + index}.svg`,
      }))
    : [
        {
          title: 'Atención Médica General',
          subTitle: `El departamento de ${department.nombre} ofrece atención médica integral para diversas condiciones de salud.`,
          iconUrl: '/images/departments/icon_9.svg',
        },
        {
          title: 'Diagnóstico Especializado',
          subTitle: 'Contamos con equipos de última generación para realizar diagnósticos precisos.',
          iconUrl: '/images/departments/icon_10.svg',
        },
        {
          title: 'Tratamientos Personalizados',
          subTitle: 'Cada paciente recibe un plan de tratamiento adaptado a sus necesidades.',
          iconUrl: '/images/departments/icon_11.svg',
        },
        {
          title: 'Seguimiento Continuo',
          subTitle: 'Realizamos seguimiento constante de la evolución de nuestros pacientes.',
          iconUrl: '/images/departments/icon_12.svg',
        },
      ];

  // Transform doctors for the TeamStyle3 component
  const doctorData = doctors.map(doctor => ({
    imgUrl: getPhotoUrl(doctor.foto),
    name: doctor.nombreCompleto || `Dr. ${doctor.nombre} ${doctor.apellido}`,
    designation: doctor.especialidades?.join(', ') || 'Médico Especialista',
    description: doctor.biografia || `${doctor.aniosExperiencia || 0} años de experiencia`,
    social: [
      { icon: 'fa6-brands:linkedin-in', href: '#' },
    ],
    availableUrl: `/appointments?doctorId=${doctor.id}`,
    callUrl: 'tel:+573243338555',
    chatUrl: 'https://wa.me/573243338555',
    btnText: 'Agendar Cita',
    btnUrl: `/appointments?doctorId=${doctor.id}`,
  }));

  return (
    <>
      <BreadcrumbStyle2 />
      <Section topMd={135} topLg={100} topXl={100}>
        <AboutSectionStyle2
          title={department.nombre}
          subTitle={department.descripcion || 'Departamento especializado en atención médica de calidad'}
          imgUrl={aboutImg}
        />
      </Section>

      <Section topMd={170} topLg={145} topXl={90}>
        <FeaturesSectionStyle3
          sectionTitle="Servicios"
          sectionTitleUp="NUESTROS"
          data={departmentFeatures}
        />
      </Section>

      {/* Department Specialties Section */}
      {specialties.length > 0 && (
        <Section topMd={170} topLg={145} topXl={90}>
          <div className="container">
            <div className="cs_section_heading cs_style_1 text-center">
              <h3 className="cs_section_subtitle text-uppercase cs_accent_color cs_semibold m-0 cs_accent_color cs_fs_32">
                ESPECIALIDADES
              </h3>
              <Spacing lg="5" md="5" />
              <h2 className="cs_section_title cs_fs_72 m-0">
                Nuestras Especialidades
              </h2>
            </div>
            <Spacing md="72" lg="50" />
            <div className="row cs_gap_y_40">
              {specialties.map((specialty, index) => (
                <div className="col-lg-4 col-md-6" key={specialty.id || index}>
                  <div className="cs_iconbox cs_style_4" style={{
                    padding: '30px',
                    backgroundColor: '#fff',
                    borderRadius: '20px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    height: '100%',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                  }}>
                    <div className="cs_iconbox_icon" style={{
                      width: '70px',
                      height: '70px',
                      backgroundColor: '#53B896',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '20px'
                    }}>
                      <Icon icon="fa6-solid:stethoscope" style={{ fontSize: '28px', color: 'white' }} />
                    </div>
                    <h3 className="cs_iconbox_title cs_fs_24 cs_semibold" style={{ marginBottom: '15px' }}>
                      {specialty.titulo}
                    </h3>
                    <p className="cs_iconbox_subtitle m-0" style={{ color: '#666' }}>
                      {specialty.descripcion || 'Servicio especializado de atención médica'}
                    </p>
                    {specialty.costoCOP && (
                      <div style={{
                        marginTop: '15px',
                        padding: '10px 15px',
                        backgroundColor: '#f0fdf4',
                        borderRadius: '10px',
                        display: 'inline-block'
                      }}>
                        <span style={{ color: '#53B896', fontWeight: 600 }}>
                          Consulta: ${Number(specialty.costoCOP).toLocaleString('es-CO')} COP
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Doctors Section */}
      {doctorData.length > 0 && (
        <Section topMd={200} topLg={150} topXl={100}>
          <div className="container">
            <div className="cs_section_heading cs_style_1 text-center">
              <h3 className="cs_section_subtitle text-uppercase cs_accent_color cs_semibold m-0 cs_accent_color cs_fs_32">
                NUESTRO EQUIPO
              </h3>
              <Spacing lg="5" md="5" />
              <h2 className="cs_section_title cs_fs_72 m-0">
                Médicos Especialistas
              </h2>
            </div>
            <Spacing md="72" lg="50" />
            <div className="row cs_gap_y_40">
              {doctorData.map((doctor, index) => (
                <div className="col-lg-3 col-sm-6" key={index}>
                  <TeamStyle3 {...doctor} />
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* No Doctors Message */}
      {doctorData.length === 0 && (
        <Section topMd={170} topLg={145} topXl={90}>
          <div className="container">
            <div className="text-center py-5">
              <Icon icon="mdi:doctor" style={{ fontSize: '64px', color: '#ccc' }} />
              <h3 className="mt-3">Próximamente</h3>
              <p className="text-muted">
                Estamos incorporando médicos especialistas a este departamento.
                <br />Contáctanos para más información.
              </p>
            </div>
          </div>
        </Section>
      )}

      {/* Appointment Section */}
      <Section
        topMd={190}
        topLg={145}
        topXl={105}
        bottomMd={190}
        bottomLg={145}
        bottomXl={110}
        id="appointment"
      >
        <AppointmentSection
          sectionTitle="Cita"
          sectionTitleUp="AGENDAR UNA"
          imgUrl={appointmentImg}
        />
      </Section>

      {/* Banner Section */}
      <Section className="cs_footer_margin_0">
        <BannerSectionStyle7
          imgUrl={bannerImg}
          bgUrl="/images/departments/banner_bg_3.svg"
          title="¡No Dejes Tu Salud <br />en Segundo Plano!"
          subTitle="Agenda una cita con nuestros profesionales médicos <br />experimentados hoy mismo!"
        />
      </Section>
    </>
  );
}
