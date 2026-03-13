/**
 * MailModule — модуль email-уведомлений через UniSender.
 *
 * Экспортирует MailService, чтобы другие модули (например, AuthModule)
 * могли инжектировать его и отправлять письма.
 */
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
