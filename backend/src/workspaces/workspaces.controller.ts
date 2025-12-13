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
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

  @Get()
  async findAll(@Request() req: { user: { id: string } }) {
    return this.workspacesService.findAllForUser(req.user.id);
  }

  @Post()
  async create(
    @Request() req: { user: { id: string } },
    @Body() createDto: CreateWorkspaceDto,
  ) {
    return this.workspacesService.create(req.user.id, createDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.workspacesService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() updateDto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(id, req.user.id, updateDto);
  }

  @Delete(':id')
  async archive(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    await this.workspacesService.archive(id, req.user.id);
    return { message: 'Workspace archived' };
  }

  @Post(':id/members')
  async inviteMember(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() inviteDto: InviteMemberDto,
  ) {
    return this.workspacesService.inviteMember(id, req.user.id, inviteDto);
  }

  @Patch(':id/members/:userId')
  async updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req: { user: { id: string } },
    @Body() updateDto: UpdateMemberRoleDto,
  ) {
    return this.workspacesService.updateMemberRole(
      id,
      userId,
      req.user.id,
      updateDto.role,
    );
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req: { user: { id: string } },
  ) {
    await this.workspacesService.removeMember(id, userId, req.user.id);
    return { message: 'Member removed' };
  }
}
