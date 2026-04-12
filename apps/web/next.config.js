/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@athleteos/types', '@athleteos/utils'],
  experimental: { typedRoutes: true },
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com', 'dgalywyr863hv.cloudfront.net'],
  },
}
module.exports = nextConfig
