import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function IconBoxStyle12({ title, subTitle, iconUrl, href }) {
  return (
    <div className="cs_iconbox cs_style_12">
      <div className="cs_iconbox_info cs_radius_20">
        <span className="cs_iconbox_circle cs_accent_bg" />
        <h2 className="cs_iconbox_title cs_fs_32 cs_semibold">
          <Link href={href}>{title}</Link>
        </h2>
        <p className="cs_iconbox_subtitle mb-0 cs_heading_color">{subTitle}</p>
      </div>
      <Link href={href} className="cs_iconbox_icon cs_center">
        <Image src={iconUrl} alt="Icon" height={70} width={70} />
      </Link>
    </div>
  );
}
