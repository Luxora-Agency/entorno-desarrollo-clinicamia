import { Icon } from '@iconify/react';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function TeamStyle4({
  imgUrl,
  name,
  designation,
  description,
  href,
  social,
}) {
  return (
    <div className="cs_team cs_style_1 text-center cs_radius_20 overflow-hidden">
      <Link href={href} className="cs_member_img d-block">
        <Image src={imgUrl} alt="Doctor" height={487} width={487} />
      </Link>
      <div className="cs_team_meta cs_white_bg">
        <div>
          <h3 className="cs_member_name cs_fs_40">
            <Link href={href}>{name}</Link>
          </h3>
          <p className="cs_member_designation cs_fs_20 cs_heading_color">
            {designation}
          </p>
          <p className="cs_member_description">{description}</p>
        </div>
        <div>
          <div className="cs_social_links">
            {social?.map((item, index) => (
              <Link href={item.href} key={index}>
                <Icon icon={item.icon} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
