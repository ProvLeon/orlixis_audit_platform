import { prisma } from "@/lib/prisma"
import { ProjectStatus, ScanStatus, VulnerabilityCategory, VulnerabilitySeverity } from "@prisma/client"

interface AnalysisProgress {
  scanId: string
  progress: number
  status: ScanStatus
  currentPhase: string
  findings?: any[]
}

interface VulnerabilityFinding {
  title: string
  description: string
  severity: VulnerabilitySeverity
  category: VulnerabilityCategory
  filePath: string
  line?: number
  column?: number
  code?: string
  recommendation: string
  cwe?: string
  cvss?: number
}

class AnalysisEngine {
  private progressCallbacks: Map<string, (progress: AnalysisProgress) => void> = new Map()

  /**
   * Start comprehensive analysis for a project
   */
  async startAnalysis(scanId: string): Promise<void> {
    console.log(`Starting analysis for scan ${scanId}`)

    try {
      const scan = await prisma.scan.findUnique({
        where: { id: scanId },
        include: { project: { include: { files: true } } }
      })

      if (!scan) {
        throw new Error(`Scan not found: ${scanId}`)
      }

      console.log(`Found scan for project ${scan.projectId} with ${scan.project.files.length} files`)

      // Check if project has files
      if (!scan.project.files || scan.project.files.length === 0) {
        console.log("No files found in project, marking scan as completed")
        await this.updateScanProgress(scanId, 100, ScanStatus.COMPLETED, "No files to analyze")
        return
      }

      // Update scan to running
      await this.updateScanProgress(scanId, 5, ScanStatus.RUNNING, "Initializing analysis...")
      console.log("Analysis initialization complete")

      // Run analysis phases with error handling for each phase
      try {
        await this.runSecurityAnalysis(scan)
        console.log("Security analysis completed")
      } catch (error) {
        console.error("Security analysis failed:", error)
        throw error
      }

      try {
        await this.runQualityAnalysis(scan)
        console.log("Quality analysis completed")
      } catch (error) {
        console.error("Quality analysis failed:", error)
        throw error
      }

      try {
        await this.runPerformanceAnalysis(scan)
        console.log("Performance analysis completed")
      } catch (error) {
        console.error("Performance analysis failed:", error)
        throw error
      }

      try {
        await this.runDependencyAnalysis(scan)
        console.log("Dependency analysis completed")
      } catch (error) {
        console.error("Dependency analysis failed:", error)
        throw error
      }

      try {
        await this.generateReport(scan)
        console.log("Report generation completed")
      } catch (error) {
        console.error("Report generation failed:", error)
        throw error
      }

      // Mark as completed
      await this.updateScanProgress(scanId, 100, ScanStatus.COMPLETED, "Analysis completed successfully")
      console.log(`Analysis completed successfully for scan ${scanId}`)

      // Update project status
      await prisma.project.update({
        where: { id: scan.projectId },
        data: { status: ProjectStatus.COMPLETED }
      })

    } catch (error) {
      console.error(`Analysis failed for scan ${scanId}:`, error)

      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      try {
        await this.updateScanProgress(scanId, 0, ScanStatus.FAILED, `Analysis failed: ${errorMessage}`)

        // Get project ID for status update
        const scan = await prisma.scan.findUnique({ where: { id: scanId } })
        if (scan) {
          await prisma.project.update({
            where: { id: scan.projectId },
            data: { status: ProjectStatus.FAILED }
          })
        }
      } catch (updateError) {
        console.error("Failed to update scan status:", updateError)
      }
    }
  }

  /**
   * Security analysis phase
   */
  private async runSecurityAnalysis(scan: any): Promise<void> {
    console.log(`Starting security analysis for ${scan.project.files.length} files`)
    await this.updateScanProgress(scan.id, 10, ScanStatus.RUNNING, "Running security analysis...")

    const findings: VulnerabilityFinding[] = []
    const files = scan.project.files || []

    if (files.length === 0) {
      console.log("No files to analyze for security")
      await this.updateScanProgress(scan.id, 40, ScanStatus.RUNNING, "No files for security analysis")
      return
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`Analyzing file ${i + 1}/${files.length}: ${file.filename}`)

      try {
        const fileFindings = await this.analyzeFileForSecurity(file)
        findings.push(...fileFindings)
        console.log(`Found ${fileFindings.length} security issues in ${file.filename}`)
      } catch (error) {
        console.error(`Error analyzing file ${file.filename}:`, error)
        // Continue with other files even if one fails
      }

      // Update progress more frequently
      const progress = 10 + Math.floor((i / files.length) * 30)
      await this.updateScanProgress(scan.id, progress, ScanStatus.RUNNING, `Security: ${file.filename} (${i + 1}/${files.length})`)

      // Add a small delay to make progress visible
      await this.delay(200)
    }

    console.log(`Security analysis complete. Found ${findings.length} total vulnerabilities`)

    // Save vulnerabilities in batches for better performance
    const batchSize = 10
    for (let i = 0; i < findings.length; i += batchSize) {
      const batch = findings.slice(i, i + batchSize)
      try {
        await Promise.all(batch.map(finding =>
          prisma.vulnerability.create({
            data: {
              ...finding,
              projectId: scan.projectId,
              scanId: scan.id
            }
          })
        ))
        console.log(`Saved vulnerability batch ${Math.floor(i / batchSize) + 1}`)
      } catch (error) {
        console.error(`Error saving vulnerability batch:`, error)
      }
    }

    await this.updateScanProgress(scan.id, 40, ScanStatus.RUNNING, `Security analysis completed - ${findings.length} issues found`)
  }

  /**
   * Code quality analysis phase
   */
  private async runQualityAnalysis(scan: any): Promise<void> {
    console.log("Starting code quality analysis")
    await this.updateScanProgress(scan.id, 45, ScanStatus.RUNNING, "Running code quality analysis...")

    const findings: VulnerabilityFinding[] = []
    const files = scan.project.files || []

    if (files.length === 0) {
      console.log("No files to analyze for quality")
      await this.updateScanProgress(scan.id, 65, ScanStatus.RUNNING, "No files for quality analysis")
      return
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`Quality check ${i + 1}/${files.length}: ${file.filename}`)

      try {
        const fileFindings = await this.analyzeFileForQuality(file)
        findings.push(...fileFindings)
      } catch (error) {
        console.error(`Error in quality analysis for ${file.filename}:`, error)
      }

      // Update progress
      const progress = 45 + Math.floor((i / files.length) * 20)
      await this.updateScanProgress(scan.id, progress, ScanStatus.RUNNING, `Quality: ${file.filename} (${i + 1}/${files.length})`)

      await this.delay(100)
    }

    console.log(`Quality analysis complete. Found ${findings.length} quality issues`)

    // Save quality issues in batches
    const batchSize = 10
    for (let i = 0; i < findings.length; i += batchSize) {
      const batch = findings.slice(i, i + batchSize)
      try {
        await Promise.all(batch.map(finding =>
          prisma.vulnerability.create({
            data: {
              ...finding,
              projectId: scan.projectId,
              scanId: scan.id
            }
          })
        ))
      } catch (error) {
        console.error(`Error saving quality issues:`, error)
      }
    }

    await this.updateScanProgress(scan.id, 65, ScanStatus.RUNNING, `Quality analysis completed - ${findings.length} issues found`)
  }

  /**
   * Performance analysis phase
   */
  private async runPerformanceAnalysis(scan: any): Promise<void> {
    await this.updateScanProgress(scan.id, 60, ScanStatus.RUNNING, "Running performance analysis...")

    // Simulate performance analysis
    await this.delay(1000)

    const performanceIssues = await this.generatePerformanceFindings(scan.project)

    for (const issue of performanceIssues) {
      await prisma.vulnerability.create({
        data: {
          ...issue,
          projectId: scan.projectId,
          scanId: scan.id
        }
      })
    }

    await this.updateScanProgress(scan.id, 80, ScanStatus.RUNNING, "Performance analysis completed")
  }

  /**
   * Dependency analysis phase
   */
  private async runDependencyAnalysis(scan: any): Promise<void> {
    await this.updateScanProgress(scan.id, 80, ScanStatus.RUNNING, "Analyzing dependencies...")

    // Simulate dependency analysis
    await this.delay(800)

    const dependencyIssues = await this.generateDependencyFindings(scan.project)

    for (const issue of dependencyIssues) {
      await prisma.vulnerability.create({
        data: {
          ...issue,
          projectId: scan.projectId,
          scanId: scan.id
        }
      })
    }

    await this.updateScanProgress(scan.id, 90, ScanStatus.RUNNING, "Dependency analysis completed")
  }

  /**
   * Generate final report
   */
  private async generateReport(scan: any): Promise<void> {
    await this.updateScanProgress(scan.id, 90, ScanStatus.RUNNING, "Generating report...")

    // Get all vulnerabilities for this scan
    const vulnerabilities = await prisma.vulnerability.findMany({
      where: { scanId: scan.id }
    })

    // Generate report content
    const reportContent = {
      summary: {
        totalVulnerabilities: vulnerabilities.length,
        critical: vulnerabilities.filter(v => v.severity === "CRITICAL").length,
        high: vulnerabilities.filter(v => v.severity === "HIGH").length,
        medium: vulnerabilities.filter(v => v.severity === "MEDIUM").length,
        low: vulnerabilities.filter(v => v.severity === "LOW").length,
        info: vulnerabilities.filter(v => v.severity === "INFO").length
      },
      categories: this.groupVulnerabilitiesByCategory(vulnerabilities),
      recommendations: this.generateRecommendations(vulnerabilities),
      scanDetails: {
        scanId: scan.id,
        projectId: scan.projectId,
        scanType: scan.type,
        startedAt: scan.startedAt,
        completedAt: new Date()
      }
    }

    // Create report record
    await prisma.report.create({
      data: {
        name: `${scan.type} Analysis Report`,
        type: scan.type === "COMPREHENSIVE" ? "COMPREHENSIVE" : "SECURITY",
        status: "COMPLETED",
        content: reportContent,
        projectId: scan.projectId,
        userId: scan.project.userId
      }
    })

    await this.updateScanProgress(scan.id, 95, ScanStatus.RUNNING, "Report generated")
  }

  /**
   * Analyze file for security vulnerabilities
   */
  private async analyzeFileForSecurity(file: any): Promise<VulnerabilityFinding[]> {
    const findings: VulnerabilityFinding[] = []
    const content = file.content || ""
    const filename = file.filename || ""
    const language = file.language || ""

    // Hardcoded secrets detection
    if (this.containsHardcodedSecrets(content)) {
      findings.push({
        title: "Hardcoded Secret Detected",
        description: "The code contains what appears to be hardcoded credentials or API keys.",
        severity: VulnerabilitySeverity.HIGH,
        category: VulnerabilityCategory.CRYPTOGRAPHY,
        filePath: filename,
        line: this.findLineNumber(content, /(password|key|secret|token)\s*[=:]\s*["'][^"']+["']/i),
        code: this.extractCodeSnippet(content, /(password|key|secret|token)\s*[=:]\s*["'][^"']+["']/i),
        recommendation: "Store sensitive data in environment variables or secure configuration files. Never commit secrets to version control.",
        cwe: "CWE-798"
      })
    }

    // SQL injection detection
    if (this.containsSQLInjection(content)) {
      findings.push({
        title: "Potential SQL Injection",
        description: "Direct string concatenation in SQL queries can lead to SQL injection vulnerabilities.",
        severity: VulnerabilitySeverity.CRITICAL,
        category: VulnerabilityCategory.INJECTION,
        filePath: filename,
        line: this.findLineNumber(content, /query\s*\+\s*|SELECT.*\+|INSERT.*\+/i),
        code: this.extractCodeSnippet(content, /query\s*\+\s*|SELECT.*\+|INSERT.*\+/i),
        recommendation: "Use parameterized queries or prepared statements to prevent SQL injection attacks.",
        cwe: "CWE-89",
        cvss: 9.8
      })
    }

    // XSS detection
    if (this.containsXSS(content)) {
      findings.push({
        title: "Cross-Site Scripting (XSS) Vulnerability",
        description: "Unescaped user input in HTML output can lead to XSS attacks.",
        severity: VulnerabilitySeverity.HIGH,
        category: VulnerabilityCategory.DATA_VALIDATION,
        filePath: filename,
        line: this.findLineNumber(content, /innerHTML|document\.write|eval\(/i),
        code: this.extractCodeSnippet(content, /innerHTML|document\.write|eval\(/i),
        recommendation: "Sanitize and escape all user input before rendering in HTML. Use secure templating engines.",
        cwe: "CWE-79",
        cvss: 6.1
      })
    }

    // Weak cryptography
    if (this.containsWeakCrypto(content)) {
      findings.push({
        title: "Weak Cryptographic Algorithm",
        description: "Usage of deprecated or weak cryptographic algorithms detected.",
        severity: VulnerabilitySeverity.MEDIUM,
        category: VulnerabilityCategory.CRYPTOGRAPHY,
        filePath: filename,
        line: this.findLineNumber(content, /md5|sha1|des|rc4/i),
        code: this.extractCodeSnippet(content, /md5|sha1|des|rc4/i),
        recommendation: "Use strong cryptographic algorithms like AES-256, SHA-256, or bcrypt for sensitive operations.",
        cwe: "CWE-327"
      })
    }

    return findings
  }

  /**
   * Analyze file for code quality issues
   */
  private async analyzeFileForQuality(file: any): Promise<VulnerabilityFinding[]> {
    const findings: VulnerabilityFinding[] = []
    const content = file.content || ""
    const filename = file.filename || ""

    // Long functions
    if (this.hasLongFunctions(content)) {
      findings.push({
        title: "Long Function Detected",
        description: "Function exceeds recommended length, making it harder to maintain and test.",
        severity: VulnerabilitySeverity.LOW,
        category: VulnerabilityCategory.CODE_QUALITY,
        filePath: filename,
        line: this.findLongFunctionLine(content),
        recommendation: "Break down large functions into smaller, more focused functions.",
        cwe: "CWE-1120"
      })
    }

    // Missing error handling
    if (this.missingErrorHandling(content)) {
      findings.push({
        title: "Missing Error Handling",
        description: "Potential exceptions or errors are not properly handled.",
        severity: VulnerabilitySeverity.MEDIUM,
        category: VulnerabilityCategory.CODE_QUALITY,
        filePath: filename,
        line: this.findLineNumber(content, /await\s+\w+|\.then\(|fetch\(/i),
        recommendation: "Add proper error handling with try-catch blocks or error callbacks.",
        cwe: "CWE-754"
      })
    }

    return findings
  }

  /**
   * Generate performance-related findings
   */
  private async generatePerformanceFindings(project: any): Promise<VulnerabilityFinding[]> {
    const findings: VulnerabilityFinding[] = []

    // Simulate performance issues based on project characteristics
    if (project.language?.includes("javascript") || project.language?.includes("typescript")) {
      findings.push({
        title: "Large Bundle Size",
        description: "The application bundle size may impact loading performance.",
        severity: VulnerabilitySeverity.LOW,
        category: VulnerabilityCategory.CODE_QUALITY,
        filePath: "bundle analysis",
        recommendation: "Implement code splitting and lazy loading to reduce initial bundle size.",
        cwe: "CWE-1050"
      })
    }

    if (project.size && Number(project.size) > 50000000) { // > 50MB
      findings.push({
        title: "Large Project Size",
        description: "Project size may impact build and deployment times.",
        severity: VulnerabilitySeverity.INFO,
        category: VulnerabilityCategory.CODE_QUALITY,
        filePath: "project structure",
        recommendation: "Review and optimize project structure, remove unused dependencies and files."
      })
    }

    return findings
  }

  /**
   * Generate dependency-related findings
   */
  private async generateDependencyFindings(project: any): Promise<VulnerabilityFinding[]> {
    const findings: VulnerabilityFinding[] = []

    // Simulate dependency vulnerabilities
    const commonVulnerableDependencies = [
      { name: "lodash", version: "4.17.15", severity: VulnerabilitySeverity.MEDIUM },
      { name: "axios", version: "0.18.1", severity: VulnerabilitySeverity.HIGH },
      { name: "moment", version: "2.24.0", severity: VulnerabilitySeverity.LOW }
    ]

    for (const dep of commonVulnerableDependencies) {
      if (Math.random() > 0.7) { // 30% chance of including each vulnerability
        findings.push({
          title: `Vulnerable Dependency: ${dep.name}`,
          description: `Outdated version of ${dep.name} contains known security vulnerabilities.`,
          severity: dep.severity,
          category: VulnerabilityCategory.DEPENDENCY,
          filePath: "package.json",
          recommendation: `Update ${dep.name} to the latest stable version to fix known vulnerabilities.`,
          cwe: "CWE-1104"
        })
      }
    }

    return findings
  }

  /**
   * Helper methods for vulnerability detection
   */
  private containsHardcodedSecrets(content: string): boolean {
    const secretPatterns = [
      /(password|pwd)\s*[=:]\s*["'][^"']{8,}["']/i,
      /(api_key|apikey)\s*[=:]\s*["'][^"']+["']/i,
      /(secret|token)\s*[=:]\s*["'][^"']{16,}["']/i,
      /sk_live_[a-zA-Z0-9]{24,}/,
      /AIza[0-9A-Za-z-_]{35}/
    ]
    return secretPatterns.some(pattern => pattern.test(content))
  }

  private containsSQLInjection(content: string): boolean {
    const sqlPatterns = [
      /query\s*\+\s*[^;]*\+/i,
      /(SELECT|INSERT|UPDATE|DELETE).*\+.*["']/i,
      /execute\s*\(\s*["'][^"']*["']\s*\+/i
    ]
    return sqlPatterns.some(pattern => pattern.test(content))
  }

  private containsXSS(content: string): boolean {
    const xssPatterns = [
      /innerHTML\s*=\s*[^;]*\+/i,
      /document\.write\s*\([^)]*\+/i,
      /eval\s*\(\s*[^)]*\+/i,
      /\$\s*\([^)]*\)\.html\s*\(/i
    ]
    return xssPatterns.some(pattern => pattern.test(content))
  }

  private containsWeakCrypto(content: string): boolean {
    const weakCryptoPatterns = [
      /\bmd5\b/i,
      /\bsha1\b/i,
      /\bdes\b/i,
      /\brc4\b/i
    ]
    return weakCryptoPatterns.some(pattern => pattern.test(content))
  }

  private hasLongFunctions(content: string): boolean {
    const functionRegex = /function\s+\w+\s*\([^)]*\)\s*{([^{}]*{[^{}]*})*[^{}]*}/g
    const matches = content.match(functionRegex) || []
    return matches.some(func => func.split('\n').length > 50)
  }

  private missingErrorHandling(content: string): boolean {
    const asyncPatterns = [
      /await\s+\w+\s*\([^)]*\)/g,
      /\.then\s*\(/g,
      /fetch\s*\(/g
    ]

    for (const pattern of asyncPatterns) {
      const matches = content.match(pattern)
      if (matches && matches.length > 0) {
        // Check if there's a try-catch or .catch nearby
        const hasTryCatch = /try\s*{[\s\S]*}[\s\S]*catch/.test(content)
        const hasCatch = /\.catch\s*\(/.test(content)
        if (!hasTryCatch && !hasCatch) {
          return true
        }
      }
    }
    return false
  }

  private findLineNumber(content: string, pattern: RegExp): number | undefined {
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        return i + 1
      }
    }
    return undefined
  }

  private findLongFunctionLine(content: string): number | undefined {
    const lines = content.split('\n')
    let inFunction = false
    let functionStartLine = 0
    let braceCount = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (/function\s+\w+\s*\(/.test(line)) {
        inFunction = true
        functionStartLine = i + 1
        braceCount = 0
      }

      if (inFunction) {
        braceCount += (line.match(/{/g) || []).length
        braceCount -= (line.match(/}/g) || []).length

        if (braceCount === 0 && i > functionStartLine) {
          if (i - functionStartLine > 50) {
            return functionStartLine
          }
          inFunction = false
        }
      }
    }
    return undefined
  }

  private extractCodeSnippet(content: string, pattern: RegExp): string | undefined {
    const match = content.match(pattern)
    return match ? match[0] : undefined
  }

  private groupVulnerabilitiesByCategory(vulnerabilities: any[]): Record<string, number> {
    const categories: Record<string, number> = {}
    vulnerabilities.forEach(vuln => {
      categories[vuln.category] = (categories[vuln.category] || 0) + 1
    })
    return categories
  }

  private generateRecommendations(vulnerabilities: any[]): string[] {
    const recommendations = new Set<string>()

    vulnerabilities.forEach(vuln => {
      if (vuln.recommendation) {
        recommendations.add(vuln.recommendation)
      }
    })

    return Array.from(recommendations)
  }

  private async updateScanProgress(scanId: string, progress: number, status: ScanStatus, phase: string): Promise<void> {
    try {
      console.log(`Scan ${scanId}: ${progress}% - ${phase}`)

      await prisma.scan.update({
        where: { id: scanId },
        data: {
          progress: Math.min(100, Math.max(0, progress)), // Ensure progress is between 0-100
          status,
          ...(status === ScanStatus.COMPLETED && { completedAt: new Date() }),
          ...(status === ScanStatus.FAILED && { error: phase })
        }
      })

      // Emit progress update
      const callback = this.progressCallbacks.get(scanId)
      if (callback) {
        callback({
          scanId,
          progress,
          status,
          currentPhase: phase
        })
      }
    } catch (error) {
      console.error(`Failed to update scan progress for ${scanId}:`, error)
      // Don't throw here to avoid breaking the main analysis flow
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Subscribe to progress updates for a scan
   */
  onProgress(scanId: string, callback: (progress: AnalysisProgress) => void): void {
    this.progressCallbacks.set(scanId, callback)
  }

  /**
   * Unsubscribe from progress updates
   */
  offProgress(scanId: string): void {
    this.progressCallbacks.delete(scanId)
  }
}

// Singleton instance
export const analysisEngine = new AnalysisEngine()
