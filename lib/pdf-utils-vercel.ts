import { chromium } from 'playwright-core'
import chromium_aws from 'chrome-aws-lambda'

export interface PDFGenerationOptions {
  format?: 'A4' | 'Letter' | 'Legal'
  margin?: {
    top: string
    right: string
    bottom: string
    left: string
  }
  displayHeaderFooter?: boolean
  headerTemplate?: string
  footerTemplate?: string
  timeout?: number
}

export class VercelPDFGenerator {
  private static instance: VercelPDFGenerator

  private constructor() { }

  public static getInstance(): VercelPDFGenerator {
    if (!VercelPDFGenerator.instance) {
      VercelPDFGenerator.instance = new VercelPDFGenerator()
    }
    return VercelPDFGenerator.instance
  }

  /**
   * Get Chrome executable path for serverless environment
   */
  private async getChromiumExecutable(): Promise<string> {
    // For local development
    if (process.env.NODE_ENV === 'development') {
      return chromium.executablePath() || '/usr/bin/google-chrome'
    }

    // For Vercel/AWS Lambda
    return await chromium_aws.executablePath
  }

  /**
   * Get Chrome arguments for serverless environment
   */
  private getChromiumArgs(): string[] {
    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-images',
      '--memory-pressure-off',
      '--max_old_space_size=4096'
    ]

    // Add AWS Lambda specific args
    if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL) {
      args.push(
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      )
    }

    return args
  }

  /**
   * Generate PDF from HTML content using Playwright
   */
  public async generatePDF(
    htmlContent: string,
    options: PDFGenerationOptions = {}
  ): Promise<Buffer> {
    let browser = null
    let context = null
    let page = null

    try {
      console.log('Starting PDF generation with Playwright...')

      // Get executable path and args
      const executablePath = await this.getChromiumExecutable()
      const args = this.getChromiumArgs()

      console.log('Using Chrome executable:', executablePath)

      // Launch browser
      browser = await chromium.launch({
        executablePath,
        args,
        headless: true,
        timeout: options.timeout || 60000
      })

      // Create context
      context = await browser.newContext({
        viewport: {
          width: 1200,
          height: 1600
        }
      })

      // Create page
      page = await context.newPage()

      // Set content with timeout
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle',
        timeout: options.timeout || 60000
      })

      // Wait for any dynamic content
      await page.waitForLoadState('networkidle')

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: options.margin || {
          top: '15mm',
          right: '15mm',
          bottom: '15mm',
          left: '15mm'
        },
        displayHeaderFooter: options.displayHeaderFooter || false,
        headerTemplate: options.headerTemplate || '',
        footerTemplate: options.footerTemplate || ''
      })

      console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes')
      return Buffer.from(pdfBuffer)

    } catch (error: any) {
      console.error('PDF generation failed:', error)

      // Provide helpful error messages
      if (error.message.includes('Could not find browser')) {
        throw new Error(`Browser not found. Ensure chrome-aws-lambda is installed and configured properly. Original error: ${error.message}`)
      }

      if (error.message.includes('timeout')) {
        throw new Error(`PDF generation timed out. The content might be too complex. Original error: ${error.message}`)
      }

      throw new Error(`PDF generation failed: ${error.message}`)

    } finally {
      // Clean up resources
      try {
        if (page) await page.close()
        if (context) await context.close()
        if (browser) await browser.close()
      } catch (cleanupError) {
        console.warn('Error during cleanup:', cleanupError)
      }
    }
  }

  /**
   * Health check for PDF generation capability
   */
  public async healthCheck(): Promise<{ success: boolean; message: string }> {
    try {
      const testHtml = '<html><body><h1>Test PDF Generation</h1><p>This is a test.</p></body></html>'
      const pdf = await this.generatePDF(testHtml)

      return {
        success: true,
        message: `PDF generation is working. Generated ${pdf.length} bytes.`
      }
    } catch (error: any) {
      return {
        success: false,
        message: `PDF generation health check failed: ${error.message}`
      }
    }
  }
}

// Export singleton instance
export const vercelPdfGenerator = VercelPDFGenerator.getInstance()

// Helper function for backward compatibility
export async function generatePDF(
  htmlContent: string,
  options: PDFGenerationOptions = {}
): Promise<Buffer> {
  return vercelPdfGenerator.generatePDF(htmlContent, options)
}
