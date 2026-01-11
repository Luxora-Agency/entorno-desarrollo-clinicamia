import { $api } from '@/utils/openapi-client';
import Image from 'next/image';
import React, { useState } from 'react';


const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export default function NewsletterForm({ label, btnText, btnArrowUrl }) {

  const [email, setEmail] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)

  const [error, setError] = useState("")

  const { mutate, isPending } = $api.useMutation("post", "/newsletter/subscribers/subscribe", {
    onSuccess: () => {
      setEmail("")
      setError("")
      setShowSuccess(true)

      // Ocultar el mensaje después de 3 segundos
      setTimeout(() => {
        setShowSuccess(false)
      }, 3000)
    },
    onError: () => {
      setError("Error al suscribirse")
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log(emailReg.test(email))
    if (!emailReg.test(email)) {
      setError("Email invalido")
      return
    }
    mutate({
      body: {
        email: email
      }
    })
  }

  return (
    <>
      {label && <p>Your Email</p>}
      <form
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSubmit(e)
          }
        }}
        className="cs_newsletter_form">
        <input
          type="text"
          className="cs_form_field"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type='submit' className="cs_btn cs_style_1" disabled={isPending}>
          <span>{isPending ? "Enviando..." : btnText}</span>
          <i>
            <Image src={btnArrowUrl} alt="Icon" height={11} width={15} />
            <Image src={btnArrowUrl} alt="Icon" height={11} width={15} />
          </i>
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {showSuccess && (
        <div className="cs_success_message" style={{
          marginTop: '10px',
          padding: '12px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'slideInFadeIn 0.5s ease-out, slideOutFadeOut 0.5s ease-in 2.5s forwards',
          fontWeight: '500',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <span style={{ fontSize: '20px' }}>✓</span>
          <span>¡Suscripción exitosa! Gracias por unirte.</span>
        </div>
      )}
      <style jsx>{`
        @keyframes slideInFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideOutFadeOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-10px);
          }
        }
      `}</style>
    </>
  );
}
