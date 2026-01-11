'use client'
import React from 'react'
import Header from '../ui/Header'
import FooterStyle3 from '../ui/Footer/FooterStyle3'

export default function Layout({ children }) {
  return (
    <>
      <Header logoSrc="/images/logo.png" variant="cs_heading_color" />
      <main>{children}</main>
      <FooterStyle3 />
    </>
  )
}
