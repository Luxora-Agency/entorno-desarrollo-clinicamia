/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Para Docker deployment
  // Permitir acceso desde dispositivos en la red local
  allowedDevOrigins: ['192.168.1.63'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/:path*` : 'http://localhost:4000/:path*',
      },
    ];
  },
};

export default nextConfig;
