'use client'

import React, { useState } from 'react'
import Pagination from '../../Pagination'
import Post from '../../Post'
import Spacing from '../../Spacing'
import { $api } from '@/utils/openapi-client'
import { Icon } from '@iconify/react'

export default function BlogSectionStyle2() {
  const [page, setPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState(null)

  // Fetch categories
  const { data: categoriesData } = $api.useQuery('get', '/blog/categories')

  // Fetch posts
  const { data: postsData, isLoading, error } = $api.useQuery('get', '/blog/posts', {
    params: {
      query: {
        limit: 9,
        page,
        ...(selectedCategory && { categoriaId: selectedCategory })
      }
    }
  })

  const categories = categoriesData?.data || []
  const posts = postsData?.data || []
  const totalPages = postsData?.pagination?.totalPages || 0

  if (isLoading) {
    return (
      <div className="container">
        <div className="text-center py-5">
          <Icon icon="svg-spinners:ring-resize" style={{ fontSize: '48px', color: '#53B896' }} />
          <p className="mt-3 text-muted">Cargando artículos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="text-center py-5">
          <Icon icon="mdi:alert-circle-outline" style={{ fontSize: '48px', color: '#f59e0b' }} />
          <p className="mt-3">No se pudieron cargar los artículos.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      {/* Category Filter */}
      {categories.length > 0 && (
        <>
          <div className="cs_isotop_filter cs_style1 cs_center">
            <ul className="cs_mp0">
              <li className={!selectedCategory ? 'active' : ''}>
                <span onClick={() => { setSelectedCategory(null); setPage(1); }}>Todos</span>
              </li>
              {categories.map(cat => (
                <li key={cat.id} className={selectedCategory === cat.id ? 'active' : ''}>
                  <span onClick={() => { setSelectedCategory(cat.id); setPage(1); }}>
                    {cat.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <Spacing md="50" />
        </>
      )}

      {/* Posts Grid */}
      {posts.length > 0 ? (
        <div className="row cs_row_gap_50">
          {posts.map((item, index) => (
            <div className="col-xl-4 col-md-6" key={item.id || index}>
              <Post
                title={item.title}
                thumbUrl={item.thumbUrl}
                date={item.date}
                excerpt={item.excerpt}
                href={item.href}
                author={item.author}
                category={item.category}
                socialShare
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5">
          <Icon icon="mdi:file-document-outline" style={{ fontSize: '64px', color: '#ccc' }} />
          <p className="mt-3 text-muted">No hay artículos disponibles.</p>
        </div>
      )}

      <Spacing md="110" lg="70" />
      {totalPages > 1 && (
        <Pagination page={page} setPage={setPage} totalPages={totalPages} />
      )}
    </div>
  )
}
