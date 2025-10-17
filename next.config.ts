/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  // Optimize for serverless PDF generation
  experimental: {
    serverComponentsExternalPackages: ['playwright-core', 'chrome-aws-lambda', '@react-pdf/renderer'],
  },
  // Webpack configuration for PDF generation libraries
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (isServer) {
      // Externalize playwright and chrome dependencies for serverless
      config.externals.push({
        'playwright-core': 'commonjs playwright-core',
        'chrome-aws-lambda': 'commonjs chrome-aws-lambda',
      })
    }

    // Handle canvas and other native dependencies
    config.resolve.alias.canvas = false
    config.resolve.alias['pdfkit'] = false

    return config
  },
  // Configure serverless functions for Vercel
  async rewrites() {
    return []
  },
  async headers() {
    return [
      {
        source: '/api/reports/:id/pdf',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Content-Type',
            value: 'application/pdf',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
