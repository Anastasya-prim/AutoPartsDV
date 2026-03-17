import { test, expect } from '@playwright/test';

test.describe('Регистрация пользователя', () => {
  const uniqueEmail = `testuser_${Date.now()}@test.com`;

  test('Успешная регистрация — попадает в профиль', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');

    // label без htmlFor не связан с input — getByLabel('Имя') не находит поле
    await page.getByPlaceholder('Иван Петров').fill('Тестовый Пользователь');
    await page.getByPlaceholder('you@example.com').fill(uniqueEmail);
    await page.getByPlaceholder('Минимум 6 символов').fill('test123456');
    await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

    await page.waitForURL('**/profile');
    await expect(page.locator('text=Тестовый Пользователь')).toBeVisible();
  });

  test('Нельзя зарегистрироваться с пустыми полями', async ({ page }) => {
    await page.goto('/register');

    await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

    await expect(page.locator('text=Заполните все поля')).toBeVisible();
  });

  test('Нельзя зарегистрироваться с коротким паролем', async ({ page }) => {
    await page.goto('/register');

    await page.getByPlaceholder('Иван Петров').fill('Тест');
    await page.getByPlaceholder('you@example.com').fill('short@test.com');
    await page.getByPlaceholder('Минимум 6 символов').fill('123');
    await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

    await expect(page.locator('text=Пароль должен содержать минимум 6 символов')).toBeVisible();
  });

  test('Нельзя зарегистрироваться с существующим email', async ({ page }) => {
    await page.goto('/register');

    await page.getByPlaceholder('Иван Петров').fill('Дубль');
    await page.getByPlaceholder('you@example.com').fill('test@test.com');
    await page.getByPlaceholder('Минимум 6 символов').fill('123456');
    await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

    await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 10_000 });
  });
});
