import React from 'react';
import Button from '../Button';
import { Icon } from '@iconify/react';

export default function Pricing({
  name,
  description,
  cost,
  duration,
  benefits,
  discounts,
  color,
  icon,
  btnText = "Comenzar",
  btnUrl = "/contact",
  isFeatured,
}) {
  // Format price with thousand separators
  const formattedCost = cost?.toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  });

  //TODO: Colocar icono real.
  //TODO : Cambiar color de tarjeta.
  return (
    <div className="cs_pricing_card cs_style_1 cs_radius_20 overflow-hidden">
      <div
        className="cs_pricing_card_head cs_white_color">
        <h3 className="cs_white_color cs_fs_24 cs_semibold">
          <span
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="cs_mr_10">
            <Icon icon={"mdi:star-outline"} />
          </span>
          <span>{name}</span>
          {isFeatured && (
            <span className="cs_heading_color cs_normal">Popular</span>
          )}
        </h3>
        {description && <p>{description}</p>}
        <h2 className="cs_white_color mb-0 cs_fs_72 cs_semibold">
          {formattedCost}
          <span className="cs_fs_24">/mes</span>
        </h2>
        {duration && (
          <p className="cs_fs_18">Duración: {duration} mes/es</p>
        )}
      </div>
      <div className="cs_pricing_card_body">
        {benefits && benefits.length > 0 && (
          <ul className="cs_pricing_card_feature cs_fs_20 cs_heading_color">
            {benefits.map((benefit, index) => (
              <li key={index}>
                <i>
                  <Icon icon="fa6-solid:circle-check" />
                </i>
                {benefit}
              </li>
            ))}
          </ul>
        )}

        {discounts && (
          <div className="cs_pricing_discounts cs_mt_20">
            <h4 className="cs_fs_18 cs_semibold cs_mb_10">Descuentos:</h4>
            <ul className="cs_pricing_card_feature cs_fs_18 cs_heading_color">
              {discounts.consultation && (
                <li>
                  <i><Icon icon="fa6-solid:stethoscope" /></i>
                  Consultas: {discounts.consultation.type === 'percentage'
                    ? `${discounts.consultation.value}%`
                    : `$${discounts.consultation.value.toLocaleString('es-CL')}`}
                </li>
              )}
              {discounts.exam && (
                <li>
                  <i><Icon icon="fa6-solid:flask" /></i>
                  Exámenes: {discounts.exam.type === 'percentage'
                    ? `${discounts.exam.value}%`
                    : `$${discounts.exam.value.toLocaleString('es-CL')}`}
                </li>
              )}
              {discounts.procedure && (
                <li>
                  <i><Icon icon="fa6-solid:syringe" /></i>
                  Procedimientos: {discounts.procedure.type === 'percentage'
                    ? `${discounts.procedure.value}%`
                    : `$${discounts.procedure.value.toLocaleString('es-CL')}`}
                </li>
              )}
              {discounts.pharmacy && (
                <li>
                  <i><Icon icon="fa6-solid:pills" /></i>
                  Farmacia: {discounts.pharmacy.type === 'percentage'
                    ? `${discounts.pharmacy.value}%`
                    : `$${discounts.pharmacy.value.toLocaleString('es-CL')}`}
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="cs_pricing_card_btn">
          <Button btnUrl={btnUrl} btnText={btnText} variant="w-100" />
        </div>
      </div>
    </div>
  );
}
