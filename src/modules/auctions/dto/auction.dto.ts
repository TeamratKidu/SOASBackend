import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsDateString,
  IsArray,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAuctionDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  @MaxLength(2000)
  description: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  startingPrice: number;

  @IsNumber()
  @Min(100)
  @Type(() => Number)
  @IsOptional()
  minimumIncrement?: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  reservePrice?: number;

  @IsDateString()
  endTime: string; // ISO 8601 format

  @IsString()
  @IsOptional()
  category?: string; // land, vehicle, ngo-asset, machinery, electronics, furniture, industrial, agricultural

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imageUrls?: string[];

  @IsArray()
  @IsOptional()
  attachments?: any[];
}

export class UpdateAuctionDto {
  @IsString()
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imageUrls?: string[];
}

export class AuctionFilterDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  minPrice?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  maxPrice?: number;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}
