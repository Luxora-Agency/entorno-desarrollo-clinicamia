'use client'
import React from 'react';
import SectionHeading from '../../SectionHeading';
import Spacing from '../../Spacing';
import { $api } from '@/utils/openapi-client';
import { Icon } from '@iconify/react';
import Link from 'next/link';

// Mapeo de iconos por nombre de departamento
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
  'cirugía': 'mdi:hospital-box-outline',
  'cirugia': 'mdi:hospital-box-outline',
  'cirugía plástica': 'mdi:face-woman-shimmer-outline',
  'cirugia plastica': 'mdi:face-woman-shimmer-outline',
  'laboratorio': 'mdi:microscope',
  'imagenología': 'mdi:radiology-box-outline',
  'imagenologia': 'mdi:radiology-box-outline',
  'default': 'mdi:medical-bag'
};

function getIconForDepartment(nombre) {
  const normalizedName = nombre?.toLowerCase().trim() || '';
  return departmentIcons[normalizedName] || departmentIcons['default'];
}

export default function DepartmentSectionStyle2({
  sectionTitle,
  sectionTitleUp,
}) {
  const { data, isLoading, error } = $api.useQuery("get", "/departments/public");

  const departments = data?.data || [];

  return (
    <div className="container">
      <div className="row">
        <div className="col-md-6 col-xl-4">
          <SectionHeading title={sectionTitle} titleUp={sectionTitleUp} />
          <Spacing md="72" lg="50" />
        </div>
        {isLoading ? (
          <div className="col-md-6 col-xl-4 d-flex">
            <div className="cs_iconbox cs_style_4 w-100">
              <div className="cs_iconbox_icon cs_accent_bg rounded-circle cs_center">
                <Icon icon="svg-spinners:ring-resize" className="cs_spin_icon" />
              </div>
              <h2 className="cs_iconbox_title cs_fs_32">Cargando...</h2>
              <p className="cs_iconbox_subtitle m-0">Por favor, espere mientras se cargan los datos.</p>
            </div>
          </div>
        ) : error ? (
          <div className="col-md-6 col-xl-4 d-flex">
            <div className="cs_iconbox cs_style_4 w-100">
              <div className="cs_iconbox_icon cs_accent_bg rounded-circle cs_center">
                <Icon icon="mdi:alert-circle-outline" color="white" />
              </div>
              <h2 className="cs_iconbox_title cs_fs_32">Error</h2>
              <p className="cs_iconbox_subtitle m-0">No se pudieron cargar los departamentos.</p>
            </div>
          </div>
        ) : (
          departments.map((item, index) => (
            <div className="col-md-6 col-xl-4 d-flex" key={item.id || index}>
              <div className="cs_iconbox cs_style_4 w-100 d-flex flex-column">
                <div className="cs_iconbox_icon cs_accent_bg rounded-circle cs_center">
                  <Icon color='white' icon={getIconForDepartment(item.nombre)} />
                </div>
                <Link href={`/departments/${item.id}`}>
                  <h2 className="cs_iconbox_title cs_fs_32">{item.nombre}</h2>
                </Link>
                <p className="cs_iconbox_subtitle m-0 flex-grow-1">{item.descripcion}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
