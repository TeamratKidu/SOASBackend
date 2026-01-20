import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class UpgradeToSellerDto {
  @ApiProperty({ description: 'Bio or description of the seller' })
  @IsString()
  @IsNotEmpty()
  bio: string;

  @ApiProperty({ description: 'Ethiopian Tax Identification Number (TIN)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{10}$/, { message: 'TIN must be a 10-digit number' })
  tinNumber: string;

  @ApiProperty({
    description: 'Fayda Alliance Number (FAN) or Fayda Identification Number (FIN)',
  })
  @IsString()
  @IsNotEmpty()
  faydaId: string;

  @ApiPropertyOptional({ description: 'Location or address' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'Profile image URL' })
  @IsString()
  @IsOptional()
  image?: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  image?: string;

  @ApiPropertyOptional()
  bio?: string;

  @ApiPropertyOptional()
  location?: string;

  @ApiPropertyOptional()
  notifications?: any; // JSONB
}
