"use client"
import React from 'react'
import Header from '../ui/Header'
import FooterStyle2 from '../ui/Footer/FooterStyle2'

export default function Layout({ children }) {
  return (
    <>
      <Header logoSrc="/images/logo_white.svg" variant="cs_white_color" />
      <main>{children}</main>
      <FooterStyle2 />
    </>
  )
}
