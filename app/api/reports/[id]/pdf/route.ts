import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { vercelPdfGenerator } from "@/lib/pdf-utils-vercel"
import { reactPdfGenerator } from "@/lib/pdf-react-generator"
import { dedupeVulnerabilities, computeScoreAndRisk, unifySecurityMetric, countBySeverity } from "@/lib/reportTheme"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: reportId } = await params

    // Resolve user ID
    let resolvedUserId = (session.user.id || "").trim()
    try {
      if (!resolvedUserId) throw new Error("Missing session user id")
      const existingById = await prisma.user.findUnique({ where: { id: resolvedUserId } })
      if (!existingById) throw new Error("User not found by id")
    } catch {
      const email = (session.user.email || "").trim()
      if (!email) {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 })
      }
      const upserted = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email, name: session.user.name, image: (session.user as any).image }
      })
      resolvedUserId = upserted.id
    }

    // Fetch the report with related data
    const [report, vulnerabilities, project, scan] = await Promise.all([
      prisma.report.findFirst({
        where: { id: reportId },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              description: true,
              language: true,
              framework: true,
              repositoryUrl: true,
              branch: true,
              size: true,
              userId: true
            }
          }
        }
      }),
      prisma.vulnerability.findMany({
        where: {
          project: {
            reports: {
              some: { id: reportId }
            }
          }
        },
        select: {
          id: true,
          title: true,
          severity: true,
          category: true,
          description: true,
          filePath: true,
          line: true,
          function: true,
          recommendation: true,
          cwe: true,
          cvss: true,
          discoveredAt: true
        },
        orderBy: [
          { severity: "desc" },
          { discoveredAt: "desc" }
        ]
      }),
      prisma.project.findFirst({
        where: {
          reports: { some: { id: reportId } },
          userId: resolvedUserId
        }
      }),
      prisma.scan.findFirst({
        where: {
          project: {
            reports: { some: { id: reportId } }
          }
        },
        orderBy: { startedAt: "desc" }
      })
    ])

    if (!report || !project) {
      return NextResponse.json({ error: "Report not found or access denied" }, { status: 404 })
    }

    // Now fetch project file statistics with confirmed project ID
    const projectStats = await prisma.projectFile.aggregate({
      where: { projectId: project.id },
      _count: { id: true },
      _sum: { size: true }
    })

    // Calculate lines of code estimation (rough estimate: 30 lines per KB)
    const estimatedLines = projectStats._sum.size ? Math.round(Number(projectStats._sum.size) / 1024 * 30) : 0

    // Enhance project data with actual statistics
    const enhancedProject = {
      ...project,
      totalFiles: projectStats._count.id || 0,
      totalLines: estimatedLines
    }

    // Generate PDF from enhanced template
    const pdfBuffer = await generateProfessionalPDF(report, enhancedProject, vulnerabilities, scan)

    // Update report with PDF info
    await prisma.report.update({
      where: { id: reportId },
      data: {
        pdfUrl: `/api/reports/${reportId}/pdf`,
        updatedAt: new Date()
      }
    })

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${project.name.replace(/[^a-zA-Z0-9]/g, '_')}-security-audit-report.pdf"`,
        "Cache-Control": "private, max-age=3600"
      }
    })

  } catch (error) {
    console.error("PDF generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    )
  }
}

async function generateProfessionalPDF(
  report: any,
  project: any,
  vulnerabilities: any[],
  scan: any
): Promise<Buffer> {
  console.log('Starting PDF generation for report:', report.id)

  // Strategy 1: Try Playwright with Chrome (HTML-based PDF)
  try {
    console.log('Attempting PDF generation with Playwright...')

    const htmlContent = generateProfessionalHTML(report, project, vulnerabilities, scan)

    const pdfBuffer = await vercelPdfGenerator.generatePDF(htmlContent, {
      format: 'A4',
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 9px; color: #666; text-align: center; width: 100%; padding: 5px;">
          <span>Orlixis Security Audit Report - ${project.name}</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 9px; color: #666; text-align: center; width: 100%; padding: 5px;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Generated on ${new Date().toLocaleDateString()}</span>
        </div>
      `,
      timeout: 120000 // 2 minutes timeout for serverless
    })

    console.log('Playwright PDF generated successfully, size:', pdfBuffer.length, 'bytes')
    return pdfBuffer

  } catch (playwrightError: any) {
    console.warn('Playwright PDF generation failed, trying React PDF fallback:', playwrightError.message)

    // Strategy 2: Fallback to React PDF (Chrome-free)
    try {
      console.log('Attempting PDF generation with React PDF...')

      const pdfBuffer = await reactPdfGenerator.generatePDF(report, project, vulnerabilities, scan, {
        format: 'A4',
        timeout: 60000
      })

      console.log('React PDF generated successfully, size:', pdfBuffer.length, 'bytes')
      return pdfBuffer

    } catch (reactPdfError: any) {
      console.error('Both PDF generation methods failed')
      console.error('Playwright error:', playwrightError.message)
      console.error('React PDF error:', reactPdfError.message)

      // Provide comprehensive error information
      throw new Error(`
PDF generation failed with both methods:

1. Playwright (Chrome-based): ${playwrightError.message}
2. React PDF (Chrome-free): ${reactPdfError.message}

This may be due to:
- Missing dependencies (chrome-aws-lambda, playwright-core, @react-pdf/renderer)
- Serverless environment limitations
- Memory constraints
- Network timeouts

Please check your deployment configuration and try again.
      `.trim())
    }
  }
}

function generateProfessionalHTML(
  report: any,
  project: any,
  rawVulnerabilities: any[],
  scan: any
): string {
  // Deduplicate vulnerabilities using shared utilities
  const vulnerabilities = dedupeVulnerabilities(rawVulnerabilities || [])

  // Compute unified score and risk using shared utilities
  const { score: overallScore, risk } = computeScoreAndRisk(vulnerabilities)

  // Calculate severity counts from deduped vulnerabilities
  const severityCounts = countBySeverity(vulnerabilities)
  const safeDate = (date: any): Date => {
    if (!date) return new Date()
    if (date instanceof Date) return date
    try {
      return new Date(date)
    } catch {
      return new Date()
    }
  }

  const formatDateTime = (date: Date | string) => {
    return safeDate(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const severityColors = {
    CRITICAL: { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' },
    HIGH: { bg: '#fed7aa', text: '#ea580c', border: '#fdba74' },
    MEDIUM: { bg: '#fef3c7', text: '#d97706', border: '#fcd34d' },
    LOW: { bg: '#dbeafe', text: '#2563eb', border: '#93c5fd' },
    INFO: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }
  }

  const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']
  const sortedVulnerabilities = vulnerabilities.sort((a, b) => {
    return severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
  })

  const getRiskLevel = (riskType: string) => {
    switch (riskType) {
      case 'LOW': return { level: 'LOW', color: '#007b8c' }
      case 'MEDIUM': return { level: 'MEDIUM', color: '#d97706' }
      case 'HIGH': return { level: 'HIGH', color: '#ea580c' }
      case 'CRITICAL': return { level: 'CRITICAL', color: '#dc2626' }
      default: return { level: 'LOW', color: '#007b8c' }
    }
  }

  const riskLevel = getRiskLevel(risk)

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.name} - Security Audit Report</title>
    <style>
        @page {
            margin: 15mm;
            size: A4;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            font-size: 11px;
        }

        .page-break {
            page-break-before: always;
        }

        .avoid-break {
            page-break-inside: avoid;
        }

        .header {
            border-bottom: 3px solid #0d9488;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 15px;
        }

        .logo {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #007b8c, #008da0);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 24px;
        }

        .title {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 5px;
        }

        .subtitle {
            font-size: 16px;
            color: #6b7280;
        }

        .meta-info {
            display: flex;
            justify-content: space-between;
            background: linear-gradient(135deg, #f0fdfa, #ecfdf5);
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #007b8c20;
        }

        .meta-column h3 {
            font-size: 12px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 8px;
        }

        .meta-column p {
            font-size: 10px;
            color: #6b7280;
            margin-bottom: 3px;
        }

        .score-section {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .score-circle {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, #007b8c, #008da0);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0, 123, 140, 0.3);
        }

        .risk-badge {
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            color: ${riskLevel.color};
            background: ${riskLevel.color}20;
            border: 1px solid ${riskLevel.color}40;
        }

        .section {
            margin: 30px 0;
        }

        .section-title {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #007b8c;
        }

        .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
            margin: 24px 0;
        }

        .summary-card {
            background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .summary-card .number {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 8px;
        }

        .summary-card .label {
            font-size: 12px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 4px;
        }

        .summary-card .description {
            font-size: 10px;
            color: #6b7280;
        }

        .high-risk .number { color: #dc2626; }
        .medium-risk .number { color: #d97706; }
        .low-risk .number { color: #007b8c; }

        .vulnerability-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 16px;
            margin: 24px 0;
        }

        .vuln-summary {
            padding: 20px;
            text-align: center;
            border-radius: 12px;
            border: 2px solid #e5e7eb;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .vuln-count {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .vuln-label {
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .vulnerability-item {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
            page-break-inside: avoid;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .vuln-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
        }

        .vuln-title {
            font-size: 14px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 8px;
        }

        .vuln-badges {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
        }

        .badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .location {
            font-family: 'Monaco', 'Menlo', monospace;
            background: #f3f4f6;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 9px;
            color: #374151;
        }

        .vuln-number {
            font-size: 10px;
            color: #6b7280;
            font-weight: 600;
        }

        .vuln-content h4 {
            font-size: 11px;
            font-weight: 600;
            color: #374151;
            margin: 15px 0 8px 0;
        }

        .vuln-content p {
            font-size: 10px;
            color: #4b5563;
            line-height: 1.5;
            margin-bottom: 10px;
        }

        .cwe-info {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 10px;
            font-size: 9px;
            color: #6b7280;
        }

        .cwe-code {
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
        }

        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            font-size: 9px;
            color: #6b7280;
        }

        .footer h3 {
            font-size: 10px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 8px;
        }

        .footer-brand {
            text-align: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            font-size: 9px;
            color: #9ca3af;
        }

        .prose {
            font-size: 11px;
            line-height: 1.6;
            color: #4b5563;
        }

        .prose p {
            margin-bottom: 12px;
        }

        .executive-summary {
            background: linear-gradient(135deg, #f0fdfa, #ecfdf5);
            border: 2px solid #007b8c20;
            border-radius: 12px;
            padding: 25px;
            margin: 20px 0;
            box-shadow: 0 2px 8px rgba(0, 123, 140, 0.1);
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div class="logo-section">
            <div class="logo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <path d="M9 9h6v6H9z"/>
                </svg>
            </div>
            <div>
                <div class="title">Security Audit Report</div>
                <div class="subtitle">Project: ${project.name}</div>
            </div>
        </div>

        <div class="meta-info">
            <div class="meta-column">
                <h3>Project Details</h3>
                <p><strong>Languages:</strong> ${(project.language || []).join(", ") || "Not specified"}</p>
                <p><strong>Framework:</strong> ${(project.framework || []).join(", ") || "Not specified"}</p>
                <p><strong>Files Scanned:</strong> ${project.totalFiles || 0}</p>
                <p><strong>Lines of Code:</strong> ${project.totalLines ? project.totalLines.toLocaleString() : 0}</p>
            </div>

            <div class="meta-column">
                <h3>Scan Information</h3>
                <p><strong>Type:</strong> ${report.type || 'Security'}</p>
                <p><strong>Started:</strong> ${formatDateTime(scan?.startedAt || report.createdAt)}</p>
                <p><strong>Completed:</strong> ${formatDateTime(scan?.completedAt || report.updatedAt)}</p>
                <p><strong>Issues Found:</strong> ${vulnerabilities?.length || 0}</p>
            </div>

            <div class="meta-column">
                <div class="score-section">
                    <div class="score-circle">${overallScore}</div>
                    <div>
                        <div class="risk-badge">${riskLevel.level} RISK</div>
                        <p style="margin-top: 8px; font-size: 9px; color: #007b8c; font-weight: 600;">Security Score</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Executive Summary -->
    <div class="section avoid-break">
        <h2 class="section-title">Executive Summary</h2>
        <div class="executive-summary">
            <div class="prose">
                <p>This comprehensive security audit report provides a detailed analysis of the <strong style="color: #007b8c;">${project.name}</strong> project. The assessment covers security vulnerabilities, code quality metrics, and performance indicators.</p>

                ${severityCounts.CRITICAL > 0 ?
      `<p><strong>Critical Findings:</strong> ${severityCounts.CRITICAL} critical vulnerabilities require immediate attention to prevent potential security breaches.</p>` :
      ''
    }

                <p>This professional audit provides detailed findings, risk assessments, and actionable recommendations to improve the security posture of your application.</p>
            </div>
        </div>

        <div class="summary-grid">
            <div class="summary-card high-risk">
                <div class="number">${severityCounts.CRITICAL + severityCounts.HIGH}</div>
                <div class="label">High-Risk Issues</div>
                <div class="description">Require immediate attention</div>
            </div>

            <div class="summary-card medium-risk">
                <div class="number">${severityCounts.MEDIUM}</div>
                <div class="label">Medium-Risk Issues</div>
                <div class="description">Should be addressed soon</div>
            </div>

            <div class="summary-card low-risk">
                <div class="number">${severityCounts.LOW + severityCounts.INFO}</div>
                <div class="label">Low-Risk Issues</div>
                <div class="description">Good to fix when possible</div>
            </div>
        </div>
    </div>

    <!-- Vulnerability Overview -->
    <div class="section avoid-break">
        <h2 class="section-title">Vulnerability Overview</h2>
        <div class="vulnerability-grid">
            ${Object.keys(severityColors).map(severity => {
      const count = severityCounts[severity as keyof typeof severityCounts] || 0
      const colors = severityColors[severity as keyof typeof severityColors]
      return `
                <div class="vuln-summary" style="background: ${colors.bg}; border-color: ${colors.border};">
                    <div class="vuln-count" style="color: ${colors.text};">${count}</div>
                    <div class="vuln-label" style="color: #374151; font-weight: 600;">${severity}</div>
                </div>
                `
    }).join('')}
        </div>
    </div>

    ${sortedVulnerabilities.length > 0 ? `
    <!-- Detailed Findings -->
    <div class="page-break"></div>
    <div class="section">
        <h2 class="section-title">Detailed Findings</h2>
        ${sortedVulnerabilities.map((vuln, index) => {
      const colors = severityColors[vuln.severity as keyof typeof severityColors]
      return `
            <div class="vulnerability-item avoid-break">
                <div class="vuln-header">
                    <div>
                        <div class="vuln-badges">
                            <span class="badge" style="background: ${colors.bg}; color: ${colors.text}; border: 1px solid ${colors.border};">
                                ${vuln.severity}
                            </span>
                            <span class="badge" style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db;">
                                ${vuln.category}
                            </span>
                            ${vuln.cvss ? `<span class="badge" style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db;">CVSS: ${vuln.cvss}</span>` : ''}
                        </div>
                        <div class="vuln-title">${vuln.title || `${vuln.category} Vulnerability`}</div>
                        <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                            <span style="font-size: 10px; color: #6b7280; font-weight: 600;">@</span>
                            <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-family: 'Courier New', monospace;">
                                ${vuln.filePath || 'Unknown file'}${vuln.line ? `:${vuln.line}` : ''}
                            </code>
                            ${vuln.function ? `<span style="font-size: 9px; color: #6b7280; font-style: italic;">in ${vuln.function}()</span>` : ''}
                        </div>
                    </div>
                    <div class="vuln-number">#${index + 1}</div>
                </div>

                <div class="vuln-content">
                    <h4>Description</h4>
                    <p>${vuln.description || 'No description available.'}</p>

                    <h4>Impact</h4>
                    <p>Potential security risk that could affect the application.</p>

                    <h4>Recommendation</h4>
                    <p>${vuln.recommendation || 'Review and address this vulnerability according to security best practices.'}</p>

                    ${vuln.cwe ? `
                    <div class="cwe-info">
                        <span><strong>CWE:</strong></span>
                        <span class="cwe-code">CWE-${vuln.cwe}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            `
    }).join('')}
    </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
        <div>
            <h3>Report Information</h3>
            <p><strong>ID:</strong> ${report.id || 'Unknown'}</p>
            <p><strong>Generated:</strong> ${formatDateTime(new Date())}</p>
            <p><strong>Version:</strong> 1.0</p>
        </div>

        <div>
            <h3>Scan Details</h3>
            <p><strong>Engine:</strong> Orlixis Security Scanner</p>
            <p><strong>Type:</strong> ${report.type || 'Security'}</p>
            <p><strong>Duration:</strong> ${scan?.duration ? Math.round(scan.duration / 1000) + 's' : 'N/A'}</p>
        </div>

        <div>
            <h3>Project Info</h3>
            <p><strong>Name:</strong> ${project.name || 'Unknown Project'}</p>
            <p><strong>Files Scanned:</strong> ${project.totalFiles ? project.totalFiles.toLocaleString() : 0}</p>
            <p><strong>Lines of Code:</strong> ${project.totalLines ? project.totalLines.toLocaleString() : 0}</p>
        </div>
    </div>

    <div class="footer-brand">
        <p>This report was generated by <strong style="color: #007b8c;">Orlixis Audit Platform</strong> - Professional Security Analysis</p>
    </div>
</body>
</html>
`
}
