import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Button({ btnUrl, btnText, variant }) {
  return (
    <Link href={btnUrl} className={`cs_btn cs_style_1 ${variant}`}>
      <span>{btnText}</span>
      <i>
        <Image src="/images/icons/arrow_white.svg" alt="Icon" height={11} width={15} />
        <Image src="/images/icons/arrow_white.svg" alt="Icon" height={11} width={15} />
      </i>
    </Link>
  );
}
