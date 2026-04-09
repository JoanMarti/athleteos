/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@athleteos/types', '@athleteos/utils'],
  experimental: { typedRoutes: true },
}
module.exports = nextConfig
