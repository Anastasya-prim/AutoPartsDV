/**
 * MailService — отправка транзакционных email через Gmail SMTP (Nodemailer).
 *
 * Принцип работы:
 * 1. Формируем HTML-письмо через шаблон (mail.templates.ts)
 * 2. Отправляем через SMTP Gmail с помощью Nodemailer
 * 3. Логируем результат
 *
 * Если SMTP_USER или SMTP_PASS не заданы — сервис работает в «тихом» режиме:
 * логирует предупреждение, но не падает и не блокирует остальной код.
 *
 * Проверка соединения (verify) выполняется в фоне — Nest сразу слушает HTTP,
 * иначе при недоступном Gmail таймаут verify блокировал старт на минуты.
 *
 * Все методы отправки возвращают void и никогда не бросают исключения —
 * ошибки ловятся внутри и логируются.
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { welcomeEmail, passwordChangedEmail } from './mail.templates';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private enabled = false;

  private readonly smtpUser: string;
  private readonly smtpPass: string;
  private readonly senderName: string;
  private readonly frontendUrl: string;

  constructor(private readonly config: ConfigService) {
    this.smtpUser = this.config.get('SMTP_USER', '');
    this.smtpPass = this.config.get('SMTP_PASS', '');
    this.senderName = this.config.get('SMTP_SENDER_NAME', 'AutoPartsDV');
    this.frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
  }

  onModuleInit() {
    if (!this.smtpUser || !this.smtpPass) {
      this.logger.warn(
        'SMTP_USER или SMTP_PASS не заданы — email-уведомления отключены. ' +
        'Добавьте их в .env для включения.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.smtpUser,
        pass: this.smtpPass,
      },
    });

    void this.verifySmtpInBackground();
  }

  /** Не блокирует bootstrap: пока verify идёт, enabled остаётся false. */
  private async verifySmtpInBackground(): Promise<void> {
    if (!this.transporter) return;
    try {
      await this.transporter.verify();
      this.enabled = true;
      this.logger.log(
        `Email-уведомления включены (отправитель: ${this.senderName} <${this.smtpUser}>)`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Не удалось подключиться к Gmail SMTP: ${message}`);
      this.logger.warn(
        'Проверьте SMTP_USER и SMTP_PASS в .env. ' +
        'SMTP_PASS — это «Пароль приложения» Google, не обычный пароль.',
      );
    }
  }

  /** Письмо-приветствие после регистрации (fire-and-forget) */
  async sendWelcome(email: string, name: string): Promise<void> {
    const { subject, body } = welcomeEmail(name, this.frontendUrl);
    await this.send(email, subject, body);
  }

  /** Уведомление о смене пароля (fire-and-forget) */
  async sendPasswordChanged(email: string, name: string): Promise<void> {
    const { subject, body } = passwordChangedEmail(name);
    await this.send(email, subject, body);
  }

  /**
   * Отправка письма через Gmail SMTP.
   * Никогда не бросает исключения — все ошибки логируются.
   */
  private async send(to: string, subject: string, htmlBody: string): Promise<void> {
    if (!this.enabled || !this.transporter) {
      this.logger.debug(`[skip] Email для ${to} не отправлен — сервис отключён`);
      return;
    }

    this.logger.log(`Отправка письма: to=${to}, subject="${subject}"`);

    try {
      const info = await this.transporter.sendMail({
        from: `"${this.senderName}" <${this.smtpUser}>`,
        to,
        subject,
        html: htmlBody,
      });

      this.logger.log(
        `Письмо отправлено: to=${to}, messageId=${info.messageId}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Не удалось отправить письмо для ${to}: ${message}`);
    }
  }
}
