import { IsInt, IsString, IsOptional, Min, Max, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFeedbackDto {
  @ApiProperty({ description: 'Auction ID', example: 'uuid' })
  @IsUUID()
  auctionId: string;

  @ApiProperty({ description: 'User receiving feedback', example: 'uuid' })
  @IsUUID()
  toUserId: string;

  @ApiProperty({
    description: 'Rating (1-5 stars)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Optional comment',
    example: 'Great seller!',
    required: false,
  })
  @IsString()
  @IsOptional()
  comment?: string;
}
