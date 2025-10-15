import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function formatDate(date: Date | string | number) {
  const d = new Date(date)
  const t = d.getTime()
  if (!Number.isFinite(t)) return "—"
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d)
}

export function formatDateTime(date: Date | string | number) {
  const d = new Date(date)
  const t = d.getTime()
  if (!Number.isFinite(t)) return "—"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

export function formatRelativeTime(date: Date | string | number) {
  const now = new Date()
  const targetDate = new Date(date)
  const t = targetDate.getTime()
  if (!Number.isFinite(t)) return "—"
  const diffInSeconds = Math.floor((now.getTime() - t) / 1000)

  if (diffInSeconds < 60) {
    return "Just now"
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }

  return formatDate(targetDate)
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200
  const wordCount = text.trim().split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export function parseFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export function getFileIcon(filename: string): string {
  const extension = parseFileExtension(filename)

  const iconMap: Record<string, string> = {
    // Web files
    'html': 'html',
    'css': 'css',
    'js': 'javascript',
    'ts': 'typescript',
    'jsx': 'react',
    'tsx': 'react',
    'vue': 'vue',
    'svelte': 'svelte',

    // Backend
    'py': 'python',
    'java': 'java',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',

    // Config files
    'json': 'json',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'toml': 'toml',
    'ini': 'config',
    'env': 'config',

    // Documentation
    'md': 'markdown',
    'txt': 'text',
    'pdf': 'pdf',
    'doc': 'doc',
    'docx': 'doc',

    // Images
    'png': 'image',
    'jpg': 'image',
    'jpeg': 'image',
    'gif': 'image',
    'svg': 'image',
    'webp': 'image',

    // Archives
    'zip': 'archive',
    'tar': 'archive',
    'gz': 'archive',
    'rar': 'archive',
    '7z': 'archive',
  }

  return iconMap[extension] || 'file'
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const SEVERITY_COLORS = {
  critical: 'text-red-600 bg-red-50 border-red-200',
  high: 'text-orange-600 bg-orange-50 border-orange-200',
  medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  low: 'text-blue-600 bg-blue-50 border-blue-200',
  info: 'text-gray-600 bg-gray-50 border-gray-200',
} as const

export const SEVERITY_ICONS = {
  critical: 'AlertTriangle',
  high: 'AlertCircle',
  medium: 'Info',
  low: 'CheckCircle',
  info: 'Circle',
} as const

export function getSeverityColor(severity: keyof typeof SEVERITY_COLORS) {
  return SEVERITY_COLORS[severity] || SEVERITY_COLORS.info
}

export function getSeverityIcon(severity: keyof typeof SEVERITY_ICONS) {
  return SEVERITY_ICONS[severity] || SEVERITY_ICONS.info
}

export function getLanguageDisplayName(language: string): string {
  const displayNames: Record<string, string> = {
    'js': 'JavaScript',
    'ts': 'TypeScript',
    'jsx': 'React JSX',
    'tsx': 'React TSX',
    'py': 'Python',
    'java': 'Java',
    'php': 'PHP',
    'rb': 'Ruby',
    'go': 'Go',
    'rs': 'Rust',
    'cpp': 'C++',
    'c': 'C',
    'cs': 'C#',
    'html': 'HTML',
    'css': 'CSS',
    'vue': 'Vue.js',
    'svelte': 'Svelte',
    'md': 'Markdown',
    'json': 'JSON',
    'yaml': 'YAML',
    'yml': 'YAML',
    'xml': 'XML',
    'toml': 'TOML',
  }

  return displayNames[language.toLowerCase()] || language.toUpperCase()
}
