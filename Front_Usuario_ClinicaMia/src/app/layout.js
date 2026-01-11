import { Figtree, Poppins } from 'next/font/google'
import './sass/index.scss'
import { RootProviders } from '@/components/providers/root.provider'

const figtree = Figtree({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-primary'
})
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-secondary'
})

export const metadata = {
  title: {
    absolute: '',
    default: 'ClinicaMia - Centro Médico Especializado en Ibagué | Endocrinología, Tiroides y Cirugía Plástica',
    template: '%s | ClinicaMia'
  },
  description: 'ClinicaMia es líder en endocrinología y especialidades médicas en Ibagué, Tolima. Expertos en enfermedades metabólicas, tiroides, cirugía plástica y medicina estética. Referentes nacionales en el manejo del cáncer de tiroides. Clínica verde con instalaciones sostenibles. ☎ 324 333 8555',
  openGraph: {
    title: 'ClinicaMia - Centro Médico Especializado en Ibagué | Líderes en Tiroides y Metabolismo',
    description: 'Expertos en endocrinología, enfermedades metabólicas y cáncer de tiroides en Ibagué. Cirugía plástica, medicina estética y Apollo Diagnóstico. Clínica verde sostenible.',
    images: ['/openGraphImage.jpeg']
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {/* ePayco Smart Checkout Script */}
        <script src="https://checkout.epayco.co/checkout.js" async></script>
      </head>
      <body className={`${figtree.variable} ${poppins.variable}`}>
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  )
}
