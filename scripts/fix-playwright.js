#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

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

// Check if Playwright is installed
function checkPlaywrightInstallation() {
  step('Checking Playwright installation...');

  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    const hasPlaywrightCore = packageJson.dependencies?.['playwright-core'] ||
      packageJson.devDependencies?.['playwright-core'];

    if (!hasPlaywrightCore) {
      warning('playwright-core not found in package.json');
      log('Installing playwright-core...', 'cyan');
      execSync('npm install playwright-core@^1.48.0', { stdio: 'inherit' });
      success('playwright-core installed');
    } else {
      success('playwright-core is already installed');
    }

    return true;
  } catch (err) {
    error('Failed to check/install playwright-core: ' + err.message);
    return false;
  }
}

// Install Playwright browsers
function installPlaywrightBrowsers() {
  step('Installing Playwright browsers...');

  try {
    // Check if browsers are already installed
    const playwrightCacheDir = process.env.PLAYWRIGHT_BROWSERS_PATH ||
      path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright');

    log(`Checking browser cache at: ${playwrightCacheDir}`, 'cyan');

    // Install Chromium browser
    log('Installing Chromium browser...', 'cyan');
    execSync('npx playwright install chromium', {
      stdio: 'inherit',
      timeout: 300000 // 5 minutes timeout
    });

    success('Playwright browsers installed successfully');
    return true;

  } catch (err) {
    error('Failed to install Playwright browsers: ' + err.message);

    // Try alternative installation method
    try {
      log('Trying alternative installation method...', 'cyan');
      execSync('npx playwright install-deps chromium', { stdio: 'inherit' });
      execSync('npx playwright install chromium', { stdio: 'inherit' });
      success('Alternative installation succeeded');
      return true;
    } catch (altErr) {
      error('Alternative installation also failed: ' + altErr.message);
      return false;
    }
  }
}

// Verify browser installation
function verifyBrowserInstallation() {
  step('Verifying browser installation...');

  try {
    // Try to get the executable path
    const { chromium } = require('playwright-core');
    const executablePath = chromium.executablePath();

    log(`Chromium executable path: ${executablePath}`, 'cyan');

    if (fs.existsSync(executablePath)) {
      success('Chromium browser is properly installed and accessible');
      return true;
    } else {
      warning('Chromium executable path exists but file is not accessible');
      return false;
    }

  } catch (err) {
    error('Failed to verify browser installation: ' + err.message);
    return false;
  }
}

// Test browser launch
async function testBrowserLaunch() {
  step('Testing browser launch...');

  try {
    const { chromium } = require('playwright-core');

    log('Attempting to launch Chromium...', 'cyan');
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    log('Browser launched successfully, creating test page...', 'cyan');
    const page = await browser.newPage();
    await page.setContent('<html><body><h1>Test Page</h1></body></html>');

    log('Generating test PDF...', 'cyan');
    const pdf = await page.pdf({ format: 'A4' });

    await browser.close();

    success(`Browser test successful! Generated PDF of ${pdf.length} bytes`);
    return true;

  } catch (err) {
    error('Browser test failed: ' + err.message);

    // Try with different launch options
    try {
      log('Trying with fallback options...', 'cyan');
      const { chromium } = require('playwright-core');

      const browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process'
        ]
      });

      const page = await browser.newPage();
      await page.setContent('<html><body><h1>Fallback Test</h1></body></html>');
      const pdf = await page.pdf({ format: 'A4' });
      await browser.close();

      success(`Fallback browser test successful! Generated PDF of ${pdf.length} bytes`);
      return true;

    } catch (fallbackErr) {
      error('Fallback browser test also failed: ' + fallbackErr.message);
      return false;
    }
  }
}

// Clean up old installations
function cleanupOldInstallations() {
  step('Cleaning up old browser installations...');

  try {
    const playwrightCacheDir = path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright');

    if (fs.existsSync(playwrightCacheDir)) {
      log(`Playwright cache directory: ${playwrightCacheDir}`, 'cyan');

      // List browser installations
      const browsers = fs.readdirSync(playwrightCacheDir).filter(dir =>
        dir.startsWith('chromium-') && fs.statSync(path.join(playwrightCacheDir, dir)).isDirectory()
      );

      if (browsers.length > 1) {
        log(`Found ${browsers.length} Chromium installations:`, 'yellow');
        browsers.forEach(browser => log(`  - ${browser}`, 'cyan'));

        // Keep only the newest one
        browsers.sort().slice(0, -1).forEach(oldBrowser => {
          const oldPath = path.join(playwrightCacheDir, oldBrowser);
          log(`Removing old installation: ${oldBrowser}`, 'yellow');
          try {
            execSync(`rm -rf "${oldPath}"`, { stdio: 'pipe' });
            success(`Removed ${oldBrowser}`);
          } catch (err) {
            warning(`Failed to remove ${oldBrowser}: ${err.message}`);
          }
        });
      } else {
        success('No cleanup needed');
      }
    } else {
      log('No Playwright cache directory found', 'cyan');
    }

  } catch (err) {
    warning('Cleanup failed: ' + err.message);
  }
}

// Set environment variables
function setEnvironmentVariables() {
  step('Setting up environment variables...');

  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  const envVars = [
    'ENABLE_PLAYWRIGHT_PDF=true',
    'ENABLE_REACT_PDF=true',
    'ENABLE_SIMPLE_PDF=true',
    'PDF_FALLBACK_TO_REACT=true'
  ];

  let updated = false;
  envVars.forEach(envVar => {
    const [key] = envVar.split('=');
    if (!envContent.includes(key)) {
      envContent += `\n${envVar}`;
      updated = true;
      log(`Added: ${envVar}`, 'green');
    }
  });

  if (updated) {
    fs.writeFileSync(envPath, envContent);
    success('Environment variables updated');
  } else {
    success('Environment variables already configured');
  }
}

// Print troubleshooting info
function printTroubleshootingInfo() {
  step('Troubleshooting Information');

  log('\n🔧 If you still encounter issues:', 'blue');
  log('1. Restart your development server', 'cyan');
  log('2. Clear Node.js cache: npm start --reset-cache', 'cyan');
  log('3. Reinstall node_modules: rm -rf node_modules && npm install', 'cyan');
  log('4. For macOS Gatekeeper issues: xattr -cr node_modules/playwright-core', 'cyan');

  log('\n📝 Environment Details:', 'blue');
  log(`Platform: ${os.platform()}`, 'cyan');
  log(`Architecture: ${os.arch()}`, 'cyan');
  log(`Node.js: ${process.version}`, 'cyan');
  log(`Working Directory: ${process.cwd()}`, 'cyan');

  const { chromium } = require('playwright-core');
  try {
    log(`Playwright Chromium Path: ${chromium.executablePath()}`, 'cyan');
  } catch (err) {
    log(`Playwright Chromium Path: Error - ${err.message}`, 'yellow');
  }

  log('\n🧪 Test your setup:', 'blue');
  log('npm run test-pdf', 'cyan');
  log('curl http://localhost:3000/api/pdf-test?method=playwright', 'cyan');
}

// Main execution
async function main() {
  try {
    log('🚀 Playwright Browser Installation and Fix Script', 'magenta');

    const args = process.argv.slice(2);
    const skipCleanup = args.includes('--skip-cleanup');
    const skipTest = args.includes('--skip-test');

    // Clean up old installations first
    if (!skipCleanup) {
      cleanupOldInstallations();
    }

    // Check and install Playwright
    if (!checkPlaywrightInstallation()) {
      throw new Error('Failed to install playwright-core');
    }

    // Install browsers
    if (!installPlaywrightBrowsers()) {
      throw new Error('Failed to install Playwright browsers');
    }

    // Verify installation
    if (!verifyBrowserInstallation()) {
      throw new Error('Browser installation verification failed');
    }

    // Test browser launch
    if (!skipTest) {
      const testResult = await testBrowserLaunch();
      if (!testResult) {
        warning('Browser test failed, but installation may still work');
      }
    }

    // Set environment variables
    setEnvironmentVariables();

    printTroubleshootingInfo();

    log('\n🎉 Playwright setup completed successfully!', 'green');
    log('You can now use Playwright for PDF generation.', 'green');

  } catch (err) {
    error('Setup failed: ' + err.message);

    log('\n🔧 Manual Setup Steps:', 'yellow');
    log('1. npm install playwright-core', 'cyan');
    log('2. npx playwright install chromium', 'cyan');
    log('3. Set ENABLE_PLAYWRIGHT_PDF=true in your .env.local', 'cyan');

    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log('Playwright Browser Installation and Fix Script', 'blue');
  log('\nUsage: node scripts/fix-playwright.js [options]', 'cyan');
  log('\nOptions:', 'cyan');
  log('  --help, -h         Show this help message', 'cyan');
  log('  --skip-cleanup     Skip cleanup of old browser installations', 'cyan');
  log('  --skip-test        Skip browser launch test', 'cyan');
  log('\nExamples:', 'cyan');
  log('  node scripts/fix-playwright.js                 # Full setup', 'cyan');
  log('  node scripts/fix-playwright.js --skip-test     # Setup without testing', 'cyan');
  process.exit(0);
}

main();
