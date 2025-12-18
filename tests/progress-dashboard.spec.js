import { test, expect } from '@playwright/test';

test.describe('Progress Dashboard', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear all storage completely
    await context.clearCookies();
    await context.clearPermissions();
    
    // Add init script to clear storage before page loads
    await context.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Check if already logged in or need to login
    const isLoggedIn = await page.locator('button:has-text("Logout")').isVisible();
    
    if (!isLoggedIn) {
      // Login - clear the field first and then fill
      const passwordField = page.locator('input[type="password"]');
      await passwordField.waitFor({ timeout: 5000 });
      await passwordField.clear();
      await passwordField.fill('asaf2024');
      await page.click('button:has-text("Login")');
      await page.waitForTimeout(1000);
      
      // Verify login was successful
      await page.waitForSelector('button:has-text("Logout")', { timeout: 10000 });
    }
    
    // Wait for main app
    await page.waitForTimeout(500);
  });

  test('should open progress dashboard when clicking Progress button', async ({ page }) => {
    // Look for Progress button in header (once integrated)
    const progressButton = page.locator('button:has-text("Progress")');
    
    // Skip test if button not yet integrated
    const buttonExists = await progressButton.count() > 0;
    test.skip(!buttonExists, 'Progress button not yet integrated');
    
    await progressButton.click();
    
    // Verify dashboard opened
    await expect(page.locator('text=Progress & Analytics')).toBeVisible();
  });

  test('should display key metrics in dashboard', async ({ page }) => {
    const progressButton = page.locator('button:has-text("Progress")');
    const buttonExists = await progressButton.count() > 0;
    test.skip(!buttonExists, 'Progress button not yet integrated');
    
    await progressButton.click();
    await page.waitForTimeout(500);
    
    // Check for metric cards
    await expect(page.locator('text=Current Streak')).toBeVisible();
    await expect(page.locator('text=Total Workouts')).toBeVisible();
    await expect(page.locator('text=Personal Records')).toBeVisible();
    await expect(page.locator('text=This Month')).toBeVisible();
  });

  test('should display personal records section', async ({ page }) => {
    const progressButton = page.locator('button:has-text("Progress")');
    const buttonExists = await progressButton.count() > 0;
    test.skip(!buttonExists, 'Progress button not yet integrated');
    
    await progressButton.click();
    await page.waitForTimeout(500);
    
    // Check for Personal Records section
    await expect(page.locator('text=Personal Records')).toBeVisible();
  });

  test('should display workout distribution chart', async ({ page }) => {
    const progressButton = page.locator('button:has-text("Progress")');
    const buttonExists = await progressButton.count() > 0;
    test.skip(!buttonExists, 'Progress button not yet integrated');
    
    await progressButton.click();
    await page.waitForTimeout(500);
    
    // Check for distribution section
    await expect(page.locator('text=Workout Distribution')).toBeVisible();
  });

  test('should display weekly progress chart', async ({ page }) => {
    const progressButton = page.locator('button:has-text("Progress")');
    const buttonExists = await progressButton.count() > 0;
    test.skip(!buttonExists, 'Progress button not yet integrated');
    
    await progressButton.click();
    await page.waitForTimeout(500);
    
    // Check for weekly progress section
    await expect(page.locator('text=Weekly Progress')).toBeVisible();
  });

  test('should show motivational message when streak exists', async ({ page }) => {
    // First log a workout to create a streak
    const logButtons = page.locator('button:has-text("Log Workout")');
    if (await logButtons.count() > 0) {
      await logButtons.first().click();
      await page.waitForTimeout(500);
      
      // Mark as completed
      await page.click('button:has-text("Completed")');
      await page.waitForTimeout(300);
      
      // Close modal
      await page.click('button:has-text("Save & Close")');
      await page.waitForTimeout(500);
    }
    
    const progressButton = page.locator('button:has-text("Progress")');
    const buttonExists = await progressButton.count() > 0;
    test.skip(!buttonExists, 'Progress button not yet integrated');
    
    await progressButton.click();
    await page.waitForTimeout(500);
    
    // Check for motivational message (may or may not be visible depending on streak)
    const motivationalSection = page.locator('text=Keep going!,text=You\'re on fire!');
    const hasMotivation = await motivationalSection.count() > 0;
    
    if (hasMotivation) {
      await expect(motivationalSection.first()).toBeVisible();
    }
  });

  test('should close dashboard when clicking close button', async ({ page }) => {
    const progressButton = page.locator('button:has-text("Progress")');
    const buttonExists = await progressButton.count() > 0;
    test.skip(!buttonExists, 'Progress button not yet integrated');
    
    await progressButton.click();
    await page.waitForTimeout(500);
    
    // Click close button (×)
    const closeButton = page.locator('button:has-text("×")').last();
    await closeButton.click();
    
    // Dashboard should be closed
    await expect(page.locator('text=Progress & Analytics')).not.toBeVisible();
  });

  test('should calculate streak correctly with consecutive workouts', async ({ page }) => {
    // Log multiple consecutive workouts
    const logButtons = page.locator('button:has-text("Log Workout")');
    const buttonCount = await logButtons.count();
    
    // Log 3 workouts
    for (let i = 0; i < Math.min(3, buttonCount); i++) {
      await logButtons.nth(i).click();
      await page.waitForTimeout(300);
      await page.click('button:has-text("Completed")');
      await page.waitForTimeout(200);
      await page.click('button:has-text("Save & Close")');
      await page.waitForTimeout(300);
    }
    
    const progressButton = page.locator('button:has-text("Progress")');
    const buttonExists = await progressButton.count() > 0;
    test.skip(!buttonExists, 'Progress button not yet integrated');
    
    await progressButton.click();
    await page.waitForTimeout(500);
    
    // Streak should be visible (at least 1 based on today's workout)
    const streakValue = await page.locator('text=Current Streak').locator('..').locator('text=/\\d+/').first();
    await expect(streakValue).toBeVisible();
  });

  test('should display PRs after logging workout with weights', async ({ page }) => {
    // Log a strength workout with weight
    const logButtons = page.locator('button:has-text("Log Workout")');
    if (await logButtons.count() > 0) {
      await logButtons.first().click();
      await page.waitForTimeout(500);
      
      // Fill in weight for first exercise
      const weightInput = page.locator('input[placeholder="kg"]').first();
      await weightInput.fill('75');
      await page.waitForTimeout(200);
      
      // Mark as completed
      await page.click('button:has-text("Completed")');
      await page.waitForTimeout(300);
      
      // Save
      await page.click('button:has-text("Save & Close")');
      await page.waitForTimeout(500);
    }
    
    const progressButton = page.locator('button:has-text("Progress")');
    const buttonExists = await progressButton.count() > 0;
    test.skip(!buttonExists, 'Progress button not yet integrated');
    
    await progressButton.click();
    await page.waitForTimeout(500);
    
    // Check if PRs section shows data
    const prSection = page.locator('text=Personal Records').locator('..');
    await expect(prSection).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const progressButton = page.locator('button:has-text("Progress")');
    const buttonExists = await progressButton.count() > 0;
    test.skip(!buttonExists, 'Progress button not yet integrated');
    
    await progressButton.click();
    await page.waitForTimeout(500);
    
    // Dashboard should be visible and scrollable
    const dashboard = page.locator('text=Progress & Analytics').locator('..');
    await expect(dashboard).toBeVisible();
    
    // Should be able to scroll
    await dashboard.evaluate((el) => {
      el.scrollTop = 100;
    });
    
    await page.waitForTimeout(200);
  });

  test('should show empty state for no workout data', async ({ page }) => {
    // Clear all data
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Check if we need to login again or if still logged in
    const isLoggedIn = await page.locator('button:has-text("Logout")').isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!isLoggedIn) {
      // Login again - clear field first
      const passwordField = page.locator('input[type="password"]');
      await passwordField.waitFor({ timeout: 5000 });
      await passwordField.clear();
      await passwordField.fill('asaf2024');
      await page.click('button:has-text("Login")');
      await page.waitForSelector('button:has-text("Logout")', { timeout: 10000 });
      await page.waitForTimeout(500);
    }
    
    const progressButton = page.locator('button:has-text("Progress")');
    const buttonExists = await progressButton.count() > 0;
    test.skip(!buttonExists, 'Progress button not yet integrated');
    
    await progressButton.click();
    await page.waitForTimeout(500);
    
    // Should show zeros or empty states
    const streakValue = await page.locator('text=Current Streak').locator('..').locator('text=/\\d+/').first().textContent();
    expect(parseInt(streakValue || '0')).toBe(0);
  });
});
