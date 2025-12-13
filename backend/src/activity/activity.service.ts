import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity, EntityType } from './entities/activity.entity';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
    private workspacesService: WorkspacesService,
  ) {}

  async findByWorkspace(
    workspaceId: string,
    userId: string,
    limit = 100,
  ): Promise<Activity[]> {
    await this.checkWorkspaceAccess(workspaceId, userId);
    return this.activityRepository.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async create(data: {
    workspaceId: string;
    userId: string;
    userName: string;
    action: string;
    entityType: EntityType;
    entityId: string;
    entityName: string;
    details?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Activity> {
    const activity = this.activityRepository.create(data);
    return this.activityRepository.save(activity);
  }

  async logActivity(
    workspaceId: string,
    userId: string,
    userName: string,
    action: string,
    entityType: EntityType,
    entityId: string,
    entityName: string,
    details?: string,
  ): Promise<void> {
    await this.create({
      workspaceId,
      userId,
      userName,
      action,
      entityType,
      entityId,
      entityName,
      details,
    });
  }

  private async checkWorkspaceAccess(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const role = await this.workspacesService.getMemberRole(workspaceId, userId);
    if (!role) {
      throw new ForbiddenException('Not a member of this workspace');
    }
  }
}
