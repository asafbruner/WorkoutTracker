const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Disable cache to get fresh deployment
    ignoreHTTPSErrors: true,
    bypassCSP: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Launch in incognito mode to bypass cache
        launchOptions: {
          args: ['--incognito']
        }
      },
    },
  ],
});
