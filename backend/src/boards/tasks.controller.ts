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
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private boardsService: BoardsService) {}

  @Get('boards/:boardId/tasks')
  async getTasksByBoard(
    @Param('boardId') boardId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.boardsService.getTasksByBoard(boardId, req.user.id);
  }

  @Post('boards/:boardId/tasks')
  async createTask(
    @Param('boardId') boardId: string,
    @Request() req: { user: { id: string } },
    @Body() createDto: CreateTaskDto,
  ) {
    return this.boardsService.createTask(boardId, req.user.id, createDto);
  }

  @Patch('tasks/:id')
  async updateTask(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() updateDto: UpdateTaskDto,
  ) {
    return this.boardsService.updateTask(id, req.user.id, updateDto);
  }

  @Post('tasks/:id/move')
  async moveTask(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() moveDto: MoveTaskDto,
  ) {
    return this.boardsService.moveTask(id, req.user.id, moveDto);
  }

  @Delete('tasks/:id')
  async deleteTask(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    await this.boardsService.deleteTask(id, req.user.id);
    return { message: 'Task deleted' };
  }
}
