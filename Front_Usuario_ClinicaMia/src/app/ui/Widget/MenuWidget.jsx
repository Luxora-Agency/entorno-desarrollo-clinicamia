import React from 'react';
import Link from 'next/link';

export default function MenuWidget({ data }) {
  return (
    <ul className="cs_menu_widget cs_mp0">
      {data?.map((item, index) => (
        <li key={index}>
          <Link href={item.href}>{item.title}</Link>
        </li>
      ))}
    </ul>
  );
}
