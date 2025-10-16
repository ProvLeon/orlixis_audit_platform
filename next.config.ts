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
  webpack: (config: unknown, { isServer }: { isServer: unknown }) => {
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
  // API route configuration
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '20mb',
  },
  // Server-side configuration
  serverRuntimeConfig: {
    maxDuration: 300, // 5 minutes for PDF generation
  },
}

module.exports = nextConfig
