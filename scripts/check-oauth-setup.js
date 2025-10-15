#!/usr/bin/env node

/**
 * Dual GitHub OAuth Setup Validation Script
 *
 * This script checks if your environment is properly configured
 * for dual GitHub OAuth apps (sign-in + account linking).
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Dual GitHub OAuth Setup...\n');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');

  if (!fs.existsSync(envPath)) {
    log('❌ .env.local file not found!', colors.red);
    log('   Create .env.local file with your OAuth credentials', colors.yellow);
    return false;
  }

  log('✅ .env.local file found', colors.green);
  return true;
}

function loadEnvVariables() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');

    const env = {};
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length) {
        env[key.trim()] = valueParts.join('=').trim().replace(/['"]/g, '');
      }
    });

    return env;
  } catch (error) {
    log('❌ Error reading .env.local file', colors.red);
    return {};
  }
}

function validateEnvironmentVariables() {
  log('\n📋 Checking Environment Variables:', colors.blue);

  const env = loadEnvVariables();
  const required = [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'GITHUB_LINK_CLIENT_ID',
    'GITHUB_LINK_CLIENT_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ];

  const missing = [];
  const present = [];

  required.forEach(varName => {
    if (env[varName]) {
      present.push(varName);
      const maskedValue = varName.includes('SECRET') || varName.includes('CLIENT_SECRET')
        ? '*'.repeat(8)
        : env[varName].substring(0, 10) + '...';
      log(`   ✅ ${varName}: ${maskedValue}`, colors.green);
    } else {
      missing.push(varName);
      log(`   ❌ ${varName}: NOT SET`, colors.red);
    }
  });

  return { missing, present };
}

function validateGitHubOAuthSetup() {
  log('\n🔧 GitHub OAuth App Setup Validation:', colors.blue);

  const env = loadEnvVariables();

  // Check if we have both OAuth apps configured
  const hasSignInApp = env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET;
  const hasLinkingApp = env.GITHUB_LINK_CLIENT_ID && env.GITHUB_LINK_CLIENT_SECRET;

  if (hasSignInApp) {
    log('   ✅ GitHub Sign-In OAuth App configured', colors.green);
    log(`      Client ID: ${env.GITHUB_CLIENT_ID.substring(0, 8)}...`, colors.reset);
    log(`      Callback URL should be: ${env.NEXTAUTH_URL}/api/auth/callback/github`, colors.yellow);
  } else {
    log('   ❌ GitHub Sign-In OAuth App missing', colors.red);
  }

  if (hasLinkingApp) {
    log('   ✅ GitHub Account Linking OAuth App configured', colors.green);
    log(`      Client ID: ${env.GITHUB_LINK_CLIENT_ID.substring(0, 8)}...`, colors.reset);
    log(`      Callback URL should be: ${env.NEXTAUTH_URL}/api/auth/link-github/callback`, colors.yellow);
  } else {
    log('   ❌ GitHub Account Linking OAuth App missing', colors.red);
  }

  return hasSignInApp && hasLinkingApp;
}

function generateSetupInstructions() {
  log('\n📝 Setup Instructions:', colors.blue);

  const env = loadEnvVariables();
  const baseUrl = env.NEXTAUTH_URL || 'http://localhost:3000';

  log('   1. Create GitHub OAuth App for Sign-In:', colors.yellow);
  log('      - Go to: https://github.com/settings/developers', colors.reset);
  log('      - Click "New OAuth App"', colors.reset);
  log('      - Application name: Orlixis Audit Platform', colors.reset);
  log(`      - Homepage URL: ${baseUrl}`, colors.reset);
  log(`      - Authorization callback URL: ${baseUrl}/api/auth/callback/github`, colors.reset);
  log('', colors.reset);

  log('   2. Create GitHub OAuth App for Account Linking:', colors.yellow);
  log('      - Click "New OAuth App" again', colors.reset);
  log('      - Application name: Orlixis Audit Platform - Account Linking', colors.reset);
  log(`      - Homepage URL: ${baseUrl}`, colors.reset);
  log(`      - Authorization callback URL: ${baseUrl}/api/auth/link-github/callback`, colors.reset);
  log('', colors.reset);

  log('   3. Update your .env.local file with both sets of credentials:', colors.yellow);
  log('      GITHUB_CLIENT_ID=your-signin-client-id', colors.reset);
  log('      GITHUB_CLIENT_SECRET=your-signin-client-secret', colors.reset);
  log('      GITHUB_LINK_CLIENT_ID=your-linking-client-id', colors.reset);
  log('      GITHUB_LINK_CLIENT_SECRET=your-linking-client-secret', colors.reset);
}

function checkPackageJson() {
  log('\n📦 Checking Package Dependencies:', colors.blue);

  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const deps = { ...packageContent.dependencies, ...packageContent.devDependencies };

    const required = [
      'next-auth',
      '@auth/prisma-adapter',
      '@prisma/client'
    ];

    required.forEach(dep => {
      if (deps[dep]) {
        log(`   ✅ ${dep}: ${deps[dep]}`, colors.green);
      } else {
        log(`   ❌ ${dep}: NOT INSTALLED`, colors.red);
      }
    });
  } catch (error) {
    log('   ❌ Error reading package.json', colors.red);
  }
}

function runTests() {
  log('\n🧪 Running Basic Tests:', colors.blue);

  const env = loadEnvVariables();

  // Test NextAuth URL format
  if (env.NEXTAUTH_URL) {
    try {
      new URL(env.NEXTAUTH_URL);
      log('   ✅ NEXTAUTH_URL is valid URL format', colors.green);
    } catch (error) {
      log('   ❌ NEXTAUTH_URL is not a valid URL', colors.red);
    }
  }

  // Test GitHub Client IDs format
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_ID.startsWith('Iv')) {
    log('   ✅ GITHUB_CLIENT_ID has correct format', colors.green);
  } else if (env.GITHUB_CLIENT_ID) {
    log('   ⚠️  GITHUB_CLIENT_ID format might be incorrect (should start with "Iv")', colors.yellow);
  }

  if (env.GITHUB_LINK_CLIENT_ID && env.GITHUB_LINK_CLIENT_ID.startsWith('Iv')) {
    log('   ✅ GITHUB_LINK_CLIENT_ID has correct format', colors.green);
  } else if (env.GITHUB_LINK_CLIENT_ID) {
    log('   ⚠️  GITHUB_LINK_CLIENT_ID format might be incorrect (should start with "Iv")', colors.yellow);
  }
}

// Main execution
function main() {
  log(`${colors.bold}Orlixis Audit Platform - OAuth Setup Validator${colors.reset}\n`);

  let allGood = true;

  // Check if .env.local exists
  if (!checkEnvFile()) {
    allGood = false;
  }

  // Validate environment variables
  const { missing } = validateEnvironmentVariables();
  if (missing.length > 0) {
    allGood = false;
  }

  // Validate GitHub OAuth setup
  if (!validateGitHubOAuthSetup()) {
    allGood = false;
  }

  // Check package dependencies
  checkPackageJson();

  // Run basic tests
  runTests();

  // Generate instructions if needed
  if (!allGood) {
    generateSetupInstructions();
  }

  // Final summary
  log('\n' + '='.repeat(60), colors.blue);
  if (allGood) {
    log('🎉 All checks passed! Your dual GitHub OAuth setup looks good.', colors.green);
    log('\nNext steps:', colors.blue);
    log('   1. Start your development server: npm run dev', colors.reset);
    log('   2. Test sign-in flow: /auth/signin', colors.reset);
    log('   3. Test account linking: Sign in with Google, then visit /profile', colors.reset);
    log('   4. Debug endpoint: /api/auth/debug', colors.reset);
  } else {
    log('⚠️  Setup incomplete. Please follow the instructions above.', colors.yellow);
    log('\nFor more help, see:', colors.blue);
    log('   - DUAL_GITHUB_OAUTH_SETUP.md', colors.reset);
    log('   - OAUTH_SETUP.md', colors.reset);
  }
  log('='.repeat(60), colors.blue);
}

// Run the script
main();
