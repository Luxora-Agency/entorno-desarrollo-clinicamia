import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function IconBoxStyle9({ title, iconUrl, href }) {
  return (
    <Link
      href={href}
      className="cs_iconbox cs_style_9 text-center cs_radius_20"
    >
      <Image src={iconUrl} alt="Icon" height={72} width={72} />
      <h2 className="cs_iconbox_title cs_white_color cs_fs_20 cs_medium mb-0">
        {title}
      </h2>
    </Link>
  );
}
