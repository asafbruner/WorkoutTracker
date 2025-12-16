const { test, expect } = require('@playwright/test');

test.describe('Production Deployment Tests', () => {
  const PRODUCTION_URL = 'https://workouttracker-six.vercel.app/';
  
  test('should load the production app without errors', async ({ page }) => {
    // Array to collect console errors
    const consoleErrors = [];
    const networkErrors = [];
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      consoleErrors.push(`Page error: ${error.message}`);
    });
    
    // Listen for failed requests
    page.on('requestfailed', request => {
      networkErrors.push(`${request.failure().errorText} - ${request.url()}`);
    });
    
    // Navigate to the production URL
    console.log('🌐 Navigating to:', PRODUCTION_URL);
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    
    // Wait for the app to load
    await page.waitForTimeout(2000);
    
    // Check if the login page loaded
    const loginHeading = await page.locator('h1:has-text("Workout Tracker")');
    await expect(loginHeading).toBeVisible();
    console.log('✅ Login page loaded successfully');
    
    // Check for password input
    const passwordInput = await page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    console.log('✅ Password input is visible');
    
    // Check for login button
    const loginButton = await page.locator('button:has-text("Login")');
    await expect(loginButton).toBeVisible();
    console.log('✅ Login button is visible');
    
    // Test login functionality
    await passwordInput.fill('asaf2024');
    await loginButton.click();
    
    // Wait for the main app to load
    await page.waitForTimeout(2000);
    
    // Verify main app loaded
    const appHeader = await page.locator('header');
    await expect(appHeader).toBeVisible();
    console.log('✅ Successfully logged in');
    
    // Check for key UI elements
    const exportButton = await page.locator('button:has-text("Export"), button[title*="Export"]');
    const importButton = await page.locator('label:has-text("Import")');
    const historyButton = await page.locator('button:has-text("History")');
    
    await expect(exportButton).toBeVisible();
    console.log('✅ Export button found');
    
    await expect(importButton).toBeVisible();
    console.log('✅ Import button found');
    
    await expect(historyButton).toBeVisible();
    console.log('✅ History button found');
    
    // Check for workout calendar
    const workoutCards = await page.locator('.rounded-xl.border').count();
    expect(workoutCards).toBeGreaterThan(0);
    console.log(`✅ Found ${workoutCards} workout day cards`);
    
    // Wait a bit more to catch any late console errors
    await page.waitForTimeout(2000);
    
    // Filter out expected warnings (Supabase table check)
    const realErrors = consoleErrors.filter(error => 
      !error.includes('Using localStorage only') &&
      !error.includes('Supabase table') &&
      !error.includes('SUPABASE_SETUP.md')
    );
    
    // Report results
    console.log('\n📊 Test Results:');
    console.log('================');
    
    if (realErrors.length > 0) {
      console.log('❌ Console Errors Found:');
      realErrors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('✅ No console errors detected');
    }
    
    if (networkErrors.length > 0) {
      console.log('\n⚠️  Network Errors:');
      networkErrors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('✅ No network errors detected');
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'tests/screenshots/production-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved to: tests/screenshots/production-test.png');
    
    // Assertions
    expect(realErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
  });
  
  test('should not have any 406 errors', async ({ page }) => {
    const apiErrors = [];
    
    // Monitor API responses
    page.on('response', response => {
      if (response.status() === 406) {
        apiErrors.push(`406 Error: ${response.url()}`);
      }
    });
    
    // Navigate and login
    await page.goto(PRODUCTION_URL);
    await page.waitForTimeout(1000);
    
    const passwordInput = await page.locator('input[type="password"]');
    await passwordInput.fill('asaf2024');
    
    const loginButton = await page.locator('button:has-text("Login")');
    await loginButton.click();
    
    // Wait for app to fully load
    await page.waitForTimeout(3000);
    
    // Check results
    console.log('\n🔍 Checking for 406 errors...');
    if (apiErrors.length > 0) {
      console.log('❌ 406 Errors Found:');
      apiErrors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('✅ No 406 errors detected');
    }
    
    expect(apiErrors.length).toBe(0);
  });
  
  test('should verify Supabase integration status', async ({ page }) => {
    const consoleMessages = [];
    
    // Capture all console messages
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });
    
    // Navigate and login
    await page.goto(PRODUCTION_URL);
    await page.waitForTimeout(1000);
    
    const passwordInput = await page.locator('input[type="password"]');
    await passwordInput.fill('asaf2024');
    
    const loginButton = await page.locator('button:has-text("Login")');
    await loginButton.click();
    
    // Wait for storage initialization
    await page.waitForTimeout(3000);
    
    // Check for Supabase status messages
    const supabaseMessages = consoleMessages.filter(msg => 
      msg.text.includes('Supabase') || 
      msg.text.includes('localStorage')
    );
    
    console.log('\n💾 Storage System Status:');
    console.log('========================');
    
    if (supabaseMessages.length > 0) {
      supabaseMessages.forEach(msg => {
        const icon = msg.type === 'info' ? 'ℹ️' : msg.type === 'warning' ? '⚠️' : '✅';
        console.log(`${icon} ${msg.text}`);
      });
    }
    
    // Verify we got at least one storage status message
    expect(supabaseMessages.length).toBeGreaterThan(0);
  });
});
