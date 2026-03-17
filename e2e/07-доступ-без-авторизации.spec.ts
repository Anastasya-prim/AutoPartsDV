import { test, expect } from '@playwright/test';

test.describe('Доступ без авторизации', () => {

  test('Главная страница доступна', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Найди запчасть по лучшей цене')).toBeVisible();
  });

  test('Поиск доступен без авторизации', async ({ page }) => {
    await page.goto('/search?q=48157-33062');
    await expect(
      page.getByRole('heading', { name: /Результаты:|Ищем:/ })
    ).toBeVisible({ timeout: 90_000 });
  });

  test('Карточка запчасти доступна без авторизации', async ({ page }) => {
    await page.goto('/part/48157-33062');
    await expect(
      page.getByRole('heading', { level: 1, name: '48157-33062' })
    ).toBeVisible({ timeout: 90_000 });
  });

  test('Профиль — перенаправляет на /login', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForURL('**/login', { waitUntil: 'domcontentloaded', timeout: 10_000 });
    await expect(page.locator('h1', { hasText: 'Вход в аккаунт' })).toBeVisible();
  });

  test('История поиска — перенаправляет на /login', async ({ page }) => {
    await page.goto('/profile/history');
    await page.waitForURL('**/login', { waitUntil: 'domcontentloaded', timeout: 10_000 });
    await expect(page.locator('h1', { hasText: 'Вход в аккаунт' })).toBeVisible();
  });

  test('Хедер показывает «Войти» вместо «Профиль»', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toContainText('Войти');
    await expect(page.locator('header')).not.toContainText('Профиль');
  });
});
