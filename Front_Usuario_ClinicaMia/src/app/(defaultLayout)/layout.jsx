import React from 'react'
import Header from '../ui/Header'
import Footer from '../ui/Footer'

export default function DefalultLayout({ children }) {
  return (
    <>
      <Header logoSrc="/images/logo.png" variant="cs_heading_color" />
      {children}
      <Footer />
    </>
  )
}
