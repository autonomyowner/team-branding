import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';
import { Task } from './entities/task.entity';
import { BoardsService } from './boards.service';
import { BoardsController } from './boards.controller';
import { TasksController } from './tasks.controller';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [TypeOrmModule.forFeature([Board, Task]), WorkspacesModule],
  providers: [BoardsService],
  controllers: [BoardsController, TasksController],
  exports: [BoardsService],
})
export class BoardsModule {}
