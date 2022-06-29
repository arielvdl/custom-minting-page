/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/success', destination: 'https://google.com/' },
    ];
  },
  images: {
    domains: ['gateway.ipfscdn.io'],
  },
}

module.exports = nextConfig
