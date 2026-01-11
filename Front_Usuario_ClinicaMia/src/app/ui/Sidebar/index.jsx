'use client'
import React from 'react';
import SideMenuWidget from '../Widget/SideMenuWidget';
import RecentPostWidget from '../Widget/RecentPostWidget';
import NewsletterStyle5 from '../Widget/NewsletterStyle5';
import { $api } from '@/utils/openapi-client';

export default function Sidebar() {
  // Fetch categories from API
  const { data: categoriesData } = $api.useQuery('get', '/blog/categories')

  // Fetch recent posts from API
  const { data: recentData } = $api.useQuery('get', '/blog/recent')

  // Map categories to widget format
  const categoryData = (categoriesData?.data || []).map(cat => ({
    title: cat.name,
    url: `/blog?categoria=${cat.id}`
  }))

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

  // Map recent posts to widget format
  const recentPostData = (recentData?.data || []).map(post => ({
    title: post.title,
    author: post.author || 'ClinicaMia',
    date: formatDate(post.date),
    href: post.href || `/blog/${post.slug}`
  }))

  return (
    <div className="cs_sidebar">
      {categoryData.length > 0 && (
        <div className="cs_sidebar_item widget_categories">
          <SideMenuWidget title="Categorías" data={categoryData} />
        </div>
      )}
      {recentPostData.length > 0 && (
        <div className="cs_sidebar_item">
          <RecentPostWidget title="Artículos Recientes" data={recentPostData} />
        </div>
      )}
      <div className="cs_sidebar_item widget_categories">
        <NewsletterStyle5 title="Suscríbete al Boletín" />
      </div>
    </div>
  );
}
