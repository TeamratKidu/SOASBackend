import { IsNumber, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PlaceBidDto {
  @IsUUID()
  auctionId: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount: number;
}
