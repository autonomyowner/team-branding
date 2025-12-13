import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { UpdateWorkflowContentDto } from './dto/update-workflow-content.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class WorkflowsController {
  constructor(private workflowsService: WorkflowsService) {}

  @Get('workspaces/:workspaceId/workflows')
  async findAll(
    @Param('workspaceId') workspaceId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.workflowsService.findAllByWorkspace(workspaceId, req.user.id);
  }

  @Post('workspaces/:workspaceId/workflows')
  async create(
    @Param('workspaceId') workspaceId: string,
    @Request() req: { user: { id: string } },
    @Body() createDto: CreateWorkflowDto,
  ) {
    return this.workflowsService.create(workspaceId, req.user.id, createDto);
  }

  @Get('workflows/:id')
  async findOne(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.workflowsService.findById(id, req.user.id);
  }

  @Patch('workflows/:id')
  async update(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() updateDto: UpdateWorkflowDto,
  ) {
    return this.workflowsService.update(id, req.user.id, updateDto);
  }

  @Put('workflows/:id/content')
  async updateContent(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() contentDto: UpdateWorkflowContentDto,
  ) {
    return this.workflowsService.updateContent(id, req.user.id, contentDto);
  }

  @Delete('workflows/:id')
  async delete(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    await this.workflowsService.delete(id, req.user.id);
    return { message: 'Workflow deleted' };
  }
}
