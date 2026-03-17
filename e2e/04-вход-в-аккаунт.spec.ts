import { test, expect } from '@playwright/test';

test.describe('Вход в аккаунт', () => {

  test('Успешный вход — хедер показывает «Профиль»', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder('you@example.com').fill('test@test.com');
    await page.locator('input[type="password"]').fill('123456');
    await page.getByRole('button', { name: 'Войти' }).click();

    await page.waitForURL('**/profile', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('header')).toContainText('Профиль');
  });

  test('Неверный пароль — показывает ошибку', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder('you@example.com').fill('test@test.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.getByRole('button', { name: 'Войти' }).click();

    await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 10_000 });
  });

  test('Пустые поля — клиентская валидация', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: 'Войти' }).click();

    await expect(page.locator('text=Заполните все поля')).toBeVisible();
  });

  test('После входа кнопка «Войти» заменяется на «Профиль»', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toContainText('Войти');

    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill('test@test.com');
    await page.locator('input[type="password"]').fill('123456');
    await page.getByRole('button', { name: 'Войти' }).click();
    await page.waitForURL('**/profile', { waitUntil: 'domcontentloaded' });

    await page.goto('/');
    await expect(page.locator('header')).toContainText('Профиль');
  });
});
