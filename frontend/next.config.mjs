/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Para Docker deployment
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL ? 
          `${process.env.NEXT_PUBLIC_API_URL.replace('/api', '')}/:path*` :
          'http://localhost:4000/:path*',
      },
    ];
  },
};

export default nextConfig;
