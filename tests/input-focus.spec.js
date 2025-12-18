import { test, expect } from '@playwright/test';

test.describe('Input Focus Retention', () => {
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

  test('should maintain focus when typing in strength exercise weight field', async ({ page }) => {
    // Click on "Log Workout" button for Sunday (Strength day)
    const logButtons = page.locator('button:has-text("Log Workout")');
    await logButtons.first().click();
    
    // Wait for modal to open
    await expect(page.locator('text=Strength Exercises')).toBeVisible();
    
    // Find the first weight input field
    const weightInput = page.locator('input[placeholder="kg"]').first();
    await weightInput.click();
    
    // Type multiple characters and verify focus is maintained
    await weightInput.type('70', { delay: 100 });
    
    // Verify the input has focus and contains the typed value
    await expect(weightInput).toBeFocused();
    await expect(weightInput).toHaveValue('70');
    
    // Continue typing to ensure focus isn't lost
    await page.keyboard.press('Backspace');
    await page.keyboard.type('5');
    
    // Verify focus is still maintained and value is correct
    await expect(weightInput).toBeFocused();
    await expect(weightInput).toHaveValue('75');
  });

  test('should maintain focus when typing in reps field', async ({ page }) => {
    // Click on "Log Workout" button for Sunday (Strength day)
    const logButtons = page.locator('button:has-text("Log Workout")');
    await logButtons.first().click();
    
    // Wait for modal to open
    await expect(page.locator('text=Strength Exercises')).toBeVisible();
    
    // Find the first reps input field
    const repsInput = page.locator('input[placeholder="5/5/5"]').first();
    await repsInput.click();
    
    // Type a sequence of characters
    await repsInput.type('5/5/5', { delay: 100 });
    
    // Verify focus is maintained and value is correct
    await expect(repsInput).toBeFocused();
    await expect(repsInput).toHaveValue('5/5/5');
  });

  test('should maintain focus when typing in notes field', async ({ page }) => {
    // Click on "Log Workout" button for Sunday (Strength day)
    const logButtons = page.locator('button:has-text("Log Workout")');
    await logButtons.first().click();
    
    // Wait for modal to open
    await expect(page.locator('text=Strength Exercises')).toBeVisible();
    
    // Find the first exercise notes field
    const notesInput = page.locator('input[placeholder="How did it feel? Any issues?"]').first();
    await notesInput.click();
    
    // Type a longer text to test focus retention
    const testText = 'Felt great today!';
    await notesInput.type(testText, { delay: 50 });
    
    // Verify focus is maintained and value is correct
    await expect(notesInput).toBeFocused();
    await expect(notesInput).toHaveValue(testText);
  });

  test('should maintain focus when typing in general notes textarea', async ({ page }) => {
    // Click on "Log Workout" button for Sunday (Strength day)
    const logButtons = page.locator('button:has-text("Log Workout")');
    await logButtons.first().click();
    
    // Wait for modal to open
    await expect(page.locator('text=General Notes')).toBeVisible();
    
    // Find the general notes textarea
    const notesTextarea = page.locator('textarea[placeholder*="How did the workout feel"]');
    await notesTextarea.click();
    
    // Type a longer text
    const testText = 'Great workout session. Hit new PRs on squats!';
    await notesTextarea.type(testText, { delay: 50 });
    
    // Verify focus is maintained and value is correct
    await expect(notesTextarea).toBeFocused();
    await expect(notesTextarea).toHaveValue(testText);
  });

  test('should maintain focus when typing in running distance field', async ({ page }) => {
    // Navigate to Friday (Long Run day)
    // Click next week button several times to get to a Friday
    const nextButton = page.locator('button').filter({ has: page.locator('svg').first() }).last();
    
    // Click on Friday's Log Workout button (index 5)
    const allLogButtons = await page.locator('button:has-text("Log Workout")').all();
    if (allLogButtons.length >= 6) {
      await allLogButtons[5].click();
    } else {
      // If not enough buttons, just use the last one
      await allLogButtons[allLogButtons.length - 1].click();
    }
    
    // Wait for modal to open - check for either Long Run or Sprint
    await page.waitForTimeout(500);
    
    // Try to find distance field (works for long run)
    const distanceInput = page.locator('input[placeholder="5.0"]');
    if (await distanceInput.isVisible()) {
      await distanceInput.click();
      
      // Type distance
      await distanceInput.type('6.5', { delay: 100 });
      
      // Verify focus is maintained and value is correct
      await expect(distanceInput).toBeFocused();
      await expect(distanceInput).toHaveValue('6.5');
    }
  });

  test('should maintain focus across multiple rapid keystrokes', async ({ page }) => {
    // Click on "Log Workout" button for Sunday (Strength day)
    const logButtons = page.locator('button:has-text("Log Workout")');
    await logButtons.first().click();
    
    // Wait for modal to open
    await expect(page.locator('text=Strength Exercises')).toBeVisible();
    
    // Find the first weight input field
    const weightInput = page.locator('input[placeholder="kg"]').first();
    await weightInput.click();
    
    // Type rapidly without delay to stress test focus retention
    await weightInput.type('123456789', { delay: 10 });
    
    // Verify focus is still maintained
    await expect(weightInput).toBeFocused();
    await expect(weightInput).toHaveValue('123456789');
  });

  test('should save data without losing focus', async ({ page }) => {
    // Click on "Log Workout" button for Sunday (Strength day)
    const logButtons = page.locator('button:has-text("Log Workout")');
    await logButtons.first().click();
    
    // Wait for modal to open
    await expect(page.locator('text=Strength Exercises')).toBeVisible();
    
    // Find the first weight input field
    const weightInput = page.locator('input[placeholder="kg"]').first();
    await weightInput.click();
    
    // Type value
    await weightInput.type('80', { delay: 100 });
    
    // Wait a bit for async save to complete
    await page.waitForTimeout(200);
    
    // Verify focus is still on the input
    await expect(weightInput).toBeFocused();
    
    // Type more to verify focus wasn't lost during save
    await page.keyboard.type('5');
    
    await expect(weightInput).toBeFocused();
    await expect(weightInput).toHaveValue('805');
  });
});
