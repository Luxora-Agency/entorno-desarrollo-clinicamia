'use client'
import React from 'react'
import HeroSlider from '../ui/Hero/HeroSlider'
import Section from '../ui/Section'
import FeaturesSection from '../ui/Section/FeaturesSection'
import AboutSection from '../ui/Section/AboutSection'
import DepartmentSection from '../ui/Section/DepartmentSection'
import AwardSection from '../ui/Section/AwardSection'
import TestimonialSection from '../ui/Section/TestimonialSection'
import Banner from '../ui/Section/BannerSection'
import BlogSection from '../ui/Section/BlogSection'
import AppointmentSection from '../ui/Section/AppointmentSection'
import FaqSection from '../ui/Section/FaqSection'
// Large Images for blur placeholder
import heroImage from '../../../public/images/home_1/hero_doctor_final.png'
import aboutImage from '../../../public/images/home_1/about_new.jpg'
import bannerImg from '../../../public/images/home_1/cta_img_new.jpg'
import appointmentImg from '../../../public/images/home_1/appointment_new.jpg'

const featureListData = [
  {
    iconSrc: '/images/home_1/compassion.svg',
    title: 'Compasión',
    subTitle:
      'En ClinicaMia entendemos que buscar atención médica puede ser una experiencia estresante. Por eso, nos esforzamos por crear un ambiente acogedor y de apoyo que ponga a nuestros pacientes en confianza y tranquilidad.'
  },
  {
    iconSrc: '/images/home_1/excellence.svg',
    title: 'Excelencia',
    subTitle:
      'Estamos comprometidos con brindar atención médica y servicios de excelencia. Creemos en mejorar continuamente nuestras habilidades, conocimientos y recursos para garantizar la más alta calidad en cada consulta.'
  },
  {
    iconSrc: '/images/home_1/integrity.svg',
    title: 'Integridad',
    subTitle: 'Practicamos la medicina con integridad y honestidad. Somos transparentes en nuestra comunicación y procesos de decisión, siempre priorizando los intereses y bienestar de nuestros pacientes.'
  },
  {
    iconSrc: '/images/home_1/respect.svg',
    title: 'Respeto',
    subTitle:
      'Tratamos a todas las personas con respeto y dignidad, sin importar su origen, creencias o circunstancias. En ClinicaMia, cada persona merece ser tratada con compasión y amabilidad.'
  },
  {
    iconSrc: '/images/home_1/teamwork.svg',
    title: 'Trabajo en Equipo',
    subTitle:
      'Creemos en trabajar colaborativamente con nuestro equipo médico y profesionales de la salud para proporcionar atención integral y efectiva a nuestros pacientes en Ibagué.'
  }
]
const faqData = [
  {
    title: '¿Qué servicios ofrece ClinicaMia?',
    content:
      'ClinicaMia es líder en endocrinología y especialidades médicas en Ibagué. Ofrecemos servicios especializados en enfermedades metabólicas, tiroides, cirugía plástica y reconstructiva, medicina estética, y Apollo Diagnóstico. Somos referentes nacionales en el manejo del cáncer de tiroides y contamos con instalaciones sostenibles como clínica verde.'
  },
  {
    title: '¿Cómo puedo agendar una cita en ClinicaMia?',
    content:
      'Puede agendar su cita de manera fácil y rápida llamando al 324 333 8555 o completando nuestro formulario de contacto en línea. Nuestro equipo de atención al paciente le ayudará a programar su consulta con el especialista que necesite en el horario más conveniente para usted.'
  },
  {
    title: '¿Qué EPS y seguros médicos aceptan?',
    content:
      'En ClinicaMia trabajamos con las principales EPS y entidades de salud de Colombia. También atendemos pacientes particulares y de medicina prepagada. Le recomendamos contactarnos directamente para confirmar la cobertura de su plan de salud específico y conocer nuestras opciones de pago.'
  },
  {
    title: '¿Qué debo llevar a mi cita médica?',
    content:
      'Por favor traiga su documento de identidad, carné de la EPS o seguro médico, resultados de exámenes previos si los tiene, y cualquier medicamento que esté tomando actualmente. Si es primera vez, llegue 15 minutos antes para completar el registro de paciente nuevo.'
  },
  {
    title: '¿Qué hace especial a ClinicaMia en el tratamiento de tiroides?',
    content:
      'Somos líderes nacionales en el manejo del cáncer de tiroides. Contamos con endocrinólogos altamente especializados, tecnología de diagnóstico avanzada en Apollo Diagnóstico, y cirujanos certificados en cirugía de tiroides. Ofrecemos atención integral desde el diagnóstico hasta el seguimiento postoperatorio.'
  }
]
const blogData = [
  {
    title: 'Cuidados Esenciales de la Tiroides: Prevención y Tratamiento',
    thumbUrl: '/images/home_1/post_1.jpeg',
    date: '15 de Noviembre, 2024',
    btnText: 'Leer Más',
    href: '#',
    socialShare: false
  },
  {
    title: 'Enfermedades Metabólicas: Diagnóstico Temprano y Manejo Integral',
    thumbUrl: '/images/home_1/post_2.jpeg',
    date: '10 de Noviembre, 2024',
    btnText: 'Leer Más',
    href: '#',
    socialShare: false
  },
  {
    title: 'Medicina Estética: Innovaciones y Procedimientos Seguros en ClinicaMia',
    thumbUrl: '/images/home_1/post_3.jpeg',
    date: '5 de Noviembre, 2024',
    btnText: 'Leer Más',
    href: '#',
    socialShare: false
  }
]
const awardData = [
  {
    title: 'Expertos en Cardiometabolismo',
    subTitle:
      'Especialistas en el diagnóstico y tratamiento de enfermedades metabólicas y cardiovasculares. Nuestro equipo de endocrinólogos ofrece atención integral para diabetes, hipertensión y trastornos metabólicos.',
    iconUrl: '/images/icons/award.svg'
  },
  {
    title: 'Referentes en Cáncer de Tiroides',
    subTitle:
      'Líderes nacionales en el manejo y tratamiento del cáncer de tiroides. Contamos con tecnología de punta y cirujanos certificados en endocrinología para el cuidado integral de la tiroides.',
    iconUrl: '/images/icons/award.svg'
  },
  {
    title: 'Medicina Estética Avanzada',
    subTitle:
      'Servicios especializados de medicina estética y cirugía plástica reconstructiva. Procedimientos innovadores realizados por profesionales certificados con tecnología de última generación.',
    iconUrl: '/images/icons/award.svg'
  },
  {
    title: 'Clínica Verde Sostenible',
    subTitle:
      'Comprometidos con el medio ambiente. Instalaciones equipadas con paneles solares e infraestructura sostenible, posicionándonos como una clínica eco-amigable en Ibagué.',
    iconUrl: '/images/icons/award.svg'
  }
]
const heroSlides = [
  {
    title: 'Enfoque en Enfermedades Metabólicas',
    subTitle: 'Brindamos atención especializada en el diagnóstico y tratamiento de enfermedades metabólicas, ayudándote a mantener tu salud en equilibrio.',
    bgUrl: '/images/home_1/hero_bg.jpeg',
    imgUrl: heroImage,
    videoBtnText: 'Ver cómo trabajamos',
    videoUrl: 'https://www.youtube.com/embed/VcaAVWtP48A'
  },
  {
    title: 'Especialización en Tiroides',
    subTitle: 'Contamos con expertos en endocrinología dedicados al cuidado integral de la tiroides, ofreciendo diagnóstico preciso y tratamientos personalizados.',
    bgUrl: '/images/home_1/hero_bg.jpeg',
    imgUrl: heroImage,
    videoBtnText: 'Conoce nuestros servicios',
    videoUrl: 'https://www.youtube.com/embed/VcaAVWtP48A'
  },
  {
    title: 'Cirugía Plástica',
    subTitle: 'Técnicas avanzadas en cirugía plástica y reconstructiva, realizadas por cirujanos certificados para realzar tu bienestar y confianza.',
    bgUrl: '/images/home_1/hero_bg.jpeg',
    imgUrl: heroImage,
    videoBtnText: 'Descubre nuestras instalaciones',
    videoUrl: 'https://www.youtube.com/embed/VcaAVWtP48A'
  }
]

export default function Home() {
  return (
    <>
      <HeroSlider
        slides={heroSlides}
        infoList={[
          {
            title: 'Teléfono',
            subTitle: '324 333 8555',
            iconUrl: '/images/contact/icon_1.svg'
          },
          {
            title: 'Email',
            subTitle: 'info@clinicamia.com',
            iconUrl: '/images/icons/ambulance.svg'
          },
          {
            title: 'Ubicación',
            subTitle: 'Ibagué, Tolima',
            iconUrl: '/images/icons/pin.svg'
          }
        ]}
        btnText="Agenda Consulta"
        btnUrl="#appointment"
      />

      {/* Start Feature Section */}
      <Section
        topMd={185}
        topLg={140}
        topXl={100}
        bottomMd={185}
        bottomLg={140}
        bottomXl={100}
      >
        <FeaturesSection sectionTitle="Nuestros Valores" data={featureListData} />
      </Section>
      {/* End Feature Section */}

      {/* Start About Section */}
      <Section>
        <AboutSection
          imgUrl={aboutImage}
          title="Acerca de Nosotros"
          subTitle="CLINICA MIA"
          featureList={[
            {
              featureListTitle:
                'ClinicaMia es líder en endocrinología y especialidades médicas en Ibagué',
              featureListSubTitle:
                'Nos especializamos en enfermedades metabólicas, tiroides y cirugía plástica. Somos referentes nacionales en el manejo del cáncer de tiroides, brindando atención médica personalizada y de excelencia con tecnología de punta.'
            }
          ]}
        />
      </Section>
      {/* End About Section */}

      {/* Start Departments Section */}
      <Section topMd={185} topLg={150} topXl={110}>
        <DepartmentSection
          sectionTitle="Nuestros Departamentos"
          sectionSubtitle="ESPECIALIDADES MÉDICAS"
          bgUrl="/images/home_1/department_bg.svg"
        />
      </Section>
      {/* End Departments Section */}

      {/* Start Award Section */}
      <Section topMd={185} topLg={140} topXl={100}>
        <AwardSection sectionTitle="Nuestros Servicios Especializados" data={awardData} />
      </Section>
      {/* End Award Section */}

      {/* Start Testimonial */}
      <Section
        topMd={185}
        topLg={140}
        topXl={100}
        bottomMd={200}
        bottomLg={150}
        bottomXl={110}
      >
        <TestimonialSection
          sectionTitle="Testimonios"
          sectionTitleDown="De nuestros pacientes"
        />
      </Section>
      {/* End Testimonial */}

      {/* Start Banner Section */}
      <Section>
        <Banner
          bgUrl="/images/home_1/cta_bg.svg"
          imgUrl={bannerImg}
          title="¡Tu Salud es Nuestra Prioridad!"
          subTitle="Agenda tu consulta con nuestros especialistas en endocrinología, tiroides y medicina estética en Ibagué."
        />
      </Section>
      {/* End Banner Section */}

      {/* Start Blog Section */}
      <Section topMd={190} topLg={145} topXl={105}>
        <BlogSection
          sectionTitle="Últimas Publicaciones"
          sectionTitleUp="NUESTRO BLOG"
        />
      </Section>
      {/* End Blog Section */}

      {/* Start Appointment Section */}
      <Section topMd={190} topLg={145} topXl={105} id="appointment">
        <AppointmentSection
          sectionTitle="Consulta"
          sectionTitleUp="AGENDA TU"
          imgUrl={appointmentImg}
        />
      </Section>
      {/* End Appointment Section */}

      {/* Start FAQ Section */}
      <Section topMd={190} topLg={145} topXl={105}>
        <FaqSection
          data={faqData}
          sectionTitle="Preguntas Frecuentes"
          sectionTitleUp="LO QUE"
        />
      </Section>
      {/* End FAQ Section */}
    </>
  )
}
