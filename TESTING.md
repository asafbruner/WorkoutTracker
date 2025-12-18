# Testing Guide

This document outlines the testing strategy and how to run tests for the Workout Tracker application.

## Test Structure

```
tests/
├── setup.js                      # Test configuration and mocks
├── auth.test.js                  # Unit tests for authentication
├── analytics.test.js             # Unit tests for analytics
├── input-focus.spec.js           # E2E tests for input focus
├── production.spec.js            # E2E tests for production
└── progress-dashboard.spec.js    # E2E tests for progress dashboard
```

## Testing Stack

- **Vitest**: Unit and integration testing
- **Playwright**: End-to-end testing
- **React Testing Library**: Component testing
- **jsdom**: DOM simulation for unit tests

## Running Tests

### Install Dependencies

```bash
npm install
```

### Unit Tests

Run all unit tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm test -- --watch
```

Run tests with UI:
```bash
npm run test:ui
```

Run specific test file:
```bash
npm test -- tests/auth.test.js
```

### Coverage Reports

Generate coverage report:
```bash
npm run test:coverage
```

View coverage in browser:
```bash
# Coverage report will be in coverage/index.html
open coverage/index.html
```

### End-to-End Tests

Run all E2E tests:
```bash
npm run test:e2e
```

Run E2E tests with UI:
```bash
npm run test:e2e:ui
```

Run specific E2E test:
```bash
npx playwright test tests/progress-dashboard.spec.js
```

Run E2E tests in headed mode:
```bash
npx playwright test --headed
```

### Run All Tests

Run both unit and E2E tests:
```bash
npm run test:all
```

## Test Coverage

### Current Coverage Areas

#### Authentication (auth.test.js)
- ✅ Password hashing with SHA-256
- ✅ Password verification
- ✅ Environment variable configuration
- ✅ Custom password storage
- ✅ Password change functionality
- ✅ Error handling

#### Analytics (analytics.test.js)
- ✅ Workout statistics calculation
- ✅ Streak tracking (consecutive workouts)
- ✅ Volume calculations (weight × reps)
- ✅ Personal records tracking
- ✅ Running statistics (long runs and sprints)
- ✅ Workout type distribution
- ✅ Weekly progress trends
- ✅ Recent activity summaries

#### Progress Dashboard (progress-dashboard.spec.js)
- ✅ Dashboard opening/closing
- ✅ Key metrics display
- ✅ Personal records visualization
- ✅ Workout distribution charts
- ✅ Weekly progress charts
- ✅ Motivational messages
- ✅ Mobile responsiveness
- ✅ Empty state handling

#### Input Focus (input-focus.spec.js)
- ✅ Focus retention during typing
- ✅ Multiple rapid keystrokes
- ✅ Async save operations
- ✅ Cross-field navigation

## Writing New Tests

### Unit Test Example

```javascript
import { describe, it, expect } from 'vitest';
import { yourFunction } from '../src/utils/yourModule';

describe('Your Module', () => {
  it('should do something', () => {
    const result = yourFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### Component Test Example

```javascript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import YourComponent from '../src/components/YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### E2E Test Example

```javascript
import { test, expect } from '@playwright/test';

test('should perform user flow', async ({ page }) => {
  await page.goto('http://localhost:5174');
  await page.click('button:has-text("Click Me")');
  await expect(page.locator('text=Result')).toBeVisible();
});
```

## Test Configuration

### Vitest Config (vitest.config.js)

```javascript
{
  environment: 'jsdom',
  globals: true,
  setupFiles: './tests/setup.js',
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html']
  }
}
```

### Playwright Config (playwright.config.js)

```javascript
{
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5174',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
}
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - run: npx playwright install
      - run: npm run test:e2e
```

## Testing Best Practices

### Unit Tests
1. **Test one thing at a time**: Each test should verify a single behavior
2. **Use descriptive names**: Test names should clearly state what they test
3. **Arrange-Act-Assert**: Structure tests with clear setup, action, and verification
4. **Mock external dependencies**: Use mocks for API calls, storage, etc.
5. **Test edge cases**: Include tests for empty inputs, errors, boundary conditions

### E2E Tests
1. **Test user flows**: Focus on complete user journeys
2. **Use realistic data**: Test with data that represents actual usage
3. **Keep tests independent**: Each test should be able to run in isolation
4. **Wait for elements**: Use proper waits instead of fixed timeouts
5. **Clean up state**: Ensure tests don't affect each other

### Component Tests
1. **Test user interactions**: Click, type, submit, etc.
2. **Verify visual output**: Check that correct elements are rendered
3. **Test accessibility**: Ensure components are accessible
4. **Mock complex dependencies**: Use mocks for complex child components
5. **Test different states**: Loading, error, success, empty states

## Debugging Tests

### Debug Unit Tests

```bash
# Run specific test in debug mode
npm test -- --reporter=verbose tests/auth.test.js

# Debug with Node inspector
node --inspect-brk ./node_modules/vitest/vitest.mjs run
```

### Debug E2E Tests

```bash
# Run with headed browser
npx playwright test --headed --debug

# Run with Playwright Inspector
PWDEBUG=1 npx playwright test

# Generate trace for debugging
npx playwright test --trace on
```

### Common Issues

#### "crypto.subtle is not defined"
- Ensure `tests/setup.js` includes the crypto mock
- This is needed for password hashing tests

#### "Cannot find module 'jsdom'"
- Run `npm install` to ensure all dev dependencies are installed

#### "Test timeout"
- Increase timeout in test config
- Check for infinite loops or stuck async operations

#### "Element not found" in E2E tests
- Ensure the dev server is running: `npm run dev`
- Check that selectors match actual elements
- Add proper wait conditions

## Test Maintenance

### When to Update Tests

- **Feature changes**: Update tests when functionality changes
- **Bug fixes**: Add regression tests for fixed bugs
- **Refactoring**: Ensure tests still pass after code refactoring
- **New features**: Add tests for all new features

### Test Coverage Goals

- **Utilities**: 90%+ coverage
- **Components**: 80%+ coverage
- **Critical paths**: 100% coverage
- **E2E flows**: Cover main user journeys

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Jest-DOM Matchers](https://github.com/testing-library/jest-dom)

## Support

For testing issues:
1. Check this documentation
2. Review test examples in the `tests/` directory
3. Check error messages and stack traces
4. Consult framework documentation
5. Open an issue if needed
