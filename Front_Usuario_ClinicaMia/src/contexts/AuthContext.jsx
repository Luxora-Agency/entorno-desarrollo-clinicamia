'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Error al iniciar sesión')
    }

    // Store tokens and user data
    localStorage.setItem('accessToken', data.data.accessToken)
    localStorage.setItem('refreshToken', data.data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.data.usuario))

    setToken(data.data.accessToken)
    setUser(data.data.usuario)

    return data.data
  }

  const register = async (userData) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

    const response = await fetch(`${apiUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Error al registrarse')
    }

    // Auto-login after registration
    localStorage.setItem('accessToken', data.data.accessToken)
    localStorage.setItem('refreshToken', data.data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.data.usuario))

    setToken(data.data.accessToken)
    setUser(data.data.usuario)

    return data.data
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      logout()
      return null
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

    try {
      const response = await fetch(`${apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        logout()
        return null
      }

      localStorage.setItem('accessToken', data.data.accessToken)
      localStorage.setItem('refreshToken', data.data.refreshToken)
      setToken(data.data.accessToken)

      return data.data.accessToken
    } catch (error) {
      logout()
      return null
    }
  }

  // Authenticated fetch helper
  const authFetch = async (url, options = {}) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    const fullUrl = url.startsWith('http') ? url : `${apiUrl}${url}`

    let accessToken = localStorage.getItem('accessToken')

    const makeRequest = async (token) => {
      return fetch(fullUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      })
    }

    let response = await makeRequest(accessToken)

    // If unauthorized, try to refresh token
    if (response.status === 401) {
      accessToken = await refreshAccessToken()
      if (accessToken) {
        response = await makeRequest(accessToken)
      }
    }

    return response
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    authFetch,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
