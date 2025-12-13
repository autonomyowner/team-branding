import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Roadmap, RoadmapItem, Milestone } from './entities/roadmap.entity';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class RoadmapsService {
  constructor(
    @InjectRepository(Roadmap)
    private roadmapsRepository: Repository<Roadmap>,
    private workspacesService: WorkspacesService,
  ) {}

  async findAllByWorkspace(workspaceId: string, userId: string): Promise<Roadmap[]> {
    await this.checkWorkspaceAccess(workspaceId, userId);
    return this.roadmapsRepository.find({
      where: { workspaceId, isArchived: false },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string, userId: string): Promise<Roadmap> {
    const roadmap = await this.roadmapsRepository.findOne({ where: { id } });
    if (!roadmap) {
      throw new NotFoundException('Roadmap not found');
    }
    await this.checkWorkspaceAccess(roadmap.workspaceId, userId);
    return roadmap;
  }

  async create(
    workspaceId: string,
    userId: string,
    data: { name: string; description?: string },
  ): Promise<Roadmap> {
    await this.checkWorkspaceAccess(workspaceId, userId, ['owner', 'admin', 'member']);

    const roadmap = this.roadmapsRepository.create({
      workspaceId,
      name: data.name,
      description: data.description,
      items: [],
      milestones: [],
      createdBy: userId,
    });

    return this.roadmapsRepository.save(roadmap);
  }

  async update(
    id: string,
    userId: string,
    data: { name?: string; description?: string; items?: RoadmapItem[]; milestones?: Milestone[] },
  ): Promise<Roadmap> {
    const roadmap = await this.findById(id, userId);
    await this.checkWorkspaceAccess(roadmap.workspaceId, userId, ['owner', 'admin', 'member']);

    Object.assign(roadmap, data);
    return this.roadmapsRepository.save(roadmap);
  }

  async addItem(id: string, userId: string, item: Omit<RoadmapItem, 'id'>): Promise<Roadmap> {
    const roadmap = await this.findById(id, userId);
    await this.checkWorkspaceAccess(roadmap.workspaceId, userId, ['owner', 'admin', 'member']);

    roadmap.items.push({ ...item, id: uuid() });
    return this.roadmapsRepository.save(roadmap);
  }

  async addMilestone(id: string, userId: string, milestone: Omit<Milestone, 'id'>): Promise<Roadmap> {
    const roadmap = await this.findById(id, userId);
    await this.checkWorkspaceAccess(roadmap.workspaceId, userId, ['owner', 'admin', 'member']);

    roadmap.milestones.push({ ...milestone, id: uuid() });
    return this.roadmapsRepository.save(roadmap);
  }

  async archive(id: string, userId: string): Promise<void> {
    const roadmap = await this.findById(id, userId);
    await this.checkWorkspaceAccess(roadmap.workspaceId, userId, ['owner', 'admin']);

    roadmap.isArchived = true;
    await this.roadmapsRepository.save(roadmap);
  }

  private async checkWorkspaceAccess(
    workspaceId: string,
    userId: string,
    requiredRoles?: string[],
  ): Promise<void> {
    const role = await this.workspacesService.getMemberRole(workspaceId, userId);
    if (!role) {
      throw new ForbiddenException('Not a member of this workspace');
    }
    if (requiredRoles && !requiredRoles.includes(role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}
