import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Board, BoardColumn } from './entities/board.entity';
import { Task } from './entities/task.entity';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private boardsRepository: Repository<Board>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private workspacesService: WorkspacesService,
  ) {}

  async findAllByWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<Board[]> {
    await this.checkWorkspaceAccess(workspaceId, userId);
    return this.boardsRepository.find({
      where: { workspaceId, isArchived: false },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string, userId: string): Promise<Board> {
    const board = await this.boardsRepository.findOne({
      where: { id },
      relations: ['tasks'],
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    await this.checkWorkspaceAccess(board.workspaceId, userId);
    return board;
  }

  async create(
    workspaceId: string,
    userId: string,
    createDto: CreateBoardDto,
  ): Promise<Board> {
    await this.checkWorkspaceAccess(workspaceId, userId, ['owner', 'admin', 'member']);

    const defaultColumns: BoardColumn[] = [
      { id: uuid(), name: 'To Do', position: 0 },
      { id: uuid(), name: 'In Progress', position: 1 },
      { id: uuid(), name: 'Done', position: 2 },
    ];

    const board = this.boardsRepository.create({
      workspaceId,
      name: createDto.name,
      description: createDto.description,
      columns: createDto.columns || defaultColumns,
      labels: createDto.labels || [],
      createdBy: userId,
    });

    return this.boardsRepository.save(board);
  }

  async update(
    id: string,
    userId: string,
    updateDto: UpdateBoardDto,
  ): Promise<Board> {
    const board = await this.findById(id, userId);
    await this.checkWorkspaceAccess(board.workspaceId, userId, ['owner', 'admin', 'member']);

    Object.assign(board, updateDto);
    return this.boardsRepository.save(board);
  }

  async archive(id: string, userId: string): Promise<void> {
    const board = await this.findById(id, userId);
    await this.checkWorkspaceAccess(board.workspaceId, userId, ['owner', 'admin']);

    board.isArchived = true;
    await this.boardsRepository.save(board);
  }

  // Column operations
  async addColumn(
    boardId: string,
    userId: string,
    column: Omit<BoardColumn, 'id'>,
  ): Promise<Board> {
    const board = await this.findById(boardId, userId);
    await this.checkWorkspaceAccess(board.workspaceId, userId, ['owner', 'admin', 'member']);

    board.columns.push({
      ...column,
      id: uuid(),
    });

    return this.boardsRepository.save(board);
  }

  async updateColumn(
    boardId: string,
    columnId: string,
    userId: string,
    updates: Partial<BoardColumn>,
  ): Promise<Board> {
    const board = await this.findById(boardId, userId);
    await this.checkWorkspaceAccess(board.workspaceId, userId, ['owner', 'admin', 'member']);

    const columnIndex = board.columns.findIndex((c) => c.id === columnId);
    if (columnIndex === -1) {
      throw new NotFoundException('Column not found');
    }

    board.columns[columnIndex] = { ...board.columns[columnIndex], ...updates };
    return this.boardsRepository.save(board);
  }

  async deleteColumn(
    boardId: string,
    columnId: string,
    userId: string,
  ): Promise<Board> {
    const board = await this.findById(boardId, userId);
    await this.checkWorkspaceAccess(board.workspaceId, userId, ['owner', 'admin', 'member']);

    board.columns = board.columns.filter((c) => c.id !== columnId);

    // Delete tasks in this column
    await this.tasksRepository.delete({ boardId, columnId });

    return this.boardsRepository.save(board);
  }

  // Task operations
  async getTasksByBoard(boardId: string, userId: string): Promise<Task[]> {
    const board = await this.findById(boardId, userId);
    return this.tasksRepository.find({
      where: { boardId: board.id },
      order: { position: 'ASC' },
    });
  }

  async createTask(
    boardId: string,
    userId: string,
    createDto: CreateTaskDto,
  ): Promise<Task> {
    const board = await this.findById(boardId, userId);
    await this.checkWorkspaceAccess(board.workspaceId, userId, ['owner', 'admin', 'member']);

    // Get max position in column
    const tasksInColumn = await this.tasksRepository.count({
      where: { boardId, columnId: createDto.columnId },
    });

    const task = this.tasksRepository.create({
      boardId,
      columnId: createDto.columnId,
      title: createDto.title,
      description: createDto.description,
      assigneeId: createDto.assigneeId,
      assigneeName: createDto.assigneeName,
      dueDate: createDto.dueDate,
      labels: createDto.labels || [],
      priority: createDto.priority || 'medium',
      storyPoints: createDto.storyPoints,
      position: tasksInColumn,
      comments: [],
      checklists: [],
      attachments: [],
    });

    return this.tasksRepository.save(task);
  }

  async updateTask(
    taskId: string,
    userId: string,
    updateDto: UpdateTaskDto,
  ): Promise<Task> {
    const task = await this.tasksRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const board = await this.findById(task.boardId, userId);
    await this.checkWorkspaceAccess(board.workspaceId, userId, ['owner', 'admin', 'member']);

    Object.assign(task, updateDto);
    return this.tasksRepository.save(task);
  }

  async moveTask(
    taskId: string,
    userId: string,
    moveDto: MoveTaskDto,
  ): Promise<Task> {
    const task = await this.tasksRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const board = await this.findById(task.boardId, userId);
    await this.checkWorkspaceAccess(board.workspaceId, userId, ['owner', 'admin', 'member']);

    const oldColumnId = task.columnId;
    const newColumnId = moveDto.columnId;
    const newPosition = moveDto.position;

    // Update positions in old column
    if (oldColumnId !== newColumnId) {
      await this.tasksRepository
        .createQueryBuilder()
        .update(Task)
        .set({ position: () => 'position - 1' })
        .where('board_id = :boardId', { boardId: task.boardId })
        .andWhere('column_id = :columnId', { columnId: oldColumnId })
        .andWhere('position > :position', { position: task.position })
        .execute();
    }

    // Update positions in new column
    await this.tasksRepository
      .createQueryBuilder()
      .update(Task)
      .set({ position: () => 'position + 1' })
      .where('board_id = :boardId', { boardId: task.boardId })
      .andWhere('column_id = :columnId', { columnId: newColumnId })
      .andWhere('position >= :position', { position: newPosition })
      .andWhere('id != :taskId', { taskId })
      .execute();

    task.columnId = newColumnId;
    task.position = newPosition;

    return this.tasksRepository.save(task);
  }

  async deleteTask(taskId: string, userId: string): Promise<void> {
    const task = await this.tasksRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const board = await this.findById(task.boardId, userId);
    await this.checkWorkspaceAccess(board.workspaceId, userId, ['owner', 'admin', 'member']);

    await this.tasksRepository.remove(task);
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
