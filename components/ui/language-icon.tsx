"use client"

import React from "react"
import {
  SiJavascript,
  SiTypescript,
  SiReact,
  SiPython,
  SiOpenjdk,
  SiPhp,
  SiRuby,
  SiGo,
  SiRust,
  SiCplusplus,
  SiVuedotjs,
  SiAngular,
  SiNodedotjs,
  SiNextdotjs,
  SiDjango,
  SiFlask,
  SiSpring,
  SiLaravel,
  SiRubyonrails,
  SiExpress,
  SiDotnet,
  SiKotlin,
  SiSwift,
  SiDart,
  SiFlutter,
  SiMongodb,
  SiPostgresql,
  SiMysql,
  SiRedis,
  SiSqlite,
  SiDocker,
  SiKubernetes,
  SiGit,
  SiHtml5,
  SiCss3,
  SiSass,
  SiTailwindcss,
  SiWebpack,
  SiVite,
  SiEslint,
  SiPrettier,
  SiJest,
  SiCypress,
  SiStorybook,
  SiFigma,
  SiLinux,

  SiMacos,
  SiAmazon,

  SiGooglecloud,
  SiVercel,
  SiNetlify,
  SiHeroku,
  SiFirebase,
  SiSupabase,
  SiCloudflare,
  SiNginx,
  SiApache,
  SiGraphql,
  SiPrisma,
  SiRedux,
  SiMobx,
  SiBootstrap,
  SiNpm,
  SiYarn,
  SiDeno
} from "react-icons/si"
import { FileText, Folder, Archive, Link as LinkIcon, Code, Monitor, Cloud } from "lucide-react"
import { cn } from "@/lib/utils"

interface LanguageIconProps {
  language: string
  className?: string
  size?: number
}

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  // Core Languages
  javascript: SiJavascript,
  js: SiJavascript,
  typescript: SiTypescript,
  ts: SiTypescript,
  python: SiPython,
  py: SiPython,
  java: SiOpenjdk,
  php: SiPhp,
  ruby: SiRuby,
  rb: SiRuby,
  go: SiGo,
  golang: SiGo,
  rust: SiRust,
  rs: SiRust,
  "c++": SiCplusplus,
  cpp: SiCplusplus,
  cxx: SiCplusplus,
  "c#": SiDotnet,
  cs: SiDotnet,
  csharp: SiDotnet,
  kotlin: SiKotlin,
  kt: SiKotlin,
  swift: SiSwift,
  dart: SiDart,

  // Frontend Frameworks
  react: SiReact,
  jsx: SiReact,
  tsx: SiReact,
  vue: SiVuedotjs,
  vuejs: SiVuedotjs,
  angular: SiAngular,
  ng: SiAngular,

  // Backend Frameworks
  nodejs: SiNodedotjs,
  node: SiNodedotjs,
  nextjs: SiNextdotjs,
  next: SiNextdotjs,
  django: SiDjango,
  flask: SiFlask,
  spring: SiSpring,
  springboot: SiSpring,
  laravel: SiLaravel,
  rails: SiRubyonrails,
  express: SiExpress,
  expressjs: SiExpress,
  dotnet: SiDotnet,
  ".net": SiDotnet,
  flutter: SiFlutter,

  // Databases
  mongodb: SiMongodb,
  mongo: SiMongodb,
  postgresql: SiPostgresql,
  postgres: SiPostgresql,
  mysql: SiMysql,
  redis: SiRedis,
  sqlite: SiSqlite,

  // DevOps & Tools
  docker: SiDocker,
  kubernetes: SiKubernetes,
  k8s: SiKubernetes,
  git: SiGit,

  // Web Technologies
  html: SiHtml5,
  html5: SiHtml5,
  css: SiCss3,
  css3: SiCss3,
  sass: SiSass,
  scss: SiSass,
  tailwind: SiTailwindcss,
  tailwindcss: SiTailwindcss,

  // Build Tools
  webpack: SiWebpack,
  vite: SiVite,
  eslint: SiEslint,
  prettier: SiPrettier,

  // Testing
  jest: SiJest,
  cypress: SiCypress,
  storybook: SiStorybook,

  // Design Tools
  figma: SiFigma,

  // Operating Systems
  linux: SiLinux,
  windows: Monitor,
  macos: SiMacos,
  mac: SiMacos,

  // Cloud Providers
  aws: SiAmazon,
  amazon: SiAmazon,
  azure: Cloud,
  gcp: SiGooglecloud,
  google: SiGooglecloud,
  vercel: SiVercel,
  netlify: SiNetlify,
  heroku: SiHeroku,

  // Backend Services
  firebase: SiFirebase,
  supabase: SiSupabase,
  cloudflare: SiCloudflare,

  // Web Servers
  nginx: SiNginx,
  apache: SiApache,

  // API & Data
  graphql: SiGraphql,
  prisma: SiPrisma,

  // State Management
  redux: SiRedux,
  mobx: SiMobx,

  // UI Frameworks
  bootstrap: SiBootstrap,

  // Package Managers
  npm: SiNpm,
  yarn: SiYarn,
  deno: SiDeno,

  // File Types (fallbacks)
  json: FileText,
  xml: FileText,
  yaml: FileText,
  yml: FileText,
  toml: FileText,
  ini: FileText,
  env: FileText,
  md: FileText,
  markdown: FileText,
  txt: FileText,
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  zip: Archive,
  tar: Archive,
  gz: Archive,
  rar: Archive,
  "7z": Archive,
  folder: Folder,
  directory: Folder,
  url: LinkIcon,
  link: LinkIcon,
  file: FileText,
  code: Code
}

const colorMap: Record<string, string> = {
  // Languages
  javascript: "text-yellow-5000",
  js: "text-yellow-5000",
  typescript: "text-blue-6000",
  ts: "text-blue-6000",
  python: "text-yellow-4000",
  py: "text-yellow-400",
  java: "text-red-6000",
  php: "text-purple-6000",
  ruby: "text-red-5000",
  rb: "text-red-5000",
  go: "text-cyan-5000",
  golang: "text-cyan-500",
  rust: "text-orange-6000",
  rs: "text-orange-600",
  "c++": "text-blue-5000",
  cpp: "text-blue-5000",
  "c#": "text-purple-7000",
  cs: "text-purple-7000",
  kotlin: "text-purple-500",
  swift: "text-orange-500",
  dart: "text-blue-400",

  // Frameworks
  react: "text-blue-4000",
  jsx: "text-blue-4000",
  tsx: "text-blue-4000",
  vue: "text-green-500",
  angular: "text-red-600",
  nodejs: "text-green-600",
  nextjs: "text-black dark:text-white",
  django: "text-green-700",
  flask: "text-gray-700",
  spring: "text-green-600",
  laravel: "text-red-500",
  rails: "text-red-600",
  express: "text-gray-700",
  dotnet: "text-purple-6000",
  flutter: "text-blue-4000",

  // Databases
  mongodb: "text-green-600",
  postgresql: "text-blue-700",
  mysql: "text-blue-600",
  redis: "text-red-600",
  sqlite: "text-blue-500",

  // Web Tech
  html: "text-orange-600",
  css: "text-blue-500",
  sass: "text-pink-500",
  tailwind: "text-teal-500",

  // Default colors
  default: "text-gray-600 dark:text-gray-400"
}

export function LanguageIcon({ language, className, size = 20 }: LanguageIconProps) {
  const normalizedLanguage = language.toLowerCase().trim()
  const IconComponent = iconMap[normalizedLanguage] || FileText
  const iconColor = colorMap[normalizedLanguage] || colorMap.default

  return (
    <IconComponent
      size={size}
      className={cn(iconColor, className)}
    />
  )
}

export function getLanguageColor(language: string): string {
  const normalizedLanguage = language.toLowerCase().trim()
  return colorMap[normalizedLanguage] || colorMap.default
}

export function getLanguageIcon(language: string): React.ComponentType<{ size?: number; className?: string }> {
  const normalizedLanguage = language.toLowerCase().trim()
  return iconMap[normalizedLanguage] || FileText
}

// Helper function to detect language from file extension
export function detectLanguageFromExtension(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || ''

  const extensionMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'react',
    ts: 'typescript',
    tsx: 'react',
    py: 'python',
    java: 'java',
    php: 'php',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    cpp: 'c++',
    cc: 'c++',
    cxx: 'c++',
    c: 'c',
    cs: 'c#',
    kt: 'kotlin',
    swift: 'swift',
    dart: 'dart',
    vue: 'vue',
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'sass',
    sass: 'sass',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    ini: 'ini',
    env: 'env',
    md: 'markdown',
    txt: 'txt',
    pdf: 'pdf',
    doc: 'doc',
    docx: 'docx',
    zip: 'zip',
    tar: 'tar',
    gz: 'gz',
    rar: 'rar',
    '7z': '7z'
  }

  return extensionMap[extension] || 'file'
}

// Helper function to detect framework from package.json dependencies
export function detectFrameworks(dependencies: Record<string, string>): string[] {
  const frameworks: string[] = []

  const frameworkMap: Record<string, string> = {
    'react': 'react',
    'next': 'nextjs',
    'vue': 'vue',
    '@angular/core': 'angular',
    'express': 'express',
    'django': 'django',
    'flask': 'flask',
    'spring-boot': 'spring',
    'laravel': 'laravel',
    'rails': 'rails',
    'flutter': 'flutter'
  }

  Object.keys(dependencies).forEach(dep => {
    if (frameworkMap[dep]) {
      frameworks.push(frameworkMap[dep])
    }
  })

  return frameworks
}
