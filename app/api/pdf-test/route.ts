import { NextRequest, NextResponse } from "next/server"
import { vercelPdfGenerator } from "@/lib/pdf-utils-vercel"
import { reactPdfGenerator } from "@/lib/pdf-react-generator"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const method = searchParams.get('method') || 'both' // 'playwright', 'react', or 'both'

    console.log(`PDF test endpoint called with method: ${method}`)

    // Test data
    const testReport = {
      id: 'test-report-123',
      title: 'Test Security Audit Report',
      createdAt: new Date().toISOString()
    }

    const testProject = {
      name: 'Test Project',
      description: 'A test project for PDF generation',
      language: 'JavaScript',
      framework: 'React',
      repositoryUrl: 'https://github.com/test/repo',
      branch: 'main'
    }

    const testVulnerabilities = [
      {
        id: '1',
        title: 'Cross-Site Scripting (XSS)',
        description: 'Potential XSS vulnerability found in user input handling',
        severity: 'high',
        file: 'src/components/UserInput.js',
        line: 42,
        cwe: 'CWE-79'
      },
      {
        id: '2',
        title: 'Insecure Direct Object Reference',
        description: 'Direct object reference without proper authorization',
        severity: 'medium',
        file: 'src/api/users.js',
        line: 78,
        cwe: 'CWE-639'
      },
      {
        id: '3',
        title: 'Information Disclosure',
        description: 'Sensitive information exposed in error messages',
        severity: 'low',
        file: 'src/utils/errorHandler.js',
        line: 15,
        cwe: 'CWE-200'
      }
    ]

    const testScan = {
      id: 'test-scan-456',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    }

    const results: any = {}

    // Test Playwright PDF generation
    if (method === 'playwright' || method === 'both') {
      try {
        console.log('Testing Playwright PDF generation...')
        const startTime = Date.now()

        const testHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Test PDF Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #2563eb; border-bottom: 2px solid #2563eb; }
              .vulnerability { background: #f8fafc; padding: 10px; margin: 10px 0; border-left: 3px solid #ef4444; }
              .severity-high { color: #dc2626; font-weight: bold; }
              .severity-medium { color: #ea580c; font-weight: bold; }
              .severity-low { color: #ca8a04; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>Security Audit Report - ${testProject.name}</h1>
            <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Language:</strong> ${testProject.language}</p>
            <p><strong>Framework:</strong> ${testProject.framework}</p>

            <h2>Vulnerabilities Found</h2>
            ${testVulnerabilities.map(vuln => `
              <div class="vulnerability">
                <h3>${vuln.title}</h3>
                <p class="severity-${vuln.severity}">Severity: ${vuln.severity.toUpperCase()}</p>
                <p>${vuln.description}</p>
                <p><strong>File:</strong> ${vuln.file} (Line: ${vuln.line})</p>
                <p><strong>CWE:</strong> ${vuln.cwe}</p>
              </div>
            `).join('')}
          </body>
          </html>
        `

        const playwrightBuffer = await vercelPdfGenerator.generatePDF(testHtml, {
          format: 'A4',
          timeout: 60000
        })

        const endTime = Date.now()
        results.playwright = {
          success: true,
          size: playwrightBuffer.length,
          duration: endTime - startTime,
          message: 'Playwright PDF generation successful'
        }

        console.log(`Playwright PDF test successful: ${playwrightBuffer.length} bytes in ${endTime - startTime}ms`)

      } catch (playwrightError: any) {
        results.playwright = {
          success: false,
          error: playwrightError.message,
          message: 'Playwright PDF generation failed'
        }
        console.error('Playwright PDF test failed:', playwrightError.message)
      }
    }

    // Test React PDF generation
    if (method === 'react' || method === 'both') {
      try {
        console.log('Testing React PDF generation...')
        const startTime = Date.now()

        const reactBuffer = await reactPdfGenerator.generatePDF(
          testReport,
          testProject,
          testVulnerabilities,
          testScan
        )

        const endTime = Date.now()
        results.react = {
          success: true,
          size: reactBuffer.length,
          duration: endTime - startTime,
          message: 'React PDF generation successful'
        }

        console.log(`React PDF test successful: ${reactBuffer.length} bytes in ${endTime - startTime}ms`)

      } catch (reactError: any) {
        results.react = {
          success: false,
          error: reactError.message,
          message: 'React PDF generation failed'
        }
        console.error('React PDF test failed:', reactError.message)
      }
    }

    // Health checks
    const healthChecks: any = {}

    if (method === 'playwright' || method === 'both') {
      try {
        healthChecks.playwright = await vercelPdfGenerator.healthCheck()
      } catch (error: any) {
        healthChecks.playwright = {
          success: false,
          message: `Health check failed: ${error.message}`
        }
      }
    }

    if (method === 'react' || method === 'both') {
      try {
        healthChecks.react = await reactPdfGenerator.healthCheck()
      } catch (error: any) {
        healthChecks.react = {
          success: false,
          message: `Health check failed: ${error.message}`
        }
      }
    }

    // Return results
    const response = {
      timestamp: new Date().toISOString(),
      method,
      results,
      healthChecks,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercel: !!process.env.VERCEL,
        awsLambda: !!process.env.AWS_LAMBDA_FUNCTION_NAME,
        platform: process.platform,
        arch: process.arch
      },
      recommendations: []
    }

    // Add recommendations based on results
    if (results.playwright && !results.playwright.success) {
      response.recommendations.push(
        'Playwright failed - consider using React PDF for serverless environments'
      )
    }

    if (results.react && !results.react.success) {
      response.recommendations.push(
        'React PDF failed - check @react-pdf/renderer installation'
      )
    }

    if (results.playwright?.success && results.react?.success) {
      response.recommendations.push(
        'Both methods work - Playwright provides better HTML rendering, React PDF is more reliable in serverless'
      )
    }

    if (!results.playwright?.success && !results.react?.success) {
      response.recommendations.push(
        'Both methods failed - check dependencies and serverless configuration'
      )
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('PDF test endpoint error:', error)

    return NextResponse.json(
      {
        error: 'PDF test failed',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { method = 'both', returnPdf = false } = body

    console.log(`PDF test POST endpoint called with method: ${method}, returnPdf: ${returnPdf}`)

    // Test data (same as GET)
    const testReport = {
      id: 'test-report-123',
      title: 'Test Security Audit Report',
      createdAt: new Date().toISOString()
    }

    const testProject = {
      name: 'Test Project',
      description: 'A test project for PDF generation',
      language: 'JavaScript',
      framework: 'React',
      repositoryUrl: 'https://github.com/test/repo',
      branch: 'main'
    }

    const testVulnerabilities = [
      {
        id: '1',
        title: 'Cross-Site Scripting (XSS)',
        description: 'Potential XSS vulnerability found in user input handling',
        severity: 'high',
        file: 'src/components/UserInput.js',
        line: 42,
        cwe: 'CWE-79'
      }
    ]

    const testScan = {
      id: 'test-scan-456',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    }

    // Try to generate PDF and return it
    if (returnPdf) {
      let pdfBuffer: Buffer | null = null

      // Try Playwright first
      if (method === 'playwright' || method === 'both') {
        try {
          const testHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Test PDF Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #2563eb; }
              </style>
            </head>
            <body>
              <h1>PDF Test Successful</h1>
              <p>Generated at: ${new Date().toISOString()}</p>
              <p>Method: Playwright</p>
            </body>
            </html>
          `

          pdfBuffer = await vercelPdfGenerator.generatePDF(testHtml)

          return new NextResponse(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': 'attachment; filename="test-report-playwright.pdf"'
            }
          })

        } catch (playwrightError) {
          console.warn('Playwright failed, trying React PDF:', playwrightError)
        }
      }

      // Try React PDF if Playwright failed or if requested
      if ((method === 'react' || method === 'both') && !pdfBuffer) {
        try {
          pdfBuffer = await reactPdfGenerator.generatePDF(
            testReport,
            testProject,
            testVulnerabilities,
            testScan
          )

          return new NextResponse(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': 'attachment; filename="test-report-react.pdf"'
            }
          })

        } catch (reactError) {
          return NextResponse.json(
            {
              error: 'Both PDF generation methods failed',
              playwright: method === 'playwright' || method === 'both' ? 'Failed' : 'Not attempted',
              react: 'Failed',
              timestamp: new Date().toISOString()
            },
            { status: 500 }
          )
        }
      }
    }

    return NextResponse.json({
      message: 'Use returnPdf: true to get actual PDF',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('PDF test POST error:', error)

    return NextResponse.json(
      {
        error: 'PDF test POST failed',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
