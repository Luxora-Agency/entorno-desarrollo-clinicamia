'use client'

import { Icon } from '@iconify/react'
import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

// Placeholder para imágenes que fallan
const PLACEHOLDER_IMAGE = '/images/blog/post_1.jpeg'

export default function Post({
  title,
  thumbUrl,
  date,
  excerpt,
  href = '#',
  author,
  category,
  socialShare,
  variant,
  // Legacy props support
  featuredImage,
  publishedAt,
  summary,
  btnText
}) {
  const [imgError, setImgError] = useState(false)

  // Support both old and new prop names
  const imageUrl = imgError ? PLACEHOLDER_IMAGE : (thumbUrl || featuredImage?.url || PLACEHOLDER_IMAGE)
  const postDate = date || publishedAt
  const postExcerpt = excerpt || summary
  const postHref = href || '#'

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    try {
      return Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(new Date(dateStr))
    } catch {
      return dateStr
    }
  }

  return (
    <div className={`cs_post cs_style_1 ${variant || ''}`}>
      <Link href={postHref} className="cs_post_thumb cs_view_mouse">
        <Image
          alt={title || 'Artículo'}
          width={526}
          height={379}
          src={imageUrl}
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            aspectRatio: 16 / 9,
            objectFit: 'cover'
          }}
        />
      </Link>
      <div className="cs_post_info">
        <div>
          <div className="cs_post_meta">
            <div className="cs_posted_by">
              {formatDate(postDate)}
              {author && <span> | {author}</span>}
            </div>
            {socialShare && (
              <div className="cs_post_social">
                <Link href="#" className="cs_center rounded-circle">
                  <Icon icon="fa-brands:linkedin-in" />
                </Link>
                <Link href="#" className="cs_center rounded-circle">
                  <Icon icon="fa-brands:facebook-f" />
                </Link>
                <Link href="#" className="cs_center rounded-circle">
                  <Icon icon="fa-brands:twitter" />
                </Link>
              </div>
            )}
          </div>
          <h2 className="cs_post_title cs_semibold cs_fs_32">
            <Link href={postHref}>{title}</Link>
          </h2>
          {category && (
            <span className="cs_post_category" style={{
              display: 'inline-block',
              backgroundColor: '#53B896',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              marginTop: '8px'
            }}>
              {category}
            </span>
          )}
        </div>
        {postExcerpt && (
          <div className="cs_heading_color cs_medium">
            <p
              className="cs_post_excerpt"
              style={{
                WebkitLineClamp: 2,
                lineClamp: 2,
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginTop: '10px',
                color: '#666'
              }}
            >
              {postExcerpt}
            </p>
            <Link
              href={postHref}
              className="cs_post_btn"
              style={{ marginTop: '10px', display: 'inline-block' }}
            >
              Leer Más
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
