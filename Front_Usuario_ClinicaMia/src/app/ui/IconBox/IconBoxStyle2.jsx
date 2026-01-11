import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function IconBoxStyle2({ title, href, iconUrl }) {
  return (
    <Link href={href} className="cs_iconbox cs_style_2">
      <div className="cs_iconbox_icon">
        <Image src={iconUrl} alt="Icon" height={75} width={75}/>
      </div>
      <h2 className="cs_iconbox_title cs_fs_32 cs_semibold m-0">{title}</h2>
    </Link>
  );
}
