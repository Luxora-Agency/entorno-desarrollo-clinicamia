/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Para Docker deployment
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/:path*',
      },
    ];
  },
};

export default nextConfig;
