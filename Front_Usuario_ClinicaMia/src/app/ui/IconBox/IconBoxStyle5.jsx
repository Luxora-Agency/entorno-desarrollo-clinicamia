import Image from 'next/image';
import React from 'react';

export default function IconBoxStyle5({ title, iconUrl }) {
  return (
    <div className="cs_iconbox cs_style_5 cs_white_bg cs_radius_15">
      <div className="cs_iconbox_icon cs_center cs_accent_bg cs_radius_15">
        <Image src={iconUrl} alt="Icon" height={69} width={58} />
      </div>
      <h2 className="cs_iconbox_title m-0 cs_fs_20 cs_medium">{title}</h2>
    </div>
  );
}
