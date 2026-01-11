import { Icon } from '@iconify/react';
import Link from 'next/link';
import React from 'react';


export default function SocialWidget() {
  return (
    <div className="cs_social_links_wrap">
      <h2>Síguenos</h2>
      <div className="cs_social_links">
        <Link href="https://www.facebook.com/share/1BjE9Y3on5/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer">
          <Icon icon="fa-brands:facebook-f" />
        </Link>
        <Link href="https://www.instagram.com/clinicamiaibague?igsh=azRsZHZzODJwYnh6" target="_blank" rel="noopener noreferrer">
          <Icon icon="fa-brands:instagram" />
        </Link>
        <Link href="https://www.tiktok.com/@clinicamia?_r=1&_t=ZS-91Cp69oH06f" target="_blank" rel="noopener noreferrer">
          <Icon icon="fa-brands:tiktok" />
        </Link>
      </div>
    </div>
  );
}
