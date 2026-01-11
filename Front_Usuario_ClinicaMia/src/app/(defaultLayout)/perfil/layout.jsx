'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Section from '@/app/ui/Section'
import ProfileSidebar from '@/app/ui/Profile/ProfileSidebar'
import { useAuth } from '@/contexts/AuthContext'

export default function ProfileLayout({ children }) {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  if (authLoading) {
    return (
      <Section topMd={170} topLg={120} topXl={80} bottomMd={200} bottomLg={150} bottomXl={110}>
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        </div>
      </Section>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <Section topMd={170} topLg={120} topXl={80} bottomMd={200} bottomLg={150} bottomXl={110}>
      <div className="container">
        <div className="profile_page">
          <div className="profile_grid">
            <ProfileSidebar />
            <main className="profile_main">
              {children}
            </main>
          </div>
        </div>
      </div>
    </Section>
  )
}
