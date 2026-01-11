'use client'
import React, { useState, useEffect } from 'react'
import Section from '@/app/ui/Section'
import BannerSectionStyle9 from '@/app/ui/Section/BannerSection/BannerSectionStyle9'
import Sidebar from '@/app/ui/Sidebar'
import Spacing from '@/app/ui/Spacing'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { $api } from '@/utils/openapi-client'

import bannerImg from '../../../../../public/images/doctors/banner_img_3.png'

const PLACEHOLDER_IMAGE = '/images/blog/post_1.jpeg'
const AUTHOR_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none'%3E%3Crect width='100' height='100' fill='%23E5E7EB'/%3E%3Ccircle cx='50' cy='35' r='20' fill='%239CA3AF'/%3E%3Cpath d='M50 60C30 60 15 78 15 95V100H85V95C85 78 70 60 50 60Z' fill='%239CA3AF'/%3E%3C/svg%3E"

export default function BlogPostDetail() {
  const params = useParams()
  const slug = params.slug
  const [imgError, setImgError] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  // Scroll progress indicator
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (window.scrollY / totalHeight) * 100
      setScrollProgress(progress)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch post by slug
  const { data: postData, isLoading, error } = $api.useQuery('get', `/blog/posts/${slug}`)

  // Fetch related posts
  const { data: relatedData } = $api.useQuery('get', '/blog/recent')

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

  // Estimate reading time
  const getReadingTime = (content) => {
    if (!content) return '1 min'
    const text = content.replace(/<[^>]*>/g, '')
    const words = text.split(/\s+/).length
    const minutes = Math.ceil(words / 200)
    return `${minutes} min de lectura`
  }

  // Loading state with skeleton
  if (isLoading) {
    return (
      <>
        {/* Progress bar */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '4px',
          backgroundColor: '#e5e7eb',
          zIndex: 9999
        }}>
          <div style={{
            width: '30%',
            height: '100%',
            backgroundColor: '#53B896',
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
        </div>
        <Section topMd={170} bottomMd={54} bottomLg={54}>
          <div className="container">
            {/* Breadcrumb skeleton */}
            <div style={{ height: '24px', width: '200px', backgroundColor: '#e5e7eb', borderRadius: '4px', marginBottom: '30px' }} />

            {/* Title skeleton */}
            <div style={{ height: '48px', width: '80%', backgroundColor: '#e5e7eb', borderRadius: '8px', marginBottom: '20px' }} />

            {/* Meta skeleton */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
              <div style={{ height: '20px', width: '120px', backgroundColor: '#e5e7eb', borderRadius: '4px' }} />
              <div style={{ height: '20px', width: '100px', backgroundColor: '#e5e7eb', borderRadius: '4px' }} />
              <div style={{ height: '20px', width: '80px', backgroundColor: '#e5e7eb', borderRadius: '4px' }} />
            </div>

            {/* Image skeleton */}
            <div style={{
              width: '100%',
              height: '400px',
              backgroundColor: '#e5e7eb',
              borderRadius: '20px',
              marginBottom: '50px',
              animation: 'pulse 1.5s ease-in-out infinite'
            }} />

            {/* Content skeleton */}
            <div className="row">
              <div className="col-lg-8">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={{
                    height: '16px',
                    width: i % 2 === 0 ? '90%' : '100%',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    marginBottom: '12px'
                  }} />
                ))}
              </div>
            </div>
          </div>
        </Section>
        <style jsx global>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </>
    )
  }

  // Error state
  if (error || !postData?.data) {
    return (
      <>
        <Section topMd={170} bottomMd={54} bottomLg={54}>
          <div className="container">
            <Link href="/blog" className="cs_back_link" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#53B896',
              marginBottom: '30px',
              textDecoration: 'none',
              fontWeight: 500
            }}>
              <Icon icon="mdi:arrow-left" />
              Volver al Blog
            </Link>
          </div>
        </Section>
        <div className="container">
          <div className="text-center py-5" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div style={{
              width: '120px',
              height: '120px',
              margin: '0 auto 30px',
              backgroundColor: '#fef3c7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Icon icon="mdi:file-document-remove-outline" style={{ fontSize: '60px', color: '#f59e0b' }} />
            </div>
            <h2 className="cs_fs_40 cs_semibold mb-3">Artículo no encontrado</h2>
            <p className="text-muted mb-4">
              El artículo que buscas no existe o ha sido eliminado.
              Explora otros artículos de salud en nuestro blog.
            </p>
            <Link href="/blog" className="cs_btn cs_style_1">
              <span>Explorar Blog</span>
              <Icon icon="mdi:arrow-right" style={{ marginLeft: '8px' }} />
            </Link>
          </div>
        </div>
        <Spacing md="200" xl="150" lg="110" />
        <Section className="cs_footer_margin_0">
          <BannerSectionStyle9
            title="¡Tu Salud es <br />Nuestra Prioridad!"
            subTitle="Agenda una cita con uno de nuestros profesionales <br />médicos experimentados hoy mismo!"
            imgUrl={bannerImg}
          />
        </Section>
      </>
    )
  }

  const post = postData.data
  const imageUrl = imgError ? PLACEHOLDER_IMAGE : (post.thumbUrl || post.imagenPortada || PLACEHOLDER_IMAGE)
  const authorName = post.author?.name || 'ClinicaMia'
  const content = post.content || post.contenido || ''
  const title = post.title || post.titulo || ''
  const excerpt = post.excerpt || post.extracto || ''
  const category = post.category || post.categoria?.nombre || ''
  const categorySlug = post.categorySlug || post.categoria?.slug || ''
  const publishDate = post.date || post.fechaPublicacion

  // Filter related posts (exclude current post)
  const relatedPosts = (relatedData?.data || [])
    .filter(p => p.slug !== slug)
    .slice(0, 3)

  // Get current URL for sharing
  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''

  return (
    <>
      {/* Progress bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '4px',
        backgroundColor: '#e5e7eb',
        zIndex: 9999
      }}>
        <div style={{
          width: `${scrollProgress}%`,
          height: '100%',
          backgroundColor: '#53B896',
          transition: 'width 0.1s ease-out'
        }} />
      </div>

      <Section topMd={170} bottomMd={40} bottomLg={30}>
        <div className="container">
          {/* Back link */}
          <Link href="/blog" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#53B896',
            marginBottom: '30px',
            textDecoration: 'none',
            fontWeight: 500,
            transition: 'all 0.3s ease'
          }}>
            <Icon icon="mdi:arrow-left" />
            Volver al Blog
          </Link>

          {/* Category badge */}
          {category && (
            <Link href={`/blog?categoria=${categorySlug}`} style={{
              display: 'inline-block',
              backgroundColor: '#53B896',
              color: 'white',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '20px'
            }}>
              {category}
            </Link>
          )}

          {/* Title */}
          <h1 className="cs_fs_48 cs_semibold" style={{
            marginBottom: '24px',
            lineHeight: 1.3,
            color: '#1a1a2e'
          }}>
            {title}
          </h1>

          {/* Meta info */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '40px',
            color: '#666',
            fontSize: '15px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon icon="mdi:calendar-outline" style={{ fontSize: '18px', color: '#53B896' }} />
              <span>{formatDate(publishDate)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon icon="mdi:account-outline" style={{ fontSize: '18px', color: '#53B896' }} />
              <span>{authorName}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon icon="mdi:clock-outline" style={{ fontSize: '18px', color: '#53B896' }} />
              <span>{getReadingTime(content)}</span>
            </div>
          </div>
        </div>
      </Section>

      {/* Hero Image */}
      <div className="container" style={{ marginBottom: '50px' }}>
        <div style={{
          position: 'relative',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
        }}>
          <Image
            src={imageUrl}
            alt={title}
            width={1200}
            height={600}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '550px',
              objectFit: 'cover'
            }}
            onError={() => setImgError(true)}
            priority
          />
        </div>
      </div>

      {/* Content */}
      <div className="container">
        <div className="row">
          <div className="col-lg-8">
            {/* Excerpt / Lead paragraph */}
            {excerpt && (
              <p style={{
                fontSize: '20px',
                lineHeight: 1.7,
                color: '#444',
                fontWeight: 500,
                marginBottom: '40px',
                paddingLeft: '20px',
                borderLeft: '4px solid #53B896'
              }}>
                {excerpt}
              </p>
            )}

            {/* Main content */}
            <div
              className="cs_blog_content"
              dangerouslySetInnerHTML={{ __html: content }}
              style={{
                fontSize: '17px',
                lineHeight: 1.8,
                color: '#333'
              }}
            />

            <Spacing md="60" />

            {/* Share section */}
            <div style={{
              padding: '30px',
              backgroundColor: '#f8f9fa',
              borderRadius: '16px',
              marginBottom: '40px'
            }}>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '20px'
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '18px', color: '#1a1a2e' }}>
                    ¿Te resultó útil este artículo?
                  </h4>
                  <p style={{ margin: '5px 0 0', color: '#666', fontSize: '14px' }}>
                    Compártelo con quienes puedan necesitarlo
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: '#1877f2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      transition: 'transform 0.3s ease'
                    }}
                    onMouseEnter={e => e.target.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                  >
                    <Icon icon="fa-brands:facebook-f" style={{ fontSize: '18px' }} />
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: '#1da1f2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      transition: 'transform 0.3s ease'
                    }}
                    onMouseEnter={e => e.target.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                  >
                    <Icon icon="fa-brands:twitter" style={{ fontSize: '18px' }} />
                  </a>
                  <a
                    href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: '#0077b5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      transition: 'transform 0.3s ease'
                    }}
                    onMouseEnter={e => e.target.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                  >
                    <Icon icon="fa-brands:linkedin-in" style={{ fontSize: '18px' }} />
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(title + ' - ' + currentUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: '#25d366',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      transition: 'transform 0.3s ease'
                    }}
                    onMouseEnter={e => e.target.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                  >
                    <Icon icon="fa-brands:whatsapp" style={{ fontSize: '20px' }} />
                  </a>
                </div>
              </div>
            </div>

            {/* Author card */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              padding: '30px',
              backgroundColor: '#fff',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid #eee'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                overflow: 'hidden',
                flexShrink: 0,
                border: '3px solid #53B896'
              }}>
                <Image
                  src={post.author?.foto || AUTHOR_PLACEHOLDER}
                  alt={authorName}
                  width={80}
                  height={80}
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
              </div>
              <div>
                <p style={{ margin: '0 0 4px', color: '#53B896', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>
                  Escrito por
                </p>
                <h4 style={{ margin: '0 0 8px', fontSize: '20px', color: '#1a1a2e' }}>
                  {authorName}
                </h4>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                  Equipo médico de ClinicaMia
                </p>
              </div>
            </div>

            <Spacing md="80" />
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            <div style={{ position: 'sticky', top: '100px' }}>
              <Sidebar />
            </div>
          </div>
        </div>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <>
            <Spacing md="80" />
            <div style={{
              borderTop: '1px solid #eee',
              paddingTop: '60px'
            }}>
              <h3 className="cs_fs_32 cs_semibold" style={{ marginBottom: '40px', textAlign: 'center' }}>
                Artículos Relacionados
              </h3>
              <div className="row cs_gap_y_40">
                {relatedPosts.map((item, index) => (
                  <div className="col-lg-4 col-md-6" key={item.id || index}>
                    <Link href={item.href || `/blog/${item.slug}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        borderRadius: '16px',
                        overflow: 'hidden',
                        backgroundColor: '#fff',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                      }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-8px)'
                          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.12)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'
                        }}
                      >
                        <div style={{ aspectRatio: '16/10', overflow: 'hidden' }}>
                          <Image
                            src={item.thumbUrl || PLACEHOLDER_IMAGE}
                            alt={item.title}
                            width={400}
                            height={250}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'transform 0.3s ease'
                            }}
                          />
                        </div>
                        <div style={{ padding: '20px' }}>
                          <p style={{
                            margin: '0 0 10px',
                            color: '#53B896',
                            fontSize: '13px',
                            fontWeight: 600
                          }}>
                            {formatDate(item.date)}
                          </p>
                          <h4 style={{
                            margin: 0,
                            fontSize: '18px',
                            color: '#1a1a2e',
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {item.title}
                          </h4>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <Spacing md="120" xl="100" lg="80" />

      {/* CTA Banner */}
      <Section className="cs_footer_margin_0">
        <BannerSectionStyle9
          title="¿Necesitas una <br />Consulta Médica?"
          subTitle="Nuestro equipo de especialistas está listo <br />para atenderte. ¡Agenda tu cita hoy!"
          imgUrl={bannerImg}
        />
      </Section>

      {/* Custom styles for blog content */}
      <style jsx global>{`
        .cs_blog_content h2 {
          font-size: 28px;
          font-weight: 600;
          color: #1a1a2e;
          margin: 40px 0 20px;
        }
        .cs_blog_content h3 {
          font-size: 22px;
          font-weight: 600;
          color: #1a1a2e;
          margin: 30px 0 15px;
        }
        .cs_blog_content p {
          margin-bottom: 20px;
        }
        .cs_blog_content ul, .cs_blog_content ol {
          margin: 20px 0;
          padding-left: 30px;
        }
        .cs_blog_content li {
          margin-bottom: 12px;
        }
        .cs_blog_content strong {
          color: #1a1a2e;
        }
        .cs_blog_content blockquote {
          margin: 30px 0;
          padding: 30px;
          background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
          border-left: 4px solid #53B896;
          border-radius: 0 16px 16px 0;
          font-style: italic;
          font-size: 18px;
          color: #1a1a2e;
        }
        .cs_blog_content img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          margin: 20px 0;
        }
        .cs_blog_content a {
          color: #53B896;
          text-decoration: underline;
        }
        .cs_blog_content a:hover {
          color: #144F79;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  )
}
