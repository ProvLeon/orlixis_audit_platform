#!/usr/bin/env node

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up PDF generation for Orlixis Audit Platform...\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function step(message) {
  log(`\n📋 ${message}`, 'blue');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

// Check if we're in the correct directory
function checkDirectory() {
  step('Checking project directory...');

  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    error('package.json not found. Please run this script from the project root.');
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (packageJson.name !== 'orlixis_audit_platform') {
    error('This script should be run from the Orlixis Audit Platform directory.');
    process.exit(1);
  }

  success('Project directory verified');
}

// Install Node.js dependencies
function installDependencies() {
  step('Installing PDF generation dependencies...');

  const dependencies = [
    'playwright-core@^1.48.0',
    'chrome-aws-lambda@^10.1.0',
    '@react-pdf/renderer@^4.0.0'
  ];

  try {
    log('Installing: ' + dependencies.join(', '), 'cyan');
    execSync(`npm install ${dependencies.join(' ')}`, { stdio: 'inherit' });
    success('Dependencies installed successfully');
  } catch (err) {
    error('Failed to install dependencies');
    console.error(err.message);
    process.exit(1);
  }
}

// Install Playwright browsers
function installPlaywrightBrowsers() {
  step('Installing Playwright browsers...');

  try {
    log('Installing Chromium browser...', 'cyan');
    execSync('npx playwright install chromium', { stdio: 'inherit' });
    success('Playwright browsers installed');
  } catch (err) {
    warning('Playwright browser installation failed - this is OK for serverless deployment');
    log('Error: ' + err.message, 'red');
  }
}

// Verify installations
function verifyInstallations() {
  step('Verifying installations...');

  // Check Node.js dependencies
  const requiredPackages = [
    'playwright-core',
    'chrome-aws-lambda',
    '@react-pdf/renderer'
  ];

  for (const pkg of requiredPackages) {
    try {
      require.resolve(pkg);
      success(`${pkg} is installed`);
    } catch (err) {
      error(`${pkg} is not installed properly`);
    }
  }
}

// Create environment configuration
function createEnvironmentConfig() {
  step('Creating environment configuration...');

  const envConfig = `
# PDF Generation Configuration
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=false
PLAYWRIGHT_BROWSERS_PATH=./node_modules/playwright-core/.local-browsers

# For local development, you can set specific paths
# CHROME_BIN=/usr/bin/google-chrome
# PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
`;

  const envLocalPath = path.join(process.cwd(), '.env.local');
  const envExamplePath = path.join(process.cwd(), '.env.example');

  // Check if .env.local exists
  if (fs.existsSync(envLocalPath)) {
    const existingEnv = fs.readFileSync(envLocalPath, 'utf8');
    if (!existingEnv.includes('PDF Generation Configuration')) {
      fs.appendFileSync(envLocalPath, envConfig);
      success('PDF configuration added to .env.local');
    } else {
      log('PDF configuration already exists in .env.local', 'yellow');
    }
  } else {
    fs.writeFileSync(envLocalPath, envConfig);
    success('Created .env.local with PDF configuration');
  }

  // Update .env.example if it exists
  if (fs.existsSync(envExamplePath)) {
    const existingExample = fs.readFileSync(envExamplePath, 'utf8');
    if (!existingExample.includes('PDF Generation Configuration')) {
      fs.appendFileSync(envExamplePath, envConfig);
      success('PDF configuration added to .env.example');
    }
  }
}

// Test PDF generation
async function testPdfGeneration() {
  step('Testing PDF generation...');

  try {
    // Import the PDF generators
    const { vercelPdfGenerator } = require('../lib/pdf-utils-vercel');
    const { reactPdfGenerator } = require('../lib/pdf-react-generator');

    // Test data
    const testReport = { id: 'test', title: 'Test Report' };
    const testProject = { name: 'Test Project', language: 'JavaScript' };
    const testVulns = [{ title: 'Test Vuln', severity: 'medium', description: 'Test' }];
    const testScan = { id: 'test-scan' };

    // Test React PDF (should work everywhere)
    try {
      log('Testing React PDF generation...', 'cyan');
      const reactPdf = await reactPdfGenerator.generatePDF(testReport, testProject, testVulns, testScan);
      success(`React PDF test passed (${reactPdf.length} bytes)`);
    } catch (err) {
      error('React PDF test failed: ' + err.message);
    }

    // Test Playwright PDF (may fail in some environments)
    try {
      log('Testing Playwright PDF generation...', 'cyan');
      const testHtml = '<html><body><h1>Test</h1></body></html>';
      const playwrightPdf = await vercelPdfGenerator.generatePDF(testHtml);
      success(`Playwright PDF test passed (${playwrightPdf.length} bytes)`);
    } catch (err) {
      warning('Playwright PDF test failed (this is expected in some environments): ' + err.message);
    }

  } catch (err) {
    error('Could not run PDF tests: ' + err.message);
  }
}

// Run health checks
async function runHealthChecks() {
  step('Running health checks...');

  try {
    const { vercelPdfGenerator } = require('../lib/pdf-utils-vercel');
    const { reactPdfGenerator } = require('../lib/pdf-react-generator');

    // React PDF health check
    const reactHealth = await reactPdfGenerator.healthCheck();
    if (reactHealth.success) {
      success('React PDF health check passed');
    } else {
      error('React PDF health check failed: ' + reactHealth.message);
    }

    // Playwright health check
    const playwrightHealth = await vercelPdfGenerator.healthCheck();
    if (playwrightHealth.success) {
      success('Playwright health check passed');
    } else {
      warning('Playwright health check failed: ' + playwrightHealth.message);
    }

  } catch (err) {
    error('Health checks failed: ' + err.message);
  }
}

// Print deployment instructions
function printDeploymentInstructions() {
  step('Deployment Instructions');

  log('\n📝 For Vercel deployment:', 'blue');
  log('1. Ensure vercel.json is configured (already done)', 'cyan');
  log('2. Set environment variables in Vercel dashboard:', 'cyan');
  log('   - PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true', 'cyan');
  log('   - PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true', 'cyan');
  log('3. Deploy with: vercel --prod', 'cyan');

  log('\n📝 For local development:', 'blue');
  log('1. Install Chrome/Chromium browser', 'cyan');
  log('2. Run: npm run dev', 'cyan');
  log('3. Test PDF generation: http://localhost:3000/api/pdf-test', 'cyan');

  log('\n📝 Testing:', 'blue');
  log('• Test endpoint: /api/pdf-test', 'cyan');
  log('• Query params: ?method=both|playwright|react', 'cyan');
  log('• POST with { "returnPdf": true } to get actual PDF', 'cyan');
}

// Main execution
async function main() {
  try {
    checkDirectory();
    installDependencies();
    installPlaywrightBrowsers();
    verifyInstallations();
    createEnvironmentConfig();

    // Only test if not in CI/deployment environment
    if (!process.env.CI && !process.env.VERCEL) {
      await testPdfGeneration();
      await runHealthChecks();
    }

    printDeploymentInstructions();

    log('\n🎉 PDF generation setup complete!', 'green');
    log('Your application now supports both Playwright and React PDF generation.', 'green');
    log('React PDF will be used as a fallback if Playwright fails.', 'green');

  } catch (err) {
    error('Setup failed: ' + err.message);
    process.exit(1);
  }
}

// Handle script arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  log('Orlixis PDF Generation Setup Script', 'blue');
  log('\nUsage: node scripts/setup-pdf-generation.js [options]', 'cyan');
  log('\nOptions:', 'cyan');
  log('  --help, -h     Show this help message', 'cyan');
  log('  --test-only    Only run tests, skip installation', 'cyan');
  log('  --install-only Only install dependencies, skip tests', 'cyan');
  process.exit(0);
}

if (args.includes('--test-only')) {
  testPdfGeneration().then(() => runHealthChecks());
} else if (args.includes('--install-only')) {
  checkDirectory();
  installDependencies();
  installPlaywrightBrowsers();
  verifyInstallations();
  createEnvironmentConfig();
} else {
  main();
}
