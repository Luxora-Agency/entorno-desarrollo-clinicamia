"use client"
import React from 'react';
import Section from '@/app/ui/Section';
import BannerSectionStyle10 from '@/app/ui/Section/BannerSection/BannerSectionStyle10';
import BannerSectionStyle3 from '@/app/ui/Section/BannerSection/BannerSectionStyle3';
import FaqSectionStyle4 from '@/app/ui/Section/FaqSection/FaqSectionStyle4';
import PricingSection from '@/app/ui/Section/PricingSection';

import bannerImg from '../../../../public/images/pricing_plan/banner_img.jpg'
import bannerImgBtm from '../../../../public/images/pricing_plan/banner_img_2.jpg'


const pricingData = [
  {
    title: 'Mia Pass Básico',
    subTitle:
      'Atención médica esencial para ti y tu familia. Consultas con descuento y beneficios exclusivos en nuestros servicios.',
    price: '$150.000',
    period: '/mes',
    featureList: [
      '2 Consultas Médicas al Mes',
      '15% Descuento en Laboratorios',
      '10% Descuento en Procedimientos',
    ],
    btnText: 'Comenzar',
    btnUrl: '/contact',
    popular: false,
  },
  {
    title: 'Mia Pass Premium',
    subTitle:
      'Atención médica integral con acceso prioritario. Consultas ilimitadas y descuentos preferenciales en todos nuestros servicios especializados.',
    price: '$350.000',
    period: '/mes',
    featureList: [
      'Consultas Médicas Ilimitadas',
      '25% Descuento en Laboratorios',
      '20% Descuento en Cirugías',
      'Agendamiento Prioritario',
      'Chequeo Anual Completo',
    ],
    btnText: 'Comenzar',
    btnUrl: '/contact',
    popular: true,
  },
  {
    title: 'Mia Pass Endocrinología',
    subTitle:
      'Especializado en el cuidado metabólico. Seguimiento continuo de diabetes, tiroides y trastornos hormonales con nuestros endocrinólogos.',
    price: '$280.000',
    period: '/mes',
    featureList: [
      'Consultas Endocrinología Ilimitadas',
      'Control Metabólico Mensual',
      'Descuento en Exámenes Hormonales',
      'Asesoría Nutricional',
    ],
    btnText: 'Comenzar',
    btnUrl: '/contact',
    popular: false,
  },
  {
    title: 'Mia Pass Estética',
    subTitle:
      'Cuida tu imagen y autoestima. Accede a tratamientos de medicina estética y cirugía plástica con descuentos exclusivos.',
    price: '$200.000',
    period: '/mes',
    featureList: [
      'Consulta Estética Mensual',
      '20% Descuento en Tratamientos Faciales',
      '15% Descuento en Procedimientos Corporales',
      'Asesoría Personalizada',
    ],
    btnText: 'Comenzar',
    btnUrl: '/contact',
    popular: false,
  },
  {
    title: 'Mia Pass Familiar',
    subTitle:
      'Protección completa para toda tu familia. Cobertura para hasta 4 miembros con acceso a todas nuestras especialidades médicas.',
    price: '$500.000',
    period: '/mes',
    featureList: [
      'Cobertura para 4 Personas',
      'Consultas Ilimitadas para Todos',
      '20% Descuento en Servicios',
      'Agendamiento Prioritario Familiar',
      'Chequeos Anuales Completos',
    ],
    btnText: 'Comenzar',
    btnUrl: '/contact',
    popular: false,
  },
  {
    title: 'Mia Pass Cirugía',
    subTitle:
      'Preparación y seguimiento quirúrgico integral. Ideal para pacientes que requieren cirugía de tiroides o procedimientos especializados.',
    price: '$400.000',
    period: '/mes',
    featureList: [
      'Evaluación Prequirúrgica Completa',
      'Consultas de Seguimiento Ilimitadas',
      '30% Descuento en Procedimiento Quirúrgico',
      'Atención Postoperatoria Especializada',
    ],
    btnText: 'Comenzar',
    btnUrl: '/contact',
    popular: false,
  },
];
const faqData = [
  {
    title: '¿Qué es Mia Pass?',
    content:
      'Mia Pass es nuestro programa de membresía que te brinda acceso preferencial a servicios médicos especializados en ClinicaMia. Con Mia Pass obtienes consultas con descuento, agendamiento prioritario, beneficios exclusivos y atención personalizada en endocrinología, cirugía de tiroides, cirugía plástica y medicina estética.',
  },
  {
    title: '¿Cómo funciona la membresía Mia Pass?',
    content:
      'Al adquirir tu Mia Pass, pagas una cuota mensual que te da acceso a consultas médicas (según el plan elegido) y descuentos en laboratorios, procedimientos y cirugías. Además, disfrutas de agendamiento prioritario y chequeos anuales. Cada plan está diseñado para diferentes necesidades: básico, premium, endocrinología, estética, familiar o cirugía.',
  },
  {
    title: '¿Puedo cambiar mi plan de Mia Pass?',
    content:
      'Sí, puedes cambiar tu plan de Mia Pass en cualquier momento. Contáctanos al 324 333 8555 o visita nuestra clínica en Ibagué para solicitar un cambio de plan. Los ajustes se aplicarán en tu próximo ciclo de facturación mensual.',
  },
  {
    title: '¿Los descuentos aplican para mi familia?',
    content:
      'Los planes Mia Pass Básico, Premium, Endocrinología, Estética y Cirugía son individuales. Si deseas cobertura para tu familia, te recomendamos el plan Mia Pass Familiar que cubre hasta 4 personas con consultas ilimitadas y descuentos en todos nuestros servicios.',
  },
  {
    title: '¿Cómo puedo adquirir mi Mia Pass?',
    content:
      'Puedes adquirir tu Mia Pass visitando nuestra clínica en Cra. 5 #28-85, Ibagué, Tolima, llamando al 324 333 8555, o a través de nuestro sitio web en la sección de contacto. Nuestro equipo te guiará en la selección del plan ideal para ti.',
  },
];
export default function PricingPlan() {
  return (
    <>
      <BannerSectionStyle3
        bgUrl="/images/pricing_plan/banner_bg.svg"
        imgUrl={bannerImg}
        title="Encuentra el Plan Mia Pass <br>Perfecto para Ti"
        subTitle="Descubre Nuestras Opciones de Membresía y Comienza tu Camino hacia una Mejor Salud"
        btnText="Comenzar"
        btnUrl="/contact"
      />
      <Section
        topMd={185}
        topLg={140}
        topXl={100}
        bottomMd={200}
        bottomLg={150}
        bottomXl={110}
      >
        <PricingSection
          sectionTitle="Elige tu Plan <br />Mia Pass"
          data={pricingData}
        />
      </Section>
      <Section
        topMd={185}
        topLg={145}
        topXl={105}
        bottomMd={200}
        bottomLg={150}
        bottomXl={110}
        className="cs_gray_bg_1"
      >
        <FaqSectionStyle4
          sectionTitle="Preguntas <br />Frecuentes"
          data={faqData}
        />
      </Section>
      <Section
        topMd={200}
        topLg={150}
        topXl={110}
        className="cs_footer_margin_0"
      >
        <BannerSectionStyle10
          imgUrl={bannerImgBtm}
          title="¡Elige tu Plan Mia Pass e Invierte en tu Salud Hoy!"
        />
      </Section>
    </>
  );
}
