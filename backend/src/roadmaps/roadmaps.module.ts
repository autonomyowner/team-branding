import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Roadmap } from './entities/roadmap.entity';
import { RoadmapsService } from './roadmaps.service';
import { RoadmapsController } from './roadmaps.controller';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [TypeOrmModule.forFeature([Roadmap]), WorkspacesModule],
  providers: [RoadmapsService],
  controllers: [RoadmapsController],
  exports: [RoadmapsService],
})
export class RoadmapsModule {}
