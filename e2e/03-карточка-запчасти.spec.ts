import { test, expect } from '@playwright/test';

test.describe('Карточка запчасти', () => {

  test('Открытие карточки по прямой ссылке', async ({ page }) => {
    await page.goto('/part/48157-33062');

    // Один h1 с артикулом — иначе text= даёт strict violation (несколько узлов с подстрокой)
    await expect(
      page.getByRole('heading', { level: 1, name: '48157-33062' })
    ).toBeVisible({ timeout: 90_000 });
  });

  test('Переход из результатов поиска в карточку', async ({ page }) => {
    await page.goto('/search?q=48157-33062');

    await expect(page.locator('text=Результаты')).toBeVisible({ timeout: 90_000 });

    const partLink = page.locator('a[href*="/part/"]').first();
    await expect(partLink).toBeVisible({ timeout: 10_000 });
    await partLink.click();

    await page.waitForURL('**/part/**');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});
