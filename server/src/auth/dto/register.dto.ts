import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Имя обязательно' })
  @MaxLength(100, { message: 'Имя — максимум 100 символов' })
  name: string;

  @IsEmail({}, { message: 'Некорректный email' })
  @IsNotEmpty({ message: 'Email обязателен' })
  @MaxLength(255, { message: 'Email — максимум 255 символов' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Пароль — минимум 6 символов' })
  @MaxLength(72, { message: 'Пароль — максимум 72 символа' })
  password: string;
}
