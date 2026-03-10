import { IsString, IsUrl, IsOptional, IsIn, MaxLength, IsNotEmpty } from 'class-validator';

export class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Некорректный URL' })
  @MaxLength(500)
  url?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  region?: string;

  @IsOptional()
  @IsIn(['online', 'offline', 'maintenance'], { message: 'status: online, offline или maintenance' })
  status?: string;

  @IsOptional()
  @IsIn(['api', 'scraper'], { message: 'apiType: api или scraper' })
  apiType?: string;
}
