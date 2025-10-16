/**
 * Shared theme + scoring utilities for Orlixis reports (web + PDF).
 *
 * This module centralizes:
 * - Brand palette and severity/risk color tokens
 * - Scoring and risk threshold logic (kept identical across surfaces)
 * - Vulnerability helpers (dedupe, counts, ordering)
 *
 * Use these utilities in both the PDF generator and the web report to guarantee
 * visual and logical consistency.
 */

/* ================================
 * Types
 * ================================ */

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO"
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export interface VulnerabilityLite {
  id?: string
  title?: string
  category?: string
  description?: string
  filePath?: string | null
  line?: number | null
  function?: string | null
  cwe?: string | null
  cvss?: number | null
  severity: Severity
  discoveredAt?: string | Date | null
}

/* ================================
 * Brand + Theme Tokens
 * ================================ */

export const palette = {
  brand: {
    teal: "#007b8c",
    teal600: "#0d9488",
    teal700: "#008da0",
  },
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    500: "#6b7280",
    600: "#475569",
    700: "#374151",
    900: "#111827",
  },
  red: {
    50: "#fef2f2",
    100: "#fee2e2",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    300: "#fca5a5",
  },
  orange: {
    50: "#fff7ed",
    100: "#fed7aa",
    400: "#fb923c",
    500: "#f97316",
    600: "#ea580c",
    300: "#fdba74",
  },
  yellow: {
    50: "#fffbeb",
    100: "#fef3c7",
    400: "#facc15",
    500: "#eab308",
    600: "#d97706",
    300: "#fcd34d",
  },
  blue: {
    50: "#eff6ff",
    100: "#dbeafe",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    300: "#93c5fd",
  },
  slate: {
    50: "#f8fafc",
    100: "#f1f5f9",
    300: "#cbd5e1",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
  },
}

export const severityColors: Record<
  Severity,
  { bg: string; text: string; border: string }
> = {
  CRITICAL: { bg: palette.red[100], text: palette.red[600], border: palette.red[300] },
  HIGH: { bg: palette.orange[100], text: palette.orange[600], border: palette.orange[300] },
  MEDIUM: { bg: palette.yellow[100], text: palette.yellow[600], border: palette.yellow[300] },
  LOW: { bg: palette.blue[100], text: palette.blue[600], border: palette.blue[300] },
  INFO: { bg: palette.slate[100], text: palette.slate[600], border: palette.slate[300] },
}

export const riskLevelConfig: Record<
  RiskLevel,
  { color: string; bg: string }
> = {
  LOW: { color: "#16a34a", bg: "#ecfdf5" },
  MEDIUM: { color: palette.yellow[600], bg: palette.yellow[50] },
  HIGH: { color: palette.orange[600], bg: palette.orange[50] },
  CRITICAL: { color: palette.red[600], bg: palette.red[50] },
}

export const reportTheme = {
  borderRadius: {
    sm: "6px",
    md: "10px",
    lg: "12px",
    xl: "16px",
  },
  shadow: {
    sm: "0 1px 2px rgba(0,0,0,.05)",
    md: "0 2px 6px rgba(0,0,0,.08)",
    lg: "0 4px 12px rgba(0,0,0,.10)",
  },
  headerAccent: palette.brand.teal600,
}

/* ================================
 * Severity helpers
 * ================================ */

export const severityOrder: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]

export function getSeverityRank(sev: Severity): number {
  return severityOrder.indexOf(sev)
}

export function countBySeverity(vulns: VulnerabilityLite[]): Record<Severity, number> {
  const counts: Record<Severity, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    INFO: 0,
  }
  for (const v of vulns) {
    counts[v.severity] = (counts[v.severity] || 0) + 1
  }
  return counts
}

export function sortBySeverityDesc<T extends VulnerabilityLite>(items: T[]): T[] {
  return [...items].sort((a, b) => getSeverityRank(a.severity) - getSeverityRank(b.severity))
}

/* ================================
 * Scoring + Risk thresholds
 * ================================
 * Keep these functions IDENTICAL between web and PDF usage.
 * Score = 100 - (CRITICAL×20 + HIGH×10 + MEDIUM×5)
 * Risk:  LOW >= 90, MEDIUM >= 70, HIGH >= 40, else CRITICAL
 */

export const severityWeights = {
  CRITICAL: 20,
  HIGH: 10,
  MEDIUM: 5,
  LOW: 0,
  INFO: 0,
}

export function clampScore(score: number): number {
  if (Number.isNaN(score) || !Number.isFinite(score)) return 0
  return Math.min(100, Math.max(0, Math.round(score)))
}

export function calculateOverallScore(vulns: VulnerabilityLite[]): number {
  if (!Array.isArray(vulns) || vulns.length === 0) return 100

  let score = 100
  for (const v of vulns) {
    score -= severityWeights[v.severity as keyof typeof severityWeights] ?? 0
  }
  return clampScore(score)
}

export function getRiskLevelFromScore(score: number): RiskLevel {
  if (score >= 90) return "LOW"
  if (score >= 70) return "MEDIUM"
  if (score >= 40) return "HIGH"
  return "CRITICAL"
}

/**
 * Convenience to compute both score and risk from a list of vulns.
 */
export function computeScoreAndRisk(vulns: VulnerabilityLite[]): { score: number; risk: RiskLevel } {
  const score = calculateOverallScore(vulns)
  const risk = getRiskLevelFromScore(score)
  return { score, risk }
}

/* ================================
 * Deduplication
 * ================================
 * Findings can be duplicated (same title/file/line/CWE) by multiple passes.
 * We dedupe on (title|filePath|line|cwe) and keep the highest severity entry.
 */

export function dedupeVulnerabilities<T extends VulnerabilityLite>(vulns: T[]): T[] {
  if (!Array.isArray(vulns) || vulns.length === 0) return []

  const rank = (s: Severity) => ({ CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, INFO: 0 }[s] ?? 0)

  const byKey = new Map<string, T>()
  for (const v of vulns) {
    const key = makeVulnKey(v)
    const prev = byKey.get(key)
    if (!prev) {
      byKey.set(key, v)
      continue
    }
    // Prefer higher severity; if same severity, prefer larger CVSS if present
    if (rank(v.severity) > rank(prev.severity)) {
      byKey.set(key, v)
    } else if (rank(v.severity) === rank(prev.severity)) {
      const a = v.cvss ?? -1
      const b = prev.cvss ?? -1
      if (a > b) byKey.set(key, v)
    }
  }
  return Array.from(byKey.values())
}

export function makeVulnKey(v: VulnerabilityLite): string {
  const title = (v.title || "").trim().toLowerCase()
  const file = (v.filePath || "").trim().toLowerCase()
  const line = v.line ?? ""
  const cwe = (v.cwe || "").trim().toLowerCase()
  return `${title}|${file}|${line}|${cwe}`
}

/* ================================
 * Consistency helpers (metrics)
 * ================================ */

/**
 * Ensure "Security Score" metric aligns with the header/summary score.
 * If a fallback is provided (legacy or external), the summary score wins.
 */
export function unifySecurityMetric(summaryScore: number, _fallback?: number): number {
  return clampScore(summaryScore)
}

/* ================================
 * Export a single object for easy use
 * ================================ */

export const ReportTokens = {
  palette,
  severityColors,
  riskLevelConfig,
  reportTheme,
  severityOrder,
  severityWeights,
}
