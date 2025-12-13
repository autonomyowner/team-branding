import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface UserPresence {
  id: string;
  name: string;
  color: string;
  cursorPosition?: { x: number; y: number };
  selection?: { blockId?: string; nodeId?: string };
  lastActiveAt: Date;
}

interface RoomUsers {
  [roomId: string]: Map<string, UserPresence>;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/ws',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private roomUsers: RoomUsers = {};
  private userColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  ];

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Remove from all rooms
    for (const roomId of Object.keys(this.roomUsers)) {
      if (this.roomUsers[roomId].has(client.id)) {
        this.roomUsers[roomId].delete(client.id);
        this.broadcastPresence(roomId);
      }
    }
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string; userName: string },
  ) {
    const { roomId, userId, userName } = data;
    client.join(roomId);

    if (!this.roomUsers[roomId]) {
      this.roomUsers[roomId] = new Map();
    }

    const color = this.userColors[this.roomUsers[roomId].size % this.userColors.length];

    this.roomUsers[roomId].set(client.id, {
      id: userId,
      name: userName,
      color,
      lastActiveAt: new Date(),
    });

    this.broadcastPresence(roomId);
    return { success: true, color };
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    client.leave(roomId);

    if (this.roomUsers[roomId]) {
      this.roomUsers[roomId].delete(client.id);
      this.broadcastPresence(roomId);
    }

    return { success: true };
  }

  @SubscribeMessage('presence:update')
  handlePresenceUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      roomId: string;
      cursorPosition?: { x: number; y: number };
      selection?: { blockId?: string; nodeId?: string };
    },
  ) {
    const { roomId, cursorPosition, selection } = data;

    if (this.roomUsers[roomId]?.has(client.id)) {
      const user = this.roomUsers[roomId].get(client.id)!;
      user.cursorPosition = cursorPosition;
      user.selection = selection;
      user.lastActiveAt = new Date();
    }

    // Broadcast to others in room
    client.to(roomId).emit('presence:update', {
      clientId: client.id,
      ...data,
    });
  }

  @SubscribeMessage('presence:heartbeat')
  handleHeartbeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    if (this.roomUsers[roomId]?.has(client.id)) {
      this.roomUsers[roomId].get(client.id)!.lastActiveAt = new Date();
    }
  }

  // Workflow events
  @SubscribeMessage('workflow:node:add')
  handleNodeAdd(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; node: unknown },
  ) {
    client.to(data.roomId).emit('workflow:node:add', data);
  }

  @SubscribeMessage('workflow:node:update')
  handleNodeUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; nodeId: string; updates: unknown },
  ) {
    client.to(data.roomId).emit('workflow:node:update', data);
  }

  @SubscribeMessage('workflow:node:delete')
  handleNodeDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; nodeId: string },
  ) {
    client.to(data.roomId).emit('workflow:node:delete', data);
  }

  @SubscribeMessage('workflow:edge:add')
  handleEdgeAdd(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; edge: unknown },
  ) {
    client.to(data.roomId).emit('workflow:edge:add', data);
  }

  @SubscribeMessage('workflow:edge:delete')
  handleEdgeDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; edgeId: string },
  ) {
    client.to(data.roomId).emit('workflow:edge:delete', data);
  }

  // Page events
  @SubscribeMessage('page:block:add')
  handleBlockAdd(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; block: unknown },
  ) {
    client.to(data.roomId).emit('page:block:add', data);
  }

  @SubscribeMessage('page:block:update')
  handleBlockUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; blockId: string; updates: unknown },
  ) {
    client.to(data.roomId).emit('page:block:update', data);
  }

  @SubscribeMessage('page:block:delete')
  handleBlockDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; blockId: string },
  ) {
    client.to(data.roomId).emit('page:block:delete', data);
  }

  // Board events
  @SubscribeMessage('board:task:move')
  handleTaskMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; taskId: string; columnId: string; position: number },
  ) {
    client.to(data.roomId).emit('board:task:move', data);
  }

  @SubscribeMessage('board:task:update')
  handleTaskUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; taskId: string; updates: unknown },
  ) {
    client.to(data.roomId).emit('board:task:update', data);
  }

  private broadcastPresence(roomId: string) {
    const users = this.roomUsers[roomId]
      ? Array.from(this.roomUsers[roomId].values())
      : [];
    this.server.to(roomId).emit('presence:users', { roomId, users });
  }
}
