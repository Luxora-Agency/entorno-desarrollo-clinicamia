import { Icon } from '@iconify/react';
import Image from 'next/image';
import React from 'react';

export default function ListStyle3({ heading, iconUrl, data }) {
  return (
    <div className="cs_list cs_style_3">
      <h2 className="cs_list_title cs_medium cs_fs_24">
        <Image src={iconUrl} alt="Icon" height={22} width={22} />
        {heading}
      </h2>
      <ul className="cs_mp0 cs_heading_color cs_radius_20 cs_white_bg cs_medium">
        {data?.map((item, index) => (
          <li key={index}>
            <span>{item.day}</span>
            <span>
              <i>
                <Icon icon="fa6-solid:clock" />
              </i>{' '}
              {item.time}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
