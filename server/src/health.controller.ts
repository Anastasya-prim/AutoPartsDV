import { Controller, Get } from '@nestjs/common';

/** Минимальная проверка без БД — для диагностики Docker/Nginx (502). */
@Controller('api')
export class HealthController {
  @Get('health')
  health() {
    return { ok: true };
  }
}
