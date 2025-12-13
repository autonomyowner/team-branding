import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BacklogItem } from './entities/backlog-item.entity';

@Controller()
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get('workspaces/:workspaceId/projects')
  async findAll(
    @Param('workspaceId') workspaceId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.projectsService.findAllByWorkspace(workspaceId, req.user.id);
  }

  @Post('workspaces/:workspaceId/projects')
  async create(
    @Param('workspaceId') workspaceId: string,
    @Request() req: { user: { id: string } },
    @Body() body: { name: string; description?: string; key: string },
  ) {
    return this.projectsService.create(workspaceId, req.user.id, body);
  }

  @Get('projects/:id')
  async findOne(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.projectsService.findById(id, req.user.id);
  }

  @Patch('projects/:id')
  async update(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() body: { name?: string; description?: string },
  ) {
    return this.projectsService.update(id, req.user.id, body);
  }

  @Get('projects/:id/sprints')
  async getSprints(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    const project = await this.projectsService.findById(id, req.user.id);
    return project.sprints;
  }

  @Post('projects/:id/sprints')
  async createSprint(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() body: { name: string; goal?: string; startDate: Date; endDate: Date },
  ) {
    return this.projectsService.createSprint(id, req.user.id, body);
  }

  @Post('sprints/:id/start')
  async startSprint(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() body: { projectId: string },
  ) {
    return this.projectsService.startSprint(body.projectId, id, req.user.id);
  }

  @Post('sprints/:id/complete')
  async completeSprint(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() body: { projectId: string },
  ) {
    return this.projectsService.completeSprint(body.projectId, id, req.user.id);
  }

  @Get('projects/:id/backlog')
  async getBacklog(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.projectsService.getBacklog(id, req.user.id);
  }

  @Post('projects/:id/backlog')
  async createBacklogItem(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() body: Partial<BacklogItem>,
  ) {
    return this.projectsService.createBacklogItem(id, req.user.id, body);
  }

  @Patch('backlog/:id')
  async updateBacklogItem(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() body: Partial<BacklogItem>,
  ) {
    return this.projectsService.updateBacklogItem(id, req.user.id, body);
  }

  @Post('backlog/:id/move-to-sprint')
  async moveToSprint(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() body: { sprintId: string },
  ) {
    return this.projectsService.moveToSprint(id, body.sprintId, req.user.id);
  }
}
