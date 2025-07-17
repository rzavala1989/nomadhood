import { test, expect } from '@playwright/test';

test.setTimeout(35e3);

test('go to /', async ({ page }) => {
  await page.goto('/');

  await page.waitForSelector(`text=Welcome to Nomadhood`);
});

test('navigate to sign in', async ({ page }) => {
  await page.goto('/');

  await page.click('text=Sign In');
  await page.waitForLoadState('networkidle');

  // Should be on auth page or redirected to provider
  expect(page.url()).toContain('/auth');
});
