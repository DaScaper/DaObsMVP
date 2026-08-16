import { test, expect } from '@playwright/test';
import path from 'node:path';

const SCREENS_DIR = './assets/screens';

const screens = [
  { name: 'today.png', hash: '#today' },
  { name: 'money.png', hash: '#money' },
  { name: 'body.png', hash: '#body' },
  { name: 'habits.png', hash: '#habits' },
];

test.describe('Capture App Screen Assets', () => {
  test('capture mobile screenshots using stored auth', async ({ page }) => {
    await page.goto('/app.html');

    // Verify session state is active
    const isSignedOut = await page.evaluate(() => {
      return document.body.innerText.includes('Sign in') || !!document.querySelector('#google-auth-button');
    });

    if (isSignedOut) {
      throw new Error('Stored Google Auth session has expired. Re-run global setup.');
    }

    for (const screen of screens) {
      await page.goto(`/app.html${screen.hash}`);
      await page.waitForTimeout(500); // Wait for transitions/animations
      await page.screenshot({ path: path.join(SCREENS_DIR, screen.name) });
      console.log(` Captured ${screen.name}`);
    }
  });
});
