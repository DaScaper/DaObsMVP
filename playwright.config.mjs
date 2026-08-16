import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Path to global setup script
  globalSetup: './global-setup.mjs',

  // Default options for all projects
  use: {
    baseURL: 'http://localhost:3000',
    storageState: './assets/auth.json',
  },

  // Automatically start local server before execution
  webServer: {
    command: 'npx http-server . -p 3000',
    url: 'http://localhost:3000/app.html',
    reuseExistingServer: !process.env.CI,
  },

  projects: [
    {
      name: 'Mobile Safari (Screen Captures)',
      use: {
        ...devices['iPhone 13 Pro'],
        deviceScaleFactor: 3,
      },
    },
  ],
});
