import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Введите текущий пароль' })
  currentPassword: string;

  @IsString()
  @MinLength(6, { message: 'Новый пароль — минимум 6 символов' })
  @MaxLength(72, { message: 'Новый пароль — максимум 72 символа' })
  newPassword: string;
}
