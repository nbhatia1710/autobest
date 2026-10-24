import { test, expect } from '@playwright/test';
async function loadPhotos(page) {
  await page.locator('img').evaluateAll(async (images) => {
    images.forEach((image) => {
      image.loading = 'eager';
    });
    await Promise.all(images.map((image) => image.decode().catch(() => {})));
  });
}
test('customer journey: video, search, details, purchase, stock and route protection', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('.hero-video')).toHaveAttribute('autoplay', '');
  await expect(page.locator('.hero-topline, .hero-copy, .demo-banner')).toHaveCount(0);
  await page.waitForFunction(() => document.querySelector('video')?.readyState >= 2);
  await page.locator('video').evaluate(async (v) => {
    v.pause();
    v.currentTime = 3.8;
    await new Promise((resolve) => v.addEventListener('seeked', resolve, { once: true }));
  });
  await loadPhotos(page);
  await page.screenshot({ path: 'docs/home-desktop.png', fullPage: true });
  await page.getByRole('link', { name: 'Sign in', exact: true }).click();
  await page.getByRole('button', { name: 'Explore as customer' }).click();
  await page.locator('#collection').scrollIntoViewIfNeeded();
  await expect(page.locator('.vehicle-card')).toHaveCount(6);
  await expect(page.getByRole('button', { name: 'Out of stock', exact: true })).toBeDisabled();
  await page.getByRole('textbox', { name: 'Search by model' }).fill('AMG');
  await expect(page.locator('.vehicle-card')).toHaveCount(1);
  await page.getByRole('button', { name: /Explore Mercedes/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.screenshot({ path: 'docs/vehicle-details.png' });
  await page.getByRole('button', { name: 'Purchase vehicle', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm purchase' }).click();
  await expect(
    page.getByRole('dialog').getByRole('button', { name: 'Out of stock' }),
  ).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('status')).toContainText('demo purchase complete');
  await page.getByRole('textbox', { name: 'Search by model' }).fill('');
  await expect(page.locator('.vehicle-card')).toHaveCount(6);
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByLabel('Minimum price ($)').fill('200000');
  await page.getByLabel('Maximum price ($)').fill('1000');
  await expect(page.getByRole('alert')).toContainText('Minimum price');
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.locator('.vehicle-card')).toHaveCount(6);
  await loadPhotos(page);
  await page.screenshot({ path: 'docs/collection-desktop.png', fullPage: true });
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Administrator access required.' })).toBeVisible();
  expect(errors).toEqual([]);
});
test('admin adds, edits, restocks and deletes a vehicle', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Explore as admin' }).click();
  await expect(page.locator('tbody tr')).toHaveCount(6);
  await page.getByRole('button', { name: 'Add vehicle', exact: true }).click();
  await page.getByLabel('Make *', { exact: true }).fill('Lexus');
  await page.getByLabel('Model *').fill('LC 500');
  await page.getByLabel('Price (USD) *').fill('94000');
  await page.getByLabel('Quantity in stock *').fill('2');
  await page.getByRole('dialog').getByRole('button', { name: 'Add vehicle', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(7);
  await page.getByRole('button', { name: 'Edit LC 500', exact: true }).click();
  await page.getByLabel('Price (USD) *').fill('93000');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('$93,000', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Restock LC 500' }).click();
  await page.getByLabel('Units to add').fill('3');
  await page.getByRole('button', { name: 'Confirm restock' }).click();
  await expect(page.locator('tr').filter({ hasText: 'LC 500' })).toContainText('5 units');
  await page.screenshot({ path: 'docs/admin-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Delete LC 500' }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(7);
  await page.getByRole('button', { name: 'Delete LC 500' }).click();
  await page.getByRole('button', { name: 'Delete vehicle', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(6);
});
test('registration validation and mobile reduced-motion layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/inventory');
  await expect(page).toHaveURL(/login/);
  await page.getByRole('link', { name: 'Create an account' }).click();
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
  await page.getByLabel('Email address').fill('test@example.com');
  await page.getByLabel('Password', { exact: true }).fill('demo-password');
  await page.getByLabel('Confirm password').fill('demo-password');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'You’re all set.' })).toBeVisible();
  await page.getByRole('link', { name: 'Continue to sign in' }).click();
  await page.getByRole('button', { name: 'Explore as customer' }).click();
  await expect(page.locator('.vehicle-card')).toHaveCount(6);
  expect(await page.locator('video').evaluate((v) => v.paused)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await loadPhotos(page);
  await page.screenshot({ path: 'docs/showroom-mobile.png', fullPage: true });
  await page.getByRole('button', { name: /Explore Porsche/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.screenshot({ path: 'docs/details-mobile.png' });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
