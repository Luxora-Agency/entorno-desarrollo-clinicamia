'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@iconify/react'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  { href: '/perfil', icon: 'fa6-solid:house', label: 'Inicio' },
  { href: '/perfil/editar', icon: 'fa6-solid:user-pen', label: 'Editar Perfil' },
  { href: '/perfil/citas', icon: 'fa6-solid:calendar-check', label: 'Mis Citas' },
  { href: '/perfil/historial', icon: 'fa6-solid:clock-rotate-left', label: 'Historial' },
  { href: '/perfil/historia-medica', icon: 'fa6-solid:file-medical', label: 'Historia Médica' },
]

export default function ProfileSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

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
          <Icon icon="fa6-solid:user-circle" />
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
