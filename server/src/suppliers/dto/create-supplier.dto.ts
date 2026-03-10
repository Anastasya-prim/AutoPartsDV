import { IsString, IsNotEmpty, IsUrl, IsOptional, IsIn, MaxLength, Matches } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty({ message: 'ID обязателен' })
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, { message: 'ID может содержать только строчные латинские буквы, цифры и дефис' })
  id: string;

  @IsString()
  @IsNotEmpty({ message: 'Название обязательно' })
  @MaxLength(100)
  name: string;

  @IsUrl({}, { message: 'Некорректный URL' })
  @IsNotEmpty({ message: 'URL обязателен' })
  @MaxLength(500)
  url: string;

  @IsString()
  @IsNotEmpty({ message: 'Регион обязателен' })
  @MaxLength(100)
  region: string;

  @IsOptional()
  @IsIn(['online', 'offline', 'maintenance'], { message: 'status: online, offline или maintenance' })
  status?: string;

  @IsOptional()
  @IsIn(['api', 'scraper'], { message: 'apiType: api или scraper' })
  apiType?: string;
}
