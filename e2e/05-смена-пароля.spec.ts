import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Смена пароля', () => {

  test('Успешная смена пароля', async ({ page }) => {
    await login(page, 'test@test.com', '123456');

    await page.locator('text=Сменить пароль').first().click();
    await expect(page.locator('h2', { hasText: 'Смена пароля' })).toBeVisible();

    await page.getByPlaceholder('Введите текущий пароль').fill('123456');
    await page.getByPlaceholder('Минимум 6 символов').fill('654321');
    await page.getByPlaceholder('Повторите новый пароль').fill('654321');
    await page.getByRole('button', { name: 'Сменить пароль', exact: true }).click();

    await expect(page.locator('text=Пароль успешно изменён')).toBeVisible({ timeout: 10_000 });

    // Возвращаем пароль обратно (форма уже открыта; второй клик по карточке закрыл бы её)
    await page.getByPlaceholder('Введите текущий пароль').fill('654321');
    await page.getByPlaceholder('Минимум 6 символов').fill('123456');
    await page.getByPlaceholder('Повторите новый пароль').fill('123456');
    await page.getByRole('button', { name: 'Сменить пароль', exact: true }).click();

    await expect(page.locator('text=Пароль успешно изменён')).toBeVisible({ timeout: 10_000 });
  });

  test('Неверный текущий пароль — ошибка', async ({ page }) => {
    await login(page, 'test@test.com', '123456');

    await page.locator('text=Сменить пароль').first().click();

    await page.getByPlaceholder('Введите текущий пароль').fill('wrongpassword');
    await page.getByPlaceholder('Минимум 6 символов').fill('newpass123');
    await page.getByPlaceholder('Повторите новый пароль').fill('newpass123');
    await page.getByRole('button', { name: 'Сменить пароль', exact: true }).click();

    await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 10_000 });
  });

  test('Пароли не совпадают — клиентская ошибка', async ({ page }) => {
    await login(page, 'test@test.com', '123456');

    await page.locator('text=Сменить пароль').first().click();

    await page.getByPlaceholder('Введите текущий пароль').fill('123456');
    await page.getByPlaceholder('Минимум 6 символов').fill('newpass1');
    await page.getByPlaceholder('Повторите новый пароль').fill('newpass2');
    await page.getByRole('button', { name: 'Сменить пароль', exact: true }).click();

    await expect(page.locator('text=Пароли не совпадают')).toBeVisible();
  });
});
