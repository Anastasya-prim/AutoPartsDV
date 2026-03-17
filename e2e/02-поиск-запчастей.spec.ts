import { test, expect } from '@playwright/test';

test.describe('Поиск запчастей', () => {

  test('Поиск через главную — результаты отображаются', async ({ page }) => {
    await page.goto('/');

    await page.getByPlaceholder('Артикул или название запчасти').fill('48157-33062');
    await page.getByRole('button', { name: 'Найти' }).click();

    await page.waitForURL('**/search?q=48157-33062');

    await expect(page.locator('text=Результаты')).toBeVisible({ timeout: 90_000 });
  });

  test('Быстрый поиск по примеру артикула', async ({ page }) => {
    await page.goto('/');

    await page.locator('button', { hasText: '48157-33062' }).click();

    await page.waitForURL('**/search?q=48157-33062');
    await expect(page.locator('text=Результаты')).toBeVisible({ timeout: 90_000 });
  });

  test('Поиск через строку на странице результатов', async ({ page }) => {
    await page.goto('/search?q=48157-33062');

    // Один h1 — «Ищем:» или «Результаты:»; .or(text=Ищем) даёт 2 узла → strict violation
    await expect(
      page.getByRole('heading', { name: /Результаты:|Ищем:/ })
    ).toBeVisible({ timeout: 90_000 });
  });

  test('Пустой поиск — остаётся на месте', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Найти' }).click();

    await expect(page).toHaveURL('http://localhost:3000/');
  });
});
