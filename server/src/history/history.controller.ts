import { Controller, Get, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private historyService: HistoryService) {}

  @Get()
  async findAll(@Request() req) {
    return this.historyService.findAll(req.user.userId);
  }

  @Delete()
  async clear(@Request() req) {
    return this.historyService.clear(req.user.userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.historyService.remove(id, req.user.userId);
  }
}
