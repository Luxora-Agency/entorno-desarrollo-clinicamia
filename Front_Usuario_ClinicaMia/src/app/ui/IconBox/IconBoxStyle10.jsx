import Image from 'next/image';
import React from 'react';

export default function IconBoxStyle10({ title, iconUrl, subTitle }) {
  return (
    <div className="cs_iconbox cs_style_10 cs_radius_20 cs_white_bg text-center">
      <div className="cs_iconbox_icon cs_center rounded-circle">
        <Image src={iconUrl} alt="Icon" height={65} width={65} />
      </div>
      <h2 className="cs_iconbox_title">{title}</h2>
      <p className="cs_iconbox_subtitle mb-0">{subTitle}</p>
    </div>
  );
}
