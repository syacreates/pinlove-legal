/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'source.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
  // Leaflet needs this to avoid SSR issues with window
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

module.exports = nextConfig
