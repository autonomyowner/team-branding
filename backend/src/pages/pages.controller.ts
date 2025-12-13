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
import { PagesService } from './pages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Block } from './entities/page.entity';

@Controller()
@UseGuards(JwtAuthGuard)
export class PagesController {
  constructor(private pagesService: PagesService) {}

  @Get('workspaces/:workspaceId/projects/:projectId/pages')
  async findAllByProject(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.pagesService.findAllByProject(workspaceId, projectId, req.user.id);
  }

  @Post('workspaces/:workspaceId/projects/:projectId/pages')
  async create(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Request() req: { user: { id: string } },
    @Body() body: { title: string; parentPageId?: string },
  ) {
    return this.pagesService.create(workspaceId, req.user.id, {
      ...body,
      projectId,
    });
  }

  @Get('pages/:id')
  async findOne(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.pagesService.findById(id, req.user.id);
  }

  @Patch('pages/:id')
  async update(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() body: { title?: string; coverImage?: string },
  ) {
    return this.pagesService.update(id, req.user.id, body);
  }

  @Put('pages/:id/blocks')
  async replaceBlocks(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() body: { blocks: Block[] },
  ) {
    return this.pagesService.updateBlocks(id, req.user.id, body.blocks);
  }

  @Post('pages/:id/blocks')
  async addBlock(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() block: Block,
  ) {
    return this.pagesService.addBlock(id, req.user.id, block);
  }

  @Patch('pages/:id/blocks/:blockId')
  async updateBlock(
    @Param('id') id: string,
    @Param('blockId') blockId: string,
    @Request() req: { user: { id: string } },
    @Body() blockData: Partial<Block>,
  ) {
    return this.pagesService.updateBlock(id, blockId, req.user.id, blockData);
  }

  @Delete('pages/:id/blocks/:blockId')
  async deleteBlock(
    @Param('id') id: string,
    @Param('blockId') blockId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.pagesService.deleteBlock(id, blockId, req.user.id);
  }

  @Delete('pages/:id')
  async archive(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    await this.pagesService.archive(id, req.user.id);
    return { message: 'Page archived' };
  }
}
