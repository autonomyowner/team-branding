import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, EntityType } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  async findAllForUser(userId: string, limit = 50): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationsRepository.count({
      where: { userId, read: false },
    });
  }

  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    entityType: EntityType;
    entityId: string;
    actionUrl?: string;
  }): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      ...data,
      read: false,
    });
    return this.notificationsRepository.save(notification);
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.read = true;
    return this.notificationsRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { userId, read: false },
      { read: true },
    );
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await this.notificationsRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException('Notification not found');
    }
  }
}
