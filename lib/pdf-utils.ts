import puppeteer, { Browser, Page } from 'puppeteer'
import { existsSync } from 'fs'
import { execSync } from 'child_process'

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

export class PDFGenerator {
  private static instance: PDFGenerator
  private browser: Browser | null = null

  private constructor() { }

  public static getInstance(): PDFGenerator {
    if (!PDFGenerator.instance) {
      PDFGenerator.instance = new PDFGenerator()
    }
    return PDFGenerator.instance
  }

  /**
   * Detect available Chrome/Chromium executable paths
   */
  private detectChromePath(): string | null {
    const possiblePaths = [
      // Environment variable
      process.env.PUPPETEER_EXECUTABLE_PATH,
      process.env.CHROME_BIN,
      process.env.CHROMIUM_PATH,

      // Common Linux paths
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium',

      // Common macOS paths
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',

      // Common Windows paths
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Chromium\\Application\\chromium.exe'
    ]

    for (const path of possiblePaths) {
      if (path && existsSync(path)) {
        console.log(`Found Chrome/Chromium at: ${path}`)
        return path
      }
    }

    return null
  }

  /**
   * Check if Puppeteer's bundled Chromium is available
   */
  private async checkPuppeteerChromium(): Promise<boolean> {
    try {
      const testBrowser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
      })
      await testBrowser.close()
      return true
    } catch (error: any) {
      console.log('Puppeteer bundled Chromium not available:', error.message)
      return false
    }
  }

  /**
   * Install Chrome browsers using Puppeteer CLI
   */
  private async installChromeBrowsers(): Promise<boolean> {
    try {
      console.log('Attempting to install Chrome browsers...')
      execSync('npx puppeteer browsers install chrome', {
        stdio: 'pipe',
        timeout: 120000 // 2 minutes timeout
      })
      console.log('Chrome browsers installed successfully')
      return true
    } catch (error: any) {
      console.log('Failed to install Chrome browsers:', error.message)
      return false
    }
  }

  /**
   * Launch browser with multiple fallback strategies
   */
  public async launchBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser
    }

    const baseArgs = [
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
      '--disable-javascript',
      '--virtual-time-budget=60000'
    ]

    // Strategy 1: Try bundled Chromium first
    try {
      console.log('Strategy 1: Trying Puppeteer bundled Chromium...')
      this.browser = await puppeteer.launch({
        headless: true,
        args: baseArgs
      })
      console.log('Successfully launched with bundled Chromium')
      return this.browser
    } catch (error1: any) {
      console.log('Strategy 1 failed:', error1.message)

      // Strategy 2: Try installing Chrome browsers
      try {
        console.log('Strategy 2: Attempting to install Chrome browsers...')
        const installed = await this.installChromeBrowsers()
        if (installed) {
          this.browser = await puppeteer.launch({
            headless: true,
            args: baseArgs
          })
          console.log('Successfully launched after installing Chrome')
          return this.browser
        }
      } catch (error2: any) {
        console.log('Strategy 2 failed:', error2.message)
      }

      // Strategy 3: Try system Chrome/Chromium
      try {
        console.log('Strategy 3: Trying system Chrome/Chromium...')
        const chromePath = this.detectChromePath()
        if (chromePath) {
          this.browser = await puppeteer.launch({
            headless: true,
            executablePath: chromePath,
            args: baseArgs
          })
          console.log('Successfully launched with system Chrome')
          return this.browser
        }
      } catch (error3: any) {
        console.log('Strategy 3 failed:', error3.message)
      }

      // Strategy 4: Try minimal configuration
      try {
        console.log('Strategy 4: Trying minimal configuration...')
        this.browser = await puppeteer.launch({
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        })
        console.log('Successfully launched with minimal config')
        return this.browser
      } catch (error4) {
        console.log('Strategy 4 failed:', error4.message)
      }

      // All strategies failed
      throw new Error(`
PDF generation failed: Unable to launch Chrome/Chromium browser.

Possible solutions:
1. Run: npx puppeteer browsers install chrome
2. Install Chrome or Chromium on your system
3. Set PUPPETEER_EXECUTABLE_PATH environment variable
4. For production deployments, ensure Chrome is available in the container

Original errors:
- Bundled Chromium: ${error1.message}
- System Chrome: ${error3?.message || 'No system Chrome found'}
- Minimal config: ${error4.message}
      `.trim())
    }
  }

  /**
   * Generate PDF from HTML content
   */
  public async generatePDF(
    htmlContent: string,
    options: PDFGenerationOptions = {}
  ): Promise<Buffer> {
    const browser = await this.launchBrowser()
    let page: Page | null = null

    try {
      page = await browser.newPage()

      // Set viewport for consistent rendering
      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 1
      })

      // Set content with timeout and wait conditions
      await page.setContent(htmlContent, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: options.timeout || 60000
      })

      // Wait for any dynamic content to load
      await page.evaluate(() => {
        return new Promise((resolve) => {
          if (document.readyState === 'complete') {
            resolve(undefined)
          } else {
            window.addEventListener('load', () => resolve(undefined))
          }
        })
      })

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

      return pdfBuffer

    } catch (error) {
      console.error('PDF generation error:', error)
      throw new Error(`PDF generation failed: ${error.message}`)
    } finally {
      if (page) {
        await page.close()
      }
    }
  }

  /**
   * Close browser instance
   */
  public async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  /**
   * Health check for PDF generation capability
   */
  public async healthCheck(): Promise<{ success: boolean; message: string }> {
    try {
      const browser = await this.launchBrowser()
      const page = await browser.newPage()

      await page.setContent('<html><body><h1>Test</h1></body></html>')
      const pdf = await page.pdf({ format: 'A4' })

      await page.close()

      return {
        success: true,
        message: `PDF generation is working. Generated ${pdf.length} bytes.`
      }
    } catch (error) {
      return {
        success: false,
        message: `PDF generation health check failed: ${error.message}`
      }
    }
  }
}

// Export singleton instance
export const pdfGenerator = PDFGenerator.getInstance()

// Helper function for backward compatibility
export async function generatePDF(
  htmlContent: string,
  options: PDFGenerationOptions = {}
): Promise<Buffer> {
  return pdfGenerator.generatePDF(htmlContent, options)
}
