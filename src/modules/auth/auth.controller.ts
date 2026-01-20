import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateProfileDto, UpgradeToSellerDto } from './dto/update-profile.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { auth } from '../../lib/auth';
import { BetterAuthGuard } from './guards/better-auth.guard';

@ApiTags('users')
@Controller('users')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('upgrade-to-seller')
  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upgrade user from buyer to seller with KYC information' })
  @ApiResponse({
    status: 200,
    description: 'Seller upgrade request submitted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'User is already a seller or admin',
  })
  async upgradeToSeller(@Body() upgradeData: UpgradeToSellerDto, @Request() req: any) {
    return this.authService.upgradeToSeller(req.user.id, upgradeData);
  }

  @Get('profile')
  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @Patch('profile')
  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profile' })
  async updateProfile(@Body() data: UpdateProfileDto, @Request() req: any) {
    return this.authService.updateProfile(req.user.id, data);
  }
}
