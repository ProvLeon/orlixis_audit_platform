import React from 'react'
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, pdf } from '@react-pdf/renderer'

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

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 10
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 10
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 10,
    borderBottom: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 5
  },
  text: {
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 5
  },
  bold: {
    fontWeight: 'bold'
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5
  },
  column: {
    flex: 1,
    paddingRight: 10
  },
  vulnerabilityItem: {
    backgroundColor: '#f8fafc',
    padding: 10,
    marginBottom: 8,
    borderLeft: 3,
    borderLeftColor: '#ef4444'
  },
  vulnerabilityTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3
  },
  vulnerabilityDescription: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 5
  },
  severityHigh: {
    color: '#dc2626',
    fontWeight: 'bold'
  },
  severityMedium: {
    color: '#ea580c',
    fontWeight: 'bold'
  },
  severityLow: {
    color: '#ca8a04',
    fontWeight: 'bold'
  },
  severityInfo: {
    color: '#0284c7',
    fontWeight: 'bold'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#64748b',
    borderTop: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10
  },
  scoreBox: {
    backgroundColor: '#f1f5f9',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
    alignItems: 'center'
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af'
  },
  riskText: {
    fontSize: 14,
    marginTop: 5
  },
  table: {
    marginBottom: 15
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 8
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
    fontWeight: 'bold'
  },
  tableCell: {
    flex: 1,
    fontSize: 11,
    paddingHorizontal: 5
  }
})

interface ReportPDFProps {
  report: any
  project: any
  vulnerabilities: any[]
  scan: any
  overallScore: number
  risk: string
  severityCounts: any
}

// React PDF Document Component
const ReportPDF: React.FC<ReportPDFProps> = ({
  report,
  project,
  vulnerabilities,
  scan,
  overallScore,
  risk,
  severityCounts
}) => (
  <Document>
  <Page size= "A4" style = { styles.page } >
    {/* Header */ }
    < View style = { styles.header } >
      <Text style={ styles.title }> Security Audit Report </Text>
        < Text style = { styles.subtitle } > Project: { project.name } </Text>
          < Text style = { styles.text } > Generated on: { new Date().toLocaleDateString() } </Text>
            </View>

{/* Executive Summary */ }
<View style={ styles.section }>
  <Text style={ styles.sectionTitle }> Executive Summary </Text>

    < View style = { styles.scoreBox } >
      <Text style={ styles.scoreText }> Overall Score: { overallScore } /100</Text >
        <Text style={
          [styles.riskText, risk === 'High' ? styles.severityHigh :
            risk === 'Medium' ? styles.severityMedium : styles.severityLow]
}>
  Risk Level: { risk }
</Text>
  </View>

  < View style = { styles.row } >
    <View style={ styles.column }>
      <Text style={ styles.text }>
        <Text style={ styles.bold }> Project Language: </Text> {project.language || 'N/A'}
          </Text>
          < Text style = { styles.text } >
            <Text style={ styles.bold }> Framework: </Text> {project.framework || 'N/A'}
              </Text>
              </View>
              < View style = { styles.column } >
                <Text style={ styles.text }>
                  <Text style={ styles.bold }> Repository: </Text> {project.repositoryUrl || 'N/A'}
                    </Text>
                    < Text style = { styles.text } >
                      <Text style={ styles.bold }> Branch: </Text> {project.branch || 'main'}
                        </Text>
                        </View>
                        </View>
                        </View>

{/* Vulnerability Summary Table */ }
<View style={ styles.section }>
  <Text style={ styles.sectionTitle }> Vulnerability Summary </Text>

    < View style = { styles.table } >
      <View style={ [styles.tableRow, styles.tableHeader] }>
        <Text style={ styles.tableCell }> Severity </Text>
          < Text style = { styles.tableCell } > Count </Text>
            < Text style = { styles.tableCell } > Percentage </Text>
              </View>

{
  Object.entries(severityCounts).map(([severity, count]: [string, any]) => (
    <View key= { severity } style = { styles.tableRow } >
    <Text style={
      [styles.tableCell,
      severity === 'high' ? styles.severityHigh :
        severity === 'medium' ? styles.severityMedium :
          severity === 'low' ? styles.severityLow : styles.severityInfo
      ]} >
    { severity.toUpperCase() }
    </Text>
  < Text style = { styles.tableCell } > { count } </Text>
  < Text style = { styles.tableCell } >
  { vulnerabilities.length > 0 ? Math.round((count / vulnerabilities.length) * 100) : 0 } %
  </Text>
  </View>
  ))
}
</View>
  </View>

{/* Footer */ }
<Text style={ styles.footer }>
  Orlixis Security Audit Platform - Confidential Report
    </Text>
    </Page>

{/* Vulnerabilities Detail Pages */ }
{
  vulnerabilities.length > 0 && (
    <Page size="A4" style = { styles.page } >
      <View style={ styles.header }>
        <Text style={ styles.title }> Detailed Vulnerabilities </Text>
          </View>

          < View style = { styles.section } >
          {
            vulnerabilities.slice(0, 10).map((vuln, index) => (
              <View key= { index } style = { styles.vulnerabilityItem } >
              <Text style={ styles.vulnerabilityTitle } >
              { vuln.title || vuln.rule_id || 'Unknown Vulnerability' }
              </Text>

            < Text style = {
              [styles.text,
              vuln.severity === 'high' ? styles.severityHigh :
                vuln.severity === 'medium' ? styles.severityMedium :
                  vuln.severity === 'low' ? styles.severityLow : styles.severityInfo
              ]} >
            Severity: {(vuln.severity || 'info').toUpperCase()}
            </Text>

            < Text style = { styles.vulnerabilityDescription } >
              { vuln.description || vuln.message || 'No description available' }
              </Text>

  {
    vuln.file && (
      <Text style={ styles.text }>
        <Text style={ styles.bold }> File: </Text> {vuln.file}
    { vuln.line && ` (Line: ${vuln.line})` }
    </Text>
              )
  }

  {
    vuln.cwe && (
      <Text style={ styles.text }>
        <Text style={ styles.bold }> CWE: </Text> {vuln.cwe}
          </Text>
              )
  }
  </View>
          ))
}

{
  vulnerabilities.length > 10 && (
    <Text style={ styles.text }>
              ... and { vulnerabilities.length - 10 } more vulnerabilities
    </Text>
          )
}
</View>

  < Text style = { styles.footer } >
    Orlixis Security Audit Platform - Page 2
      </Text>
      </Page>
    )}
</Document>
)

export class ReactPDFGenerator {
  private static instance: ReactPDFGenerator

  private constructor() { }

  public static getInstance(): ReactPDFGenerator {
    if (!ReactPDFGenerator.instance) {
      ReactPDFGenerator.instance = new ReactPDFGenerator()
    }
    return ReactPDFGenerator.instance
  }

  /**
   * Generate PDF from report data using React PDF
   */
  public async generatePDF(
    report: any,
    project: any,
    vulnerabilities: any[],
    scan: any,
    options: PDFGenerationOptions = {}
  ): Promise<Buffer> {
    try {
      console.log('Starting React PDF generation for report:', report.id)

      // Calculate metrics
      const overallScore = this.calculateOverallScore(vulnerabilities)
      const risk = this.calculateRiskLevel(overallScore)
      const severityCounts = this.countBySeverity(vulnerabilities)

      // Create PDF document
      const pdfDoc = React.createElement(ReportPDF, {
        report,
        project,
        vulnerabilities,
        scan,
        overallScore,
        risk,
        severityCounts
      })

      // Generate PDF buffer
      const pdfBuffer = await pdf(pdfDoc).toBuffer()

      console.log('React PDF generated successfully, size:', pdfBuffer.length, 'bytes')
      return pdfBuffer

    } catch (error: any) {
      console.error('React PDF generation failed:', error)
      throw new Error(`PDF generation failed: ${error.message}`)
    }
  }

  /**
   * Calculate overall security score
   */
  private calculateOverallScore(vulnerabilities: any[]): number {
    if (!vulnerabilities.length) return 100

    const severityWeights = { high: 10, medium: 5, low: 2, info: 1 }
    const totalWeight = vulnerabilities.reduce((sum, vuln) => {
      return sum + (severityWeights[vuln.severity as keyof typeof severityWeights] || 1)
    }, 0)

    return Math.max(0, Math.min(100, 100 - totalWeight))
  }

  /**
   * Calculate risk level based on score
   */
  private calculateRiskLevel(score: number): string {
    if (score >= 80) return 'Low'
    if (score >= 60) return 'Medium'
    return 'High'
  }

  /**
   * Count vulnerabilities by severity
   */
  private countBySeverity(vulnerabilities: any[]) {
    return vulnerabilities.reduce((counts, vuln) => {
      const severity = vuln.severity || 'info'
      counts[severity] = (counts[severity] || 0) + 1
      return counts
    }, {} as Record<string, number>)
  }

  /**
   * Health check for PDF generation capability
   */
  public async healthCheck(): Promise<{ success: boolean; message: string }> {
    try {
      const testReport = { id: 'test', title: 'Test Report' }
      const testProject = { name: 'Test Project', language: 'JavaScript' }
      const testVulns = [{
        title: 'Test Vulnerability',
        severity: 'medium',
        description: 'Test description'
      }]
      const testScan = { id: 'test-scan' }

      const pdf = await this.generatePDF(testReport, testProject, testVulns, testScan)

      return {
        success: true,
        message: `React PDF generation is working. Generated ${pdf.length} bytes.`
      }
    } catch (error: any) {
      return {
        success: false,
        message: `React PDF generation health check failed: ${error.message}`
      }
    }
  }
}

// Export singleton instance
export const reactPdfGenerator = ReactPDFGenerator.getInstance()

// Helper function for backward compatibility
export async function generateReactPDF(
  report: any,
  project: any,
  vulnerabilities: any[],
  scan: any,
  options: PDFGenerationOptions = {}
): Promise<Buffer> {
  return reactPdfGenerator.generatePDF(report, project, vulnerabilities, scan, options)
}
