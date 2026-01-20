import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { BiddingService } from './bidding.service';
import { PlaceBidDto } from './dto/bid.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/bidding',
})
export class BiddingGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Socket>();

  constructor(private readonly biddingService: BiddingService) { }

  handleConnection(client: Socket) {
    console.log(`🔌 Client connected: ${client.id}`);

    // Extract user from handshake (if authenticated)
    const userId = client.handshake.auth?.userId;
    if (userId) {
      this.userSockets.set(userId, client);
      console.log(`👤 User ${userId} connected`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌 Client disconnected: ${client.id}`);

    // Remove from user sockets map
    for (const [userId, socket] of this.userSockets.entries()) {
      if (socket.id === client.id) {
        this.userSockets.delete(userId);
        console.log(`👤 User ${userId} disconnected`);
        break;
      }
    }
  }

  @SubscribeMessage('join-auction')
  handleJoinAuction(
    @MessageBody() data: { auctionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `auction-${data.auctionId}`;
    client.join(room);
    console.log(`📍 Client ${client.id} joined ${room}`);

    return {
      event: 'joined-auction',
      data: { auctionId: data.auctionId, room },
    };
  }

  @SubscribeMessage('leave-auction')
  handleLeaveAuction(
    @MessageBody() data: { auctionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `auction-${data.auctionId}`;
    client.leave(room);
    console.log(`📍 Client ${client.id} left ${room}`);
  }

  @SubscribeMessage('place-bid')
  async handlePlaceBid(
    @MessageBody() placeBidDto: PlaceBidDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Extract user ID from socket auth
      const userId = client.handshake.auth?.userId;

      if (!userId) {
        return {
          event: 'bid-rejected',
          data: { error: 'Not authenticated' },
        };
      }

      // Place bid using service with SERIALIZABLE transaction
      const result = await this.biddingService.placeBid(
        placeBidDto.auctionId,
        userId,
        placeBidDto.amount,
      );

      const room = `auction-${placeBidDto.auctionId}`;

      // Broadcast bid-accepted to all clients in the auction room
      this.server.to(room).emit('bid-accepted', {
        bid: {
          id: result.bid.id,
          amount: result.bid.amount,
          timestamp: result.bid.timestamp,
          bidderId: userId,
          bidder: {
            username: result.bid.bidder.username
          }
        },
        auction: result.auction,
      });

      // If auction was extended, broadcast extension event
      if (result.wasExtended) {
        this.server.to(room).emit('auction-extended', {
          auctionId: placeBidDto.auctionId,
          newEndTime: result.auction.endTime,
          message: 'Auction extended by 2 minutes due to last-minute bid',
        });
      }

      return {
        event: 'bid-placed',
        data: { success: true },
      };
    } catch (error) {
      console.error('❌ Bid placement error:', error.message);

      return {
        event: 'bid-rejected',
        data: {
          error: error.message,
          code: error.status || 500,
        },
      };
    }
  }

  @SubscribeMessage('get-bid-history')
  async handleGetBidHistory(
    @MessageBody() data: { auctionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const bids = await this.biddingService.getBidHistory(data.auctionId);

      return {
        event: 'bid-history',
        data: { bids },
      };
    } catch (error) {
      return {
        event: 'error',
        data: { error: error.message },
      };
    }
  }
}
