import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Get('workspaces/:workspaceId/activity')
  async findByWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Request() req: { user: { id: string } },
    @Query('limit') limit?: number,
  ) {
    return this.activityService.findByWorkspace(
      workspaceId,
      req.user.id,
      limit,
    );
  }
}
