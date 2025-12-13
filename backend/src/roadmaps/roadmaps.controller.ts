import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RoadmapsService } from './roadmaps.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoadmapItem, Milestone } from './entities/roadmap.entity';

@Controller()
@UseGuards(JwtAuthGuard)
export class RoadmapsController {
  constructor(private roadmapsService: RoadmapsService) {}

  @Get('workspaces/:workspaceId/roadmaps')
  async findAll(
    @Param('workspaceId') workspaceId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.roadmapsService.findAllByWorkspace(workspaceId, req.user.id);
  }

  @Post('workspaces/:workspaceId/roadmaps')
  async create(
    @Param('workspaceId') workspaceId: string,
    @Request() req: { user: { id: string } },
    @Body() body: { name: string; description?: string },
  ) {
    return this.roadmapsService.create(workspaceId, req.user.id, body);
  }

  @Get('roadmaps/:id')
  async findOne(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.roadmapsService.findById(id, req.user.id);
  }

  @Patch('roadmaps/:id')
  async update(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() body: { name?: string; description?: string; items?: RoadmapItem[]; milestones?: Milestone[] },
  ) {
    return this.roadmapsService.update(id, req.user.id, body);
  }

  @Post('roadmaps/:id/items')
  async addItem(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() item: Omit<RoadmapItem, 'id'>,
  ) {
    return this.roadmapsService.addItem(id, req.user.id, item);
  }

  @Post('roadmaps/:id/milestones')
  async addMilestone(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() milestone: Omit<Milestone, 'id'>,
  ) {
    return this.roadmapsService.addMilestone(id, req.user.id, milestone);
  }

  @Delete('roadmaps/:id')
  async archive(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    await this.roadmapsService.archive(id, req.user.id);
    return { message: 'Roadmap archived' };
  }
}
