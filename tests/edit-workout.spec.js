import { test, expect } from '@playwright/test';

test.describe('Edit Workout Feature', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear storage to ensure clean state
    await context.clearCookies();
    await context.clearPermissions();
    
    await page.goto('http://localhost:5173');
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Check if we're already logged in or need to log in
    const editWorkoutButton = page.locator('button:has-text("Edit Workout")');
    const passwordInput = page.locator('input[type="password"]');
    
    // Wait a bit for the page to determine if login is needed
    await page.waitForTimeout(1000);
    
    const isLoginVisible = await passwordInput.isVisible().catch(() => false);
    
    if (isLoginVisible) {
      // Need to login
      await passwordInput.fill('test123');
      const loginButton = page.locator('button:has-text("Login")');
      await loginButton.click();
    }
    
    // Wait for main app to be ready
    await editWorkoutButton.first().waitFor({ state: 'visible', timeout: 15000 });
  });

  test('should display Edit Workout button on workout days', async ({ page }) => {
    // Check that Edit Workout button exists for non-rest days
    const editButtons = await page.locator('button:has-text("Edit Workout")').count();
    
    // Should have Edit Workout buttons for all non-rest days (6 buttons in weekly view)
    expect(editButtons).toBeGreaterThan(0);
    
    // Verify button styling
    const firstEditButton = page.locator('button:has-text("Edit Workout")').first();
    await expect(firstEditButton).toBeVisible();
    await expect(firstEditButton).toHaveClass(/bg-amber-600/);
  });

  test('should open Edit Workout modal when button is clicked', async ({ page }) => {
    // Click the first Edit Workout button
    await page.locator('button:has-text("Edit Workout")').first().click();
    
    // Wait for modal to appear
    await page.waitForSelector('text=Edit Workout', { timeout: 2000 });
    
    // Verify modal elements
    await expect(page.locator('h2:has-text("Edit Workout")')).toBeVisible();
    await expect(page.locator('div.text-sm.text-gray-400:has-text("Workout Type")').first()).toBeVisible();
    await expect(page.locator('text=Exercises')).toBeVisible();
    await expect(page.locator('button:has-text("Save Changes")')).toBeVisible();
    await expect(page.locator('button:has-text("Reset to Default")')).toBeVisible();
  });

  test('should display workout type as read-only', async ({ page }) => {
    // Open Edit Workout modal
    await page.locator('button:has-text("Edit Workout")').first().click();
    await page.waitForTimeout(500);
    
    // Verify workout type section exists and shows read-only message
    await expect(page.locator('div.text-sm.text-gray-400:has-text("Workout Type")').first()).toBeVisible();
    await expect(page.locator('text=To change workout type, use the Schedule feature')).toBeVisible();
  });

  test('should allow editing exercise name', async ({ page }) => {
    // Open Edit Workout modal for a Strength day
    const strengthButton = page.locator('button:has-text("Edit Workout")').first();
    await strengthButton.click();
    await page.waitForTimeout(500);
    
    // Find the first exercise name input
    const exerciseNameInput = page.locator('input[placeholder="e.g., Back Squats"]').first();
    
    // Clear and type new name
    await exerciseNameInput.clear();
    await exerciseNameInput.fill('Modified Exercise Name');
    
    // Verify the value changed
    await expect(exerciseNameInput).toHaveValue('Modified Exercise Name');
  });

  test('should allow editing target weight and reps', async ({ page }) => {
    // Open Edit Workout modal
    await page.locator('button:has-text("Edit Workout")').first().click();
    await page.waitForTimeout(500);
    
    // Find target weight input
    const targetWeightInput = page.locator('input[placeholder="e.g., 70"]').first();
    await targetWeightInput.clear();
    await targetWeightInput.fill('85');
    await expect(targetWeightInput).toHaveValue('85');
    
    // Find target reps input
    const targetRepsInput = page.locator('input[placeholder="e.g., 20"]').first();
    await targetRepsInput.clear();
    await targetRepsInput.fill('25');
    await expect(targetRepsInput).toHaveValue('25');
  });

  test('should allow adding new exercises', async ({ page }) => {
    // Open Edit Workout modal
    await page.locator('button:has-text("Edit Workout")').first().click();
    await page.waitForTimeout(500);
    
    // Count initial exercises by counting Remove buttons
    const initialExerciseCount = await page.locator('button:has-text("Remove")').count();
    
    // Click Add Exercise button
    await page.locator('button:has-text("Add Exercise")').click();
    await page.waitForTimeout(300);
    
    // Verify new exercise was added by counting Remove buttons
    const newExerciseCount = await page.locator('button:has-text("Remove")').count();
    expect(newExerciseCount).toBe(initialExerciseCount + 1);
    
    // Verify new exercise has correct fields
    await expect(page.locator('input[placeholder="e.g., Back Squats"]').last()).toBeVisible();
  });

  test('should allow removing exercises', async ({ page }) => {
    // Open Edit Workout modal
    await page.locator('button:has-text("Edit Workout")').first().click();
    await page.waitForTimeout(500);
    
    // Count initial exercises
    const initialExerciseCount = await page.locator('button:has-text("Remove")').count();
    
    if (initialExerciseCount > 1) {
      // Click the first Remove button
      await page.locator('button:has-text("Remove")').first().click();
      await page.waitForTimeout(300);
      
      // Verify exercise was removed
      const newExerciseCount = await page.locator('button:has-text("Remove")').count();
      expect(newExerciseCount).toBe(initialExerciseCount - 1);
    }
  });

  test('should show "Apply to all future occurrences" checkbox', async ({ page }) => {
    // Open Edit Workout modal
    await page.locator('button:has-text("Edit Workout")').first().click();
    await page.waitForTimeout(500);
    
    // Verify checkbox exists
    const checkbox = page.locator('input[type="checkbox"]');
    await expect(checkbox).toBeVisible();
    
    // Verify label text
    await expect(page.locator('text=Apply to all future occurrences')).toBeVisible();
    
    // Verify it's unchecked by default
    await expect(checkbox).not.toBeChecked();
  });

  test('should toggle "Apply to future" checkbox and update description', async ({ page }) => {
    // Open Edit Workout modal
    await page.locator('button:has-text("Edit Workout")').first().click();
    await page.waitForTimeout(500);
    
    // Find checkbox
    const checkbox = page.locator('input[type="checkbox"]');
    
    // Verify default state shows "this week" message
    await expect(page.locator('text=Changes will only apply to this week\'s workout')).toBeVisible();
    
    // Click checkbox
    await checkbox.check();
    await page.waitForTimeout(200);
    
    // Verify it's checked
    await expect(checkbox).toBeChecked();
    
    // Verify description changed to "all future" message
    const futureText = page.locator('text=This will update the default');
    await expect(futureText).toBeVisible();
  });

  test('should save changes when Save button is clicked', async ({ page }) => {
    // Open Edit Workout modal
    await page.locator('button:has-text("Edit Workout")').first().click();
    await page.waitForTimeout(500);
    
    // Make a change - edit exercise name
    const exerciseNameInput = page.locator('input[placeholder="e.g., Back Squats"]').first();
    await exerciseNameInput.clear();
    await exerciseNameInput.fill('Test Exercise');
    
    // Click Save Changes button
    await page.locator('button:has-text("Save Changes")').click();
    await page.waitForTimeout(1000);
    
    // Verify modal closed
    await expect(page.locator('h2:has-text("Edit Workout")')).not.toBeVisible();
    
    // Verify save status message appeared
    await expect(page.locator('text=✓ Updated for this week').or(page.locator('text=✓ Applied to all future occurrences'))).toBeVisible();
  });

  test('should close modal when X button is clicked', async ({ page }) => {
    // Open Edit Workout modal
    await page.locator('button:has-text("Edit Workout")').first().click();
    await page.waitForTimeout(500);
    
    // Verify modal is open
    await expect(page.locator('h2:has-text("Edit Workout")')).toBeVisible();
    
    // Click close button (×)
    await page.locator('button:has-text("×")').last().click();
    await page.waitForTimeout(300);
    
    // Verify modal closed
    await expect(page.locator('h2:has-text("Edit Workout")')).not.toBeVisible();
  });

  test('should reset to default when Reset button is clicked', async ({ page }) => {
    // First, make a change
    await page.locator('button:has-text("Edit Workout")').first().click();
    await page.waitForTimeout(500);
    
    const exerciseNameInput = page.locator('input[placeholder="e.g., Back Squats"]').first();
    await exerciseNameInput.clear();
    await exerciseNameInput.fill('Modified Name');
    
    // Save the change
    await page.locator('button:has-text("Save Changes")').click();
    await page.waitForTimeout(1000);
    
    // Open modal again and verify change persisted
    await page.locator('button:has-text("Edit Workout")').first().click();
    await page.waitForTimeout(500);
    const modifiedInput = page.locator('input[placeholder="e.g., Back Squats"]').first();
    await expect(modifiedInput).toHaveValue('Modified Name');
    
    // Click Reset to Default
    await page.locator('button:has-text("Reset to Default")').click();
    await page.waitForTimeout(500);
    
    // Verify modal closed
    await expect(page.locator('h2:has-text("Edit Workout")')).not.toBeVisible();
    
    // Reopen modal and verify the exercise name is back to default (Back Squats)
    await page.locator('button:has-text("Edit Workout")').first().click();
    await page.waitForTimeout(500);
    const resetInput = page.locator('input[placeholder="e.g., Back Squats"]').first();
    // Should be back to default value (Back Squats)
    await expect(resetInput).toHaveValue('Back Squats');
  });

  test('should preserve changes after modal close and reopen', async ({ page }) => {
    // Open Edit Workout modal
    await page.locator('button:has-text("Edit Workout")').first().click();
    await page.waitForTimeout(500);
    
    // Make a change
    const exerciseNameInput = page.locator('input[placeholder="e.g., Back Squats"]').first();
    const testName = 'Preserved Exercise Name';
    await exerciseNameInput.clear();
    await exerciseNameInput.fill(testName);
    
    // Save
    await page.locator('button:has-text("Save Changes")').click();
    await page.waitForTimeout(1000);
    
    // Reopen modal
    await page.locator('button:has-text("Edit Workout")').first().click();
    await page.waitForTimeout(500);
    
    // Verify the change persisted
    const reopenedInput = page.locator('input[placeholder="e.g., Back Squats"]').first();
    await expect(reopenedInput).toHaveValue(testName);
  });

  test('should always show Edit Workout button on non-rest days', async ({ page }) => {
    // Verify Edit Workout buttons are always visible for non-rest days
    const editButtons = await page.locator('button:has-text("Edit Workout")').count();
    
    // Should have Edit Workout buttons for all non-rest days
    expect(editButtons).toBeGreaterThan(0);
    
    // Verify button is visible
    const firstEditButton = page.locator('button:has-text("Edit Workout")').first();
    await expect(firstEditButton).toBeVisible();
  });

  test('should not show Edit Workout button on Rest days', async ({ page }) => {
    // Look for Rest day card
    const restDay = page.locator('div:has-text("Rest")').first();
    
    if (await restDay.isVisible()) {
      // Get the parent card
      const restCard = restDay.locator('xpath=ancestor::div[contains(@class, "rounded-xl")]').first();
      
      // Verify no Edit Workout button in this card
      const editButton = restCard.locator('button:has-text("Edit Workout")');
      await expect(editButton).not.toBeVisible();
    }
  });

  test('should allow editing exercise notes', async ({ page }) => {
    // Open Edit Workout modal
    await page.locator('button:has-text("Edit Workout")').first().click();
    await page.waitForTimeout(500);
    
    // Find notes textarea
    const notesTextarea = page.locator('textarea[placeholder*="Additional notes"]').first();
    await notesTextarea.clear();
    await notesTextarea.fill('This is a test note for the exercise');
    
    // Verify the value
    await expect(notesTextarea).toHaveValue('This is a test note for the exercise');
  });

  test('should display correct date in modal header', async ({ page }) => {
    // Open Edit Workout modal
    await page.locator('button:has-text("Edit Workout")').first().click();
    await page.waitForTimeout(500);
    
    // Verify date is displayed (should contain day name and date)
    const dateText = page.locator('div:has-text("day")').first();
    await expect(dateText).toBeVisible();
  });

  test('should handle multiple exercise edits correctly', async ({ page }) => {
    // Open Edit Workout modal
    await page.locator('button:has-text("Edit Workout")').first().click();
    await page.waitForTimeout(500);
    
    // Edit multiple fields in first exercise - use more specific selectors
    const exerciseCard = page.locator('div:has-text("Exercise 1")').first();
    
    await exerciseCard.locator('input[placeholder="e.g., Back Squats"]').first().fill('Modified Exercise');
    await exerciseCard.locator('input[placeholder="e.g., 3 sets: 5 reps"]').first().fill('4 sets: 6 reps');
    await exerciseCard.locator('input[placeholder="e.g., 70"]').first().fill('80');
    await exerciseCard.locator('input[placeholder="e.g., 20"]').first().fill('24');
    
    // Save
    await page.locator('button:has-text("Save Changes")').click();
    await page.waitForTimeout(1000);
    
    // Reopen and verify all changes persisted
    await page.locator('button:has-text("Edit Workout")').first().click();
    await page.waitForTimeout(500);
    
    const reopenedCard = page.locator('div:has-text("Exercise 1")').first();
    await expect(reopenedCard.locator('input[placeholder="e.g., Back Squats"]').first()).toHaveValue('Modified Exercise');
    await expect(reopenedCard.locator('input[placeholder="e.g., 3 sets: 5 reps"]').first()).toHaveValue('4 sets: 6 reps');
    await expect(reopenedCard.locator('input[placeholder="e.g., 70"]').first()).toHaveValue('80');
    await expect(reopenedCard.locator('input[placeholder="e.g., 20"]').first()).toHaveValue('24');
  });
});
