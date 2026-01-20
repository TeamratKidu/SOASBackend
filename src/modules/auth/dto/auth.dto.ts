import {
  IsEmail,
  IsString,
  MinLength,
  Matches,
  IsEnum,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { UserRole } from '../../../database/schema';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^\+2519[0-9]{8}$/, {
    message: 'Phone must be a valid Ethiopian number (+2519XXXXXXXX)',
  })
  phone: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least 1 uppercase, 1 lowercase, 1 digit, and 1 special character',
  })
  password: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  email: string; // Can be email or phone

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

export class VerifyOtpDto {
  @IsString()
  userId: string;

  @IsString()
  @MinLength(6)
  otp: string;
}
