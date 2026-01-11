"use client"
import Section from "@/app/ui/Section";
import AwardSectionStyle2 from "@/app/ui/Section/AwardSection/AwardSectionStyle2";
import DepartmentSectionStyle2 from "@/app/ui/Section/DepartmentSection/DepartmentSectionStyle2";
import BannerSectionStyle3 from "@/app/ui/Section/BannerSection/BannerSectionStyle3";
import BannerSectionStyle4 from "@/app/ui/Section/BannerSection/BannerSectionStyle4";
import FeaturesSectionStyle2 from "@/app/ui/Section/FeaturesSection/FeaturesSectionStyle2";
import FunFactSection from "@/app/ui/Section/FunFactSection";
import GallerySection from "@/app/ui/Section/GallerySection";
import TeamSection from "@/app/ui/Section/TeamSection";

import bannerImg from '../../../../public/images/about/banner_img_final.png'
import whyChooseUsImg from '../../../../public/images/about/why_choose_us_new.png'

const featureListData = [
  {
    title: 'Misión',
    subTitle:
      'Proporcionar servicios médicos especializados de la más <br />alta calidad en endocrinología, cirugía de tiroides, cirugía <br />plástica y medicina estética. Nos comprometemos a cuidar <br />la salud integral de nuestros pacientes con tecnología de <br />punta, un equipo médico altamente calificado y un enfoque <br />sostenible que respeta el medio ambiente, siendo un referente <br />de excelencia médica en Ibagué y Colombia.',
    iconUrl: '/images/icons/professional.svg',
  },
  {
    title: 'Visión',
    subTitle:
      'Consolidarnos como la clínica líder en endocrinología y <br />especialidades médicas en Colombia, reconocidos a nivel <br />nacional por nuestra excelencia clínica, innovación constante, <br />investigación médica y compromiso con la sostenibilidad. <br />Aspiramos a ser la primera opción para pacientes que buscan <br />atención médica especializada de calidad superior en un <br />ambiente seguro, cálido y ambientalmente responsable.',
    iconUrl: '/images/icons/comprehensive.svg',
  },
];

const funFactData = [
  { number: '15+', title: 'Años liderando en endocrinología' },
  { number: '98%', title: 'Pacientes satisfechos' },
  { number: '10,000+', title: 'Pacientes atendidos con éxito' },
  { number: '100%', title: 'Equipos médicos de última generación' },
  { number: '100%', title: 'Energía solar sostenible' },
];


const galleryData = [
  { imgUrl: '/images/about/portfolio_2_lg_new.jpg' },
  { imgUrl: '/images/about/portfolio_3_lg_new.jpg' },
  { imgUrl: '/images/about/portfolio_1_lg_final.jpg' },
  { imgUrl: '/images/about/portfolio_4_lg_new.jpg' },
  { imgUrl: '/images/about/portfolio_5_lg_new.jpg' },
];

const awardData = [
  {
    iconUrl: '/images/icons/award.svg',
    title: 'Certificación en Clínica Verde Sostenible con Energía Solar',
  },
  {
    iconUrl: '/images/icons/award.svg',
    title: 'Centro de Referencia Nacional en Cirugía de Tiroides'
  },
  {
    iconUrl: '/images/icons/award.svg',
    title: 'Acreditación en Servicios de Endocrinología y Metabolismo',
  },
  {
    iconUrl: '/images/icons/award.svg',
    title: 'Certificación ISO 9001:2015 en Gestión de Calidad Médica',
  },
];

// export const metadata = {
//   title: "About"
// }

export default function About() {
  return (
    <>
      <BannerSectionStyle3
        bgUrl="/images/about/banner_bg.svg"
        imgUrl={bannerImg}
        title="Bienvenido a <br />ClinicaMia Centro Médico Especializado"
        subTitle="Tu Aliado en Salud y Bienestar"
      />
      <Section topMd={200} topLg={150} topXl={110}>
        <DepartmentSectionStyle2
          sectionTitle="Nuestros Departamentos"
          sectionTitleUp="SERVICIOS"
        />
      </Section>
      <Section topMd={175} topLg={125} topXl={85} bottomMd={100} bottomLg={110}>
        <FeaturesSectionStyle2
          sectionTitle="¿Quiénes Somos?"
          imgUrl={whyChooseUsImg}
          data={featureListData}
        />
      </Section>
      <Section>
        <FunFactSection
          bgUrl="/images/about/fun_fact_bg.jpeg"
          data={funFactData}
        />
      </Section>
      <Section topMd={190} topLg={145} topXl={105}>
        <TeamSection
          sectionTitle="Médicos Especialistas"
          sectionTitleUp="CONOCE A NUESTROS"
        />
      </Section>
      <Section topMd={170} topLg={120} topXl={80}>
        <GallerySection
          sectionTitle="Instalaciones de Primera <br />y Tecnología Avanzada"
          sectionTitleUp="CONOCE"
          data={galleryData}
        />
      </Section>
      <Section
        topMd={190}
        topLg={145}
        topXl={105}
        bottomMd={200}
        bottomLg={150}
        bottomXl={110}
      >
        <AwardSectionStyle2
          sectionTitle="Certificaciones y <br />Reconocimientos"
          sectionTitleUp="NUESTRAS"
          sectionSubTitle="ClinicaMia ha sido reconocida a nivel nacional por su <br />excelencia médica, innovación tecnológica y compromiso ambiental."
          data={awardData}
        />
      </Section>
      <Section className="cs_footer_margin_0">
        <BannerSectionStyle4
          bgUrl="/images/about/banner_bg_2_new.jpg"
          title="¡Confía tu Salud a <br />los Mejores Especialistas!"
          subTitle="Agenda tu cita hoy en ClinicaMia Ibagué <br />Líderes en Endocrinología, Tiroides y Cirugía Plástica"
          center
        />
      </Section>
    </>
  );
}
