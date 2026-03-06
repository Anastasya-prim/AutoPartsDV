import { Controller, Get, Query, Param, UseGuards, Request } from '@nestjs/common';
import { PartsService } from './parts.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('api')
export class PartsController {
  constructor(private readonly partsService: PartsService) {}

  @Get('search')
  @UseGuards(OptionalJwtAuthGuard)
  async search(@Query('q') q: string, @Request() req) {
    return this.partsService.search(q, req.user?.userId);
  }

  @Get('parts/:article')
  async getByArticle(@Param('article') article: string) {
    return this.partsService.findByArticle(article);
  }
}
