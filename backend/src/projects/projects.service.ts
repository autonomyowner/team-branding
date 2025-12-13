import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { Sprint, SprintStatus } from './entities/sprint.entity';
import { BacklogItem, BacklogItemStatus } from './entities/backlog-item.entity';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Sprint)
    private sprintsRepository: Repository<Sprint>,
    @InjectRepository(BacklogItem)
    private backlogRepository: Repository<BacklogItem>,
    private workspacesService: WorkspacesService,
  ) {}

  async findAllByWorkspace(workspaceId: string, userId: string): Promise<Project[]> {
    await this.checkWorkspaceAccess(workspaceId, userId);
    return this.projectsRepository.find({
      where: { workspaceId, isArchived: false },
      relations: ['sprints'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string, userId: string): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: ['sprints', 'backlogItems'],
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    await this.checkWorkspaceAccess(project.workspaceId, userId);
    return project;
  }

  async create(
    workspaceId: string,
    userId: string,
    data: { name: string; description?: string; key: string },
  ): Promise<Project> {
    await this.checkWorkspaceAccess(workspaceId, userId, ['owner', 'admin', 'member']);

    const existingKey = await this.projectsRepository.findOne({
      where: { key: data.key },
    });
    if (existingKey) {
      throw new ConflictException('Project key already exists');
    }

    const project = this.projectsRepository.create({
      workspaceId,
      name: data.name,
      description: data.description,
      key: data.key.toUpperCase(),
      createdBy: userId,
    });

    return this.projectsRepository.save(project);
  }

  async update(
    id: string,
    userId: string,
    data: { name?: string; description?: string },
  ): Promise<Project> {
    const project = await this.findById(id, userId);
    await this.checkWorkspaceAccess(project.workspaceId, userId, ['owner', 'admin', 'member']);

    Object.assign(project, data);
    return this.projectsRepository.save(project);
  }

  // Sprint operations
  async createSprint(
    projectId: string,
    userId: string,
    data: { name: string; goal?: string; startDate: Date; endDate: Date },
  ): Promise<Sprint> {
    const project = await this.findById(projectId, userId);
    await this.checkWorkspaceAccess(project.workspaceId, userId, ['owner', 'admin', 'member']);

    const sprint = this.sprintsRepository.create({
      projectId,
      name: data.name,
      goal: data.goal,
      startDate: data.startDate,
      endDate: data.endDate,
      status: 'planning',
      committedPoints: 0,
      completedPoints: 0,
    });

    return this.sprintsRepository.save(sprint);
  }

  async startSprint(projectId: string, sprintId: string, userId: string): Promise<Sprint> {
    const project = await this.findById(projectId, userId);
    await this.checkWorkspaceAccess(project.workspaceId, userId, ['owner', 'admin', 'member']);

    const sprint = await this.sprintsRepository.findOne({ where: { id: sprintId } });
    if (!sprint || sprint.projectId !== projectId) {
      throw new NotFoundException('Sprint not found');
    }

    // Check no active sprint
    const activeSprint = await this.sprintsRepository.findOne({
      where: { projectId, status: 'active' },
    });
    if (activeSprint) {
      throw new ConflictException('There is already an active sprint');
    }

    sprint.status = 'active';
    await this.sprintsRepository.save(sprint);

    // Update project's current sprint
    project.currentSprintId = sprintId;
    await this.projectsRepository.save(project);

    return sprint;
  }

  async completeSprint(projectId: string, sprintId: string, userId: string): Promise<Sprint> {
    const project = await this.findById(projectId, userId);
    await this.checkWorkspaceAccess(project.workspaceId, userId, ['owner', 'admin', 'member']);

    const sprint = await this.sprintsRepository.findOne({ where: { id: sprintId } });
    if (!sprint || sprint.projectId !== projectId) {
      throw new NotFoundException('Sprint not found');
    }

    sprint.status = 'completed';
    sprint.velocity = sprint.completedPoints;
    await this.sprintsRepository.save(sprint);

    // Update project velocity
    const completedSprints = await this.sprintsRepository.find({
      where: { projectId, status: 'completed' },
    });
    const totalVelocity = completedSprints.reduce((sum, s) => sum + (s.velocity || 0), 0);
    project.averageVelocity = totalVelocity / completedSprints.length;
    project.currentSprintId = null;
    await this.projectsRepository.save(project);

    return sprint;
  }

  // Backlog operations
  async getBacklog(projectId: string, userId: string): Promise<BacklogItem[]> {
    const project = await this.findById(projectId, userId);
    return this.backlogRepository.find({
      where: { projectId: project.id },
      order: { priority: 'DESC', createdAt: 'ASC' },
    });
  }

  async createBacklogItem(
    projectId: string,
    userId: string,
    data: Partial<BacklogItem>,
  ): Promise<BacklogItem> {
    const project = await this.findById(projectId, userId);
    await this.checkWorkspaceAccess(project.workspaceId, userId, ['owner', 'admin', 'member']);

    const item = this.backlogRepository.create({
      ...data,
      projectId,
      status: 'backlog',
    });

    return this.backlogRepository.save(item);
  }

  async updateBacklogItem(
    itemId: string,
    userId: string,
    data: Partial<BacklogItem>,
  ): Promise<BacklogItem> {
    const item = await this.backlogRepository.findOne({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException('Backlog item not found');
    }

    const project = await this.findById(item.projectId, userId);
    await this.checkWorkspaceAccess(project.workspaceId, userId, ['owner', 'admin', 'member']);

    Object.assign(item, data);
    return this.backlogRepository.save(item);
  }

  async moveToSprint(itemId: string, sprintId: string, userId: string): Promise<BacklogItem> {
    const item = await this.backlogRepository.findOne({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException('Backlog item not found');
    }

    const project = await this.findById(item.projectId, userId);
    await this.checkWorkspaceAccess(project.workspaceId, userId, ['owner', 'admin', 'member']);

    item.sprintId = sprintId;
    item.status = 'in_sprint';
    return this.backlogRepository.save(item);
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
