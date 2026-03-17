import { Page } from '@playwright/test';

/**
 * Авторизует пользователя через форму входа и ждёт перехода в профиль.
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL('**/profile', { waitUntil: 'domcontentloaded' });
}
