'use client'
import React from 'react'
import Link from 'next/link'
import Slider from 'react-slick'
import { Icon } from '@iconify/react'

// Mapeo de iconos por nombre de departamento (usando iconos de Material Design y Font Awesome)
const departmentIcons = {
  'ginecología': 'mdi:human-pregnant',
  'ginecologia': 'mdi:human-pregnant',
  'medicina general': 'mdi:stethoscope',
  'pediatría': 'mdi:baby-face-outline',
  'pediatria': 'mdi:baby-face-outline',
  'urgencias': 'mdi:ambulance',
  'emergencias': 'mdi:ambulance',
  'cardiología': 'mdi:heart-pulse',
  'cardiologia': 'mdi:heart-pulse',
  'endocrinología': 'mdi:diabetes',
  'endocrinologia': 'mdi:diabetes',
  'dermatología': 'mdi:hand-back-right-outline',
  'dermatologia': 'mdi:hand-back-right-outline',
  'neurología': 'mdi:brain',
  'neurologia': 'mdi:brain',
  'oftalmología': 'mdi:eye-outline',
  'oftalmologia': 'mdi:eye-outline',
  'traumatología': 'mdi:bone',
  'traumatologia': 'mdi:bone',
  'ortopedia': 'mdi:bone',
  'cirugía': 'mdi:hospital-box-outline',
  'cirugia': 'mdi:hospital-box-outline',
  'cirugía plástica': 'mdi:face-woman-shimmer-outline',
  'cirugia plastica': 'mdi:face-woman-shimmer-outline',
  'laboratorio': 'mdi:microscope',
  'imagenología': 'mdi:radiology-box-outline',
  'imagenologia': 'mdi:radiology-box-outline',
  'farmacia': 'mdi:pharmacy',
  'nutrición': 'mdi:food-apple-outline',
  'nutricion': 'mdi:food-apple-outline',
  'psicología': 'mdi:head-heart-outline',
  'psicologia': 'mdi:head-heart-outline',
  'psiquiatría': 'mdi:head-cog-outline',
  'psiquiatria': 'mdi:head-cog-outline',
  'odontología': 'mdi:tooth-outline',
  'odontologia': 'mdi:tooth-outline',
  'default': 'mdi:medical-bag'
}

// Colores de gradiente para las tarjetas
const cardGradients = [
  'linear-gradient(135deg, #144F79 0%, #1a6a9e 100%)',
  'linear-gradient(135deg, #53B896 0%, #3d9a7a 100%)',
  'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
  'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
  'linear-gradient(135deg, #144F79 0%, #53B896 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
]

function getIconForDepartment(nombre) {
  const normalizedName = nombre?.toLowerCase().trim() || ''
  return departmentIcons[normalizedName] || departmentIcons['default']
}

export default function DepartmentCarousel({ data }) {
  const SlickArrowLeft = ({ currentSlide, slideCount, ...props }) => (
    <button
      {...props}
      className={`cs_dept_arrow cs_dept_arrow_prev ${currentSlide === 0 ? 'slick-disabled' : ''}`}
      aria-label="Anterior"
      type="button"
    >
      <Icon icon="fa6-solid:chevron-left" />
    </button>
  )

  const SlickArrowRight = ({ currentSlide, slideCount, ...props }) => (
    <button
      {...props}
      className={`cs_dept_arrow cs_dept_arrow_next ${currentSlide === slideCount - 1 ? 'slick-disabled' : ''}`}
      aria-label="Siguiente"
      type="button"
    >
      <Icon icon="fa6-solid:chevron-right" />
    </button>
  )

  const settings = {
    dots: true,
    prevArrow: <SlickArrowLeft />,
    nextArrow: <SlickArrowRight />,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 5000,
    speed: 600,
    slidesToShow: 4,
    slidesToScroll: 1,
    swipeToSlide: true,
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 3
        }
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 2,
          arrows: false
        }
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 1,
          arrows: false,
          centerMode: true,
          centerPadding: '30px'
        }
      }
    ]
  }

  if (!data || data.length === 0) {
    return (
      <div className="cs_dept_empty">
        <Icon icon="mdi:hospital-building" className="cs_dept_empty_icon" />
        <p>No hay departamentos disponibles</p>
      </div>
    )
  }

  return (
    <div className="cs_dept_carousel_wrapper">
      <Slider {...settings} className="cs_dept_carousel">
        {data.map((item, index) => (
          <div key={item.id || index} className="cs_dept_slide">
            <Link href={`/appointments?departmentId=${item.id}`} className="cs_dept_card">
              <div
                className="cs_dept_card_bg"
                style={{ background: cardGradients[index % cardGradients.length] }}
              />
              <div className="cs_dept_card_content">
                <div className="cs_dept_icon_wrapper">
                  <Icon
                    icon={getIconForDepartment(item.nombre || item.name)}
                    className="cs_dept_icon"
                  />
                </div>
                <h3 className="cs_dept_name">
                  {item.nombre || item.name}
                </h3>
                {item.descripcion && (
                  <p className="cs_dept_description">
                    {item.descripcion}
                  </p>
                )}
                <span className="cs_dept_link">
                  Agendar Cita
                  <Icon icon="fa6-solid:calendar-plus" className="cs_dept_link_icon" />
                </span>
              </div>
              <div className="cs_dept_card_decoration">
                <Icon icon="mdi:plus-circle-outline" />
              </div>
            </Link>
          </div>
        ))}
      </Slider>
    </div>
  )
}
