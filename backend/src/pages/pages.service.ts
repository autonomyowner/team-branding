import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page, Block } from './entities/page.entity';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class PagesService {
  constructor(
    @InjectRepository(Page)
    private pagesRepository: Repository<Page>,
    private workspacesService: WorkspacesService,
  ) {}

  async findAllByWorkspace(workspaceId: string, userId: string): Promise<Page[]> {
    await this.checkWorkspaceAccess(workspaceId, userId);
    return this.pagesRepository.find({
      where: { workspaceId, isArchived: false },
      order: { updatedAt: 'DESC' },
    });
  }

  async findAllByProject(
    workspaceId: string,
    projectId: string,
    userId: string,
  ): Promise<Page[]> {
    await this.checkWorkspaceAccess(workspaceId, userId);
    return this.pagesRepository.find({
      where: { workspaceId, projectId, isArchived: false },
      order: { updatedAt: 'DESC' },
    });
  }

  async findById(id: string, userId: string): Promise<Page> {
    const page = await this.pagesRepository.findOne({ where: { id } });
    if (!page) {
      throw new NotFoundException('Page not found');
    }
    await this.checkWorkspaceAccess(page.workspaceId, userId);
    return page;
  }

  async create(
    workspaceId: string,
    userId: string,
    data: { title: string; projectId?: string; parentPageId?: string },
  ): Promise<Page> {
    await this.checkWorkspaceAccess(workspaceId, userId, ['owner', 'admin', 'member']);

    const page = this.pagesRepository.create({
      workspaceId,
      projectId: data.projectId,
      title: data.title,
      parentPageId: data.parentPageId,
      blocks: [],
      childPageIds: [],
      createdBy: userId,
    });

    return this.pagesRepository.save(page);
  }

  async update(
    id: string,
    userId: string,
    data: { title?: string; coverImage?: string },
  ): Promise<Page> {
    const page = await this.findById(id, userId);
    await this.checkWorkspaceAccess(page.workspaceId, userId, ['owner', 'admin', 'member']);

    Object.assign(page, data);
    page.lastEditedBy = userId;
    return this.pagesRepository.save(page);
  }

  async updateBlocks(id: string, userId: string, blocks: Block[]): Promise<Page> {
    const page = await this.findById(id, userId);
    await this.checkWorkspaceAccess(page.workspaceId, userId, ['owner', 'admin', 'member']);

    page.blocks = blocks;
    page.lastEditedBy = userId;
    return this.pagesRepository.save(page);
  }

  async addBlock(id: string, userId: string, block: Block): Promise<Page> {
    const page = await this.findById(id, userId);
    await this.checkWorkspaceAccess(page.workspaceId, userId, ['owner', 'admin', 'member']);

    page.blocks.push(block);
    page.lastEditedBy = userId;
    return this.pagesRepository.save(page);
  }

  async updateBlock(
    id: string,
    blockId: string,
    userId: string,
    blockData: Partial<Block>,
  ): Promise<Page> {
    const page = await this.findById(id, userId);
    await this.checkWorkspaceAccess(page.workspaceId, userId, ['owner', 'admin', 'member']);

    const blockIndex = page.blocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) {
      throw new NotFoundException('Block not found');
    }

    page.blocks[blockIndex] = { ...page.blocks[blockIndex], ...blockData };
    page.lastEditedBy = userId;
    return this.pagesRepository.save(page);
  }

  async deleteBlock(id: string, blockId: string, userId: string): Promise<Page> {
    const page = await this.findById(id, userId);
    await this.checkWorkspaceAccess(page.workspaceId, userId, ['owner', 'admin', 'member']);

    page.blocks = page.blocks.filter((b) => b.id !== blockId);
    page.lastEditedBy = userId;
    return this.pagesRepository.save(page);
  }

  async archive(id: string, userId: string): Promise<void> {
    const page = await this.findById(id, userId);
    await this.checkWorkspaceAccess(page.workspaceId, userId, ['owner', 'admin']);

    page.isArchived = true;
    await this.pagesRepository.save(page);
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
