/**
 * HTML-шаблоны email-писем.
 *
 * Каждая функция принимает данные (имя, дата и т.д.) и возвращает
 * объект { subject, body } для передачи в UniSender API.
 *
 * Стили инлайновые — email-клиенты не поддерживают <style> блоки.
 */

const BRAND_COLOR = '#2563eb';

function layout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        <!-- Шапка -->
        <tr>
          <td style="background:${BRAND_COLOR};padding:24px 32px;">
            <span style="color:#ffffff;font-size:22px;font-weight:bold;">AutoParts</span><span style="color:#e0e7ff;font-size:22px;font-weight:bold;">DV</span>
          </td>
        </tr>
        <!-- Контент -->
        <tr>
          <td style="padding:32px;">
            ${content}
          </td>
        </tr>
        <!-- Подвал -->
        <tr>
          <td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
              Это автоматическое письмо от сервиса AutoPartsDV. Не отвечайте на него.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

/** Письмо-приветствие после регистрации */
export function welcomeEmail(name: string) {
  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;color:#111827;">Добро пожаловать, ${name}!</h1>
    <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
      Вы успешно зарегистрировались в <strong>AutoPartsDV</strong> — агрегаторе автозапчастей Дальнего Востока.
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      Теперь вы можете искать запчасти по артикулу и сравнивать цены у нескольких поставщиков одновременно.
    </p>
    <a href="http://localhost:3000"
       style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;font-size:15px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">
      Перейти к поиску
    </a>
  `;
  return {
    subject: 'Добро пожаловать в AutoPartsDV!',
    body: layout(content),
  };
}

/** Уведомление об успешной смене пароля */
export function passwordChangedEmail(name: string) {
  const now = new Date().toLocaleString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;color:#111827;">Пароль изменён</h1>
    <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
      ${name}, ваш пароль в AutoPartsDV был успешно изменён <strong>${now}</strong>.
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      Если вы не меняли пароль — срочно свяжитесь с нами или смените пароль заново.
    </p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;">
      <p style="margin:0;font-size:14px;color:#991b1b;">
        ⚠ Если это были не вы — немедленно войдите в аккаунт и измените пароль.
      </p>
    </div>
  `;
  return {
    subject: 'Ваш пароль в AutoPartsDV изменён',
    body: layout(content),
  };
}
