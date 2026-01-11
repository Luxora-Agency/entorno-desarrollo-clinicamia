"use client"
import React from 'react';
import { $api } from '@/utils/openapi-client';
import { Icon } from '@iconify/react/dist/iconify.js';
import parser from 'html-react-parser';
import Link from 'next/link';
import Image from 'next/image';

export default function DepartmentSectionStyle3() {
  const { data, isLoading } = $api.useQuery('get', '/departments/public')

  return (
    <div className="container cs_mt_minus_110">
      <div className="row justify-content-end">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div className="col-xl-4 col-md-6 d-flex" key={index}>
              <div className="cs_iconbox cs_style_7 w-100">
                <div className="cs_iconbox_icon">
                  <Icon icon="fa6-solid:spinner" className="fa-spin" height={70} width={66} />
                </div>
                <h2 className="cs_iconbox_title cs_fs_32">Cargando...</h2>
                <p className="cs_iconbox_subtitle m-0">Por favor, espere mientras se cargan los departamentos.</p>
              </div>
            </div>
          ))
        ) : (
          data?.data?.map((item, index) => (
            <div className="col-xl-4 col-md-6 d-flex" key={index}>
              <div className="cs_iconbox cs_style_7 w-100 d-flex flex-column">
                <div className="cs_iconbox_icon">
                  <Icon
                    icon={item.icon || "fa6-solid:hospital"}
                    alt="Icon"
                    height={70}
                    width={66}
                  />
                </div>
                <h2 className="cs_iconbox_title cs_fs_32">{parser(item.nombre || item.name || '')}</h2>
                <p className="cs_iconbox_subtitle m-0 flex-grow-1">{parser(item.descripcion || item.description || '')}</p>
                <Link href={`/departments/${item.id}`} className="cs_iconbox_btn cs_center">
                  <Image src="/images/icons/arrow_white.svg" alt="Icon" height={24} width={35} />
                  <Image src="/images/icons/arrow_white.svg" alt="Icon" height={24} width={35} />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
