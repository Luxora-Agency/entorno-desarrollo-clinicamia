'use client'

import { Icon } from '@iconify/react'
import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

// Avatar placeholder SVG como data URL
const AVATAR_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 487 487' fill='none'%3E%3Crect width='487' height='487' fill='%23E5E7EB'/%3E%3Ccircle cx='243.5' cy='180' r='95' fill='%239CA3AF'/%3E%3Cpath d='M243.5 305C159.5 305 88 365 88 453V487H399V453C399 365 327.5 305 243.5 305Z' fill='%239CA3AF'/%3E%3C/svg%3E"

export default function TeamStyle2({
  id,
  slug,
  name,
  designation,
  biography,
  avatar,
  social,
  specialties
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const doctorUrl = `/doctors/${slug || id}`
  const displayImage = hasError || !avatar ? AVATAR_PLACEHOLDER : avatar

  const specialtyNames =
    specialties?.map((ds) => ds?.name).filter(Boolean) || []

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  return (
    <div className="cs_team cs_style_1 cs_type_2 text-center cs_radius_20 ">
      <div className="cs_member_img" style={{ position: 'relative', minHeight: '300px' }}>
        {/* Skeleton mientras carga */}
        {isLoading && !hasError && avatar && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              borderRadius: '20px 20px 0 0',
            }}
          />
        )}

        <Link href={doctorUrl} className="d-block">
          <Image
            src={displayImage}
            alt={name || 'Doctor'}
            height={487}
            width={487}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              opacity: isLoading && !hasError && avatar ? 0 : 1,
              transition: 'opacity 0.3s ease',
            }}
            unoptimized={displayImage === AVATAR_PLACEHOLDER}
          />
        </Link>
        <div className="cs_label cs_white_color cs_accent_bg">
          {designation || specialtyNames.at(0) || 'Médico'}
        </div>
      </div>
      <div className="cs_team_meta cs_white_bg">
        <div>
          <h3 className="cs_member_name cs_fs_32">
            <Link href={doctorUrl}>{name}</Link>
          </h3>
          {biography && <p className="cs_member_description">{biography}</p>}
        </div>
        {social && social.length > 0 && (
          <div>
            <div className="cs_social_links">
              {social.map((item, index) => (
                <Link href={item.href} key={index}>
                  <Icon icon={item.icon} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Estilos para el skeleton */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  )
}
