import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';

export default async function globalSetup(config) {
  await fs.mkdir('./assets', { recursive: true });

  const { baseURL, storageState } = config.projects[0].use;

  // Launch a headed browser for manual sign-in
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to app for manual Google login...');
  await page.goto(baseURL || 'http://localhost:3000/app.html');

  console.log('Please sign in with Google in the opened browser window...');

  // Wait for post-login element (adjust selector to match your app state)
  await page.waitForSelector('#today, .user-profile, [data-authenticated="true"]', {
    timeout: 120000,
  });

  // Save session state to the path specified in playwright.config.mjs
  await context.storageState({ path: storageState });
  console.log(` Authentication state saved to ${storageState}`);

  await browser.close();
}
