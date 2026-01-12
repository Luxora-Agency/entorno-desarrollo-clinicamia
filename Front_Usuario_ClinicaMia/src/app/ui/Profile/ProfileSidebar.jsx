'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@iconify/react'
import { useAuth } from '@/contexts/AuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const navItems = [
  { href: '/perfil', icon: 'fa6-solid:house', label: 'Inicio' },
  { href: '/perfil/editar', icon: 'fa6-solid:user-pen', label: 'Editar Perfil' },
  { href: '/perfil/citas', icon: 'fa6-solid:calendar-check', label: 'Mis Citas' },
  { href: '/perfil/historial', icon: 'fa6-solid:clock-rotate-left', label: 'Historial' },
  { href: '/perfil/historia-medica', icon: 'fa6-solid:file-medical', label: 'Historia Médica' },
]

export default function ProfileSidebar() {
  const pathname = usePathname()
  const { user, logout, authFetch } = useAuth()
  const [fotoUrl, setFotoUrl] = useState(null)

  // Fetch patient profile to get photo
  useEffect(() => {
    const fetchPatientPhoto = async () => {
      try {
        const response = await authFetch('/pacientes/me')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data?.foto_url) {
            // Build full URL if it's a relative path
            const imgUrl = data.data.foto_url.startsWith('http') || data.data.foto_url.startsWith('data:')
              ? data.data.foto_url
              : `${API_URL}${data.data.foto_url}`
            setFotoUrl(imgUrl)
          }
        }
      } catch (error) {
        console.error('Error fetching patient photo:', error)
      }
    }

    if (user) {
      fetchPatientPhoto()
    }
  }, [user, authFetch])

  const isActive = (href) => {
    if (href === '/perfil') {
      return pathname === '/perfil'
    }
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <aside className="profile_sidebar">
      <div className="profile_user_card">
        <div className="profile_avatar">
          {fotoUrl ? (
            <img
              src={fotoUrl}
              alt={`${user?.nombre || 'Usuario'}`}
              className="profile_avatar_img"
            />
          ) : (
            <Icon icon="fa6-solid:user-circle" />
          )}
        </div>
        <h2 className="profile_name">
          {user?.nombre} {user?.apellido || ''}
        </h2>
        <p className="profile_email">{user?.email}</p>
      </div>

      <nav className="profile_nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`profile_nav_item ${isActive(item.href) ? 'active' : ''}`}
          >
            <Icon icon={item.icon} />
            <span>{item.label}</span>
          </Link>
        ))}

        <button className="profile_nav_item logout_btn" onClick={handleLogout}>
          <Icon icon="fa6-solid:right-from-bracket" />
          <span>Cerrar Sesión</span>
        </button>
      </nav>
    </aside>
  )
}
