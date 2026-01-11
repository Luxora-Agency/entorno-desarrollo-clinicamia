'use client'

import { Icon } from '@iconify/react';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Avatar placeholder SVG como data URL
const AVATAR_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 231 231' fill='none'%3E%3Crect width='231' height='231' fill='%23E5E7EB'/%3E%3Ccircle cx='115.5' cy='85' r='45' fill='%239CA3AF'/%3E%3Cpath d='M115.5 145C75.5 145 42 175 42 215V231H189V215C189 175 155.5 145 115.5 145Z' fill='%239CA3AF'/%3E%3C/svg%3E";

export default function Team({
  imgUrl,
  name,
  designation,
  description,
  social,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Determinar qué imagen mostrar
  const displayImage = hasError || !imgUrl ? AVATAR_PLACEHOLDER : imgUrl;

  return (
    <div className="cs_team cs_style_1 text-center cs_radius_20 cs_type_1">
      <div className="cs_member_img" style={{ position: 'relative', minHeight: '231px' }}>
        {/* Skeleton mientras carga */}
        {isLoading && !hasError && imgUrl && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '231px',
              height: '231px',
              borderRadius: '50%',
              background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }}
          />
        )}

        <Image
          src={displayImage}
          alt={name || 'Doctor'}
          height={231}
          width={231}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            opacity: isLoading && !hasError && imgUrl ? 0 : 1,
            transition: 'opacity 0.3s ease',
            borderRadius: hasError || !imgUrl ? '50%' : undefined,
          }}
          unoptimized={displayImage === AVATAR_PLACEHOLDER}
        />
      </div>
      <div className="cs_team_meta">
        <div>
          <h3 className="cs_member_name cs_semibold cs_fs_40">{name}</h3>
          <p className="cs_member_designation cs_fs_20 cs_heading_color">
            {designation}
          </p>
          <p className="cs_member_description">{description}</p>
        </div>
      </div>

      {/* Estilos para el skeleton */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
