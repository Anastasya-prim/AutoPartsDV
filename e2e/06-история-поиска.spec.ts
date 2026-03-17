import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('История поиска', () => {

  test('После поиска запрос появляется в истории', async ({ page }) => {
    await login(page, 'test@test.com', '123456');

    // Выполняем поиск
    await page.goto('/');
    await page.getByPlaceholder('Артикул или название запчасти').fill('48157-33062');
    await page.getByRole('button', { name: 'Найти' }).click();
    await page.waitForURL('**/search?q=48157-33062');
    await expect(page.locator('text=Результаты')).toBeVisible({ timeout: 90_000 });

    // Переходим в историю (ждём контент после гидрации и ответа API)
    await page.goto('/profile/history', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1', { hasText: 'История поиска' })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('text=48157-33062')).toBeVisible();
  });

  test('Из истории можно повторить запрос', async ({ page }) => {
    await login(page, 'test@test.com', '123456');

    await page.goto('/profile/history', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1', { hasText: 'История поиска' })).toBeVisible({ timeout: 20_000 });

    const repeatLink = page.locator('a', { hasText: 'Повторить' }).first();

    if (await repeatLink.isVisible()) {
      await repeatLink.click();
      await page.waitForURL('**/search?q=**');
      await expect(
        page.getByRole('heading', { name: /Результаты:|Ищем:/ })
      ).toBeVisible({ timeout: 90_000 });
    }
  });

  test('История видна в профиле (последние поиски)', async ({ page }) => {
    await login(page, 'test@test.com', '123456');

    await expect(page.locator('text=Последние поиски')).toBeVisible();
  });
});
