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
import { BoardsService } from './boards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { CreateColumnDto } from './dto/create-column.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class BoardsController {
  constructor(private boardsService: BoardsService) {}

  @Get('workspaces/:workspaceId/boards')
  async findAll(
    @Param('workspaceId') workspaceId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.boardsService.findAllByWorkspace(workspaceId, req.user.id);
  }

  @Post('workspaces/:workspaceId/boards')
  async create(
    @Param('workspaceId') workspaceId: string,
    @Request() req: { user: { id: string } },
    @Body() createDto: CreateBoardDto,
  ) {
    return this.boardsService.create(workspaceId, req.user.id, createDto);
  }

  @Get('boards/:id')
  async findOne(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.boardsService.findById(id, req.user.id);
  }

  @Patch('boards/:id')
  async update(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() updateDto: UpdateBoardDto,
  ) {
    return this.boardsService.update(id, req.user.id, updateDto);
  }

  @Delete('boards/:id')
  async archive(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    await this.boardsService.archive(id, req.user.id);
    return { message: 'Board archived' };
  }

  @Post('boards/:id/columns')
  async addColumn(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() createColumnDto: CreateColumnDto,
  ) {
    return this.boardsService.addColumn(id, req.user.id, createColumnDto);
  }

  @Patch('boards/:id/columns/:columnId')
  async updateColumn(
    @Param('id') id: string,
    @Param('columnId') columnId: string,
    @Request() req: { user: { id: string } },
    @Body() updateDto: Partial<CreateColumnDto>,
  ) {
    return this.boardsService.updateColumn(id, columnId, req.user.id, updateDto);
  }

  @Delete('boards/:id/columns/:columnId')
  async deleteColumn(
    @Param('id') id: string,
    @Param('columnId') columnId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.boardsService.deleteColumn(id, columnId, req.user.id);
  }
}
