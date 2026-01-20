import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuctionsService } from './auctions.service';
import {
  CreateAuctionDto,
  UpdateAuctionDto,
  AuctionFilterDto,
} from './dto/auction.dto';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../database/schema';

@ApiTags('auctions')
@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) { }

  @Post()
  @UseGuards(BetterAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new auction (Seller only)' })
  @ApiResponse({ status: 201, description: 'Auction created successfully' })
  create(@Body() createAuctionDto: CreateAuctionDto, @Request() req) {
    return this.auctionsService.create(createAuctionDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all auctions with filters' })
  @ApiResponse({ status: 200, description: 'Auctions retrieved successfully' })
  async findAll(@Query() filterDto: AuctionFilterDto) {
    return this.auctionsService.findAll(filterDto);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get auctions by category' })
  @ApiResponse({ status: 200, description: 'Auctions retrieved successfully' })
  async findByCategory(@Param('category') category: string) {
    return this.auctionsService.findByCategory(category);
  }

  @Get('statistics/categories')
  @ApiOperation({ summary: 'Get category statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getCategoryStatistics() {
    return this.auctionsService.getCategoryStatistics();
  }

  @Get('my-auctions')
  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user auctions' })
  findMyAuctions(@Request() req) {
    return this.auctionsService.findByUser(req.user.id, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get auction by ID' })
  @ApiResponse({ status: 200, description: 'Returns auction details' })
  @ApiResponse({ status: 404, description: 'Auction not found' })
  findOne(@Param('id') id: string) {
    return this.auctionsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update auction (Seller only, pending auctions)' })
  update(
    @Param('id') id: string,
    @Body() updateAuctionDto: UpdateAuctionDto,
    @Request() req,
  ) {
    return this.auctionsService.update(
      id,
      updateAuctionDto,
      req.user.id,
      req.user.role,
    );
  }

  @Patch(':id/approve')
  @UseGuards(BetterAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve auction (Admin only)' })
  @ApiResponse({ status: 200, description: 'Auction approved' })
  approve(@Param('id') id: string) {
    return this.auctionsService.approve(id);
  }

  @Patch(':id/cancel')
  @UseGuards(BetterAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel auction (Admin only)' })
  cancel(@Param('id') id: string) {
    return this.auctionsService.cancel(id);
  }
}
