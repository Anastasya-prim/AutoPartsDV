import { IsEmail, IsOptional, IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Имя не может быть пустым' })
  @MaxLength(100, { message: 'Имя — максимум 100 символов' })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Некорректный email' })
  @MaxLength(255, { message: 'Email — максимум 255 символов' })
  email?: string;
}
