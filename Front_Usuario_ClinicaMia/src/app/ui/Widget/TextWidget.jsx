import React from 'react';
import parse from 'html-react-parser';
import Image from 'next/image';

export default function TextWidget({ logoUrl, text }) {
  return (
    <div className="cs_text_widget">
      {logoUrl && <Image src={logoUrl} alt="Logo" height={57} width={258} />}
      {text && <p className="cs_medium">{parse(text)}</p>}
    </div>
  );
}
